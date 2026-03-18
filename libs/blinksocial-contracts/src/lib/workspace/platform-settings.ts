import { Platform } from './enums.js';

export interface PlatformGlobalRulesContract {
  defaultPlatform: Platform;
  maxIdeasPerMonth: number;
  contentWarningToggle?: boolean;
  aiDisclaimerToggle?: boolean;
}

export interface PlatformConfigContract {
  platformId: Platform;
  enabled: boolean;
  defaultResolution?: string;
  postingSchedule?: string;
  peakTimes?: string[];
  aiContentStyle?: string;
  designPromptSuffix?: string;
}

export interface PlatformSettingsContract {
  globalRules: PlatformGlobalRulesContract;
  platforms: PlatformConfigContract[];
}
