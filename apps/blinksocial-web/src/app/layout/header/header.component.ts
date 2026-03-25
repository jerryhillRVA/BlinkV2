import { Component, EventEmitter, Output, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { ThemeService } from '../../core/theme/theme.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  @Output() logout = new EventEmitter<void>();

  protected readonly themeService = inject(ThemeService);
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly menuOpen = signal(false);
  readonly workspaceId = signal<string | null>(null);

  readonly displayName = computed(() => this.authService.currentUser()?.displayName ?? '');
  readonly userInitials = computed(() => this.authService.getUserInitials());
  readonly currentRole = computed(() => {
    const wsId = this.workspaceId();
    if (wsId) return this.authService.getWorkspaceRole(wsId) ?? '';
    // Show role from first workspace if not on a workspace page
    const user = this.authService.currentUser();
    if (user?.workspaces?.length) return user.workspaces[0].role;
    return 'Admin';
  });

  /** Workspace settings link — use current workspace, or last visited, or first available */
  readonly settingsWorkspaceId = computed(() => {
    const current = this.workspaceId();
    if (current) return current;
    const last = this.authService.lastWorkspaceId();
    if (last) return last;
    const user = this.authService.currentUser();
    if (user?.workspaces?.length) return user.workspaces[0].workspaceId;
    return null;
  });

  ngOnInit(): void {
    this.updateWorkspaceId(this.router.url);
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((e) => this.updateWorkspaceId((e as NavigationEnd).urlAfterRedirects));
  }

  private updateWorkspaceId(url: string): void {
    const match = url.match(/^\/workspace\/([^/]+)/);
    const id = match ? match[1] : null;
    this.workspaceId.set(id);
    if (id) {
      this.authService.lastWorkspaceId.set(id);
    }
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  onLogout(): void {
    this.closeMenu();
    this.logout.emit();
  }
}
