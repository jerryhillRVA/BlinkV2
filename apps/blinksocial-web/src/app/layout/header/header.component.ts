import { Component, EventEmitter, Output, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, catchError, of } from 'rxjs';
import { ThemeService } from '../../core/theme/theme.service';
import { AuthService } from '../../core/auth/auth.service';
import { DashboardApiService } from '../../pages/dashboard/dashboard-api.service';
import type { WorkspaceSummaryContract } from '@blinksocial/contracts';

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
  private readonly dashboardApi = inject(DashboardApiService);

  readonly menuOpen = signal(false);
  readonly workspaceId = signal<string | null>(null);
  readonly currentTab = signal<string | null>(null);
  readonly wsDropdownOpen = signal(false);

  /** Cached workspace summaries (loaded once, reused across navigations) */
  private readonly workspaceSummaries = signal<WorkspaceSummaryContract[]>([]);
  private workspacesLoaded = false;

  readonly workspaceName = computed(() => {
    const wsId = this.workspaceId();
    if (!wsId) return null;
    const summary = this.workspaceSummaries().find((w) => w.id === wsId);
    return summary?.name ?? wsId;
  });

  readonly otherWorkspaces = computed(() => {
    const wsId = this.workspaceId();
    return this.workspaceSummaries().filter(
      (w) => w.id !== wsId && (!w.status || w.status === 'active')
    );
  });

  readonly displayName = computed(() => this.authService.currentUser()?.displayName ?? '');
  readonly userInitials = computed(() => this.authService.getUserInitials());
  readonly currentRole = computed(() => {
    const wsId = this.workspaceId();
    if (wsId) return this.authService.getWorkspaceRole(wsId) ?? '';
    const user = this.authService.currentUser();
    if (user?.workspaces?.length) return user.workspaces[0].role;
    return 'Admin';
  });

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
      const tabMatch = url.match(/^\/workspace\/[^/]+\/(\w+)/);
      this.currentTab.set(tabMatch ? tabMatch[1] : null);
      this.loadWorkspacesIfNeeded();
    } else {
      this.currentTab.set(null);
    }
  }

  private loadWorkspacesIfNeeded(): void {
    if (this.workspacesLoaded) return;
    this.workspacesLoaded = true;
    this.dashboardApi
      .listWorkspaces()
      .pipe(catchError(() => of({ workspaces: [] })))
      .subscribe((resp) => this.workspaceSummaries.set(resp.workspaces));
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  toggleWsDropdown(): void {
    this.wsDropdownOpen.update((v) => !v);
  }

  closeWsDropdown(): void {
    this.wsDropdownOpen.set(false);
  }

  addWorkspace(): void {
    this.closeWsDropdown();
    this.router.navigate(['/new-workspace']);
  }

  switchWorkspace(wsId: string): void {
    this.closeWsDropdown();
    const tab = this.currentTab() ?? 'content';
    this.router.navigate(['/workspace', wsId, tab]);
  }

  onLogout(): void {
    this.closeMenu();
    this.logout.emit();
  }
}
