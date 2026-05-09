export type ProductionStep =
  | 'brief'
  | 'builder'
  | 'packaging'
  | 'qa'
  | 'handoff';

export interface BriefValidationIssue {
  field: string;
  label: string;
}

export interface ProductionStepDef {
  id: ProductionStep;
  label: string;
  number: number;
  // Lucide icon path data — rendered inside a 12×12 SVG.
  iconPaths: string[];
}

export const PRODUCTION_STEPS: ProductionStepDef[] = [
  {
    id: 'brief',
    label: 'Brief',
    number: 1,
    // Lucide Briefcase
    iconPaths: [
      'M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16',
      'M2 13a18.5 18.5 0 0 0 20 0',
      'M22 6H2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2z',
    ],
  },
  {
    id: 'builder',
    label: 'Builder',
    number: 2,
    // Lucide Sparkles (5-path, post-#110)
    iconPaths: [
      'M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z',
      'M20 3v4',
      'M22 5h-4',
      'M4 17v2',
      'M5 18H3',
    ],
  },
  {
    id: 'packaging',
    label: 'Packaging',
    number: 3,
    // Lucide Package
    iconPaths: [
      'M16.5 9.4 7.55 4.24',
      'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',
      'm3.3 7 8.7 5 8.7-5',
      'M12 22V12',
    ],
  },
  {
    id: 'qa',
    label: 'QA',
    number: 4,
    // Lucide Eye
    iconPaths: [
      'M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0',
      'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
    ],
  },
  {
    id: 'handoff',
    label: 'Handoff',
    number: 5,
    // Lucide Send
    iconPaths: [
      'M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z',
      'M21.854 2.147l-10.94 10.939',
    ],
  },
];
