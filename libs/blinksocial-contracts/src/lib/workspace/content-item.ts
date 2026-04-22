export type ContentStageContract = 'idea' | 'concept' | 'post';

export type ContentStatusContract =
  | 'draft'
  | 'in-progress'
  | 'review'
  | 'scheduled'
  | 'published';

export type PlatformContract =
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'facebook'
  | 'linkedin'
  | 'tbd';

export type ContentObjectiveContract =
  | 'awareness'
  | 'engagement'
  | 'traffic'
  | 'leads'
  | 'sales'
  | 'community'
  | 'recruiting'
  | 'lead-gen'
  | 'trust'
  | 'education'
  | 'conversion';

export type ContentTypeContract =
  | 'reel'
  | 'carousel'
  | 'feed-post'
  | 'story'
  | 'guide'
  | 'live'
  | 'short-video'
  | 'photo-carousel'
  | 'long-form'
  | 'shorts'
  | 'live-stream'
  | 'community-post'
  | 'fb-link-post'
  | 'fb-feed-post'
  | 'fb-live'
  | 'fb-reel'
  | 'fb-story'
  | 'ln-text-post'
  | 'ln-document'
  | 'ln-article'
  | 'ln-video';

export type CtaTypeContract =
  | 'learn-more'
  | 'subscribe'
  | 'follow'
  | 'comment'
  | 'download'
  | 'buy'
  | 'book-call'
  | 'other';

export type TonePresetContract =
  | 'professional'
  | 'casual'
  | 'friendly'
  | 'authoritative'
  | 'inspiring'
  | 'playful';

export interface ContentCtaContract {
  type: CtaTypeContract;
  text: string;
}

export interface ContentAttachmentContract {
  name: string;
  size: string;
  url?: string;
}

export interface TargetPlatformContract {
  platform: PlatformContract;
  contentType: ContentTypeContract;
  postId?: string | null;
}

export interface TargetPublishWindowContract {
  start?: string;
  end?: string;
}

export type RiskLevelContract = 'low' | 'medium' | 'high';

export interface ProductionBriefStrategyContract {
  objective?: ContentObjectiveContract;
  audienceSegmentIds?: string[];
  pillarIds?: string[];
  keyMessage?: string;
  ctaType?: CtaTypeContract;
  ctaText?: string;
  tonePreset?: TonePresetContract;
  doChecklist?: string[];
  dontChecklist?: string[];
}

export interface ProductionBriefPlatformRulesContract {
  durationTarget?: number;
  hookType?: string;
  loopEnding?: boolean;
}

export interface ProductionBriefCreativePlanContract {
  hook?: string;
  storyArc?: string;
  musicNotes?: string;
}

export type ProductionBriefComplianceContract = Record<string, unknown>;

export interface ProductionBriefContract {
  strategy?: ProductionBriefStrategyContract;
  platformRules?: ProductionBriefPlatformRulesContract;
  creativePlan?: ProductionBriefCreativePlanContract;
  compliance?: ProductionBriefComplianceContract;
}

export interface ProductionContract {
  brief?: ProductionBriefContract;
  outputs?: Record<string, unknown>;
}

export interface ContentItemContract {
  id: string;
  conceptId?: string;
  stage: ContentStageContract;
  status: ContentStatusContract;
  title: string;
  description: string;
  pillarIds: string[];
  segmentIds: string[];
  objectiveId?: string;
  contentCategory?: string;
  hook?: string;
  objective?: ContentObjectiveContract;
  owner?: string;
  platform?: PlatformContract;
  contentType?: ContentTypeContract;
  keyMessage?: string;
  tonePreset?: TonePresetContract;
  cta?: ContentCtaContract;
  sourceUrl?: string;
  attachments?: ContentAttachmentContract[];
  parentIdeaId?: string;
  parentConceptId?: string;
  targetPlatforms?: TargetPlatformContract[];
  angle?: string;
  formatNotes?: string[];
  claimsFlag?: boolean;
  sourceLinks?: string[];
  riskLevel?: RiskLevelContract;
  targetPublishWindow?: TargetPublishWindowContract;
  scheduledDate?: string;
  scheduledAt?: string;
  production?: ProductionContract;
  archived?: boolean;
  tags?: string[];
  briefApproved?: boolean;
  briefApprovedAt?: string;
  briefApprovedBy?: string;
  createdAt: string;
  updatedAt: string;
}
