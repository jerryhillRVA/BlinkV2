export type ContentStageContract =
  | 'idea'
  | 'concept'
  | 'post'
  | 'production-brief';

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
  size: string; // pre-formatted display string, e.g. "2.4 MB"
  url?: string;
}

export interface ProductionTargetContract {
  platform: PlatformContract;
  contentType: ContentTypeContract;
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
  productionTargets?: ProductionTargetContract[];
  scheduledAt?: string; // ISO datetime
  archived?: boolean;
  tags?: string[];
  briefApproved?: boolean;
  briefApprovedAt?: string; // ISO datetime
  briefApprovedBy?: string;
  createdAt: string;
  updatedAt: string;
}
