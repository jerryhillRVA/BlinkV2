export type CalendarMilestoneTypeContract =
  | 'brief_due'
  | 'draft_due'
  | 'blueprint_due'
  | 'assets_due'
  | 'packaging_due'
  | 'qa_due';

export interface CalendarMilestoneContract {
  milestoneId: string;
  contentId: string;
  milestoneType: CalendarMilestoneTypeContract;
  dueAt: string;
  milestoneOwner: string;
  isRequired: boolean;
}
