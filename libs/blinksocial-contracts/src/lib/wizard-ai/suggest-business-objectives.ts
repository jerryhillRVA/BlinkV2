import type { BusinessObjectiveContract } from '../workspace/business-objective.js';

export interface SuggestBusinessObjectivesAudienceSegment {
  name: string;
  description?: string;
}

export interface SuggestBusinessObjectivesExistingObjective {
  statement: string;
  category?: string;
}

export interface SuggestBusinessObjectivesRequestContract {
  workspaceName?: string;
  purpose?: string;
  mission?: string;
  audienceSegments?: SuggestBusinessObjectivesAudienceSegment[];
  existingObjectives?: SuggestBusinessObjectivesExistingObjective[];
  blueprintContext?: string;
}

export interface SuggestBusinessObjectivesResponseContract {
  suggestions: BusinessObjectiveContract[];
}
