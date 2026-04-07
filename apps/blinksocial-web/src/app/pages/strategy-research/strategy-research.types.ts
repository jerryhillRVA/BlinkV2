export type StrategyView =
  | 'brand-voice'
  | 'pillars'
  | 'audience'
  | 'channel'
  | 'content-mix'
  | 'research'
  | 'competitors'
  | 'repurposer'
  | 'series'
  | 'ab-analyzer'
  | 'seo';

export type Platform = 'instagram' | 'tiktok' | 'youtube' | 'facebook' | 'linkedin';

export type ObjectiveCategory = 'growth' | 'revenue' | 'awareness' | 'trust' | 'community' | 'engagement';

export type ObjectiveStatus = 'on-track' | 'at-risk' | 'behind' | 'achieved';

export type ContentCategory = 'educational' | 'entertaining' | 'community' | 'promotional' | 'trending';

export interface BusinessObjective {
  id: string;
  category: ObjectiveCategory;
  statement: string;
  target: number;
  unit: string;
  timeframe: string;
  currentValue?: number;
  status: ObjectiveStatus;
}

export interface VoiceAttribute {
  id: string;
  label: string;
  description: string;
  doExample: string;
  dontExample: string;
}

export interface ToneContext {
  id: string;
  context: string;
  tone: string;
  example: string;
}

export interface BrandVoiceData {
  missionStatement: string;
  voiceAttributes: VoiceAttribute[];
  toneByContext: ToneContext[];
  platformToneAdjustments: { platform: Platform; adjustment: string }[];
  vocabulary: { preferred: string[]; avoid: string[] };
}

export interface ContentPillar {
  id: string;
  name: string;
  description: string;
  color: string;
  goals?: PillarGoal[];
  objectiveIds?: string[];
}

export interface PillarGoal {
  id: string;
  metric: string;
  target: number;
  unit: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  current?: number;
}

export interface AudienceSegment {
  id: string;
  name: string;
  description: string;
  journeyStages?: SegmentJourneyStage[];
}

export type JourneyStage = 'awareness' | 'consideration' | 'conversion' | 'retention';

export interface SegmentJourneyStage {
  stage: JourneyStage;
  primaryGoal: string;
  contentTypes: string[];
  hookAngles: string[];
  successMetric: string;
}

export interface ChannelStrategyEntry {
  platform: Platform;
  active: boolean;
  role: string;
  primaryContentTypes: string[];
  toneAdjustment: string;
  postingCadence: string;
  primaryAudience: string;
  primaryGoal: string;
  notes: string;
}

export interface ContentMixTarget {
  category: ContentCategory;
  label: string;
  targetPercent: number;
  color: string;
  description: string;
}

export interface ResearchSource {
  id: string;
  title: string;
  url: string;
  type: 'article' | 'report' | 'social' | 'news' | 'video';
  relevance: number;
  pillarIds: string[];
  summary: string;
  discoveredAt: string;
}

export interface CompetitorInsight {
  id: string;
  competitor: string;
  platform: Platform;
  contentType: string;
  topic: string;
  relevancyLevel: 'Very High' | 'High' | 'Medium';
  frequency: string;
  insight: string;
}

export interface AudienceInsight {
  segmentId: string;
  interests: string[];
  painPoints: string[];
  peakActivityTimes: { day: string; hour: string; engagement: string }[];
  preferredPlatforms: { platform: Platform; preference: number }[];
  contentPreferences: string[];
}

export interface SidebarItem {
  id: StrategyView;
  label: string;
  section: 'strategy' | 'research' | 'content-tools';
  iconPath: string;
}

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

// ── Shared platform constants ───────────────────────────────────────────────

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

// ── Goal option sets (intentionally different per tool context) ─────────────

/** A/B Analyzer: performance metrics for comparing content variants */
export const AB_GOAL_OPTIONS = ['Engagement', 'Conversions', 'Brand Awareness', 'Follower Growth', 'Traffic'];
/** SEO & Hashtags: discoverability-focused goals */
export const SEO_GOAL_OPTIONS = ['Engagement', 'Reach', 'Conversions', 'Brand Awareness', 'Traffic'];
/** Series Builder: business-level campaign goals */
export const SERIES_GOAL_OPTIONS = ['Grow Followers', 'Drive Sales', 'Build Authority', 'Increase Engagement', 'Launch Product'];

