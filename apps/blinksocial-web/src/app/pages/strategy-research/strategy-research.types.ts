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
