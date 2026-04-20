import type {
  ContentStageContract,
  ContentStatusContract,
  PlatformContract,
  ContentTypeContract,
  ContentObjectiveContract,
  ContentItemContract,
  CtaTypeContract,
  TonePresetContract,
  ContentCtaContract,
} from '@blinksocial/contracts';

export type ContentView =
  | 'overview'
  | 'strategy'
  | 'production'
  | 'review'
  | 'performance';

export type ViewMode = 'kanban' | 'list';
export type SortField = 'updatedAt' | 'title' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export type ContentStage = ContentStageContract;
export type ContentStatus = ContentStatusContract;
export type Platform = PlatformContract;
export type ContentType = ContentTypeContract;
export type ContentObjective = ContentObjectiveContract;
export type CtaType = CtaTypeContract;
export type TonePreset = TonePresetContract;
export type ContentCta = ContentCtaContract;

export type ContentItem = ContentItemContract;

export type ContentItemType = 'idea' | 'concept' | 'production-brief';
export type IdeaMode = 'manual' | 'generate';

export interface GeneratedIdea {
  id: string;
  title: string;
  rationale: string;
  pillarId: string;
}

interface ContentCreatePayloadBase {
  title: string;
  description: string;
  pillarIds: string[];
  segmentIds: string[];
}

export interface IdeaPayload extends ContentCreatePayloadBase {
  kind: 'idea';
}

export interface ConceptPayload extends ContentCreatePayloadBase {
  kind: 'concept';
  hook: string;
  objective: ContentObjective;
  platform?: Platform;
  contentType?: ContentType;
  cta?: ContentCta;
}

export interface ProductionConceptPayload extends ContentCreatePayloadBase {
  kind: 'production';
  hook: string;
  objective: ContentObjective;
  platform: Platform;
  contentType: ContentType;
  cta?: ContentCta;
}

export interface BriefPayload extends ContentCreatePayloadBase {
  kind: 'brief';
  platform: Platform;
  contentType: ContentType;
  objective: ContentObjective;
  keyMessage: string;
  tonePreset?: TonePreset;
  cta?: ContentCta;
}

export type ContentCreatePayload =
  | IdeaPayload
  | ConceptPayload
  | ProductionConceptPayload
  | BriefPayload;

export interface ContentPillar {
  id: string;
  name: string;
  description: string;
  color: string;
}

export interface AudienceSegment {
  id: string;
  name: string;
  description: string;
}

export interface SidebarStep {
  id: ContentView;
  label: string;
  step: number;
  iconPath: string;
}

export interface PipelineColumn {
  id: string;
  label: string;
  stage: ContentStage | null;
  statuses: ContentStatus[];
  colorClass: string;
  iconColor: string;
  iconPaths: string[];
  addType?: ContentItemType;
}
