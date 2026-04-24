import type { CalendarMilestoneTypeContract } from './calendar-milestone.js';

export type CalendarEventKindContract = 'publish' | 'milestone';

export interface CalendarPublishEventContract {
  kind: 'publish';
  contentId: string;
  scheduleAt: string;
}

export interface CalendarMilestoneEventContract {
  kind: 'milestone';
  contentId: string;
  milestoneId: string;
  milestoneType: CalendarMilestoneTypeContract;
  dueAt: string;
}

export type CalendarEventContract =
  | CalendarPublishEventContract
  | CalendarMilestoneEventContract;
