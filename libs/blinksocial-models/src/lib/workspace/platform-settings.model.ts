import type {
  PlatformGlobalRulesContract,
  PlatformConfigContract,
  PlatformSettingsContract,
} from '@blinksocial/contracts';
import { Platform } from '@blinksocial/contracts';

export class PlatformGlobalRules implements PlatformGlobalRulesContract {
  readonly maxIdeasPerMonth: number;
  readonly contentWarningToggle?: boolean;
  readonly aiDisclaimerToggle?: boolean;
  readonly defaultPlatform?: Platform;

  constructor(data: PlatformGlobalRulesContract) {
    this.maxIdeasPerMonth = data.maxIdeasPerMonth;
    this.contentWarningToggle = data.contentWarningToggle;
    this.aiDisclaimerToggle = data.aiDisclaimerToggle;
    this.defaultPlatform = data.defaultPlatform;
  }
}

export class PlatformConfig implements PlatformConfigContract {
  readonly platformId: Platform;
  readonly enabled: boolean;
  readonly defaultResolution?: string;
  readonly postingSchedule?: string;
  readonly peakTimes?: string[];
  readonly aiContentStyle?: string;
  readonly designPromptSuffix?: string;

  constructor(data: PlatformConfigContract) {
    this.platformId = data.platformId;
    this.enabled = data.enabled;
    this.defaultResolution = data.defaultResolution;
    this.postingSchedule = data.postingSchedule;
    this.peakTimes = data.peakTimes;
    this.aiContentStyle = data.aiContentStyle;
    this.designPromptSuffix = data.designPromptSuffix;
  }
}

export class PlatformSettings implements PlatformSettingsContract {
  readonly globalRules: PlatformGlobalRules;
  readonly platforms: PlatformConfig[];

  constructor(data: PlatformSettingsContract) {
    this.globalRules = new PlatformGlobalRules(data.globalRules);
    this.platforms = data.platforms.map((p: PlatformConfigContract) => new PlatformConfig(p));
  }
}
