import type {
  ContentCta,
  ContentObjective,
  ContentType,
  Platform,
} from '../../content.types';

export interface ConceptTargetPlatform {
  platform: Platform;
  contentType: ContentType;
  postId?: string | null;
}

/**
 * Shape returned by the simulated "Generate Concept Options" flow on the
 * Idea detail screen. Picking one of these options seeds the new concept's
 * fields when the user clicks "Concept →".
 */
export interface ConceptOption {
  id: string;
  angle: string; // becomes the concept's hook
  description: string;
  objectiveAlignment: string; // display-only label (e.g. a business goal)
  objective: ContentObjective;
  pillarIds: string[];
  segmentIds: string[];
  targetPlatforms: ConceptTargetPlatform[];
  cta: ContentCta;
  suggestedFormatLabel: string;
}
