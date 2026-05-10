export type ProductionStep =
  | 'brief'
  | 'draft'
  | 'packaging'
  | 'qa';

export interface BriefValidationIssue {
  field: string;
  label: string;
}

export interface ProductionStepDef {
  id: ProductionStep;
  label: string;
  number: number;
}

export const PRODUCTION_STEPS: ProductionStepDef[] = [
  { id: 'brief', label: 'Brief', number: 1 },
  { id: 'draft', label: 'Draft', number: 2 },
  { id: 'packaging', label: 'Packaging', number: 3 },
  { id: 'qa', label: 'QA', number: 4 },
];
