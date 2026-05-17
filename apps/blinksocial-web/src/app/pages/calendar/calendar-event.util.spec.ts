import {
  applyFilters,
  buildEvents,
  daysBetween,
  deriveMilestoneSeverity,
  derivePublishSeverity,
  sortEventsForCell,
} from './calendar-event.util';
import type {
  CalendarContentItemContract,
  CalendarMilestoneContract,
  CalendarResponseContract,
} from '@blinksocial/contracts';
import type { CalendarFilterState } from './calendar.types';

const REF = new Date('2026-05-01T00:00:00.000Z');

function buildItem(
  overrides: Partial<CalendarContentItemContract> = {},
): CalendarContentItemContract {
  return {
    id: 'item-1',
    title: 'Test title',
    platform: 'instagram',
    canonicalType: 'IMAGE_SINGLE',
    status: 'in-progress',
    owner: 'Ava Chen',
    scheduledAt: null,
    blockers: [],
    ...overrides,
  };
}

function buildMilestone(
  overrides: Partial<CalendarMilestoneContract> = {},
): CalendarMilestoneContract {
  return {
    milestoneId: 'm-1',
    contentId: 'item-1',
    milestoneType: 'draft_due',
    dueAt: '2026-05-02T00:00:00.000Z',
    milestoneOwner: 'Ava Chen',
    isRequired: true,
    ...overrides,
  };
}

describe('daysBetween', () => {
  it('returns positive for future date', () => {
    const d = new Date('2026-05-08T00:00:00.000Z');
    expect(daysBetween(d, REF)).toBe(7);
  });
  it('returns negative for past date', () => {
    const d = new Date('2026-04-24T00:00:00.000Z');
    expect(daysBetween(d, REF)).toBe(-7);
  });
});

describe('deriveMilestoneSeverity', () => {
  it('returns overdue when due date is before reference', () => {
    const m = buildMilestone({ dueAt: '2026-04-20T00:00:00.000Z' });
    expect(deriveMilestoneSeverity(m, buildItem(), REF)).toBe('overdue');
  });
  it('returns null when due date is on/after reference', () => {
    const m = buildMilestone({ dueAt: '2026-05-05T00:00:00.000Z' });
    expect(deriveMilestoneSeverity(m, buildItem(), REF)).toBe(null);
  });
  it('returns blocked when item has blockers', () => {
    const m = buildMilestone({ dueAt: '2026-05-05T00:00:00.000Z' });
    const item = buildItem({ blockers: ['QA fail'] });
    expect(deriveMilestoneSeverity(m, item, REF)).toBe('blocked');
  });
});

describe('derivePublishSeverity', () => {
  it('returns null when no scheduledAt', () => {
    const item = buildItem({ scheduledAt: null });
    expect(derivePublishSeverity(item, REF)).toBe(null);
  });
  it('returns at-risk when within 7 days and not approved/scheduled/published', () => {
    const item = buildItem({
      scheduledAt: '2026-05-03T00:00:00.000Z',
      status: 'in-progress',
    });
    expect(derivePublishSeverity(item, REF)).toBe('at-risk');
  });
  it('returns null when within 7 days but status is approved', () => {
    const item = buildItem({
      scheduledAt: '2026-05-03T00:00:00.000Z',
      status: 'approved',
    });
    expect(derivePublishSeverity(item, REF)).toBe(null);
  });
  it('returns null when beyond 7-day window', () => {
    const item = buildItem({
      scheduledAt: '2026-05-20T00:00:00.000Z',
      status: 'in-progress',
    });
    expect(derivePublishSeverity(item, REF)).toBe(null);
  });
  it('returns blocked when item has blockers regardless of schedule', () => {
    const item = buildItem({
      scheduledAt: '2026-05-03T00:00:00.000Z',
      blockers: ['No assets'],
    });
    expect(derivePublishSeverity(item, REF)).toBe('blocked');
  });
});

function buildResponse(): CalendarResponseContract {
  const items: CalendarContentItemContract[] = [
    buildItem({
      id: 'a',
      scheduledAt: '2026-05-03T00:00:00.000Z',
      status: 'in-progress',
    }),
    buildItem({
      id: 'b',
      platform: 'youtube',
      scheduledAt: '2026-05-20T12:00:00.000Z',
      status: 'approved',
      owner: 'Marcus Lee',
    }),
  ];
  const milestones: CalendarMilestoneContract[] = [
    buildMilestone({
      milestoneId: 'm-a-1',
      contentId: 'a',
      dueAt: '2026-04-28T00:00:00.000Z',
    }),
    buildMilestone({
      milestoneId: 'm-b-1',
      contentId: 'b',
      dueAt: '2026-05-10T00:00:00.000Z',
      milestoneType: 'qa_due',
    }),
  ];
  return {
    workspaceId: 'w',
    referenceDate: REF.toISOString(),
    items,
    milestones,
  };
}

