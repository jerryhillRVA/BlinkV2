import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceSettingsStateService } from '../../workspace-settings-state.service';
import type { TeamMemberContract, WorkspaceRole } from '@blinksocial/contracts';

@Component({
  selector: 'app-tab-team',
  imports: [CommonModule],
  templateUrl: './tab-team.component.html',
  styleUrl: './tab-team.component.scss',
})
export class TabTeamComponent {
  protected readonly state = inject(WorkspaceSettingsStateService);

  readonly roles: WorkspaceRole[] = ['Admin', 'Editor', 'Viewer'];

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

  updateMemberField(index: number, field: 'name' | 'email', value: string): void {
    const current = this.state.teamSettings();
    if (!current) return;
    const members = current.members.map((m, i) =>
      i === index ? { ...m, [field]: value } : m
    );
    this.state.teamSettings.set({ ...current, members });
  }

  updateMemberRole(index: number, value: string): void {
    const current = this.state.teamSettings();
    if (!current) return;
    const members = current.members.map((m, i) =>
      i === index ? { ...m, role: value as WorkspaceRole } : m
    );
    this.state.teamSettings.set({ ...current, members });
  }

  isExistingMember(member: TeamMemberContract): boolean {
    return member.status === 'active' || (member.status === 'invited' && !!member.email);
  }

  removeMember(index: number): void {
    const current = this.state.teamSettings();
    if (!current) return;
    const members = current.members.filter((_, i) => i !== index);
    this.state.teamSettings.set({ ...current, members });
  }
}
