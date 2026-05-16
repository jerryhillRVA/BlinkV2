import type {
  ContentCtaContract,
  ContentObjectiveContract,
  ContentTypeContract,
  PlatformContract,
} from '../workspace/content-item.js';

export interface ConceptTargetPlatformContract {
  platform: PlatformContract;
  contentType: ContentTypeContract;
  postId?: string | null;
}

export interface ConceptOptionContract {
  id: string;
  angle: string;
  description: string;
  objectiveAlignment: string;
  objective: ContentObjectiveContract;
  pillarIds: string[];
  segmentIds: string[];
  targetPlatforms: ConceptTargetPlatformContract[];
  cta: ContentCtaContract;
  suggestedFormatLabel: string;
}

export interface IdeaConceptOptionsRequestContract {
  workspaceId: string;
  refId: string;
}

export interface IdeaConceptOptionsResponseContract {
  options: ConceptOptionContract[];
}

export const IDEA_CONCEPT_OPTIONS_COUNT = 6;
