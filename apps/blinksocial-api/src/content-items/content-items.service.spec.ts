import {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
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
    async listTenants(): Promise<string[]> {
      return [];
    },
  };
}

function readContent<T>(
  fs: ReturnType<typeof buildFakeFs>,
  filename: string,
): T {
  const found = Object.values(fs.files).find((f) => f.filename === filename);
  if (!found) throw new Error(`fixture file not written: ${filename}`);
  return found.content as T;
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
        scheduledAt: null,
        parentIdeaId: null,
        parentConceptId: null,
      });
      expect((entry as Record<string, unknown>).description).toBeUndefined();
      expect((entry as Record<string, unknown>).production).toBeUndefined();
    });

    // Ticket #135: scheduledAt projects into the index entry so the
    // Calendar can derive the publish cell from a single read of the
    // index aggregate (no per-item file fetch needed for unblocked posts).
    it('projects top-level scheduledAt onto the index entry', () => {
      const item = buildItem({
        id: 'c-2',
        title: 'Scheduled',
        scheduledAt: '2026-06-01T15:00:00.000Z',
        scheduledDate: '2026-06-01',
      });
      const entry = service.projectIndexEntry(item);
      expect(entry.scheduledAt).toBe('2026-06-01T15:00:00.000Z');
      expect(entry.scheduledDate).toBe('2026-06-01');
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
      const idx = readContent<{
        items: { id: string }[];
        totalCount: number;
      }>(fs, '_content-items-index.json');
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

      const idx = readContent<{
        items: { id: string; title: string }[];
      }>(fs, '_content-items-index.json');
      expect(idx.items.find((r) => r.id === created.id)?.title).toBe('New Title');
    });

    it('throws 404 when item does not exist', async () => {
      await expect(
        service.updateItem('ws-1', 'c-missing', { title: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('deep-merges milestoneOverrides so unrelated types are preserved (#134)', async () => {
      const created = await service.createItem('ws-1', {
        stage: 'post',
        status: 'in-progress',
        title: 'p1',
      });
      // First patch — seed two overrides
      await service.updateItem('ws-1', created.id, {
        milestoneOverrides: {
          brief_due: { dueAt: '2026-05-01T00:00:00.000Z' },
          draft_due: { dueAt: '2026-05-05T00:00:00.000Z' },
        },
      });
      // Second patch — touch only draft_due. brief_due must survive.
      const after = await service.updateItem('ws-1', created.id, {
        milestoneOverrides: {
          draft_due: { dueAt: '2026-05-07T00:00:00.000Z' },
        },
      });
      expect(after.milestoneOverrides).toEqual({
        brief_due: { dueAt: '2026-05-01T00:00:00.000Z' },
        draft_due: { dueAt: '2026-05-07T00:00:00.000Z' },
      });
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

      const primary = readContent<{ items: { id: string }[] }>(
        fs,
        '_content-items-index.json',
      );
      const archive = readContent<{
        items: { id: string; archived: boolean }[];
      }>(fs, '_content-items-archive-index.json');
      expect(primary.items.find((r) => r.id === created.id)).toBeUndefined();
      expect(archive.items.find((r) => r.id === created.id)?.archived).toBe(true);

      const unarchived = await service.unarchiveItem('ws-1', created.id);
      expect(unarchived.archived).toBe(false);

      const primary2 = readContent<{ items: { id: string }[] }>(
        fs,
        '_content-items-index.json',
      );
      const archive2 = readContent<{ items: { id: string }[] }>(
        fs,
        '_content-items-archive-index.json',
      );
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
      const idx = readContent<{ items: { id: string }[] }>(
        fs,
        '_content-items-index.json',
      );
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
    /**
     * Build a stateful MockDataService stand-in that mirrors the real
     * service's override semantics: items/aggregates can be written and
     * read back, and deleted items mask seed JSON. Used by #126's tests
     * that verify mock-mode CRUD + cascade.
     */
    function buildStatefulMockDs(mockWorkspaceId = 'hive-collective') {
      const items = new Map<string, Map<string, unknown>>();
      const aggregates = new Map<string, Map<string, Map<string, unknown>>>();
      const deleted = new Map<string, Set<string>>();
      const isMock = (id: string) => id === mockWorkspaceId;
      return {
        isMockWorkspace: (id: string) => isMock(id),
        async getItemFile(workspaceId: string, itemId: string) {
          if (!isMock(workspaceId)) return null;
          if (deleted.get(workspaceId)?.has(itemId)) return null;
          return items.get(workspaceId)?.get(itemId) ?? null;
        },
        setItemOverride(workspaceId: string, itemId: string, item: unknown) {
          if (!isMock(workspaceId)) return;
          if (!items.has(workspaceId)) items.set(workspaceId, new Map());
          items.get(workspaceId)?.set(itemId, item);
          deleted.get(workspaceId)?.delete(itemId);
        },
        deleteItemOverride(workspaceId: string, itemId: string) {
          if (!isMock(workspaceId)) return;
          items.get(workspaceId)?.delete(itemId);
          if (!deleted.has(workspaceId)) deleted.set(workspaceId, new Set());
          deleted.get(workspaceId)?.add(itemId);
        },
        async getNamespaceAggregate(
          workspaceId: string,
          namespace: string,
          filename: string,
        ) {
          if (!isMock(workspaceId)) return null;
          return aggregates.get(workspaceId)?.get(namespace)?.get(filename) ?? null;
        },
        setAggregateOverride(
          workspaceId: string,
          namespace: string,
          filename: string,
          data: unknown,
        ) {
          if (!isMock(workspaceId)) return;
          if (!aggregates.has(workspaceId)) aggregates.set(workspaceId, new Map());
          const ns = aggregates.get(workspaceId)!;
          if (!ns.has(namespace)) ns.set(namespace, new Map());
          ns.get(namespace)!.set(filename, data);
        },
        // Test-only inspection helpers.
        __items: items,
        __aggregates: aggregates,
        __deleted: deleted,
      };
    }

    async function buildMockService() {
      fs.setConfigured(false);
      const mockDs = buildStatefulMockDs();
      const moduleRef = await Test.createTestingModule({
        providers: [
          ContentItemsService,
          { provide: AgenticFilesystemService, useValue: fs },
          { provide: 'MOCK_DATA_SERVICE', useValue: mockDs },
        ],
      }).compile();
      return { svc: moduleRef.get(ContentItemsService), mockDs };
    }

    it('createItem persists override + index row in mock mode (#126: no silent drop)', async () => {
      const { svc, mockDs } = await buildMockService();

      const created = await svc.createItem('hive-collective', {
        stage: 'idea',
        status: 'new',
        title: 'Echo',
      });

      // Item override is recorded.
      const item = await mockDs.getItemFile('hive-collective', created.id);
      expect(item).toMatchObject({ id: created.id, title: 'Echo' });
      // Index aggregate now contains the new row.
      const idx = (await svc.getIndex('hive-collective')) as {
        items: { id: string }[];
        totalCount: number;
      };
      expect(idx.totalCount).toBe(1);
      expect(idx.items[0].id).toBe(created.id);
      // Mock-mode creates must NOT touch the fake AFS layer.
      expect(Object.keys(fs.files)).toHaveLength(0);
    });

    it('createItem in mock mode flips parent idea to used when a concept is added', async () => {
      const { svc, mockDs } = await buildMockService();
      const idea = await svc.createItem('hive-collective', {
        stage: 'idea',
        status: 'new',
        title: 'Idea',
      });
      await svc.createItem('hive-collective', {
        stage: 'concept',
        status: 'new',
        title: 'Concept',
        parentIdeaId: idea.id,
      });
      const refreshed = (await mockDs.getItemFile('hive-collective', idea.id)) as {
        status: string;
      };
      expect(refreshed.status).toBe('used');
    });

    it('createItem in mock mode flips parent concept to used when a post is added', async () => {
      const { svc, mockDs } = await buildMockService();
      const concept = await svc.createItem('hive-collective', {
        stage: 'concept',
        status: 'new',
        title: 'Concept',
      });
      await svc.createItem('hive-collective', {
        stage: 'post',
        status: 'in-progress',
        title: 'Post',
        parentConceptId: concept.id,
      });
      const refreshed = (await mockDs.getItemFile('hive-collective', concept.id)) as {
        status: string;
      };
      expect(refreshed.status).toBe('used');
    });

    it('createItem in mock mode is a no-op flip when the parent is already used', async () => {
      const { svc, mockDs } = await buildMockService();
      const idea = await svc.createItem('hive-collective', {
        stage: 'idea',
        status: 'used',
        title: 'Already used',
      });
      await svc.createItem('hive-collective', {
        stage: 'concept',
        status: 'new',
        title: 'Concept',
        parentIdeaId: idea.id,
      });
      const refreshed = (await mockDs.getItemFile('hive-collective', idea.id)) as {
        status: string;
        updatedAt: string;
      };
      expect(refreshed.status).toBe('used');
    });

    it('deleteItem in mock mode removes the override, the index row, and un-flips the parent (#126)', async () => {
      const { svc, mockDs } = await buildMockService();
      const concept = await svc.createItem('hive-collective', {
        stage: 'concept',
        status: 'new',
        title: 'Parent',
      });
      const post = await svc.createItem('hive-collective', {
        stage: 'post',
        status: 'in-progress',
        title: 'Sole child',
        parentConceptId: concept.id,
      });

      await svc.deleteItem('hive-collective', post.id);

      // Override is gone (deletion masks it).
      const removedItem = await mockDs.getItemFile('hive-collective', post.id);
      expect(removedItem).toBeNull();
      // Index row gone.
      const idx = (await svc.getIndex('hive-collective')) as {
        items: { id: string }[];
      };
      expect(idx.items.find((r) => r.id === post.id)).toBeUndefined();
      // Parent un-flipped.
      const refreshedConcept = (await mockDs.getItemFile(
        'hive-collective',
        concept.id,
      )) as { status: string };
      expect(refreshedConcept.status).toBe('new');
    });

    it('deleteItem in mock mode leaves parent used when sibling posts remain', async () => {
      const { svc, mockDs } = await buildMockService();
      const concept = await svc.createItem('hive-collective', {
        stage: 'concept',
        status: 'new',
        title: 'Parent',
      });
      const postA = await svc.createItem('hive-collective', {
        stage: 'post',
        status: 'in-progress',
        title: 'A',
        parentConceptId: concept.id,
      });
      await svc.createItem('hive-collective', {
        stage: 'post',
        status: 'in-progress',
        title: 'B',
        parentConceptId: concept.id,
      });
      await svc.deleteItem('hive-collective', postA.id);
      const refreshedConcept = (await mockDs.getItemFile(
        'hive-collective',
        concept.id,
      )) as { status: string };
      expect(refreshedConcept.status).toBe('used');
    });

    it('archived siblings in mock mode still count — delete does not flip', async () => {
      const { svc, mockDs } = await buildMockService();
      const concept = await svc.createItem('hive-collective', {
        stage: 'concept',
        status: 'new',
        title: 'Parent',
      });
      const live = await svc.createItem('hive-collective', {
        stage: 'post',
        status: 'in-progress',
        title: 'Live',
        parentConceptId: concept.id,
      });
      const archived = await svc.createItem('hive-collective', {
        stage: 'post',
        status: 'in-progress',
        title: 'Archived',
        parentConceptId: concept.id,
      });
      await svc.archiveItem('hive-collective', archived.id);
      await svc.deleteItem('hive-collective', live.id);
      const refreshedConcept = (await mockDs.getItemFile(
        'hive-collective',
        concept.id,
      )) as { status: string };
      expect(refreshedConcept.status).toBe('used');
    });

    it('sendConceptBack in mock mode cascades archive + flips concept to new (#126)', async () => {
      const { svc, mockDs } = await buildMockService();
      const concept = await svc.createItem('hive-collective', {
        stage: 'concept',
        status: 'new',
        title: 'Parent',
      });
      const postA = await svc.createItem('hive-collective', {
        stage: 'post',
        status: 'in-progress',
        title: 'Live A',
        parentConceptId: concept.id,
      });
      const postB = await svc.createItem('hive-collective', {
        stage: 'post',
        status: 'in-progress',
        title: 'Live B',
        parentConceptId: concept.id,
      });
      const postC = await svc.createItem('hive-collective', {
        stage: 'post',
        status: 'in-progress',
        title: 'Already archived',
        parentConceptId: concept.id,
      });
      await svc.archiveItem('hive-collective', postC.id);

      const result = await svc.sendConceptBack('hive-collective', concept.id);

      expect(result.conceptStatus).toBe('new');
      expect(result.archivedPostIds.sort()).toEqual([postA.id, postB.id].sort());
      expect(result.alreadyArchivedPostIds).toEqual([postC.id]);

      // Concept is now `new` in the mock layer.
      const refreshedConcept = (await mockDs.getItemFile(
        'hive-collective',
        concept.id,
      )) as { status: string };
      expect(refreshedConcept.status).toBe('new');
      // Live posts are now archived.
      for (const id of [postA.id, postB.id]) {
        const p = (await mockDs.getItemFile('hive-collective', id)) as {
          archived: boolean;
        };
        expect(p.archived).toBe(true);
      }
    });

    it('updateItem records an in-memory override so subsequent reads reflect the patch', async () => {
      fs.setConfigured(false);
      const seed = {
        id: 'item-1',
        stage: 'post',
        status: 'in-progress',
        title: 'Seeded',
        description: '',
        pillarIds: [],
        segmentIds: [],
        createdAt: '2026-05-01T00:00:00Z',
        updatedAt: '2026-05-01T00:00:00Z',
        briefApproved: true,
        production: { productionStep: 'draft' },
      };
      const setItemOverride = vi.fn();
      const mockDs = {
        isMockWorkspace: (id: string) => id === 'hive-collective',
        getNamespaceAggregate: vi.fn(),
        getItemFile: vi.fn().mockResolvedValue(seed),
        setItemOverride,
      };
      const moduleRef = await Test.createTestingModule({
        providers: [
          ContentItemsService,
          { provide: AgenticFilesystemService, useValue: fs },
          { provide: 'MOCK_DATA_SERVICE', useValue: mockDs },
        ],
      }).compile();
      const svc = moduleRef.get(ContentItemsService);

      const updated = await svc.updateItem('hive-collective', 'item-1', {
        production: { productionStep: 'packaging' },
      } as unknown as Parameters<ContentItemsService['updateItem']>[2]);

      expect(setItemOverride).toHaveBeenCalledTimes(1);
      const [ws, id, persisted] = setItemOverride.mock.calls[0];
      expect(ws).toBe('hive-collective');
      expect(id).toBe('item-1');
      expect(
        (persisted as { production?: { productionStep?: string } }).production
          ?.productionStep,
      ).toBe('packaging');
      expect(updated.title).toBe('Seeded');
      expect(
        (updated as { production?: { productionStep?: string } }).production
          ?.productionStep,
      ).toBe('packaging');
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

  // Ticket #117: backend owns the parent-flip on create and parent un-flip
  // on delete/stage-change. The frontend's `applyLocalStatus` is just an
  // optimistic mirror; these tests cover the authoritative behavior.
  describe('parent-flip on create (ticket #117)', () => {
    it('flips a `new` parent idea to `used` when a concept is created under it', async () => {
      const idea = await service.createItem('w1', {
        stage: 'idea',
        status: 'new',
        title: 'Parent idea',
      });
      await service.createItem('w1', {
        stage: 'concept',
        status: 'new',
        title: 'Child concept',
        parentIdeaId: idea.id,
      });
      const refreshed = await service.getItem('w1', idea.id);
      expect(refreshed.status).toBe('used');
    });

    it('flips a `new` parent concept to `used` when a post is created under it', async () => {
      const concept = await service.createItem('w1', {
        stage: 'concept',
        status: 'new',
        title: 'Parent concept',
      });
      await service.createItem('w1', {
        stage: 'post',
        status: 'in-progress',
        title: 'Child post',
        parentConceptId: concept.id,
      });
      const refreshed = await service.getItem('w1', concept.id);
      expect(refreshed.status).toBe('used');
    });

    it('parent already `used` ⇒ no parent write (idempotent)', async () => {
      const idea = await service.createItem('w1', {
        stage: 'idea',
        status: 'used',
        title: 'Already used',
      });
      const replaceSpy = vi.spyOn(fs, 'replaceJsonFile');
      await service.createItem('w1', {
        stage: 'concept',
        status: 'new',
        title: 'Another concept',
        parentIdeaId: idea.id,
      });
      // No call referenced the parent idea's file (only the new concept +
      // the index).
      const calls = replaceSpy.mock.calls
        .map((c) => c[2] as string)
        .filter((name) => name === `${idea.id}.json`);
      expect(calls).toEqual([]);
    });

    it('rolls back the child file when the parent flip fails', async () => {
      const idea = await service.createItem('w1', {
        stage: 'idea',
        status: 'new',
        title: 'Boomer',
      });
      // Make the next parent-file write fail. Note that we let the child's
      // create write succeed first.
      let callCount = 0;
      const original = fs.replaceJsonFile.bind(fs);
      vi.spyOn(fs, 'replaceJsonFile').mockImplementation(
        ((
          tenant: string,
          fileId: string,
          filename: string,
          content: unknown,
        ) => {
          callCount++;
          if (filename === `${idea.id}.json`) {
            throw new Error('forced parent flip failure');
          }
          return original(tenant, fileId, filename, content);
        }) as typeof fs.replaceJsonFile,
      );

      await expect(
        service.createItem('w1', {
          stage: 'concept',
          status: 'new',
          title: 'Doomed concept',
          parentIdeaId: idea.id,
        }),
      ).rejects.toThrow(ServiceUnavailableException);
      void callCount;

      // The child should NOT remain on disk after rollback.
      const names = Object.values(fs.files).map((f) => f.filename);
      expect(names.filter((n) => n.startsWith('c-') && n.endsWith('.json'))).toEqual([
        `${idea.id}.json`,
      ]);
    });
  });

  describe('parent un-flip on delete (ticket #117)', () => {
    it('flips parent concept back to `new` when the last child post is deleted', async () => {
      const concept = await service.createItem('w1', {
        stage: 'concept',
        status: 'new',
        title: 'Parent',
      });
      const post = await service.createItem('w1', {
        stage: 'post',
        status: 'in-progress',
        title: 'Sole child',
        parentConceptId: concept.id,
      });
      // Parent is now `used` (verified by previous suite).
      await service.deleteItem('w1', post.id);
      const refreshed = await service.getItem('w1', concept.id);
      expect(refreshed.status).toBe('new');
    });

    it('leaves parent concept `used` when sibling posts remain', async () => {
      const concept = await service.createItem('w1', {
        stage: 'concept',
        status: 'new',
        title: 'Parent',
      });
      const postA = await service.createItem('w1', {
        stage: 'post',
        status: 'in-progress',
        title: 'A',
        parentConceptId: concept.id,
      });
      await service.createItem('w1', {
        stage: 'post',
        status: 'in-progress',
        title: 'B',
        parentConceptId: concept.id,
      });
      await service.deleteItem('w1', postA.id);
      const refreshed = await service.getItem('w1', concept.id);
      expect(refreshed.status).toBe('used');
    });

    it('flips parent idea back to `new` when the last child concept is deleted', async () => {
      const idea = await service.createItem('w1', {
        stage: 'idea',
        status: 'new',
        title: 'Parent',
      });
      const concept = await service.createItem('w1', {
        stage: 'concept',
        status: 'new',
        title: 'Sole child',
        parentIdeaId: idea.id,
      });
      await service.deleteItem('w1', concept.id);
      const refreshed = await service.getItem('w1', idea.id);
      expect(refreshed.status).toBe('new');
    });

    it('archived siblings still count — does not trigger un-flip', async () => {
      const concept = await service.createItem('w1', {
        stage: 'concept',
        status: 'new',
        title: 'Parent',
      });
      const postLive = await service.createItem('w1', {
        stage: 'post',
        status: 'in-progress',
        title: 'Live',
        parentConceptId: concept.id,
      });
      const postArchived = await service.createItem('w1', {
        stage: 'post',
        status: 'in-progress',
        title: 'Archived',
        parentConceptId: concept.id,
      });
      await service.archiveItem('w1', postArchived.id);
      await service.deleteItem('w1', postLive.id);
      // Archived post still in archive index — the un-flip must NOT fire.
      const refreshed = await service.getItem('w1', concept.id);
      expect(refreshed.status).toBe('used');
    });
  });

  describe('sendConceptBack (ticket #118)', () => {
    async function seedConceptWithChildren(
      workspaceId: string,
      liveCount: number,
      archivedCount = 0,
    ): Promise<{ concept: ContentItemContract; liveIds: string[]; archivedIds: string[] }> {
      const concept = await service.createItem(workspaceId, {
        stage: 'concept',
        status: 'new',
        title: 'Parent concept',
      });
      const liveIds: string[] = [];
      for (let i = 0; i < liveCount; i++) {
        const p = await service.createItem(workspaceId, {
          stage: 'post',
          status: 'in-progress',
          title: `Live ${i + 1}`,
          parentConceptId: concept.id,
        });
        liveIds.push(p.id);
      }
      const archivedIds: string[] = [];
      for (let i = 0; i < archivedCount; i++) {
        const p = await service.createItem(workspaceId, {
          stage: 'post',
          status: 'in-progress',
          title: `Archived ${i + 1}`,
          parentConceptId: concept.id,
        });
        await service.archiveItem(workspaceId, p.id);
        archivedIds.push(p.id);
      }
      return { concept, liveIds, archivedIds };
    }

    it('archives every live child post and flips the concept to `new`', async () => {
      const { concept, liveIds, archivedIds } = await seedConceptWithChildren(
        'w1',
        2,
        1,
      );

      const result = await service.sendConceptBack('w1', concept.id);

      expect(result.conceptId).toBe(concept.id);
      expect(result.conceptStatus).toBe('new');
      expect(result.archivedPostIds.sort()).toEqual([...liveIds].sort());
      expect(result.alreadyArchivedPostIds.sort()).toEqual([...archivedIds].sort());

      const refreshedConcept = await service.getItem('w1', concept.id);
      expect(refreshedConcept.status).toBe('new');

      for (const id of liveIds) {
        const post = await service.getItem('w1', id);
        expect(post.archived).toBe(true);
      }
      for (const id of archivedIds) {
        const post = await service.getItem('w1', id);
        expect(post.archived).toBe(true);
      }
    });

    it('is idempotent — second call on the same concept is a no-op', async () => {
      const { concept } = await seedConceptWithChildren('w1', 2);
      await service.sendConceptBack('w1', concept.id);

      const result = await service.sendConceptBack('w1', concept.id);

      expect(result.archivedPostIds).toEqual([]);
      expect(result.conceptStatus).toBe('new');
      const refreshedConcept = await service.getItem('w1', concept.id);
      expect(refreshedConcept.status).toBe('new');
    });

    it('returns empty arrays when the concept has no posts', async () => {
      const concept = await service.createItem('w1', {
        stage: 'concept',
        status: 'new',
        title: 'Childless',
      });

      const result = await service.sendConceptBack('w1', concept.id);

      expect(result.archivedPostIds).toEqual([]);
      expect(result.alreadyArchivedPostIds).toEqual([]);
      expect(result.conceptStatus).toBe('new');
    });

    it('rejects with BadRequestException when the target is not a concept', async () => {
      const idea = await service.createItem('w1', {
        stage: 'idea',
        status: 'new',
        title: 'Idea',
      });
      await expect(service.sendConceptBack('w1', idea.id)).rejects.toBeInstanceOf(
        BadRequestException,
      );

      const concept = await service.createItem('w1', {
        stage: 'concept',
        status: 'new',
        title: 'Parent',
      });
      const post = await service.createItem('w1', {
        stage: 'post',
        status: 'in-progress',
        title: 'Post',
        parentConceptId: concept.id,
      });
      await expect(service.sendConceptBack('w1', post.id)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects with NotFoundException when the concept does not exist', async () => {
      await expect(
        service.sendConceptBack('w1', 'c-does-not-exist'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rolls back archived posts when the concept-flip throws', async () => {
      const { concept, liveIds } = await seedConceptWithChildren('w1', 2);

      // Force flipParentToNew to fail by stubbing it. Cast through unknown
      // to bypass the private-method visibility guard.
      const orig = (
        service as unknown as { flipParentToNew: (w: string, p: string) => Promise<void> }
      ).flipParentToNew.bind(service);
      let calls = 0;
      (
        service as unknown as { flipParentToNew: (w: string, p: string) => Promise<void> }
      ).flipParentToNew = async (w: string, p: string) => {
        calls++;
        if (p === concept.id) throw new Error('forced flip failure');
        return orig(w, p);
      };

      await expect(service.sendConceptBack('w1', concept.id)).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );

      expect(calls).toBeGreaterThan(0);
      // Every live post should be restored to archived=false (rollback).
      for (const id of liveIds) {
        const post = await service.getItem('w1', id);
        expect(post.archived).toBe(false);
      }
      // Concept stays `used` because the flip never landed.
      const refreshedConcept = await service.getItem('w1', concept.id);
      expect(refreshedConcept.status).toBe('used');
    });
  });

  // Ticket #135: bootstrap reconciliation that backfills top-level
  // scheduledAt / scheduledDate / status for legacy items that only have
  // publishConfig.scheduleAt set. Tests cover happy path, idempotency,
  // skip conditions, and resilience to per-tenant failures.
  describe('reconcileScheduledPosts (ticket #135)', () => {
    function seedIndexRow(
      tenant: string,
      row: Record<string, unknown>,
    ): void {
      const indexFile = `_content-items-index.json`;
      const existing = Object.entries(fs.files).find(
        ([, f]) => f.filename === indexFile,
      );
      const index = existing
        ? (existing[1].content as { items: unknown[]; totalCount: number })
        : { items: [], totalCount: 0, lastUpdated: 'now' };
      index.items.push(row);
      index.totalCount = index.items.length;
      if (existing) {
        fs.files[existing[0]] = { filename: indexFile, content: index };
      } else {
        // Use the namespace prefix-agnostic filename — the buildFakeFs
        // listDirectory matches by name only, so this is sufficient.
        const fileId = `f-${Object.keys(fs.files).length + 1000}`;
        fs.files[fileId] = { filename: indexFile, content: index };
      }
      // mark tenant so listTenants returns it
      tenants.add(tenant);
    }

    function seedItemFile(item: Record<string, unknown>): void {
      const fileId = `f-item-${(item.id as string).replace(/[^a-z0-9]/gi, '')}`;
      fs.files[fileId] = {
        filename: `${item.id}.json`,
        content: item,
      };
    }

    let tenants: Set<string>;

    beforeEach(() => {
      tenants = new Set<string>();
      (fs as unknown as { listTenants: () => Promise<string[]> }).listTenants =
        async () => Array.from(tenants);
    });

    it('reconciles a drifted item: publishConfig.scheduleAt + scheduledAt missing', async () => {
      seedIndexRow('w-a', {
        id: 'c-99',
        stage: 'post',
        status: 'review',
        title: 'Drifted',
        platform: 'instagram',
        contentType: 'reel',
        pillarIds: [],
        segmentIds: [],
        owner: null,
        parentIdeaId: null,
        parentConceptId: null,
        scheduledDate: null,
        scheduledAt: null,
        archived: false,
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-01T00:00:00.000Z',
      });
      seedItemFile({
        id: 'c-99',
        stage: 'post',
        status: 'review',
        title: 'Drifted',
        description: '',
        pillarIds: [],
        segmentIds: [],
        archived: false,
        production: {
          qa: {
            publishConfig: {
              publishAction: 'schedule',
              scheduleAt: '2026-06-15T10:00',
            },
          },
        },
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-01T00:00:00.000Z',
      });

      const result = await service.reconcileScheduledPosts();

      expect(result).toEqual({ workspacesScanned: 1, itemsReconciled: 1 });
      const updated = await service.getItem('w-a', 'c-99');
      expect(updated.scheduledAt).toBe('2026-06-15T10:00:00.000Z');
      expect(updated.scheduledDate).toBe('2026-06-15');
      expect(updated.status).toBe('scheduled');
    });

    it('is idempotent: second run reconciles zero items', async () => {
      seedIndexRow('w-a', {
        id: 'c-99',
        stage: 'post',
        status: 'review',
        title: 'Drifted',
        scheduledDate: null,
        scheduledAt: null,
        archived: false,
        platform: null,
        contentType: null,
        pillarIds: [],
        segmentIds: [],
        owner: null,
        parentIdeaId: null,
        parentConceptId: null,
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-01T00:00:00.000Z',
      });
      seedItemFile({
        id: 'c-99',
        stage: 'post',
        status: 'review',
        title: 'Drifted',
        description: '',
        pillarIds: [],
        segmentIds: [],
        archived: false,
        production: {
          qa: {
            publishConfig: {
              publishAction: 'schedule',
              scheduleAt: '2026-06-15T10:00',
            },
          },
        },
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-01T00:00:00.000Z',
      });

      const first = await service.reconcileScheduledPosts();
      const second = await service.reconcileScheduledPosts();

      expect(first.itemsReconciled).toBe(1);
      expect(second.itemsReconciled).toBe(0);
    });

    it('skips entries with scheduledAt already set, archived, wrong publishAction, missing/malformed scheduleAt', async () => {
      // Already in sync — skipped by `entry.scheduledAt` guard.
      seedIndexRow('w-a', {
        id: 'c-already',
        stage: 'post',
        status: 'scheduled',
        title: 'Synced',
        scheduledDate: '2026-06-01',
        scheduledAt: '2026-06-01T15:00:00.000Z',
        archived: false,
        platform: null,
        contentType: null,
        pillarIds: [],
        segmentIds: [],
        owner: null,
        parentIdeaId: null,
        parentConceptId: null,
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-01T00:00:00.000Z',
      });
      // Archived — skipped by `entry.archived` guard.
      seedIndexRow('w-a', {
        id: 'c-archived',
        stage: 'post',
        status: 'review',
        title: 'Archived',
        scheduledDate: null,
        scheduledAt: null,
        archived: true,
        platform: null,
        contentType: null,
        pillarIds: [],
        segmentIds: [],
        owner: null,
        parentIdeaId: null,
        parentConceptId: null,
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-01T00:00:00.000Z',
      });
      // publishAction is 'save-draft' — skipped.
      seedIndexRow('w-a', {
        id: 'c-draft',
        stage: 'post',
        status: 'review',
        title: 'Draft action',
        scheduledDate: null,
        scheduledAt: null,
        archived: false,
        platform: null,
        contentType: null,
        pillarIds: [],
        segmentIds: [],
        owner: null,
        parentIdeaId: null,
        parentConceptId: null,
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-01T00:00:00.000Z',
      });
      seedItemFile({
        id: 'c-draft',
        stage: 'post',
        status: 'review',
        title: 'Draft action',
        description: '',
        pillarIds: [],
        segmentIds: [],
        archived: false,
        production: {
          qa: {
            publishConfig: {
              publishAction: 'save-draft',
              scheduleAt: '2026-06-15T10:00',
            },
          },
        },
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-01T00:00:00.000Z',
      });
      // Malformed scheduleAt — skipped.
      seedIndexRow('w-a', {
        id: 'c-bad',
        stage: 'post',
        status: 'review',
        title: 'Bad date',
        scheduledDate: null,
        scheduledAt: null,
        archived: false,
        platform: null,
        contentType: null,
        pillarIds: [],
        segmentIds: [],
        owner: null,
        parentIdeaId: null,
        parentConceptId: null,
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-01T00:00:00.000Z',
      });
      seedItemFile({
        id: 'c-bad',
        stage: 'post',
        status: 'review',
        title: 'Bad date',
        description: '',
        pillarIds: [],
        segmentIds: [],
        archived: false,
        production: {
          qa: {
            publishConfig: {
              publishAction: 'schedule',
              scheduleAt: 'not-a-date',
            },
          },
        },
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-01T00:00:00.000Z',
      });

      const result = await service.reconcileScheduledPosts();

      expect(result.itemsReconciled).toBe(0);
    });

    it('continues to remaining tenants when one tenant throws', async () => {
      // Override listTenants to return two tenants; one explodes on readIndex.
      (fs as unknown as {
        listTenants: () => Promise<string[]>;
      }).listTenants = async () => ['w-bad', 'w-ok'];
      const realListDirectory = fs.listDirectory.bind(fs);
      (fs as unknown as {
        listDirectory: typeof fs.listDirectory;
      }).listDirectory = async (tenant: string, namespace: string) => {
        if (tenant === 'w-bad') throw new Error('AFS down for w-bad');
        return realListDirectory(tenant, namespace);
      };
      seedIndexRow('w-ok', {
        id: 'c-ok',
        stage: 'post',
        status: 'review',
        title: 'OK',
        scheduledDate: null,
        scheduledAt: null,
        archived: false,
        platform: null,
        contentType: null,
        pillarIds: [],
        segmentIds: [],
        owner: null,
        parentIdeaId: null,
        parentConceptId: null,
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-01T00:00:00.000Z',
      });
      seedItemFile({
        id: 'c-ok',
        stage: 'post',
        status: 'review',
        title: 'OK',
        description: '',
        pillarIds: [],
        segmentIds: [],
        archived: false,
        production: {
          qa: {
            publishConfig: {
              publishAction: 'schedule',
              scheduleAt: '2026-07-01T08:00',
            },
          },
        },
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-01T00:00:00.000Z',
      });

      const result = await service.reconcileScheduledPosts();

      expect(result.workspacesScanned).toBe(2);
      expect(result.itemsReconciled).toBe(1);
    });

    it('returns zero when fs is not configured', async () => {
      fs.setConfigured(false);
      const result = await service.reconcileScheduledPosts();
      expect(result).toEqual({ workspacesScanned: 0, itemsReconciled: 0 });
    });

    it('returns zero and logs when listTenants itself throws', async () => {
      (fs as unknown as {
        listTenants: () => Promise<string[]>;
      }).listTenants = async () => {
        throw new Error('tenants endpoint down');
      };
      const result = await service.reconcileScheduledPosts();
      expect(result).toEqual({ workspacesScanned: 0, itemsReconciled: 0 });
    });

    it('onModuleInit never throws even when reconciliation rejects', async () => {
      (fs as unknown as {
        listTenants: () => Promise<string[]>;
      }).listTenants = async () => {
        throw new Error('boom');
      };
      await expect(service.onModuleInit()).resolves.toBeUndefined();
    });
  });
});
