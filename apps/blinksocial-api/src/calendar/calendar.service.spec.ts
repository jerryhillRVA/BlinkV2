import { ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CalendarService } from './calendar.service';
import { AgenticFilesystemService } from '../agentic-filesystem/agentic-filesystem.service';
import type {
  BatchFileEntry,
  DirEntry,
} from '../agentic-filesystem/agentic-filesystem.service';
import type {
  CalendarItemStatusContract,
  CalendarResponseContract,
  CalendarSettingsContract,
  ContentItemsIndexContract,
} from '@blinksocial/contracts';

type FixtureMockDataService = {
  isMockWorkspace: (id: string) => boolean;
  getNamespaceAggregate: (
    id: string,
    ns: string,
    file: string,
  ) => Promise<unknown | null>;
  getSettings: (id: string, tab: string) => Promise<unknown | null>;
  getItemFile: (id: string, itemId: string) => Promise<unknown | null>;
};

type FixtureFsService = {
  isConfigured: () => boolean;
  listDirectory: (tenant: string, namespace: string) => Promise<DirEntry[]>;
  batchRetrieve: (tenant: string, fileIds: string[]) => Promise<BatchFileEntry[]>;
};

function buildFixture(): CalendarResponseContract {
  return {
    workspaceId: 'hive-collective',
    referenceDate: '2026-05-01T00:00:00.000Z',
    items: [
      {
        id: 'fixture-1',
        title: 'Fixture item',
        platform: 'instagram',
        canonicalType: 'IMAGE_SINGLE',
        status: 'scheduled',
        owner: 'Ava',
        scheduledAt: '2026-05-02T15:00:00.000Z',
      },
    ],
    milestones: [
      {
        milestoneId: 'fixture-1-draft-0',
        contentId: 'fixture-1',
        milestoneType: 'draft_due',
        dueAt: '2026-04-28T00:00:00.000Z',
        milestoneOwner: 'Ava',
        isRequired: true,
      },
    ],
  };
}

function buildIndex(): ContentItemsIndexContract {
  return {
    items: [
      {
        id: 'real-1',
        stage: 'post',
        status: 'scheduled',
        title: 'Real scheduled post',
        platform: 'instagram',
        contentType: 'reel',
        pillarIds: [],
        segmentIds: [],
        owner: 'user-a',
        parentIdeaId: null,
        parentConceptId: null,
        scheduledAt: "2026-05-10T14:00:00.000Z",
        archived: false,
        createdAt: '2026-04-01T08:00:00Z',
        updatedAt: '2026-04-15T10:00:00Z',
      },
      {
        id: 'real-2',
        stage: 'post',
        status: 'in-progress',
        title: 'Real in-progress post',
        platform: 'youtube',
        contentType: 'long-form',
        pillarIds: [],
        segmentIds: [],
        owner: null,
        parentIdeaId: null,
        parentConceptId: null,
        scheduledAt: "2026-05-20T14:00:00.000Z",
        archived: false,
        createdAt: '2026-04-05T08:00:00Z',
        updatedAt: '2026-04-20T10:00:00Z',
      },
      {
        id: 'idea-x',
        stage: 'idea',
        status: 'draft',
        title: 'Unscheduled idea',
        platform: null,
        contentType: null,
        pillarIds: [],
        segmentIds: [],
        owner: null,
        parentIdeaId: null,
        parentConceptId: null,
        scheduledAt: null,
        archived: false,
        createdAt: '2026-04-01T08:00:00Z',
        updatedAt: '2026-04-01T08:00:00Z',
      },
    ],
    totalCount: 3,
    lastUpdated: '2026-04-26T00:00:00.000Z',
  };
}

function buildSettings(): CalendarSettingsContract {
  return {
    enableDeadlineTemplates: true,
    deadlineTemplates: {
      VIDEO_SHORT_VERTICAL: {
        milestones: [
          { milestoneType: 'draft_due', offsetDays: -5, required: true },
          { milestoneType: 'qa_due', offsetDays: -1, required: true },
        ],
        phases: [],
      },
    },
    reminderSettings: {
      milestone72h: false,
      milestone24h: false,
      milestoneOverdue: false,
      publish24h: false,
    },
    autoCreateOnPublish: false,
  };
}

