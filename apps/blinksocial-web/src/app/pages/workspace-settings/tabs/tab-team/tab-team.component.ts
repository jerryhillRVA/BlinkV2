import { Component, ElementRef, inject, signal } from '@angular/core';
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
import { DropdownComponent, type DropdownOption } from '../../../../shared/dropdown/dropdown.component';

// Bootstrap admin email — the API enforces this with a constant of the same
// value (see auth.service.ts BOOTSTRAP_EMAIL). If one moves, the other must too.
const BOOTSTRAP_EMAIL = 'blinkadmin@blinksocial.com';

@Component({
  selector: 'app-tab-team',
  imports: [CommonModule, FormsModule, DropdownComponent],
  templateUrl: './tab-team.component.html',
  styleUrl: './tab-team.component.scss',
})
export class TabTeamComponent {
  protected readonly state = inject(WorkspaceSettingsStateService);
  protected readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  readonly roles: WorkspaceRole[] = ['Admin', 'Editor', 'Viewer'];

  readonly roleDropdownOptions: DropdownOption[] = this.roles.map((role) => ({
    value: role,
    label: this.displayRole(role),
  }));

  // Add user form state
  readonly showAddForm = signal(false);
  readonly addLoading = signal(false);
  readonly addError = signal<string | null>(null);

  // Reset password dialog state
  readonly resetTarget = signal<TeamMemberContract | null>(null);
  readonly resetLoading = signal(false);
  readonly resetError = signal<string | null>(null);

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

  setNewUserRole(value: string): void {
    this.newUserRole = value as WorkspaceRole;
  }

  displayRole(role: string): string {
    if (role === 'Viewer') return 'User';
    return role;
  }

  isSelfRow(member: TeamMemberContract): boolean {
    return this.authService.currentUser()?.id === member.id;
  }

  isBootstrapRow(member: TeamMemberContract): boolean {
    return member.email.toLowerCase() === BOOTSTRAP_EMAIL.toLowerCase();
  }

  canShowResetButton(member: TeamMemberContract): boolean {
    if (!this.isAdmin) return false;
    if (this.isSelfRow(member)) return false;
    if (this.isBootstrapRow(member)) return false;
    return true;
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

  openResetDialog(member: TeamMemberContract): void {
    if (!this.canShowResetButton(member)) return;
    this.resetError.set(null);
    this.resetTarget.set(member);
    queueMicrotask(() => this.focusCancelButton());
  }

  cancelResetDialog(): void {
    if (this.resetLoading()) return;
    const targetId = this.resetTarget()?.id;
    this.resetTarget.set(null);
    this.resetError.set(null);
    if (targetId) {
      queueMicrotask(() => this.focusResetButton(targetId));
    }
  }

  async confirmResetPassword(): Promise<void> {
    const target = this.resetTarget();
    if (!target || this.resetLoading()) return;

    this.resetError.set(null);
    this.resetLoading.set(true);

    try {
      const workspaceId = this.state.workspaceId();
      const resp = await firstValueFrom(
        this.http.post<CreateUserResponseContract>(
          `/api/account/${workspaceId}/users/${target.id}/password-reset`,
          {},
          { withCredentials: true },
        ),
      );

      this.state.tempPassword.set(resp.temporaryPassword);
      this.state.tempPasswordEmail.set(target.email);
      this.resetTarget.set(null);
      this.resetError.set(null);
      queueMicrotask(() => this.focusResetButton(target.id));
    } catch (err: unknown) {
      const message =
        (err as { error?: { message?: string } })?.error?.message ??
        'Failed to reset password';
      this.resetError.set(message);
    } finally {
      this.resetLoading.set(false);
    }
  }

  /** Cycle focus between the two dialog buttons (Tab / Shift-Tab). */
  trapDialogFocus(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const root = this.host.nativeElement;
    const cancel = root.querySelector<HTMLButtonElement>('.confirm-modal-cancel');
    const confirm = root.querySelector<HTMLButtonElement>('.confirm-modal-confirm');
    if (!cancel || !confirm) return;
    const active = document.activeElement;
    event.preventDefault();
    if (event.shiftKey) {
      if (active === cancel) confirm.focus();
      else cancel.focus();
    } else {
      if (active === confirm) cancel.focus();
      else confirm.focus();
    }
  }

  private focusCancelButton(): void {
    const btn = this.host.nativeElement.querySelector<HTMLButtonElement>(
      '.confirm-modal-cancel',
    );
    btn?.focus();
  }

  private focusResetButton(memberId: string): void {
    const btn = this.host.nativeElement.querySelector<HTMLButtonElement>(
      `.member-reset-btn[data-member-id="${memberId}"]`,
    );
    btn?.focus();
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
