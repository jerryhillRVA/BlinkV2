export enum Platform {
  Instagram = 'instagram',
  TikTok = 'tiktok',
  YouTube = 'youtube',
  Facebook = 'facebook',
  LinkedIn = 'linkedin',
  Twitter = 'twitter',
  Slack = 'slack',
  Discord = 'discord',
  Tbd = 'tbd',
}

export const PLATFORM_DISPLAY_NAMES: Record<Platform, string> = {
  [Platform.Instagram]: 'Instagram',
  [Platform.TikTok]: 'TikTok',
  [Platform.YouTube]: 'YouTube',
  [Platform.Facebook]: 'Facebook',
  [Platform.LinkedIn]: 'LinkedIn',
  [Platform.Twitter]: 'Twitter/X',
  [Platform.Slack]: 'Slack',
  [Platform.Discord]: 'Discord',
  [Platform.Tbd]: 'TBD',
};

/** All Platform values except Tbd — the canonical list of real platforms. */
export const PLATFORM_OPTIONS: Platform[] = Object.values(Platform).filter(
  (p) => p !== Platform.Tbd
);

/** Display-name equivalents of PLATFORM_OPTIONS (e.g. 'YouTube', 'Twitter/X'). */
export const PLATFORM_DISPLAY_OPTIONS: string[] = PLATFORM_OPTIONS.map(
  (p) => PLATFORM_DISPLAY_NAMES[p]
);

const displayNameMap = new Map(
  Object.entries(PLATFORM_DISPLAY_NAMES).map(([k, v]) => [v, k as Platform])
);

export function displayNameToPlatform(displayName: string): Platform | undefined {
  return displayNameMap.get(displayName);
}

export type TonePreset =
  | 'professional'
  | 'casual'
  | 'bold'
  | 'empathetic'
  | 'educational'
  | 'playful';
