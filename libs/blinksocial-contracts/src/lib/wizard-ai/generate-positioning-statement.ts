export interface GeneratePositioningStatementRequestContract {
  targetCustomer?: string;
  problemSolved?: string;
  solution?: string;
  differentiator?: string;
  workspaceName?: string;
  purpose?: string;
  mission?: string;
}

export interface GeneratePositioningStatementResponseContract {
  positioningStatement: string;
}
