import type { WorkspaceRole } from '../workspace/team-settings.js';

export interface UserWorkspaceAccess {
  workspaceId: string;
  role: WorkspaceRole;
  joinedAt: string;
}

export interface UserContract {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  workspaces: UserWorkspaceAccess[];
}

export interface UsersFileContract {
  users: UserContract[];
}

export interface SessionContract {
  token: string;
  userId: string;
  createdAt: string;
  lastActivity: string;
  expiresAt: string;
}

export interface SessionsFileContract {
  sessions: SessionContract[];
}
