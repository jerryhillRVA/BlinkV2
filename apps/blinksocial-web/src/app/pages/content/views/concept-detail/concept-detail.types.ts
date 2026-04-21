import type { ProductionTargetContract } from '@blinksocial/contracts';

export type ProductionTarget = ProductionTargetContract;

export interface MoveToProductionOptions {
  keepConcept: boolean;
  workOnIndex: number | null;
}
