export type MilestoneType = 'brief_due' | 'draft_due' | 'blueprint_due' | 'assets_due' | 'packaging_due' | 'qa_due';
export type PhaseType = 'production_window' | 'review_window';
export type CanonicalContentType = 'VIDEO_SHORT_VERTICAL' | 'VIDEO_LONG_HORIZONTAL' | 'IMAGE_SINGLE' | 'IMAGE_CAROUSEL' | 'TEXT_POST' | 'LINK_POST' | 'DOCUMENT_CAROUSEL_PDF' | 'STORY_FRAME_SET' | 'LIVE_BROADCAST';

export interface MilestoneTemplateContract {
  milestoneType: MilestoneType;
  offsetDays: number;
  required: boolean;
}

export interface PhaseTemplateContract {
  phaseType: PhaseType;
  startOffsetDays: number;
  endOffsetDays: number;
  required: boolean;
}

export interface DeadlineTemplateContract {
  milestones: MilestoneTemplateContract[];
  phases: PhaseTemplateContract[];
}

export interface ReminderSettingsContract {
  milestone72h: boolean;
  milestone24h: boolean;
  milestoneOverdue: boolean;
  publish24h: boolean;
}

export interface CalendarSettingsContract {
  enableDeadlineTemplates?: boolean;
  deadlineTemplates: Record<string, DeadlineTemplateContract>;
  reminderSettings: ReminderSettingsContract;
  enableReminders?: boolean;
  autoCreateOnPublish: boolean;
}
