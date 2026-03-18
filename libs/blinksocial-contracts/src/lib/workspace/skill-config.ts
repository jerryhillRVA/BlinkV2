import type { Platform, TonePreset } from './enums.js';

export interface SkillConfigContract {
  id: string;
  skillId: string;
  name: string;
  role: string;
  persona?: string;
  responsibilities?: string[];
  expectedOutputs?: string[];
  contextPreferences?: {
    includeBrandVoice?: boolean;
    includeAudiencePersonas?: boolean;
    includePlatformAccounts?: boolean;
    additionalContextPaths?: string[];
  };
  overrides?: {
    tonePreset?: TonePreset;
    defaultPlatform?: Platform;
    maxOutputTokens?: number;
  };
  triggers?: string[];
  enabled?: boolean;
  archived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SkillSettingsContract {
  skills: SkillConfigContract[];
}
