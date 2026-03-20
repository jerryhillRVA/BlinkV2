export interface WorkspaceSummaryContract {
  id: string;
  name: string;
  color: string;
  status: string;
  createdAt: string;
}

export interface ListWorkspacesResponseContract {
  workspaces: WorkspaceSummaryContract[];
}
