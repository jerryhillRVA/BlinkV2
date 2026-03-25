import type { WorkspaceRole } from '../workspace/team-settings.js';

export interface LoginRequestContract {
  email: string;
  password: string;
}

export interface AuthUserInfoContract {
  id: string;
  email: string;
  displayName: string;
  workspaces: { workspaceId: string; role: WorkspaceRole }[];
}

export interface LoginResponseContract {
  user: AuthUserInfoContract;
  message: string;
}

export interface AuthStatusResponseContract {
  authenticated: boolean;
  needsBootstrap: boolean;
  user: AuthUserInfoContract | null;
}

export interface ChangePasswordRequestContract {
  currentPassword: string;
  newPassword: string;
}

export interface CreateUserRequestContract {
  email: string;
  displayName: string;
  workspaceId: string;
  role: WorkspaceRole;
}

export interface CreateUserResponseContract {
  user: AuthUserInfoContract;
  temporaryPassword: string;
  message: string;
}

export interface UpdateUserRoleRequestContract {
  role: WorkspaceRole;
}
