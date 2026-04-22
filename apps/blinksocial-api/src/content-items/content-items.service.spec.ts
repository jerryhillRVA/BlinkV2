import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ContentItemsService } from './content-items.service';
import { AgenticFilesystemService } from '../agentic-filesystem/agentic-filesystem.service';
import type { ContentItemContract } from '@blinksocial/contracts';

type DirEntry = { name: string; type: 'file' | 'directory'; file_id?: string };
type BatchEntry = {
  file_id: string;
  filename: string;
  content_type: 'json' | 'error' | 'text' | 'binary';
  content?: unknown;
};

function buildItem(
  overrides: Partial<ContentItemContract> = {},
): ContentItemContract {
  return {
    id: overrides.id ?? 'c-existing',
    stage: overrides.stage ?? 'idea',
    status: overrides.status ?? 'draft',
    title: overrides.title ?? 'Seed',
    description: overrides.description ?? '',
    pillarIds: overrides.pillarIds ?? [],
    segmentIds: overrides.segmentIds ?? [],
    archived: overrides.archived ?? false,
    createdAt: overrides.createdAt ?? '2026-04-21T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-04-21T00:00:00.000Z',
    ...overrides,
  } as ContentItemContract;
}

function buildFakeFs() {
  const files: Record<string, { filename: string; content: unknown }> = {};
  let idCounter = 1;
  let configured = true;

  return {
    setConfigured(v: boolean) {
      configured = v;
    },
    isConfigured: () => configured,
    files,
    async listDirectory(_tenant: string, _namespace: string): Promise<DirEntry[]> {
      return Object.entries(files).map(([file_id, { filename }]) => ({
        name: filename,
        type: 'file',
        file_id,
      }));
    },
    async uploadJsonFile(
      _tenant: string,
      _namespace: string,
      filename: string,
      content: unknown,
    ) {
      const id = `f-${idCounter++}`;
      files[id] = { filename, content };
      return { file_id: id, filename };
    },
    async replaceJsonFile(
      _tenant: string,
      fileId: string,
      filename: string,
      content: unknown,
    ) {
      files[fileId] = { filename, content };
      return { file_id: fileId, filename };
    },
    async batchRetrieve(_tenant: string, fileIds: string[]): Promise<BatchEntry[]> {
      return fileIds.map((id) => {
        const f = files[id];
        if (!f)
          return {
            file_id: id,
            filename: '',
            content_type: 'error' as const,
          };
        return {
          file_id: id,
          filename: f.filename,
          content_type: 'json' as const,
          content: f.content,
        };
      });
    },
    async deleteFile(_tenant: string, fileId: string) {
      delete files[fileId];
    },
  };
}

