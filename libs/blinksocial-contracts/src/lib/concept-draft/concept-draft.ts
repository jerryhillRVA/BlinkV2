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

export interface ConceptDraftRequestContract {
  workspaceId: string;
  draft: ConceptDraftSnapshotContract;
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
