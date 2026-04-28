import { Component, EventEmitter, Output, HostListener, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
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
  /**
   * Non-workspace routes where we still want the workspace selector + nav
   * tabs visible (keyed to the user's last-active or first workspace).
   * See issue #23 — deep-linking to /profile-settings otherwise strands the
   * user with no way back into a workspace.
   */
  private static readonly NAV_ELIGIBLE_ROUTES: readonly string[] = [
    '/profile-settings',
  ];

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
  /** True when the current route is in NAV_ELIGIBLE_ROUTES (e.g. /profile-settings). */
  readonly isNavEligibleRoute = signal(false);

  /** Cached workspace summaries (loaded once, reused across navigations) */
  private readonly workspaceSummaries = signal<WorkspaceSummaryContract[]>([]);
  private workspacesLoaded = false;

  /**
   * The workspace the selector + nav tabs should key off. On workspace routes
   * this matches `workspaceId()`; on other nav-eligible routes it falls back
   * to `lastWorkspaceId → user.workspaces[0] → null` (same chain as
   * `settingsWorkspaceId`, which already drives the settings-gear link).
   */
  readonly effectiveWorkspaceId = computed(() => {
    const current = this.workspaceId();
    if (current) return current;
    return this.settingsWorkspaceId();
  });

  /**
   * Whether to render the workspace selector + Content/Strategy tabs.
   * True on any workspace route, plus explicit whitelist (e.g. /profile-settings),
   * and only when an effective workspace exists (hides for zero-workspace users).
   */
  readonly showWorkspaceNav = computed(() => {
    const onEligibleRoute =
      this.workspaceId() != null || this.isNavEligibleRoute();
    return onEligibleRoute && this.effectiveWorkspaceId() != null;
  });

  readonly workspaceName = computed(() => {
    const wsId = this.effectiveWorkspaceId();
    if (!wsId) return null;
    const summary = this.workspaceSummaries().find((w) => w.id === wsId);
    return summary?.name ?? wsId;
  });

  readonly otherWorkspaces = computed(() => {
    const wsId = this.effectiveWorkspaceId();
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

    const urlPath = url.split('?')[0].split('#')[0];
    const eligible = HeaderComponent.NAV_ELIGIBLE_ROUTES.includes(urlPath);
    this.isNavEligibleRoute.set(eligible);

    if (id) {
      this.authService.lastWorkspaceId.set(id);
      const tabMatch = url.match(/^\/workspace\/[^/]+\/(\w+)/);
      this.currentTab.set(tabMatch ? tabMatch[1] : null);
      // Calendar-sourced detail screens (e.g. /workspace/<id>/content/<itemId>?from=calendar)
      // keep the Calendar tab active so the header doesn't flip while Back returns to Calendar.
      // calendar-page.component.ts `openEvent()` is the sole writer of the literal `from=calendar`.
      if (/[?&]from=calendar(?:&|$)/.test(url)) {
        this.currentTab.set('calendar');
      }
      this.loadWorkspacesIfNeeded();
    } else {
      this.currentTab.set(null);
      // On eligible non-workspace routes (e.g. /profile-settings), still load
      // workspace summaries so the selector can resolve names rather than
      // showing raw workspace IDs.
      if (eligible) {
        this.loadWorkspacesIfNeeded();
      }
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

  @HostListener('document:keydown.escape')
  onDocumentEscape(): void {
    if (this.wsDropdownOpen()) this.closeWsDropdown();
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
