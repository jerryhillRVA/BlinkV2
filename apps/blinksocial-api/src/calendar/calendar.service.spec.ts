import { Test } from '@nestjs/testing';
import { CalendarService } from './calendar.service';
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
        scheduleAt: '2026-05-02T15:00:00.000Z',
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
        scheduledDate: '2026-05-10',
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
        scheduledDate: '2026-05-20',
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
        scheduledDate: null,
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
): Promise<CalendarService> {
  const defaultMock: FixtureMockDataService = {
    isMockWorkspace: () => false,
    getNamespaceAggregate: async () => null,
    getSettings: async () => null,
    ...mock,
  };
  const module = await Test.createTestingModule({
    providers: [
      CalendarService,
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
    expect(result.items.find((i) => i.id === 'real-1')?.scheduleAt).toBe(
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

  it('falls back to synthetic when mock workspace has no fixture and no content items', async () => {
    const service = await buildService({
      isMockWorkspace: (id) => id === 'hive-collective',
      getNamespaceAggregate: async () => null,
      getSettings: async () => null,
    });
    const result = await service.getCalendar('hive-collective');
    expect(result.items.length).toBeGreaterThanOrEqual(28);
    expect(result.items[0].id).toMatch(/^calitem-hive-collective-/);
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
});
