import type {
  ContentCta,
  ContentObjective,
  ContentType,
  Platform,
} from '../../content.types';

export interface ConceptProductionTarget {
  platform: Platform;
  contentType: ContentType;
}

/**
 * Shape returned by the simulated "Generate Concept Options" flow on the
 * Idea detail screen. Picking one of these options merges its fields into
 * the item when the user clicks "Concept →".
 */
export interface ConceptOption {
  id: string;
  angle: string; // becomes the concept's hook
  description: string;
  objectiveAlignment: string; // display-only label (e.g. a business goal)
  objective: ContentObjective;
  pillarIds: string[];
  segmentIds: string[];
  productionTargets: ConceptProductionTarget[];
  cta: ContentCta;
  suggestedFormatLabel: string;
}
