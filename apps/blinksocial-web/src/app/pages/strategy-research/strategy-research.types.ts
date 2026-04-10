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

export type ContentCategory = string;

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

export interface CompetitorIntelPositioning {
  brandVoice: string;
  primaryMessage: string;
  targeting: string;
}

export interface CompetitorIntelContentStrategy {
  topFormat: string;
  frequency: string;
  hookStyle: string;
  ctaPattern: string;
  engagement: 'Very High' | 'High' | 'Medium';
}

export interface CompetitorIntelGaps {
  uncoveredAngles: string[];
  missedPainPoints: string[];
  counterStrategy: string;
}

export interface CompetitorIntel {
  positioning: CompetitorIntelPositioning;
  contentStrategy: CompetitorIntelContentStrategy;
  gaps: CompetitorIntelGaps;
  recommendedActions: string[];
  lastUpdated: string;
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
  intel?: CompetitorIntel;
}

export type HashtagTab = 'reach' | 'niche' | 'community';

export interface HashtagEntry {
  tag: string;
  posts: string;
}

export interface SeoChecklistItem {
  label: string;
  tip: string;
}

export interface TrendingAngle {
  title: string;
  hook: string;
  virality: 'Very High' | 'High' | 'Medium';
}

export interface SeoData {
  hashtags: Record<HashtagTab, HashtagEntry[]>;
  keywords: string[];
  searchIntents: string[];
  exampleBio: string;
  checklist: SeoChecklistItem[];
  trending: TrendingAngle[];
}

export interface AbScoreBreakdown {
  hookStrength: { a: number; b: number };
  clarity: { a: number; b: number };
  emotionalResonance: { a: number; b: number };
  ctaEffectiveness: { a: number; b: number };
}

export interface AbVariantInsights {
  strengths: string[];
  weaknesses: string[];
}

export interface AbAnalysisResult {
  winner: 'A' | 'B';
  confidence: 'High' | 'Medium' | 'Low';
  verdict: string;
  variantA: AbVariantInsights;
  variantB: AbVariantInsights;
  scores: AbScoreBreakdown;
  improvedVersion: string;
  improvementRationale: string;
}

export type SeriesPostRole = 'Hook' | 'Value' | 'Proof' | 'Pivot' | 'Conversion';

export interface SeriesPost {
  number: number;
  title: string;
  role: SeriesPostRole;
  contentType: string;
  suggestedDay: string;
  hook: string;
  captionDirection: string;
  cta: string;
  bridgeNote?: string;
}

export interface SeriesOverview {
  title: string;
  narrativeArc: string;
  platform: Platform;
  postCount: number;
  goal: string;
  pillarId: string;
  segmentId: string;
  posts: SeriesPost[];
}

export interface RepurposeCarouselSlide {
  role: string;
  headline: string;
}

export interface RepurposeOutput {
  sourceText: string;
  pillarId: string;
  segmentId: string;
  generatedAt: string;
  reelHooks: string[];
  carouselSlides: RepurposeCarouselSlide[];
  instagramCaption: string;
  tiktokHook: string;
  youtubeShort: string;
  linkedinPost: string;
  facebookPost: string;
}

export interface RepurposeOutputCard {
  key: string;
  platformId: Platform;
  label: string;
  badge: string;
  badgeClass: string;
  content: string;
}

export interface SavedIdeaRecord {
  uid: string;
  title: string;
  platformId: Platform;
  badge: string;
  badgeClass: string;
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
