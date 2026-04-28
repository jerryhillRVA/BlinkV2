import { Platform } from './enums.js';

export interface PlatformGlobalRulesContract {
  maxIdeasPerMonth: number;
  contentWarningToggle?: boolean;
  aiDisclaimerToggle?: boolean;
  /**
   * @deprecated Retained as optional for forward-compatibility with persisted
   * workspace settings written before #58. Not surfaced in the wizard or
   * settings UI and not consumed by any downstream code path.
   */
  defaultPlatform?: Platform;
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
