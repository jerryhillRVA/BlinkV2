export interface WorkspaceRegistryEntryContract {
  tenantId: string;
  name: string;
  status: 'active' | 'archived' | 'suspended' | 'onboarding' | 'creating';
  plan?: 'free' | 'pro' | 'enterprise';
  brandColor?: string;
  createdAt: string;
  lastActiveAt?: string;
}

export interface WorkspaceRegistryContract {
  workspaces: WorkspaceRegistryEntryContract[];
  totalWorkspaces: number;
}
