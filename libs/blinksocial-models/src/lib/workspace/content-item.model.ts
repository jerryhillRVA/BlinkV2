import type {
  ContentItemContract,
  ContentStageContract,
  ContentStatusContract,
  PlatformContract,
  ContentTypeContract,
  ContentObjectiveContract,
  TonePresetContract,
  ContentCtaContract,
  ContentAttachmentContract,
  TargetPlatformContract,
  TargetPublishWindowContract,
  RiskLevelContract,
  ProductionContract,
} from '@blinksocial/contracts';

export class ContentItem implements ContentItemContract {
  id!: string;
  conceptId?: string;
  stage!: ContentStageContract;
  status!: ContentStatusContract;
  title!: string;
  description!: string;
  pillarIds!: string[];
  segmentIds!: string[];
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
  createdAt!: string;
  updatedAt!: string;

  constructor(data: Partial<ContentItemContract> = {}) {
    Object.assign(this, data);
  }
}