describe('buildEvents', () => {
  it('yields publish + milestone events and sorts chronologically', () => {
    const events = buildEvents(buildResponse());
    expect(events.length).toBe(4);
    for (let i = 1; i < events.length; i += 1) {
      expect(events[i].date.getTime()).toBeGreaterThanOrEqual(
        events[i - 1].date.getTime(),
      );
    }
  });

  it('attaches derived severity to each event', () => {
    const events = buildEvents(buildResponse());
    const aPublish = events.find((e) => e.kind === 'publish' && e.contentId === 'a');
    const aMilestone = events.find(
      (e) => e.kind === 'milestone' && e.contentId === 'a',
    );
    expect(aPublish?.severity).toBe('at-risk');
    expect(aMilestone?.severity).toBe('overdue');
  });

  it('drops milestones whose content is missing', () => {
    const response = buildResponse();
    response.milestones.push(
      buildMilestone({ milestoneId: 'orphan', contentId: 'does-not-exist' }),
    );
    const events = buildEvents(response);
    expect(events.find((e) => e.id === 'milestone-orphan')).toBeUndefined();
  });

  it('skips publish events for items without scheduledAt', () => {
    const response = buildResponse();
    response.items.push(buildItem({ id: 'c', scheduledAt: null }));
    const events = buildEvents(response);
    expect(events.find((e) => e.contentId === 'c' && e.kind === 'publish')).toBeUndefined();
  });

  // #140 — per-status tone derivation in publish events.
  it('emits tone="scheduled" + uses scheduledAt as the event date for status=scheduled', () => {
    const response = buildResponse();
    response.items.push(
      buildItem({
        id: 's',
        status: 'scheduled',
        scheduledAt: '2099-01-15T12:00:00.000Z',
      }),
    );
    const events = buildEvents(response);
    const ev = events.find((e) => e.contentId === 's' && e.kind === 'publish');
    expect(ev).toBeDefined();
    expect(ev?.kind === 'publish' && ev.tone).toBe('scheduled');
    expect(ev?.date.toISOString()).toBe('2099-01-15T12:00:00.000Z');
  });

  it('emits tone="published" + uses publishedAt for status=published', () => {
    const response = buildResponse();
    response.items.push(
      buildItem({
        id: 'p',
        status: 'published',
        scheduledAt: '2099-01-15T12:00:00.000Z',
        publishedAt: '2099-01-16T08:00:00.000Z',
      }),
    );
    const events = buildEvents(response);
    const ev = events.find((e) => e.contentId === 'p' && e.kind === 'publish');
    expect(ev).toBeDefined();
    expect(ev?.kind === 'publish' && ev.tone).toBe('published');
    expect(ev?.date.toISOString()).toBe('2099-01-16T08:00:00.000Z');
  });

  it('silently skips a published item with no publishedAt (legacy data)', () => {
    const response = buildResponse();
    response.items.push(
      buildItem({
        id: 'legacy',
        status: 'published',
        scheduledAt: '2099-01-15T12:00:00.000Z',
        publishedAt: undefined,
      }),
    );
    const events = buildEvents(response);
    expect(
      events.find((e) => e.contentId === 'legacy' && e.kind === 'publish'),
    ).toBeUndefined();
  });

  it('emits tone="intent" for non-terminal status with scheduledAt (legacy intent-to-schedule)', () => {
    const response = buildResponse();
    response.items.push(
      buildItem({
        id: 'i',
        status: 'in-progress',
        scheduledAt: '2099-01-15T12:00:00.000Z',
      }),
    );
    const events = buildEvents(response);
    const ev = events.find((e) => e.contentId === 'i' && e.kind === 'publish');
    expect(ev).toBeDefined();
    expect(ev?.kind === 'publish' && ev.tone).toBe('intent');
  });

  it('propagates isExported into the publish event view', () => {
    const response = buildResponse();
    response.items.push(
      buildItem({
        id: 'ex',
        status: 'scheduled',
        scheduledAt: '2099-01-15T12:00:00.000Z',
        isExported: true,
      }),
    );
    const events = buildEvents(response);
    const ev = events.find((e) => e.contentId === 'ex' && e.kind === 'publish');
    expect(ev?.kind === 'publish' && ev.isExported).toBe(true);
  });
});

describe('applyFilters', () => {
  const events = buildEvents(buildResponse());
  const base: CalendarFilterState = {
    platforms: [],
    statuses: [],
    owners: [],
    search: '',
    showMilestones: true,
    showPublished: true,
  };

  it('passes through when filters empty', () => {
    expect(applyFilters(events, base)).toHaveLength(events.length);
  });
  it('filters by platform', () => {
    const out = applyFilters(events, { ...base, platforms: ['instagram'] });
    expect(out.every((e) => e.item.platform === 'instagram')).toBe(true);
  });
  it('filters by status', () => {
    const out = applyFilters(events, { ...base, statuses: ['approved'] });
    expect(out.every((e) => e.item.status === 'approved')).toBe(true);
  });
  it('filters by owner', () => {
    const out = applyFilters(events, { ...base, owners: ['Marcus Lee'] });
    expect(out.every((e) => e.item.owner === 'Marcus Lee')).toBe(true);
  });
  it('filters by search (case-insensitive)', () => {
    const out = applyFilters(events, { ...base, search: 'TEST' });
    expect(out.length).toBe(events.length);
  });
  it('hides milestones when showMilestones=false', () => {
    const out = applyFilters(events, { ...base, showMilestones: false });
    expect(out.every((e) => e.kind === 'publish')).toBe(true);
  });
  it('hides published events when showPublished=false', () => {
    const published = { ...buildResponse() };
    published.items[0].status = 'published';
    const ev = buildEvents(published);
    const out = applyFilters(ev, { ...base, showPublished: false });
    expect(out.find((e) => e.kind === 'publish' && e.item.status === 'published')).toBeUndefined();
  });
});

describe('sortEventsForCell', () => {
  it('puts overdue/blocked first, then milestones, then publish', () => {
    const events = buildEvents(buildResponse());
    const sorted = sortEventsForCell(events);
    expect(sorted[0].severity).toBe('overdue');
  });
});