// ── Accent colors (token-based for dark mode support) ───────────────────────

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

// ── Utility ─────────────────────────────────────────────────────────────────

export function toggleSetItem<T>(set: Set<T>, item: T): Set<T> {
  const next = new Set(set);
  if (next.has(item)) {
    next.delete(item);
  } else {
    next.add(item);
  }
  return next;
}

// ── Objective category config ───────────────────────────────────────────────

export const OBJECTIVE_CATEGORY_CONFIG: Record<ObjectiveCategory, { label: string; emoji: string }> = {
  growth: { label: 'Growth', emoji: '📈' },
  revenue: { label: 'Revenue', emoji: '💰' },
  awareness: { label: 'Awareness', emoji: '📣' },
  trust: { label: 'Trust', emoji: '🤝' },
  community: { label: 'Community', emoji: '👥' },
  engagement: { label: 'Engagement', emoji: '⚡' },
};

export const DEFAULT_PILLARS: ContentPillar[] = [
  { id: 'p1', name: 'Yoga & Movement', description: 'Yoga flows, stretching routines, and mindful movement practices', color: 'var(--blink-brand-primary)' },
  { id: 'p2', name: 'Wellness & Mindfulness', description: 'Stress management, meditation, sleep, and mental health', color: 'var(--blink-accent-green)' },
  { id: 'p3', name: 'Fitness & Strength', description: 'Strength training, cardio, and fitness routines for women 40+', color: 'var(--blink-accent-blue)' },
  { id: 'p4', name: 'Nutrition & Recipes', description: 'Healthy eating, meal prep, and nutrition for hormonal health', color: 'var(--blink-accent-amber)' },
  { id: 'p5', name: 'Aging & Confidence', description: 'Body positivity, aging gracefully, and empowerment content', color: 'var(--blink-accent-purple)' },
];

export const DEFAULT_SEGMENTS: AudienceSegment[] = [
  { id: 's1', name: 'Active 40s', description: 'Women in their 40s maintaining fitness and managing perimenopause' },
  { id: 's2', name: 'Thriving 50s', description: 'Women in their 50s focused on strength, flexibility, and menopause wellness' },
  { id: 's3', name: 'Yoga Enthusiasts', description: 'Women passionate about yoga practice and mindful movement' },
  { id: 's4', name: 'Fitness Beginners', description: 'Women new to fitness or restarting their wellness journey' },
  { id: 's5', name: 'Holistic Health Seekers', description: 'Women focused on whole-body wellness and natural living' },
];

export const MOCK_RESEARCH_SOURCES: ResearchSource[] = [
  { id: 'rs1', title: 'Yoga for Women Over 40: Joint Health & Flexibility', url: 'https://example.com/yoga-joint-health', type: 'report', relevance: 98, pillarIds: ['p1'], summary: 'Study on how modified yoga poses and gentle flows help women 40+ maintain joint health and flexibility while reducing injury risk.', discoveredAt: '2026-02-20T08:00:00' },
  { id: 'rs2', title: 'Menopause & Fitness: Strength Training Guidelines', url: 'https://example.com/menopause-strength', type: 'report', relevance: 95, pillarIds: ['p3'], summary: 'Evidence-based strength training protocols for women managing perimenopause and menopause, focusing on bone density and metabolic health.', discoveredAt: '2026-02-19T10:00:00' },
  { id: 'rs3', title: 'Anti-Inflammatory Nutrition for Hormonal Health', url: 'https://example.com/anti-inflammatory-nutrition', type: 'article', relevance: 93, pillarIds: ['p4'], summary: 'Comprehensive guide to anti-inflammatory eating patterns that support hormone balance and reduce inflammation in women 40+.', discoveredAt: '2026-02-21T14:00:00' },
  { id: 'rs4', title: 'Meditation & Sleep Quality in Midlife Women', url: 'https://example.com/meditation-sleep', type: 'report', relevance: 91, pillarIds: ['p2'], summary: 'Research showing how mindfulness meditation practices improve sleep quality and reduce stress for women experiencing perimenopause.', discoveredAt: '2026-02-22T09:00:00' },
  { id: 'rs5', title: 'Body Confidence Movement: Women 40+ on Social Media', url: 'https://example.com/body-confidence-trends', type: 'article', relevance: 88, pillarIds: ['p5'], summary: 'Analysis of trending body positivity content for midlife women, showing authentic representation drives 3x higher engagement.', discoveredAt: '2026-02-18T11:00:00' },
  { id: 'rs6', title: 'Gut Health & Hormones: What Women Need to Know', url: 'https://example.com/gut-hormones', type: 'report', relevance: 89, pillarIds: ['p2', 'p4'], summary: 'Latest research on gut microbiome role in hormone regulation, metabolism, and overall wellness for women in their 40s and 50s.', discoveredAt: '2026-02-17T15:00:00' },
];

