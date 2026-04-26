import type {
  CalendarContentItemContract,
  CalendarMilestoneContract,
  CalendarResponseContract,
  CalendarSeverityContract,
} from '@blinksocial/contracts';
import type {
  CalendarEventView,
  CalendarFilterState,
  CalendarMilestoneEventView,
  CalendarPublishEventView,
} from './calendar.types';

const AT_RISK_WINDOW_DAYS = 7;
const AT_RISK_BLOCKING_STATUSES = new Set<string>(['approved', 'scheduled', 'published']);

const MILESTONE_PRIORITY_ORDER: Record<string, number> = {
  overdue: 0,
  'at-risk': 1,
  blocked: 0,
  normal: 2,
};

export function daysBetween(a: Date, b: Date): number {
  const ms = a.getTime() - b.getTime();
  return ms / (1000 * 60 * 60 * 24);
}

export function deriveMilestoneSeverity(
  milestone: CalendarMilestoneContract,
  item: CalendarContentItemContract,
  referenceDate: Date,
): CalendarSeverityContract {
  if (item.blockers && item.blockers.length > 0) {
    return 'blocked';
  }
  const due = new Date(milestone.dueAt);
  if (due.getTime() < referenceDate.getTime()) {
    return 'overdue';
  }
  return null;
}

export function derivePublishSeverity(
  item: CalendarContentItemContract,
  referenceDate: Date,
): CalendarSeverityContract {
  if (item.blockers && item.blockers.length > 0) {
    return 'blocked';
  }
  if (!item.scheduleAt) {
    return null;
  }
  const schedule = new Date(item.scheduleAt);
  const days = daysBetween(schedule, referenceDate);
  if (days >= 0 && days <= AT_RISK_WINDOW_DAYS) {
    if (!AT_RISK_BLOCKING_STATUSES.has(item.status)) {
      return 'at-risk';
    }
  }
  return null;
}

export function buildEvents(
  response: CalendarResponseContract,
): CalendarEventView[] {
  const referenceDate = new Date(response.referenceDate);
  const itemsById = new Map<string, CalendarContentItemContract>();
  for (const item of response.items) {
    itemsById.set(item.id, item);
  }

  const events: CalendarEventView[] = [];

  for (const item of response.items) {
    if (item.scheduleAt) {
      const ev: CalendarPublishEventView = {
        kind: 'publish',
        id: `publish-${item.id}`,
        contentId: item.id,
        date: new Date(item.scheduleAt),
        item,
        severity: derivePublishSeverity(item, referenceDate),
      };
      events.push(ev);
    }
  }

  for (const milestone of response.milestones) {
    const item = itemsById.get(milestone.contentId);
    if (!item) continue;
    const ev: CalendarMilestoneEventView = {
      kind: 'milestone',
      id: `milestone-${milestone.milestoneId}`,
      contentId: milestone.contentId,
      milestoneId: milestone.milestoneId,
      milestoneType: milestone.milestoneType,
      date: new Date(milestone.dueAt),
      item,
      milestone,
      severity: deriveMilestoneSeverity(milestone, item, referenceDate),
    };
    events.push(ev);
  }

  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function applyFilters(
  events: CalendarEventView[],
  filter: CalendarFilterState,
): CalendarEventView[] {
  const needle = filter.search.trim().toLowerCase();
  return events.filter((ev) => {
    if (ev.kind === 'milestone' && !filter.showMilestones) return false;
    if (
      ev.kind === 'publish' &&
      ev.item.status === 'published' &&
      !filter.showPublished
    ) {
      return false;
    }
    if (filter.platforms.length > 0 && !filter.platforms.includes(ev.item.platform)) {
      return false;
    }
    if (filter.statuses.length > 0 && !filter.statuses.includes(ev.item.status)) {
      return false;
    }
    if (filter.owners.length > 0 && !filter.owners.includes(ev.item.owner)) {
      return false;
    }
    if (needle) {
      const haystack = `${ev.item.title} ${ev.item.owner}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

export function sortEventsForCell(events: CalendarEventView[]): CalendarEventView[] {
  return [...events].sort((a, b) => {
    const aRank =
      a.severity === 'overdue' || a.severity === 'blocked'
        ? MILESTONE_PRIORITY_ORDER['overdue']
        : a.kind === 'milestone'
          ? MILESTONE_PRIORITY_ORDER['normal']
          : 3;
    const bRank =
      b.severity === 'overdue' || b.severity === 'blocked'
        ? MILESTONE_PRIORITY_ORDER['overdue']
        : b.kind === 'milestone'
          ? MILESTONE_PRIORITY_ORDER['normal']
          : 3;
    if (aRank !== bRank) return aRank - bRank;
    return a.date.getTime() - b.date.getTime();
  });
}
