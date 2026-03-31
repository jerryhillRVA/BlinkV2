import type { BrandPositioningContract } from '@blinksocial/contracts';

export class BrandPositioning implements BrandPositioningContract {
  readonly targetCustomer?: string;
  readonly problemSolved?: string;
  readonly solution?: string;
  readonly differentiator?: string;
  readonly positioningStatement?: string;

  constructor(data: BrandPositioningContract) {
    this.targetCustomer = data.targetCustomer;
    this.problemSolved = data.problemSolved;
    this.solution = data.solution;
    this.differentiator = data.differentiator;
    this.positioningStatement = data.positioningStatement;
  }
}
