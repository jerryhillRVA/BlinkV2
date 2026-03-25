import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-profile-settings',
  imports: [FormsModule],
  templateUrl: './profile-settings.component.html',
  styleUrl: './profile-settings.component.scss',
})
export class ProfileSettingsComponent {
  protected readonly authService = inject(AuthService);

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  readonly passwordMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);
  readonly passwordLoading = signal(false);

  get user() {
    return this.authService.currentUser();
  }

  get workspaceCount(): number {
    return this.user?.workspaces?.length ?? 0;
  }

  get currentRole(): string {
    const ws = this.user?.workspaces;
    if (!ws?.length) return 'N/A';
    // Show the highest role across workspaces
    if (ws.some((w) => w.role === 'Admin')) return 'Admin';
    if (ws.some((w) => w.role === 'Editor')) return 'Editor';
    return 'Viewer';
  }

  async onChangePassword(): Promise<void> {
    this.passwordMessage.set(null);

    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.passwordMessage.set({ type: 'error', text: 'All fields are required' });
      return;
    }

    if (this.newPassword.length < 8) {
      this.passwordMessage.set({ type: 'error', text: 'New password must be at least 8 characters' });
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.passwordMessage.set({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    this.passwordLoading.set(true);
    const result = await this.authService.changePassword(this.currentPassword, this.newPassword);
    this.passwordLoading.set(false);

    if (result.success) {
      this.passwordMessage.set({ type: 'success', text: result.message });
      this.currentPassword = '';
      this.newPassword = '';
      this.confirmPassword = '';
    } else {
      this.passwordMessage.set({ type: 'error', text: result.message });
    }
  }
}
