import type {
  ContentCtaContract,
  ContentObjectiveContract,
} from '../workspace/content-item.js';

/**
 * Draft-snapshot the Create Concept drawer sends with each
 * `POST /api/concept-draft` request. Mirrors the shape the user has
 * filled out in the UI so far; pillar/segment ids are *currently
 * selected* — server uses their length to decide whether to suggest
 * fallbacks.
 */
export interface ConceptDraftSnapshotContract {
  title: string;
  objective: ContentObjectiveContract;
  pillarIds: string[];
  segmentIds: string[];
}

/**
 * Field length bounds (in characters) passed from the frontend so the
 * skill prompt and the forced-tool schema target the same limits the
 * Create Concept form validator enforces. Mirrors the pattern from
 * `AiAssistFieldLengthContract` (#155). Without this the LLM cheerfully
 * overshoots the validators and the user can't click Save without
 * manually trimming.
 */
export interface ConceptDraftBoundsContract {
  descriptionMax?: number;
  hookMax?: number;
}

export interface ConceptDraftRequestContract {
  workspaceId: string;
  draft: ConceptDraftSnapshotContract;
  bounds?: ConceptDraftBoundsContract;
}

/**
 * One AI-generated concept draft. `pillarIdFallback` /
 * `segmentIdsFallback` are non-null only when the caller had no chips
 * selected for that field — preserving user choices across re-clicks.
 */
export interface ConceptDraftContract {
  description: string;
  hook: string;
  cta: ContentCtaContract | null;
  pillarIdFallback: string | null;
  segmentIdsFallback: string[];
}

export interface ConceptDraftResponseContract {
  draft: ConceptDraftContract;
}
