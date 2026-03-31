import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import type {
  AuthStatusResponseContract,
  LoginResponseContract,
  AuthUserInfoContract,
  WorkspaceRole,
} from '@blinksocial/contracts';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  readonly currentUser = signal<AuthUserInfoContract | null>(null);
  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly isLoading = signal(true);
  readonly needsBootstrap = signal(false);

  /** True if user is Admin of any workspace, or is the bootstrap user (no workspaces yet) */
  readonly isAnyWorkspaceAdmin = computed(() => {
    const user = this.currentUser();
    if (!user) return false;
    return (
      user.workspaces.length === 0 ||
      user.workspaces.some((w) => w.role === 'Admin')
    );
  });

  /** Track last visited workspace for navigation */
  readonly lastWorkspaceId = signal<string | null>(null);

  async checkStatus(): Promise<void> {
    // Skip during SSR
    if (isPlatformServer(this.platformId)) {
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    try {
      const resp = await firstValueFrom(
        this.http.get<AuthStatusResponseContract>('/api/auth/status', {
          withCredentials: true,
        }),
      );
      this.currentUser.set(resp.user);
      this.needsBootstrap.set(resp.needsBootstrap);
    } catch {
      this.currentUser.set(null);
    } finally {
      this.isLoading.set(false);
    }
  }

  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const resp = await firstValueFrom(
        this.http.post<LoginResponseContract>(
          '/api/auth/login',
          { email, password },
          { withCredentials: true },
        ),
      );
      this.currentUser.set(resp.user);
      this.needsBootstrap.set(false);
      return { success: true };
    } catch (err: unknown) {
      const message =
        (err as { error?: { message?: string } })?.error?.message ?? 'Login failed';
      return { success: false, error: message };
    }
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post('/api/auth/logout', {}, { withCredentials: true }),
      );
    } catch {
      // Clear state even if logout request fails
    }
    this.currentUser.set(null);
    this.lastWorkspaceId.set(null);
    this.router.navigate(['/login']);
  }

  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const resp = await firstValueFrom(
        this.http.put<{ message: string }>(
          '/api/account/password',
          { currentPassword, newPassword },
          { withCredentials: true },
        ),
      );
      return { success: true, message: resp.message };
    } catch (err: unknown) {
      const message =
        (err as { error?: { message?: string } })?.error?.message ?? 'Failed to change password';
      return { success: false, message };
    }
  }

  isAdmin(workspaceId: string): boolean {
    const user = this.currentUser();
    if (!user) return false;
    return user.workspaces.some(
      (w) => w.workspaceId === workspaceId && w.role === 'Admin',
    );
  }

  getWorkspaceRole(workspaceId: string): WorkspaceRole | null {
    const user = this.currentUser();
    if (!user) return null;
    const access = user.workspaces.find((w) => w.workspaceId === workspaceId);
    return (access?.role as WorkspaceRole) ?? null;
  }

  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return '?';
    const parts = user.displayName.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return user.displayName.substring(0, 2).toUpperCase();
  }
}
