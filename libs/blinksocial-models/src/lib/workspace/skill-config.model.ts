import type { SkillConfigContract, SkillSettingsContract } from '@blinksocial/contracts';
import type { Platform, TonePreset } from '@blinksocial/contracts';

export class SkillConfig implements SkillConfigContract {
  readonly id: string;
  readonly skillId: string;
  readonly name: string;
  readonly role: string;
  readonly persona?: string;
  readonly responsibilities?: string[];
  readonly expectedOutputs?: string[];
  readonly contextPreferences?: {
    includeBrandVoice?: boolean;
    includeAudiencePersonas?: boolean;
    includePlatformAccounts?: boolean;
    additionalContextPaths?: string[];
  };
  readonly overrides?: {
    tonePreset?: TonePreset;
    defaultPlatform?: Platform;
    maxOutputTokens?: number;
  };
  readonly triggers?: string[];
  readonly enabled?: boolean;
  readonly archived?: boolean;
  readonly createdAt?: string;
  readonly updatedAt?: string;

  constructor(data: SkillConfigContract) {
    this.id = data.id;
    this.skillId = data.skillId;
    this.name = data.name;
    this.role = data.role;
    this.persona = data.persona;
    this.responsibilities = data.responsibilities;
    this.expectedOutputs = data.expectedOutputs;
    this.contextPreferences = data.contextPreferences;
    this.overrides = data.overrides;
    this.triggers = data.triggers;
    this.enabled = data.enabled;
    this.archived = data.archived;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}

export class SkillSettings implements SkillSettingsContract {
  readonly skills: SkillConfig[];

  constructor(data: SkillSettingsContract) {
    this.skills = data.skills.map((s: SkillConfigContract) => new SkillConfig(s));
  }
}
