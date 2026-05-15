import type {
  ConceptOptionContract,
  ConceptTargetPlatformContract,
} from '@blinksocial/contracts';

/**
 * UI-facing aliases for the contract types. The shape mirrors what the
 * server returns from `POST /api/idea-concept-options`. Imports across the
 * idea-detail screen prefer these aliases to keep the call sites readable.
 */
export type ConceptOption = ConceptOptionContract;
export type ConceptTargetPlatform = ConceptTargetPlatformContract;
