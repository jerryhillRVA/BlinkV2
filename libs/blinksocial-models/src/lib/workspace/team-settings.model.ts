import type { TeamMemberContract, TeamSettingsContract, WorkspaceRole, MemberStatus } from '@blinksocial/contracts';

export class TeamMember implements TeamMemberContract {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: WorkspaceRole;
  readonly status: MemberStatus;
  readonly avatarUrl?: string;
  readonly invitedAt?: string;
  readonly joinedAt?: string;

  constructor(data: TeamMemberContract) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.role = data.role;
    this.status = data.status;
    this.avatarUrl = data.avatarUrl;
    this.invitedAt = data.invitedAt;
    this.joinedAt = data.joinedAt;
  }
}

export class TeamSettings implements TeamSettingsContract {
  readonly members: TeamMember[];

  constructor(data: TeamSettingsContract) {
    this.members = data.members.map((m: TeamMemberContract) => new TeamMember(m));
  }
}
