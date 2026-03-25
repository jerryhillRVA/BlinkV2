import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { WorkspaceSettingsStateService } from '../../workspace-settings-state.service';
import type {
  TeamMemberContract,
  WorkspaceRole,
  CreateUserResponseContract,
} from '@blinksocial/contracts';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-tab-team',
  imports: [CommonModule, FormsModule],
  templateUrl: './tab-team.component.html',
  styleUrl: './tab-team.component.scss',
})
export class TabTeamComponent {
  protected readonly state = inject(WorkspaceSettingsStateService);
  protected readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);

  readonly roles: WorkspaceRole[] = ['Admin', 'Editor', 'Viewer'];

  // Add user form state
  readonly showAddForm = signal(false);
  readonly addLoading = signal(false);
  readonly addError = signal<string | null>(null);

  /** Temp password stored on state service so it survives tab reload */
  get tempPassword() { return this.state.tempPassword; }
  get tempPasswordEmail() { return this.state.tempPasswordEmail; }

  newUserEmail = '';
  newUserName = '';
  newUserRole: WorkspaceRole = 'Viewer';

  get settings() {
    return this.state.teamSettings();
  }

  get members(): TeamMemberContract[] {
    return this.settings?.members ?? [];
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin(this.state.workspaceId());
  }

  displayRole(role: string): string {
    if (role === 'Viewer') return 'User';
    return role;
  }

  openAddForm(): void {
    this.showAddForm.set(true);
    this.addError.set(null);
    this.tempPassword.set(null);
    this.tempPasswordEmail.set(null);
    this.newUserEmail = '';
    this.newUserName = '';
    this.newUserRole = 'Viewer';
  }

  closeAddForm(): void {
    this.showAddForm.set(false);
    this.addError.set(null);
  }

  dismissTempPassword(): void {
    this.state.tempPassword.set(null);
    this.state.tempPasswordEmail.set(null);
  }

  async submitAddUser(): Promise<void> {
    if (!this.newUserEmail || !this.newUserName) {
      this.addError.set('Email and display name are required');
      return;
    }

    this.addError.set(null);
    this.addLoading.set(true);

    try {
      const workspaceId = this.state.workspaceId();
      const resp = await firstValueFrom(
        this.http.post<CreateUserResponseContract>(
          `/api/account/${workspaceId}/users`,
          {
            email: this.newUserEmail,
            displayName: this.newUserName,
            workspaceId,
            role: this.newUserRole,
          },
          { withCredentials: true },
        ),
      );

      // Show temp password if a new user was created
      if (resp.temporaryPassword) {
        this.state.tempPassword.set(resp.temporaryPassword);
        this.state.tempPasswordEmail.set(this.newUserEmail);
      }

      this.showAddForm.set(false);

      // Reload team data
      this.state.loadTab('team');
    } catch (err: unknown) {
      const message =
        (err as { error?: { message?: string } })?.error?.message ?? 'Failed to add user';
      this.addError.set(message);
    } finally {
      this.addLoading.set(false);
    }
  }

  async updateMemberRole(memberId: string, newRole: string): Promise<void> {
    if (!this.isAdmin) return;
    const workspaceId = this.state.workspaceId();
    try {
      await firstValueFrom(
        this.http.put(
          `/api/account/${workspaceId}/users/${memberId}/role`,
          { role: newRole },
          { withCredentials: true },
        ),
      );
      this.state.loadTab('team');
    } catch {
      // Silently fail — reload will show current state
      this.state.loadTab('team');
    }
  }

  async removeMember(memberId: string): Promise<void> {
    if (!this.isAdmin) return;
    const workspaceId = this.state.workspaceId();
    try {
      await firstValueFrom(
        this.http.delete(
          `/api/account/${workspaceId}/users/${memberId}`,
          { withCredentials: true },
        ),
      );
      this.state.loadTab('team');
    } catch {
      this.state.loadTab('team');
    }
  }
}
