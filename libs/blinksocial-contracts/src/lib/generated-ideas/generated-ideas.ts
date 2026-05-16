export interface GeneratedIdeaContract {
  id: string;
  title: string;
  rationale: string;
  pillarId: string;
}

export interface GenerateIdeasRequestContract {
  workspaceId: string;
  pillarIds: string[];
}

export interface GenerateIdeasResponseContract {
  ideas: GeneratedIdeaContract[];
}

export const GENERATE_IDEAS_COUNT = 6;
