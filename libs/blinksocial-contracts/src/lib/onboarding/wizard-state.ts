import type { CreateWorkspaceRequestContract } from '../workspace/create-workspace-request.js';

export interface WizardStateContract {
  currentStep: number;
  completedSteps: number[];
  formData: Partial<CreateWorkspaceRequestContract>;
  blueprintSessionId?: string;
}