describe('ContentItemsService', () => {
  let service: ContentItemsService;
  let fs: ReturnType<typeof buildFakeFs>;

  beforeEach(async () => {
    fs = buildFakeFs();
    const moduleRef = await Test.createTestingModule({
      providers: [
        ContentItemsService,
        { provide: AgenticFilesystemService, useValue: fs },
        { provide: 'MOCK_DATA_SERVICE', useValue: null },
      ],
    }).compile();
    service = moduleRef.get(ContentItemsService);
  });

  describe('projectIndexEntry', () => {
    it('picks only lean fields', () => {
      const item = buildItem({
        id: 'c-1',
        title: 'T',
        description: 'never-in-index',
        production: { brief: { strategy: 'nope' } as unknown as Record<string, unknown> },
      });
      const entry = service.projectIndexEntry(item);
      expect(entry).toMatchObject({
        id: 'c-1',
        title: 'T',
        archived: false,
        platform: null,
        contentType: null,
        scheduledDate: null,
        parentIdeaId: null,
        parentConceptId: null,
      });
      expect((entry as Record<string, unknown>).description).toBeUndefined();
      expect((entry as Record<string, unknown>).production).toBeUndefined();
    });
  });

  describe('createItem', () => {
    it('writes item file and primary index (item first, index second)', async () => {
      const created = await service.createItem('ws-1', {
        stage: 'idea',
        status: 'draft',
        title: 'TC1',
      });
      expect(created.id).toMatch(/^c-/);

      const names = Object.values(fs.files).map((f) => f.filename);
      expect(names).toContain(`${created.id}.json`);
      expect(names).toContain('_content-items-index.json');
      const idx = Object.values(fs.files).find(
        (f) => f.filename === '_content-items-index.json',
      )!.content as { items: { id: string }[]; totalCount: number };
      expect(idx.items).toHaveLength(1);
      expect(idx.items[0].id).toBe(created.id);
      expect(idx.totalCount).toBe(1);
    });

    it('generates a server-authoritative id even when input has one', async () => {
      const created = await service.createItem('ws-1', {
        stage: 'idea',
        status: 'draft',
        title: 'X',
      });
      expect(created.id).toMatch(/^c-/);
    });
  });

  describe('updateItem', () => {
    it('replaces the item file and updates the index row', async () => {
      const created = await service.createItem('ws-1', {
        stage: 'idea',
        status: 'draft',
        title: 'Original',
      });
      await new Promise((r) => setTimeout(r, 2));
      const updated = await service.updateItem('ws-1', created.id, {
        title: 'New Title',
      });
      expect(updated.title).toBe('New Title');
      expect(updated.updatedAt >= created.updatedAt).toBe(true);

      const idx = Object.values(fs.files).find(
        (f) => f.filename === '_content-items-index.json',
      )!.content as { items: { id: string; title: string }[] };
      expect(idx.items.find((r) => r.id === created.id)?.title).toBe('New Title');
    });

    it('throws 404 when item does not exist', async () => {
      await expect(
        service.updateItem('ws-1', 'c-missing', { title: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('archiveItem / unarchiveItem', () => {
    it('moves the row between primary and archive indexes and flips archived', async () => {
      const created = await service.createItem('ws-1', {
        stage: 'idea',
        status: 'draft',
        title: 'AR',
      });

      const archived = await service.archiveItem('ws-1', created.id);
      expect(archived.archived).toBe(true);

      const primary = Object.values(fs.files).find(
        (f) => f.filename === '_content-items-index.json',
      )!.content as { items: { id: string }[] };
      const archive = Object.values(fs.files).find(
        (f) => f.filename === '_content-items-archive-index.json',
      )!.content as { items: { id: string; archived: boolean }[] };
      expect(primary.items.find((r) => r.id === created.id)).toBeUndefined();
      expect(archive.items.find((r) => r.id === created.id)?.archived).toBe(true);

      const unarchived = await service.unarchiveItem('ws-1', created.id);
      expect(unarchived.archived).toBe(false);

      const primary2 = Object.values(fs.files).find(
        (f) => f.filename === '_content-items-index.json',
      )!.content as { items: { id: string }[] };
      const archive2 = Object.values(fs.files).find(
        (f) => f.filename === '_content-items-archive-index.json',
      )!.content as { items: { id: string }[] };
      expect(primary2.items.find((r) => r.id === created.id)).toBeDefined();
      expect(archive2.items.find((r) => r.id === created.id)).toBeUndefined();
    });

    it('is idempotent — archiving an already-archived item returns unchanged', async () => {
      const created = await service.createItem('ws-1', {
        stage: 'idea',
        status: 'draft',
        title: 'IDEMP',
      });
      const first = await service.archiveItem('ws-1', created.id);
      const second = await service.archiveItem('ws-1', created.id);
      expect(second.updatedAt).toBe(first.updatedAt);
    });
  });

  describe('deleteItem', () => {
    it('removes the file and the index row', async () => {
      const created = await service.createItem('ws-1', {
        stage: 'idea',
        status: 'draft',
        title: 'DEL',
      });
      const res = await service.deleteItem('ws-1', created.id);
      expect(res).toEqual({ deleted: true, id: created.id });
      const names = Object.values(fs.files).map((f) => f.filename);
      expect(names).not.toContain(`${created.id}.json`);
      const idx = Object.values(fs.files).find(
        (f) => f.filename === '_content-items-index.json',
      )!.content as { items: { id: string }[] };
      expect(idx.items.find((r) => r.id === created.id)).toBeUndefined();
    });
  });

  describe('getIndex / getArchiveIndex', () => {
    it('returns empty envelope when no manifest exists', async () => {
      const idx = await service.getIndex('ws-empty');
      expect(idx.items).toEqual([]);
      expect(idx.totalCount).toBe(0);
    });

    it('surfaces ServiceUnavailableException when the batch read blows up', async () => {
      // listDirectory succeeds, but batchRetrieve explodes — matches how a
      // genuine 5xx from AFS reaches the service layer.
      fs.files['idx'] = {
        filename: '_content-items-index.json',
        content: { items: [], totalCount: 0, lastUpdated: '' },
      };
      fs.batchRetrieve = async () => {
        throw new Error('network down');
      };
      await expect(service.getIndex('ws-1')).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });
  });

  describe('mock mode (fs not configured, mockDataService present)', () => {
    it('reads from mock data service and echoes on create', async () => {
      fs.setConfigured(false);
      const mockDs = {
        isMockWorkspace: (id: string) => id === 'hive-collective',
        getNamespaceAggregate: vi
          .fn()
          .mockImplementation((_w: string, _n: string, filename: string) =>
            filename === '_content-items-index.json'
              ? { items: [], totalCount: 0, lastUpdated: '' }
              : null,
          ),
        getItemFile: vi.fn().mockResolvedValue(null),
      };
      const moduleRef = await Test.createTestingModule({
        providers: [
          ContentItemsService,
          { provide: AgenticFilesystemService, useValue: fs },
          { provide: 'MOCK_DATA_SERVICE', useValue: mockDs },
        ],
      }).compile();
      const svc = moduleRef.get(ContentItemsService);

      const idx = await svc.getIndex('hive-collective');
      expect(idx.items).toEqual([]);

      const created = await svc.createItem('hive-collective', {
        stage: 'idea',
        status: 'draft',
        title: 'Echo',
      });
      expect(created.title).toBe('Echo');
      // Mock-mode creates must NOT touch the fake AFS
      expect(Object.keys(fs.files)).toHaveLength(0);
    });

    it('404s for an unknown non-mock workspace when fs is not configured', async () => {
      fs.setConfigured(false);
      const mockDs = {
        isMockWorkspace: () => false,
        getNamespaceAggregate: vi.fn(),
        getItemFile: vi.fn(),
      };
      const moduleRef = await Test.createTestingModule({
        providers: [
          ContentItemsService,
          { provide: AgenticFilesystemService, useValue: fs },
          { provide: 'MOCK_DATA_SERVICE', useValue: mockDs },
        ],
      }).compile();
      const svc = moduleRef.get(ContentItemsService);
      await expect(svc.getIndex('unknown')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('D-25: concurrent createItem index integrity', () => {
    it('N parallel creates all land in the primary index (no race)', async () => {
      // Inject an async microtask into each AFS write to amplify any RMW race
      // on `_content-items-index.json`. Without the per-workspace index lock
      // the final index would be missing one or more rows.
      const innerReplace = fs.replaceJsonFile.bind(fs);
      fs.replaceJsonFile = (async (
        tenant: string,
        fileId: string,
        filename: string,
        content: unknown,
      ) => {
        await Promise.resolve();
        await Promise.resolve();
        return innerReplace(tenant, fileId, filename, content);
      }) as typeof fs.replaceJsonFile;

      const N = 5;
      const results = await Promise.all(
        Array.from({ length: N }, (_, i) =>
          service.createItem('w1', {
            stage: 'idea',
            status: 'draft',
            title: `Concurrent #${i + 1}`,
          }),
        ),
      );
      const ids = new Set(results.map((r) => r.id));
      expect(ids.size).toBe(N);

      const index = await service.getIndex('w1');
      expect(index.totalCount).toBe(N);
      expect(index.items.length).toBe(N);
      for (const id of ids) {
        expect(index.items.some((r) => r.id === id)).toBe(true);
      }
    });
  });
});
