import type { TargetPlatformContract } from '@blinksocial/contracts';

export type TargetPlatform = TargetPlatformContract;

export interface MoveToProductionOptions {
  keepConcept: boolean;
  workOnIndex: number | null;
}
