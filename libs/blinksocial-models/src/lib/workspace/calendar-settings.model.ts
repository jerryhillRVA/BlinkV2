import type {
  MilestoneType,
  PhaseType,
  MilestoneTemplateContract,
  PhaseTemplateContract,
  DeadlineTemplateContract,
  ReminderSettingsContract,
  CalendarSettingsContract,
} from '@blinksocial/contracts';

export class MilestoneTemplate implements MilestoneTemplateContract {
  readonly milestoneType: MilestoneType;
  readonly offsetDays: number;
  readonly required: boolean;

  constructor(data: MilestoneTemplateContract) {
    this.milestoneType = data.milestoneType;
    this.offsetDays = data.offsetDays;
    this.required = data.required;
  }
}

export class PhaseTemplate implements PhaseTemplateContract {
  readonly phaseType: PhaseType;
  readonly startOffsetDays: number;
  readonly endOffsetDays: number;
  readonly required: boolean;

  constructor(data: PhaseTemplateContract) {
    this.phaseType = data.phaseType;
    this.startOffsetDays = data.startOffsetDays;
    this.endOffsetDays = data.endOffsetDays;
    this.required = data.required;
  }
}

export class DeadlineTemplate implements DeadlineTemplateContract {
  readonly milestones: MilestoneTemplate[];
  readonly phases: PhaseTemplate[];

  constructor(data: DeadlineTemplateContract) {
    this.milestones = data.milestones.map((m: MilestoneTemplateContract) => new MilestoneTemplate(m));
    this.phases = data.phases.map((p: PhaseTemplateContract) => new PhaseTemplate(p));
  }
}

export class ReminderSettings implements ReminderSettingsContract {
  readonly milestone72h: boolean;
  readonly milestone24h: boolean;
  readonly milestoneOverdue: boolean;
  readonly publish24h: boolean;

  constructor(data: ReminderSettingsContract) {
    this.milestone72h = data.milestone72h;
    this.milestone24h = data.milestone24h;
    this.milestoneOverdue = data.milestoneOverdue;
    this.publish24h = data.publish24h;
  }
}

export class CalendarSettings implements CalendarSettingsContract {
  readonly deadlineTemplates: Record<string, DeadlineTemplate>;
  readonly reminderSettings: ReminderSettings;
  readonly autoCreateOnPublish: boolean;

  constructor(data: CalendarSettingsContract) {
    this.deadlineTemplates = {};
    for (const [key, value] of Object.entries(data.deadlineTemplates)) {
      this.deadlineTemplates[key] = new DeadlineTemplate(value);
    }
    this.reminderSettings = new ReminderSettings(data.reminderSettings);
    this.autoCreateOnPublish = data.autoCreateOnPublish;
  }
}
