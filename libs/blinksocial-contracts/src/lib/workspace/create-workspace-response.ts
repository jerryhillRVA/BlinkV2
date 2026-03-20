export interface CreateWorkspaceResponseContract {
  id: string;
  tenantId: string;
  workspaceName: string;
  status: 'active';
  createdAt: string;
}

export interface ValidationErrorContract {
  field: string;
  message: string;
}

export interface CreateWorkspaceErrorContract {
  statusCode: number;
  message: string;
  errors?: ValidationErrorContract[];
}
