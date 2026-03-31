import type { BusinessObjectiveContract, ObjectiveCategory } from '@blinksocial/contracts';

export class BusinessObjective implements BusinessObjectiveContract {
  readonly id: string;
  readonly category: ObjectiveCategory;
  readonly statement: string;
  readonly target: number;
  readonly unit: string;
  readonly timeframe: string;
  readonly currentValue?: number;
  readonly status?: 'on-track' | 'at-risk' | 'behind' | 'achieved';

  constructor(data: BusinessObjectiveContract) {
    this.id = data.id;
    this.category = data.category;
    this.statement = data.statement;
    this.target = data.target;
    this.unit = data.unit;
    this.timeframe = data.timeframe;
    this.currentValue = data.currentValue;
    this.status = data.status;
  }
}
