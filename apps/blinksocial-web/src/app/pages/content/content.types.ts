import type {
  ContentStageContract,
  ContentStatusContract,
  PlatformContract,
  ContentTypeContract,
  ContentObjectiveContract,
  ContentItemContract,
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

export type ContentItem = ContentItemContract;

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
}
