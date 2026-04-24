import type {
  CalendarContentItemContract,
  CalendarMilestoneContract,
  CalendarMilestoneTypeContract,
  CalendarSeverityContract,
  PlatformContract,
} from '@blinksocial/contracts';

export type CalendarViewMode = 'month' | 'week' | 'day' | 'list';

export type CalendarEventKind = 'publish' | 'milestone';

export interface CalendarPublishEventView {
  kind: 'publish';
  id: string;
  contentId: string;
  date: Date;
  item: CalendarContentItemContract;
  severity: CalendarSeverityContract;
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