export const MOCK_COMPETITOR_INSIGHTS: CompetitorInsight[] = [
  { id: 'ci1', competitor: 'Yoga with Adriene', platform: 'youtube', contentType: 'Long-form', topic: '30-day yoga journeys', relevancyLevel: 'Very High', frequency: 'Daily', insight: 'Monthly yoga challenges with daily 20-30 min videos. Strong community engagement in comments.' },
  { id: 'ci2', competitor: 'Move with Nicole', platform: 'instagram', contentType: 'Reels', topic: 'Low-impact fitness demos', relevancyLevel: 'High', frequency: '4x/week', insight: 'Short fitness demos focused on joint-friendly movements. Clear form cues and modifications.' },
  { id: 'ci3', competitor: 'The Midlife Feast', platform: 'instagram', contentType: 'Carousel', topic: 'Nutrition & recipes', relevancyLevel: 'High', frequency: '3x/week', insight: 'Recipe carousels with ingredient benefits highlighted. Anti-inflammatory foods focus.' },
  { id: 'ci4', competitor: 'Dr. Mary Claire Haver', platform: 'tiktok', contentType: 'Short-form', topic: 'Menopause education', relevancyLevel: 'Very High', frequency: '5x/week', insight: 'Myth-busting menopause content with medical expertise. Direct, science-backed tips.' },
  { id: 'ci5', competitor: 'Fit After 40', platform: 'youtube', contentType: 'Shorts', topic: 'Quick strength workouts', relevancyLevel: 'Medium', frequency: '6x/week', insight: '15-second exercise demos with clear benefits callout. Functional strength focus.' },
];

export const MOCK_AUDIENCE_INSIGHTS: AudienceInsight[] = [
  {
    segmentId: 's1',
    interests: ['Strength training', 'Hormone health', 'Energy management', 'Metabolism support'],
    painPoints: ['Energy fluctuations throughout day', 'Metabolism slowing down', 'Balancing career demands with self-care', 'Finding time for fitness'],
    peakActivityTimes: [
      { day: 'Monday', hour: '6:00 AM', engagement: 'Very High' },
      { day: 'Wednesday', hour: '12:00 PM', engagement: 'High' },
      { day: 'Saturday', hour: '8:00 AM', engagement: 'High' },
    ],
    preferredPlatforms: [{ platform: 'instagram', preference: 88 }, { platform: 'youtube', preference: 75 }, { platform: 'tiktok', preference: 45 }],
    contentPreferences: ['Quick workout routines', 'Hormone health tips', 'Energy-boosting nutrition', 'Motivational content'],
  },
  {
    segmentId: 's2',
    interests: ['Bone health', 'Joint mobility', 'Menopause support', 'Gentle movement'],
    painPoints: ['Joint pain and stiffness', 'Weight management challenges', 'Sleep disruption', 'Hot flashes affecting workouts'],
    peakActivityTimes: [
      { day: 'Tuesday', hour: '7:00 AM', engagement: 'Very High' },
      { day: 'Thursday', hour: '10:00 AM', engagement: 'High' },
      { day: 'Sunday', hour: '9:00 AM', engagement: 'Medium' },
    ],
    preferredPlatforms: [{ platform: 'youtube', preference: 92 }, { platform: 'instagram', preference: 70 }, { platform: 'facebook', preference: 65 }],
    contentPreferences: ['Low-impact exercises', 'Menopause education', 'Joint-friendly yoga', 'Strength training for bone health'],
  },
];