async function buildService(
  mock?: Partial<FixtureMockDataService>,
  fsMock?: Partial<FixtureFsService>,
): Promise<CalendarService> {
  const defaultMock: FixtureMockDataService = {
    isMockWorkspace: () => false,
    getNamespaceAggregate: async () => null,
    getSettings: async () => null,
    getItemFile: async () => null,
    ...mock,
  };
  const defaultFs: FixtureFsService = {
    isConfigured: () => false,
    listDirectory: async () => [],
    batchRetrieve: async () => [],
    ...fsMock,
  };
  const module = await Test.createTestingModule({
    providers: [
      CalendarService,
      { provide: AgenticFilesystemService, useValue: defaultFs },
      { provide: 'MOCK_DATA_SERVICE', useValue: defaultMock },
    ],
  }).compile();
  return module.get(CalendarService);
}

describe('CalendarService', () => {
  it('returns fixture data when workspace is a mock tenant with a stored fixture', async () => {
    const fixture = buildFixture();
    const service = await buildService({
      isMockWorkspace: (id) => id === 'hive-collective',
      getNamespaceAggregate: async (_id, ns) =>
        ns === 'calendar' ? fixture : null,
    });
    const result = await service.getCalendar('hive-collective');
    expect(result.workspaceId).toBe('hive-collective');
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('fixture-1');
    expect(result.milestones[0].contentId).toBe('fixture-1');
  });

  it('derives calendar from mock content items when no calendar fixture exists', async () => {
    const index = buildIndex();
    const settings = buildSettings();
    const service = await buildService({
      isMockWorkspace: (id) => id === 'hive-collective',
      getNamespaceAggregate: async (_id, ns) =>
        ns === 'content-items' ? index : null,
      getSettings: async (_id, tab) => (tab === 'calendar' ? settings : null),
    });
    const result = await service.getCalendar('hive-collective');
    const ids = result.items.map((i) => i.id).sort();
    expect(ids).toEqual(['real-1', 'real-2']);
    expect(result.items.find((i) => i.id === 'real-1')?.scheduledAt).toBe(
      '2026-05-10T14:00:00.000Z',
    );
    expect(result.items.find((i) => i.id === 'real-1')?.canonicalType).toBe(
      'VIDEO_SHORT_VERTICAL',
    );
    // real-1 (reel) gets two milestones from the template; real-2 (long-form) gets none
    const real1Milestones = result.milestones.filter(
      (m) => m.contentId === 'real-1',
    );
    expect(real1Milestones).toHaveLength(2);
    expect(real1Milestones[0].dueAt).toBe('2026-05-05T14:00:00.000Z');
    expect(
      result.milestones.filter((m) => m.contentId === 'real-2'),
    ).toHaveLength(0);
  });

  it('skips archived items when deriving from content', async () => {
    const index = buildIndex();
    index.items[0].archived = true;
    const service = await buildService({
      isMockWorkspace: (id) => id === 'hive-collective',
      getNamespaceAggregate: async (_id, ns) =>
        ns === 'content-items' ? index : null,
      getSettings: async () => null,
    });
    const result = await service.getCalendar('hive-collective');
    expect(result.items.map((i) => i.id)).toEqual(['real-2']);
  });

  it('returns an empty derived response (NOT synthetic) when a mock workspace has no fixture and no content items', async () => {
    const service = await buildService({
      isMockWorkspace: (id) => id === 'hive-collective',
      getNamespaceAggregate: async () => null,
      getSettings: async () => null,
    });
    const result = await service.getCalendar('hive-collective');
    expect(result.workspaceId).toBe('hive-collective');
    expect(result.items).toEqual([]);
    expect(result.milestones).toEqual([]);
  });

  it('does not apply deadline-template milestones to items without an explicit contentType', async () => {
    const index: ContentItemsIndexContract = {
      items: [
        {
          id: 'untyped-1',
          stage: 'post',
          status: 'in-progress',
          title: 'Item without contentType',
          platform: null,
          contentType: null,
          pillarIds: [],
          segmentIds: [],
          owner: null,
          parentIdeaId: null,
          parentConceptId: null,
          scheduledAt: "2026-05-10T14:00:00.000Z",
          archived: false,
          createdAt: '2026-04-01T08:00:00Z',
          updatedAt: '2026-04-15T10:00:00Z',
        },
      ],
      totalCount: 1,
      lastUpdated: '2026-04-26T00:00:00.000Z',
    };
    // Settings define a template for IMAGE_SINGLE — the visual default for
    // unset contentType. We must NOT pick it up.
    const settings: CalendarSettingsContract = {
      enableDeadlineTemplates: true,
      deadlineTemplates: {
        IMAGE_SINGLE: {
          milestones: [
            { milestoneType: 'draft_due', offsetDays: -3, required: true },
          ],
          phases: [],
        },
      },
      reminderSettings: {
        milestone72h: false,
        milestone24h: false,
        milestoneOverdue: false,
        publish24h: false,
      },
      autoCreateOnPublish: false,
    };
    const service = await buildService({
      isMockWorkspace: (id) => id === 'hive-collective',
      getNamespaceAggregate: async (_id, ns) =>
        ns === 'content-items' ? index : null,
      getSettings: async (_id, tab) => (tab === 'calendar' ? settings : null),
    });
    const result = await service.getCalendar('hive-collective');
    expect(result.items.map((i) => i.id)).toEqual(['untyped-1']);
    expect(result.items[0].canonicalType).toBe('IMAGE_SINGLE');
    expect(result.milestones).toEqual([]);
  });

  it('generates a synthetic dataset for a non-mock workspace', async () => {
    const service = await buildService({
      isMockWorkspace: () => false,
    });
    const result = await service.getCalendar('any-tenant');
    expect(result.workspaceId).toBe('any-tenant');
    expect(result.referenceDate).toBe('2026-05-01T00:00:00.000Z');
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items[0].id).toMatch(/^calitem-any-tenant-/);
  });

  it('produces a deterministic synthetic dataset for the same workspaceId', async () => {
    const service = await buildService();
    const a = await service.getCalendar('blink-deterministic');
    const b = await service.getCalendar('blink-deterministic');
    expect(a.items.map((i) => i.id)).toEqual(b.items.map((i) => i.id));
    expect(a.milestones.map((m) => m.milestoneId)).toEqual(
      b.milestones.map((m) => m.milestoneId),
    );
  });

  it('produces different synthetic datasets for different workspaceIds', async () => {
    const service = await buildService();
    const a = await service.getCalendar('tenant-a');
    const b = await service.getCalendar('tenant-b');
    expect(a.items.map((i) => i.id)).not.toEqual(b.items.map((i) => i.id));
  });

  it('every milestone references a real item (synthetic)', async () => {
    const service = await buildService();
    const result = await service.getCalendar('tenant-c');
    const itemIds = new Set(result.items.map((i) => i.id));
    for (const m of result.milestones) {
      expect(itemIds.has(m.contentId)).toBe(true);
    }
  });

  it('every synthetic item has every required field', async () => {
    const service = await buildService();
    const result = await service.getCalendar('tenant-d');
    for (const item of result.items) {
      expect(item.id).toBeTruthy();
      expect(item.title).toBeTruthy();
      expect(item.platform).toBeTruthy();
      expect(item.canonicalType).toBeTruthy();
      expect(item.owner).toBeTruthy();
      expect(item.status).toBeTruthy();
    }
  });

  it('synthetic status values fall within the documented set', async () => {
    const service = await buildService();
    const result = await service.getCalendar('tenant-e');
    const valid: CalendarItemStatusContract[] = [
      'intake',
      'in-progress',
      'in-review',
      'revisions',
      'approved',
      'scheduled',
      'published',
      'archived',
    ];
    for (const item of result.items) {
      expect(valid).toContain(item.status);
    }
  });

  it('preserves the fixture but rewrites workspaceId to the requested id', async () => {
    const fixture = buildFixture();
    fixture.workspaceId = 'stored-in-file';
    const service = await buildService({
      isMockWorkspace: (id) => id === 'hive-collective',
      getNamespaceAggregate: async (_id, ns) =>
        ns === 'calendar' ? fixture : null,
    });
    const result = await service.getCalendar('hive-collective');
    expect(result.workspaceId).toBe('hive-collective');
  });

  describe('AFS mode', () => {
    function fsThatServes(
      files: Record<string, unknown>,
    ): Partial<FixtureFsService> {
      // files: namespace+filename → JSON content. Mocks listDirectory to
      // return matching DirEntry shapes and batchRetrieve to return the
      // content for the requested file_ids.
      const dir = Object.entries(files).reduce<Record<string, DirEntry[]>>(
        (acc, [key, _content]) => {
          const [namespace, filename] = key.split('|');
          acc[namespace] = acc[namespace] ?? [];
          acc[namespace].push({
            name: filename,
            type: 'file',
            file_id: `id-${namespace}-${filename}`,
          });
          return acc;
        },
        {},
      );
      return {
        isConfigured: () => true,
        listDirectory: async (_tenant, namespace) => dir[namespace] ?? [],
        batchRetrieve: async (_tenant, fileIds) =>
          fileIds.map((id) => {
            const match = Object.entries(files).find(
              ([key]) => `id-${key.split('|')[0]}-${key.split('|')[1]}` === id,
            );
            return {
              file_id: id,
              filename: id,
              content_type: 'json',
              content: match ? match[1] : null,
            } as BatchFileEntry;
          }),
      };
    }

    it('projects an IG-Reel post from the AFS index with the documented field shape', async () => {
      const index: ContentItemsIndexContract = {
        items: [
          {
            id: 'afs-reel-1',
            stage: 'post',
            status: 'scheduled',
            title: 'AFS-mode reel',
            platform: 'instagram',
            contentType: 'reel',
            pillarIds: [],
            segmentIds: [],
            owner: 'Test Owner',
            parentIdeaId: null,
            parentConceptId: null,
            scheduledAt: "2026-05-20T14:00:00.000Z",
            archived: false,
            createdAt: '2026-04-01T08:00:00Z',
            updatedAt: '2026-04-20T10:00:00Z',
          },
        ],
        totalCount: 1,
        lastUpdated: '2026-04-26T00:00:00.000Z',
      };
      const service = await buildService(
        // mock-mode isn't reachable when fs.isConfigured() === true, but
        // we still provide a stub so any accidental call surfaces a fail.
        { isMockWorkspace: () => true, getNamespaceAggregate: async () => null },
        fsThatServes({
          'content-items|_content-items-index.json': index,
        }),
      );
      const result = await service.getCalendar('afs-tenant');
      expect(result.workspaceId).toBe('afs-tenant');
      expect(result.items).toEqual([
        {
          id: 'afs-reel-1',
          title: 'AFS-mode reel',
          platform: 'instagram',
          canonicalType: 'VIDEO_SHORT_VERTICAL',
          status: 'scheduled',
          owner: 'Test Owner',
          scheduledAt: '2026-05-20T14:00:00.000Z',
          blockers: [],
        },
      ]);
      expect(result.milestones).toEqual([]);
    });

    it('derives milestones from settings/calendar.json deadline templates', async () => {
      const index: ContentItemsIndexContract = {
        items: [
          {
            id: 'afs-reel-2',
            stage: 'post',
            status: 'scheduled',
            title: 'AFS milestone reel',
            platform: 'instagram',
            contentType: 'reel',
            pillarIds: [],
            segmentIds: [],
            owner: 'Owner-TC3',
            parentIdeaId: null,
            parentConceptId: null,
            scheduledAt: "2026-06-01T14:00:00.000Z",
            archived: false,
            createdAt: '2026-04-01T08:00:00Z',
            updatedAt: '2026-04-20T10:00:00Z',
          },
        ],
        totalCount: 1,
        lastUpdated: '2026-04-26T00:00:00.000Z',
      };
      const settings: CalendarSettingsContract = {
        enableDeadlineTemplates: true,
        deadlineTemplates: {
          VIDEO_SHORT_VERTICAL: {
            milestones: [
              { milestoneType: 'draft_due', offsetDays: -7, required: true },
              { milestoneType: 'assets_due', offsetDays: -5, required: true },
              { milestoneType: 'qa_due', offsetDays: -2, required: true },
            ],
            phases: [],
          },
        },
        reminderSettings: {
          milestone72h: false,
          milestone24h: false,
          milestoneOverdue: false,
          publish24h: false,
        },
        autoCreateOnPublish: false,
      };
      const service = await buildService(
        undefined,
        fsThatServes({
          'content-items|_content-items-index.json': index,
          'settings|calendar.json': settings,
        }),
      );
      const result = await service.getCalendar('afs-tenant');
      expect(result.milestones).toHaveLength(3);
      const due = result.milestones.map((m) => ({
        type: m.milestoneType,
        dueAt: m.dueAt,
        owner: m.milestoneOwner,
        required: m.isRequired,
      }));
      expect(due).toEqual([
        {
          type: 'draft_due',
          dueAt: '2026-05-25T14:00:00.000Z',
          owner: 'Owner-TC3',
          required: true,
        },
        {
          type: 'assets_due',
          dueAt: '2026-05-27T14:00:00.000Z',
          owner: 'Owner-TC3',
          required: true,
        },
        {
          type: 'qa_due',
          dueAt: '2026-05-30T14:00:00.000Z',
          owner: 'Owner-TC3',
          required: true,
        },
      ]);
    });

    it('returns empty items + milestones for a fresh AFS workspace (no index, no settings)', async () => {
      const service = await buildService(undefined, {
        isConfigured: () => true,
        // listDirectory throws → readAfsAggregate returns null → empty response.
        listDirectory: async () => {
          throw new Error('namespace not found');
        },
        batchRetrieve: async () => [],
      });
      const result = await service.getCalendar('fresh-tenant');
      expect(result).toEqual({
        workspaceId: 'fresh-tenant',
        referenceDate: '2026-05-01T00:00:00.000Z',
        items: [],
        milestones: [],
      });
    });

    it('throws ServiceUnavailableException when batchRetrieve fails', async () => {
      const service = await buildService(undefined, {
        isConfigured: () => true,
        listDirectory: async () => [
          {
            name: '_content-items-index.json',
            type: 'file',
            file_id: 'some-id',
          },
        ],
        batchRetrieve: async () => {
          throw new Error('connection refused');
        },
      });
      await expect(service.getCalendar('broken-tenant')).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });

    it('does not invoke the mock-mode fixture / synthetic paths when AFS is configured', async () => {
      const fixture = buildFixture();
      const mockFixtureCalls: string[] = [];
      const service = await buildService(
        {
          isMockWorkspace: () => {
            mockFixtureCalls.push('isMockWorkspace');
            return true;
          },
          getNamespaceAggregate: async (_id, ns) => {
            mockFixtureCalls.push(`getNamespaceAggregate:${ns}`);
            return ns === 'calendar' ? fixture : null;
          },
          getSettings: async () => {
            mockFixtureCalls.push('getSettings');
            return null;
          },
        },
        fsThatServes({}),
      );
      const result = await service.getCalendar('afs-tenant');
      expect(mockFixtureCalls).toEqual([]);
      expect(result.items).toEqual([]);
      expect(result.milestones).toEqual([]);
    });

    it('skips archived entries when projecting from the AFS index', async () => {
      const index: ContentItemsIndexContract = {
        items: [
          {
            id: 'afs-archived',
            stage: 'post',
            status: 'scheduled',
            title: 'Archived',
            platform: 'instagram',
            contentType: 'reel',
            pillarIds: [],
            segmentIds: [],
            owner: 'A',
            parentIdeaId: null,
            parentConceptId: null,
            scheduledAt: "2026-05-20T14:00:00.000Z",
            archived: true,
            createdAt: '2026-04-01T08:00:00Z',
            updatedAt: '2026-04-20T10:00:00Z',
          },
          {
            id: 'afs-live',
            stage: 'post',
            status: 'scheduled',
            title: 'Live',
            platform: 'instagram',
            contentType: 'reel',
            pillarIds: [],
            segmentIds: [],
            owner: 'A',
            parentIdeaId: null,
            parentConceptId: null,
            scheduledAt: "2026-05-21T14:00:00.000Z",
            archived: false,
            createdAt: '2026-04-01T08:00:00Z',
            updatedAt: '2026-04-20T10:00:00Z',
          },
        ],
        totalCount: 2,
        lastUpdated: '2026-04-26T00:00:00.000Z',
      };
      const service = await buildService(
        undefined,
        fsThatServes({
          'content-items|_content-items-index.json': index,
        }),
      );
      const result = await service.getCalendar('afs-tenant');
      expect(result.items.map((i) => i.id)).toEqual(['afs-live']);
    });
  });
});
