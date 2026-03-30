export type ObjectiveCategory =
  | 'growth'
  | 'revenue'
  | 'awareness'
  | 'trust'
  | 'community'
  | 'engagement';

export interface BusinessObjectiveContract {
  id: string;
  category: ObjectiveCategory;
  statement: string;
  target: number;
  unit: string;
  timeframe: string;
  currentValue?: number;
  status?: 'on-track' | 'at-risk' | 'behind' | 'achieved';
}
