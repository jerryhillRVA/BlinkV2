import { Test } from '@nestjs/testing';
import { CalendarService } from './calendar.service';
import type {
  CalendarItemStatusContract,
  CalendarResponseContract,
} from '@blinksocial/contracts';

type FixtureMockDataService = {
  isMockWorkspace: (id: string) => boolean;
  getNamespaceAggregate: (
    id: string,
    ns: string,
    file: string,
  ) => Promise<CalendarResponseContract | null>;
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

async function buildService(
  mock?: Partial<FixtureMockDataService>,
): Promise<CalendarService> {
  const defaultMock: FixtureMockDataService = {
    isMockWorkspace: () => false,
    getNamespaceAggregate: async () => null,
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
      getNamespaceAggregate: async () => fixture,
    });
    const result = await service.getCalendar('hive-collective');
    expect(result.workspaceId).toBe('hive-collective');
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('fixture-1');
    expect(result.milestones[0].contentId).toBe('fixture-1');
  });

  it('falls back to synthetic data when fixture is missing for a mock tenant', async () => {
    const service = await buildService({
      isMockWorkspace: (id) => id === 'hive-collective',
      getNamespaceAggregate: async () => null,
    });
    const result = await service.getCalendar('hive-collective');
    expect(result.workspaceId).toBe('hive-collective');
    expect(result.items.length).toBeGreaterThanOrEqual(28);
  });

  it('generates a synthetic dataset for a non-mock workspace', async () => {
    const service = await buildService({
      isMockWorkspace: () => false,
    });
    const result = await service.getCalendar('any-tenant');
    expect(result.workspaceId).toBe('any-tenant');
    expect(result.referenceDate).toBe('2026-05-01T00:00:00.000Z');
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.milestones.length).toBeGreaterThan(0);
  });

  it('produces a deterministic dataset for the same workspaceId', async () => {
    const service = await buildService();
    const a = await service.getCalendar('blink-deterministic');
    const b = await service.getCalendar('blink-deterministic');
    expect(a.items.map((i) => i.id)).toEqual(b.items.map((i) => i.id));
    expect(a.milestones.map((m) => m.milestoneId)).toEqual(
      b.milestones.map((m) => m.milestoneId),
    );
  });

  it('produces different datasets for different workspaceIds', async () => {
    const service = await buildService();
    const a = await service.getCalendar('tenant-a');
    const b = await service.getCalendar('tenant-b');
    expect(a.items.map((i) => i.id)).not.toEqual(b.items.map((i) => i.id));
  });

  it('every milestone references a real item', async () => {
    const service = await buildService();
    const result = await service.getCalendar('tenant-c');
    const itemIds = new Set(result.items.map((i) => i.id));
    for (const m of result.milestones) {
      expect(itemIds.has(m.contentId)).toBe(true);
    }
  });

  it('every item has every required field', async () => {
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

  it('status values fall within the documented set', async () => {
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
      getNamespaceAggregate: async () => fixture,
    });
    const result = await service.getCalendar('hive-collective');
    expect(result.workspaceId).toBe('hive-collective');
  });
});
