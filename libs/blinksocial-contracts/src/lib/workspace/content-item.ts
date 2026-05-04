export type ContentStageContract = 'idea' | 'concept' | 'post';

export type ContentStatusContract =
  | 'draft'
  | 'concepting'
  | 'posting'
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
  approved?: boolean;
  canonicalType?: string;
  hasTalent?: boolean;
  hasMusic?: boolean;
  needsAccessibility?: boolean;
}

export type ProductionStepContract =
  | 'select'
  | 'brief'
  | 'draft'
  | 'blueprint'
  | 'assets'
  | 'packaging'
  | 'qa'
  | 'handoff';

export type ProductionSourceTypeContract =
  | 'article'
  | 'report'
  | 'social'
  | 'news'
  | 'video'
  | 'docs';

export interface ProductionSourceContract {
  id: string;
  url: string;
  title: string;
  keyTakeaways?: string;
  type: ProductionSourceTypeContract;
}

export interface ProductionAssetContract {
  id: string;
  label: string;
  required: boolean;
  completed: boolean;
  assignee?: string;
  notes?: string;
}

export interface ProductionTaskContract {
  id: string;
  label: string;
  assignee?: string;
  completed: boolean;
  dueDate?: string;
}

export interface ProductionVersionContract {
  label: string;
  savedAt: string;
}

export interface ProductionContract {
  productionStep?: ProductionStepContract;
  brief?: ProductionBriefContract;
  outputs?: Record<string, unknown>;
  sources?: ProductionSourceContract[];
  assets?: ProductionAssetContract[];
  tasks?: ProductionTaskContract[];
  versions?: ProductionVersionContract[];
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
  owner?: string | null;
  platform?: PlatformContract | null;
  contentType?: ContentTypeContract | null;
  keyMessage?: string;
  tonePreset?: TonePresetContract;
  cta?: ContentCtaContract;
  sourceUrl?: string;
  attachments?: ContentAttachmentContract[];
  parentIdeaId?: string | null;
  parentConceptId?: string | null;
  targetPlatforms?: TargetPlatformContract[];
  angle?: string;
  formatNotes?: string[];
  claimsFlag?: boolean;
  sourceLinks?: string[];
  riskLevel?: RiskLevelContract;
  targetPublishWindow?: TargetPublishWindowContract;
  scheduledDate?: string | null;
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
