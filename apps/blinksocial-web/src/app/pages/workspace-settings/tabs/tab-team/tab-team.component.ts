import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceSettingsStateService } from '../../workspace-settings-state.service';
import type { TeamMemberContract } from '@blinksocial/contracts';

@Component({
  selector: 'app-tab-team',
  imports: [CommonModule],
  templateUrl: './tab-team.component.html',
  styleUrl: './tab-team.component.scss',
})
export class TabTeamComponent {
  protected readonly state = inject(WorkspaceSettingsStateService);

  get settings() {
    return this.state.teamSettings();
  }

  get members(): TeamMemberContract[] {
    return this.settings?.members ?? [];
  }

  displayRole(role: string): string {
    if (role === 'Viewer') return 'User';
    return role;
  }

  addUser(): void {
    const current = this.state.teamSettings();
    if (!current) return;
    const newMember: TeamMemberContract = {
      id: `user-${Date.now()}`,
      name: '',
      email: '',
      role: 'Viewer',
      status: 'invited',
      invitedAt: new Date().toISOString(),
    };
    this.state.teamSettings.set({
      ...current,
      members: [...current.members, newMember],
    });
  }
}
