export interface NotificationChannelsContract {
  email: boolean;
  inApp: boolean;
  slack: boolean;
  slackWebhookUrl?: string | null;
}

export interface NotificationTriggersContract {
  researchResults: boolean;
  contentPublished: boolean;
  teamMentions: boolean;
  qaReviewRequired: boolean;
  approachingDeadlines: boolean;
  weeklyDigest: boolean;
}

export interface NotificationSettingsContract {
  channels: NotificationChannelsContract;
  triggers: NotificationTriggersContract;
}
