import type {
  NotificationChannelsContract,
  NotificationTriggersContract,
  NotificationSettingsContract,
} from '@blinksocial/contracts';

export class NotificationChannels implements NotificationChannelsContract {
  readonly email: boolean;
  readonly inApp: boolean;
  readonly slack: boolean;
  readonly slackWebhookUrl?: string | null;

  constructor(data: NotificationChannelsContract) {
    this.email = data.email;
    this.inApp = data.inApp;
    this.slack = data.slack;
    this.slackWebhookUrl = data.slackWebhookUrl;
  }
}

export class NotificationTriggers implements NotificationTriggersContract {
  readonly researchResults: boolean;
  readonly contentPublished: boolean;
  readonly teamMentions: boolean;
  readonly qaReviewRequired: boolean;
  readonly approachingDeadlines: boolean;
  readonly weeklyDigest: boolean;

  constructor(data: NotificationTriggersContract) {
    this.researchResults = data.researchResults;
    this.contentPublished = data.contentPublished;
    this.teamMentions = data.teamMentions;
    this.qaReviewRequired = data.qaReviewRequired;
    this.approachingDeadlines = data.approachingDeadlines;
    this.weeklyDigest = data.weeklyDigest;
  }
}

export class NotificationSettings implements NotificationSettingsContract {
  readonly channels: NotificationChannels;
  readonly triggers: NotificationTriggers;

  constructor(data: NotificationSettingsContract) {
    this.channels = new NotificationChannels(data.channels);
    this.triggers = new NotificationTriggers(data.triggers);
  }
}
