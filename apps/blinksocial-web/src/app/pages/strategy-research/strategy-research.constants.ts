import type {
  SidebarItem,
  Platform,
  ObjectiveCategory,
} from './strategy-research.types';

export const AI_SIMULATION_DELAY_MS = 2500;

export const SIDEBAR_ITEMS: SidebarItem[] = [
  // Strategy
  { id: 'brand-voice', label: 'Brand Voice & Tone', section: 'strategy', iconPath: 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3ZM19 10v2a7 7 0 0 1-14 0v-2M12 19v3' },
  { id: 'pillars', label: 'Strategic Pillars', section: 'strategy', iconPath: 'M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.84ZM22 17.65l-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65M22 12.65l-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65' },
  { id: 'audience', label: 'Audience', section: 'strategy', iconPath: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
  { id: 'channel', label: 'Channel Strategy', section: 'strategy', iconPath: 'M4.9 19.1C1 15.2 1 8.8 4.9 4.9 M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5 M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5 M19.1 4.9C23 8.8 23 15.1 19.1 19 M14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0' },
  { id: 'content-mix', label: 'Content Mix', section: 'strategy', iconPath: 'M21.21 15.89A10 10 0 1 1 8 2.83M22 12A10 10 0 0 0 12 2v10z' },
  // Research
  { id: 'research', label: 'Research Sources', section: 'research', iconPath: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z' },
  { id: 'competitors', label: 'Competitor Deep Dive', section: 'research', iconPath: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z' },
  // Content Tools
  { id: 'repurposer', label: 'Content Repurposer', section: 'content-tools', iconPath: 'M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16' },
  { id: 'series', label: 'Series Builder', section: 'content-tools', iconPath: 'M10 12h11 M10 18h11 M10 6h11 M4 10h2 M4 6h1v4 M6 18H4c0-1 2-2 2-3s-1-1.5-2-1' },
  { id: 'ab-analyzer', label: 'A/B Analyzer', section: 'content-tools', iconPath: 'M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2 M6.453 15h11.094 M8.5 2h7' },
  { id: 'seo', label: 'SEO & Hashtags', section: 'content-tools', iconPath: 'M4 9h16M4 15h16M10 3 8 21M16 3l-2 18' },
];

export const PLATFORM_OPTIONS: { id: Platform; label: string }[] = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'facebook', label: 'Facebook' },
];

export const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
};

export const AB_GOAL_OPTIONS = [
  'Maximize Saves',
  'Maximize Comments',
  'Maximize Shares',
  'Maximize Follows',
  'Drive Link Clicks',
];

export const AB_PLATFORM_OPTIONS: { value: Platform; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok',    label: 'TikTok'    },
  { value: 'linkedin',  label: 'LinkedIn'  },
  { value: 'youtube',   label: 'YouTube'   },
];
export const SEO_GOAL_OPTIONS = [
  'Discoverability',
  'Saves & Shares',
  'Niche Authority',
  'Trending Reach',
];
export const SERIES_GOAL_OPTIONS = [
  'Educate & Build Trust',
  'Drive Profile Follows',
  'Launch a New Topic or Offer',
  'Re-engage Inactive Audience',
  'Community & Engagement Push',
];

export const SERIES_LENGTH_OPTIONS = ['3', '5', '7'];

export const SERIES_PLATFORM_OPTIONS: { value: Platform; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok',    label: 'TikTok'    },
  { value: 'youtube',   label: 'YouTube'   },
  { value: 'linkedin',  label: 'LinkedIn'  },
];

export const PRESET_COLORS = [
  'var(--blink-brand-primary)',
  'var(--blink-accent-coral)',
  'var(--blink-accent-amber)',
  'var(--blink-accent-green)',
  'var(--blink-accent-blue)',
  'var(--blink-accent-purple)',
  'var(--blink-accent-pink)',
  'var(--blink-accent-indigo)',
  'var(--blink-accent-teal)',
  'var(--blink-accent-orange)',
];

export const OBJECTIVE_CATEGORY_CONFIG: Record<ObjectiveCategory, { label: string; emoji: string }> = {
  growth: { label: 'Growth', emoji: '📈' },
  revenue: { label: 'Revenue', emoji: '💰' },
  awareness: { label: 'Awareness', emoji: '📣' },
  trust: { label: 'Trust', emoji: '🤝' },
  community: { label: 'Community', emoji: '👥' },
  engagement: { label: 'Engagement', emoji: '⚡' },
};
