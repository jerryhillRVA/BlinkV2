import type {
  CalendarContentItemContract,
  CalendarMilestoneContract,
  CalendarMilestoneTypeContract,
  CalendarSeverityContract,
  PlatformContract,
} from '@blinksocial/contracts';

export type CalendarViewMode = 'month' | 'week' | 'day' | 'list';

export type CalendarEventKind = 'publish' | 'milestone';

/**
 * #140: per-status tone — drives the icon + color of the calendar
 * event. `scheduled` uses Clock + blue tokens; `published` uses
 * CheckCircle + green tokens. `intent` is the legacy "post has a date
 * but isn't yet scheduled" case (status not 'scheduled' or 'published').
 */
export type CalendarPublishTone = 'scheduled' | 'published' | 'intent';

export interface CalendarPublishEventView {
  kind: 'publish';
  id: string;
  contentId: string;
  date: Date;
  item: CalendarContentItemContract;
  severity: CalendarSeverityContract;
  /** #140 — defaults to 'intent' when undefined (legacy fixtures). */
  tone?: CalendarPublishTone;
  isExported?: boolean;
}

export interface CalendarMilestoneEventView {
  kind: 'milestone';
  id: string;
  contentId: string;
  milestoneId: string;
  milestoneType: CalendarMilestoneTypeContract;
  date: Date;
  item: CalendarContentItemContract;
  milestone: CalendarMilestoneContract;
  severity: CalendarSeverityContract;
}

export type CalendarEventView =
  | CalendarPublishEventView
  | CalendarMilestoneEventView;

export interface CalendarFilterState {
  platforms: PlatformContract[];
  statuses: string[];
  owners: string[];
  search: string;
  showMilestones: boolean;
  showPublished: boolean;
}

export const EMPTY_FILTER_STATE: CalendarFilterState = {
  platforms: [],
  statuses: [],
  owners: [],
  search: '',
  showMilestones: true,
  showPublished: true,
};
