export type ProductionStep = 'brief' | 'builder' | 'packaging' | 'qa';

export interface BriefValidationIssue {
  field: string;
  label: string;
}

export const PRODUCTION_STEPS: {
  id: ProductionStep;
  label: string;
  number: number;
}[] = [
  { id: 'brief', label: 'Brief', number: 1 },
  { id: 'builder', label: 'Builder', number: 2 },
  { id: 'packaging', label: 'Packaging', number: 3 },
  { id: 'qa', label: 'QA', number: 4 },
];
