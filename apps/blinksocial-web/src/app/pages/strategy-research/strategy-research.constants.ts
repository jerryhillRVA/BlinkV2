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
  { id: 'channel', label: 'Channel Strategy', section: 'strategy', iconPath: 'M4.9 19.1C1 15.2 1 8.8 4.9 4.9M7.8 16.2a5 5 0 0 1 0-8.4M16.2 7.8a5 5 0 0 1 0 8.4M19.1 4.9C23 8.8 23 15.1 19.1 19M12 12h.01' },
  { id: 'content-mix', label: 'Content Mix', section: 'strategy', iconPath: 'M21.21 15.89A10 10 0 1 1 8 2.83M22 12A10 10 0 0 0 12 2v10z' },
  // Research
  { id: 'research', label: 'Research Sources', section: 'research', iconPath: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z' },
  { id: 'competitors', label: 'Competitor Deep Dive', section: 'research', iconPath: 'M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z' },
  // Content Tools
  { id: 'repurposer', label: 'Content Repurposer', section: 'content-tools', iconPath: 'M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16' },
  { id: 'series', label: 'Series Builder', section: 'content-tools', iconPath: 'M10 6h11M10 12h11M10 18h11M3 6l2 2 4-4M3 12l2 2 4-4M3 18l2 2 4-4' },
  { id: 'ab-analyzer', label: 'A/B Analyzer', section: 'content-tools', iconPath: 'M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2' },
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

export const PLATFORM_ICONS: Record<Platform, string> = {
  instagram: 'M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2Zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6ZM16.5 6.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  tiktok: 'M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5',
  youtube: 'M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17ZM10 15l5-3-5-3v6Z',
  facebook: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z',
  linkedin: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
};

export const AB_GOAL_OPTIONS = ['Engagement', 'Conversions', 'Brand Awareness', 'Follower Growth', 'Traffic'];
export const SEO_GOAL_OPTIONS = ['Engagement', 'Reach', 'Conversions', 'Brand Awareness', 'Traffic'];
export const SERIES_GOAL_OPTIONS = ['Grow Followers', 'Drive Sales', 'Build Authority', 'Increase Engagement', 'Launch Product'];

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
