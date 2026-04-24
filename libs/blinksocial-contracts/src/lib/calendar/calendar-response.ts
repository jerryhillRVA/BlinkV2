import type { CalendarContentItemContract } from './calendar-item.js';
import type { CalendarMilestoneContract } from './calendar-milestone.js';

export interface CalendarResponseContract {
  workspaceId: string;
  referenceDate: string;
  items: CalendarContentItemContract[];
  milestones: CalendarMilestoneContract[];
}
