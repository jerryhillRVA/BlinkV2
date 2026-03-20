export type WorkspaceRole = 'Admin' | 'Editor' | 'Viewer';
export type MemberStatus = 'active' | 'invited' | 'deactivated';

export interface TeamMemberContract {
  id: string;
  name: string;
  email: string;
  role: WorkspaceRole;
  status: MemberStatus;
  avatarUrl?: string;
  invitedAt?: string;
  joinedAt?: string;
}

export interface TeamSettingsContract {
  members: TeamMemberContract[];
}
