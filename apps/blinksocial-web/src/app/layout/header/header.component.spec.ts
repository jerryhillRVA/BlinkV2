import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HeaderComponent } from './header.component';
import { ThemeService } from '../../core/theme/theme.service';
import { AuthService } from '../../core/auth/auth.service';
import { Component } from '@angular/core';

@Component({ template: '' })
class DummyComponent {}

function setupAuth(authService: AuthService) {
  authService.currentUser.set({
    id: 'u1',
    email: 'blewis@jackreiley.com',
    displayName: 'Brett Lewis',
    workspaces: [{ workspaceId: 'abc123', role: 'Admin' }],
  });
}

describe('HeaderComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideRouter([
          { path: 'profile-settings', component: DummyComponent },
          { path: 'workspace/:id/settings', component: DummyComponent },
          { path: 'workspace/:id/content', component: DummyComponent },
          { path: 'workspace/:id/strategy', component: DummyComponent },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    setupAuth(TestBed.inject(AuthService));
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display brand text "BLINK SOCIAL"', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.brand-text')?.textContent).toBe('BLINK SOCIAL');
  });

  it('should have a brand icon with SVG', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const icon = el.querySelector('.brand-icon');
    expect(icon).toBeTruthy();
    expect(icon?.querySelector('svg')).toBeTruthy();
  });

  it('should have a clickable brand link to dashboard', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const brandLink = el.querySelector('.navbar-brand') as HTMLAnchorElement;
    expect(brandLink).toBeTruthy();
    expect(brandLink.tagName).toBe('A');
    expect(brandLink.getAttribute('href')).toBe('/');
  });

  it('should display user name and role', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.user-name')?.textContent).toBe('Brett Lewis');
    expect(el.querySelector('.user-role')?.textContent).toBe('Admin');
  });

  it('should display avatar with initials "BL"', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.avatar-placeholder')?.textContent?.trim()).toBe('BL');
  });

  it('should show workspace settings from user workspaces when not on workspace page', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    (el.querySelector('.avatar-placeholder') as HTMLElement).click();
    fixture.detectChanges();
    const wsItem = el.querySelector('a[href*="/workspace/"]');
    expect(wsItem).toBeTruthy();
    expect(wsItem?.getAttribute('href')).toContain('abc123');
  });

  it('should fallback to first workspace role when not on workspace page', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.currentRole()).toBe('Admin');
  });

  it('should use lastWorkspaceId when set', () => {
    const authService = TestBed.inject(AuthService);
    authService.lastWorkspaceId.set('last-ws');
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.settingsWorkspaceId()).toBe('last-ws');
  });

  it('should have a logout option in the profile menu that emits event', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const el: HTMLElement = fixture.nativeElement;

    // Open the menu first
    (el.querySelector('.avatar-placeholder') as HTMLElement).click();
    fixture.detectChanges();

    const items = el.querySelectorAll('.profile-menu-item');
    const logoutItem = Array.from(items).find(
      (i) => i.textContent?.trim() === 'Logout'
    ) as HTMLElement;
    expect(logoutItem).toBeTruthy();

    const spy = vi.fn();
    component.logout.subscribe(spy);
    logoutItem.click();
    expect(spy).toHaveBeenCalled();
  });

  describe('Profile Menu', () => {
    it('should not show profile menu by default', () => {
      const fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.profile-menu')).toBeFalsy();
    });

    it('should show profile menu when avatar is clicked', () => {
      const fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      const avatar = el.querySelector('.avatar-placeholder') as HTMLElement;
      avatar.click();
      fixture.detectChanges();
      expect(el.querySelector('.profile-menu')).toBeTruthy();
    });

    it('should show "Profile Settings" menu item', () => {
      const fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      (el.querySelector('.avatar-placeholder') as HTMLElement).click();
      fixture.detectChanges();
      const items = el.querySelectorAll('.profile-menu-item');
      const texts = Array.from(items).map((i) => i.textContent?.trim());
      expect(texts).toContain('Profile Settings');
    });

    it('should show "Logout" menu item', () => {
      const fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      (el.querySelector('.avatar-placeholder') as HTMLElement).click();
      fixture.detectChanges();
      const items = el.querySelectorAll('.profile-menu-item');
      const texts = Array.from(items).map((i) => i.textContent?.trim());
      expect(texts).toContain('Logout');
    });

    it('should show "Workspace Settings" even when not in a workspace (uses first available)', () => {
      const fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      (el.querySelector('.avatar-placeholder') as HTMLElement).click();
      fixture.detectChanges();
      const items = el.querySelectorAll('.profile-menu-item');
      const texts = Array.from(items).map((i) => i.textContent?.trim());
      expect(texts).toContain('Workspace Settings');
    });

    it('should hide profile menu when clicking avatar again', () => {
      const fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      const avatar = el.querySelector('.avatar-placeholder') as HTMLElement;
      avatar.click();
      fixture.detectChanges();
      expect(el.querySelector('.profile-menu')).toBeTruthy();
      avatar.click();
      fixture.detectChanges();
      expect(el.querySelector('.profile-menu')).toBeFalsy();
    });

    it('should close menu when clicking the backdrop', () => {
      const fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      (el.querySelector('.avatar-placeholder') as HTMLElement).click();
      fixture.detectChanges();
      expect(el.querySelector('.profile-menu')).toBeTruthy();

      const backdrop = el.querySelector('.profile-menu-backdrop') as HTMLElement;
      expect(backdrop).toBeTruthy();
      backdrop.click();
      fixture.detectChanges();
      expect(el.querySelector('.profile-menu')).toBeFalsy();
    });

    it('should emit logout when "Logout" menu item is clicked', () => {
      const fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance;
      const el: HTMLElement = fixture.nativeElement;
      const spy = vi.fn();
      component.logout.subscribe(spy);

      (el.querySelector('.avatar-placeholder') as HTMLElement).click();
      fixture.detectChanges();
      const items = el.querySelectorAll('.profile-menu-item');
      const logoutItem = Array.from(items).find(
        (i) => i.textContent?.trim() === 'Logout'
      ) as HTMLElement;
      logoutItem.click();
      expect(spy).toHaveBeenCalled();
    });

    it('should navigate to /profile-settings when "Profile Settings" is clicked', () => {
      const fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      (el.querySelector('.avatar-placeholder') as HTMLElement).click();
      fixture.detectChanges();
      const items = el.querySelectorAll('.profile-menu-item');
      const profileItem = Array.from(items).find(
        (i) => i.textContent?.trim() === 'Profile Settings'
      ) as HTMLAnchorElement;
      expect(profileItem.getAttribute('href')).toBe('/profile-settings');
    });

    it('should close menu when "Profile Settings" is clicked', () => {
      const fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      (el.querySelector('.avatar-placeholder') as HTMLElement).click();
      fixture.detectChanges();
      const items = el.querySelectorAll('.profile-menu-item');
      const profileItem = Array.from(items).find(
        (i) => i.textContent?.trim() === 'Profile Settings'
      ) as HTMLElement;
      profileItem.click();
      fixture.detectChanges();
      expect(el.querySelector('.profile-menu')).toBeFalsy();
    });
  });

  describe('Profile Menu in workspace context', () => {
    beforeEach(async () => {
      localStorage.clear();
      document.documentElement.removeAttribute('data-theme');
      TestBed.resetTestingModule();

      await TestBed.configureTestingModule({
        imports: [HeaderComponent],
        providers: [
          provideRouter([
            { path: 'workspace/:id', component: DummyComponent },
            { path: 'workspace/:id/settings', component: DummyComponent },
            { path: 'profile-settings', component: DummyComponent },
          ]),
          provideHttpClient(),
          provideHttpClientTesting(),
        ],
      }).compileComponents();

      setupAuth(TestBed.inject(AuthService));
    });

    it('should show "Workspace Settings" when on a workspace route', async () => {
      const fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();

      const router = TestBed.inject(Router);
      await router.navigateByUrl('/workspace/abc123');
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      (el.querySelector('.avatar-placeholder') as HTMLElement).click();
      fixture.detectChanges();
      const items = el.querySelectorAll('.profile-menu-item');
      const texts = Array.from(items).map((i) => i.textContent?.trim());
      expect(texts).toContain('Workspace Settings');
    });

    it('should link Workspace Settings to the current workspace settings page', async () => {
      const fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();

      const router = TestBed.inject(Router);
      await router.navigateByUrl('/workspace/abc123');
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      (el.querySelector('.avatar-placeholder') as HTMLElement).click();
      fixture.detectChanges();
      const items = el.querySelectorAll('.profile-menu-item');
      const wsItem = Array.from(items).find(
        (i) => i.textContent?.trim() === 'Workspace Settings'
      ) as HTMLAnchorElement;
      expect(wsItem.getAttribute('href')).toBe('/workspace/abc123/settings');
    });
  });

  it('should have a theme toggle button', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.theme-toggle-btn')).toBeTruthy();
  });

  it('should show moon icon in light mode', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const btn = el.querySelector('.theme-toggle-btn');
    expect(btn?.querySelector('.icon-moon')).toBeTruthy();
    expect(btn?.querySelector('.icon-sun')).toBeFalsy();
  });

  it('should show sun icon in dark mode', () => {
    const themeService = TestBed.inject(ThemeService);
    themeService.setTheme('dark');
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const btn = el.querySelector('.theme-toggle-btn');
    expect(btn?.querySelector('.icon-sun')).toBeTruthy();
    expect(btn?.querySelector('.icon-moon')).toBeFalsy();
  });

  it('should toggle theme when toggle button is clicked', () => {
    const themeService = TestBed.inject(ThemeService);
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    expect(themeService.theme()).toBe('light');

    const el: HTMLElement = fixture.nativeElement;
    const btn = el.querySelector('.theme-toggle-btn') as HTMLButtonElement;
    btn.click();
    expect(themeService.theme()).toBe('dark');

    btn.click();
    expect(themeService.theme()).toBe('light');
  });

  describe('Workspace Navigation', () => {
    it('should not show workspace nav when not on workspace route', () => {
      const fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.workspace-nav')).toBeFalsy();
      expect(el.querySelector('.ws-selector-btn')).toBeFalsy();
    });

    it('should show workspace nav and selector when on workspace route', async () => {
      const router = TestBed.inject(Router);
      const fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();
      await router.navigateByUrl('/workspace/abc123/content');
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.workspace-nav')).toBeTruthy();
      expect(el.querySelector('.ws-selector-btn')).toBeTruthy();
    });

    it('should show Content and Strategy nav items', async () => {
      const router = TestBed.inject(Router);
      const fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();
      await router.navigateByUrl('/workspace/abc123/content');
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      const navItems = el.querySelectorAll('.ws-nav-item');
      expect(navItems.length).toBe(2);
      expect(navItems[0].textContent).toContain('Content');
      expect(navItems[1].textContent).toContain('Strategy');
    });

    it('should highlight active tab', async () => {
      const router = TestBed.inject(Router);
      const fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();
      await router.navigateByUrl('/workspace/abc123/content');
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      const activeItem = el.querySelector('.ws-nav-item.active');
      expect(activeItem?.textContent).toContain('Content');
    });

    it('should show workspace name in selector', async () => {
      const router = TestBed.inject(Router);
      const fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();
      await router.navigateByUrl('/workspace/abc123/content');
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      const name = el.querySelector('.ws-selector-name');
      expect(name?.textContent).toContain('abc123');
    });

    it('should toggle workspace dropdown', async () => {
      const router = TestBed.inject(Router);
      const fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();
      await router.navigateByUrl('/workspace/abc123/content');
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.ws-dropdown')).toBeFalsy();
      (el.querySelector('.ws-selector-btn') as HTMLElement).click();
      fixture.detectChanges();
      expect(el.querySelector('.ws-dropdown')).toBeTruthy();
    });

    it('should close workspace dropdown when backdrop is clicked', async () => {
      const router = TestBed.inject(Router);
      const fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();
      await router.navigateByUrl('/workspace/abc123/content');
      fixture.detectChanges();
      fixture.componentInstance.toggleWsDropdown();
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      (el.querySelector('.ws-dropdown-backdrop') as HTMLElement).click();
      fixture.detectChanges();
      expect(el.querySelector('.ws-dropdown')).toBeFalsy();
    });

    it('should highlight strategy tab when on strategy route', async () => {
      const router = TestBed.inject(Router);
      const fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();
      await router.navigateByUrl('/workspace/abc123/strategy');
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      const activeItem = el.querySelector('.ws-nav-item.active');
      expect(activeItem?.textContent).toContain('Strategy');
    });

    it('should clear workspace nav when navigating away from workspace', async () => {
      const router = TestBed.inject(Router);
      const fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();
      await router.navigateByUrl('/workspace/abc123/content');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.workspace-nav')).toBeTruthy();
      await router.navigateByUrl('/profile-settings');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.workspace-nav')).toBeFalsy();
    });

    it('should call switchWorkspace and navigate', async () => {
      const router = TestBed.inject(Router);
      const fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();
      await router.navigateByUrl('/workspace/abc123/content');
      fixture.detectChanges();
      const spy = vi.spyOn(router, 'navigate');
      fixture.componentInstance.switchWorkspace('other-ws');
      expect(spy).toHaveBeenCalledWith(['/workspace', 'other-ws', 'content']);
    });

    it('should show other workspace items in dropdown when summaries are loaded', async () => {
      const router = TestBed.inject(Router);
      const fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();
      await router.navigateByUrl('/workspace/abc123/content');
      fixture.detectChanges();
      // Manually set workspace summaries to simulate API response
      (fixture.componentInstance as unknown as { workspaceSummaries: ReturnType<typeof import('@angular/core').signal> })
        .workspaceSummaries.set([
          { id: 'abc123', name: 'Hive Collective', color: '#d94e33', status: 'active', createdAt: '' },
          { id: 'other-ws', name: 'Other Workspace', color: '#2b6bff', status: 'active', createdAt: '' },
        ]);
      fixture.detectChanges();
      // Workspace name should now resolve
      expect(fixture.componentInstance.workspaceName()).toBe('Hive Collective');
      // Open dropdown
      fixture.componentInstance.toggleWsDropdown();
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      // Current workspace + 1 other workspace + Add Workspace = 3 items
      const items = el.querySelectorAll('.ws-dropdown-item');
      expect(items.length).toBe(3);
      // First item is current workspace
      expect(items[0].textContent).toContain('Hive Collective');
      // Second is the other workspace
      expect(items[1].textContent).toContain('Other Workspace');
      // Third is Add Workspace
      expect(items[2].textContent).toContain('Add Workspace');
    });

    it('should show Add Workspace in dropdown', async () => {
      const router = TestBed.inject(Router);
      const fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();
      await router.navigateByUrl('/workspace/abc123/content');
      fixture.detectChanges();
      fixture.componentInstance.toggleWsDropdown();
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      const addBtn = el.querySelector('.ws-dropdown-add');
      expect(addBtn).toBeTruthy();
      expect(addBtn?.textContent).toContain('Add Workspace');
    });

    it('should set currentTab to null when not on workspace page', () => {
      const fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();
      expect(fixture.componentInstance.currentTab()).toBeNull();
    });

    it('should show navbar-start wrapper', () => {
      const fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.navbar-start')).toBeTruthy();
    });

    it('should derive workspaceName from summaries when loaded', async () => {
      const router = TestBed.inject(Router);
      const fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();
      await router.navigateByUrl('/workspace/abc123/content');
      fixture.detectChanges();
      expect(fixture.componentInstance.workspaceName()).toBe('abc123');
    });

    it('should use workspace role when on workspace page', async () => {
      const router = TestBed.inject(Router);
      const fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();
      await router.navigateByUrl('/workspace/abc123/content');
      fixture.detectChanges();
      expect(fixture.componentInstance.currentRole()).toBe('Admin');
    });

    it('should use current workspace for settingsWorkspaceId when on workspace page', async () => {
      const router = TestBed.inject(Router);
      const fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();
      await router.navigateByUrl('/workspace/abc123/content');
      fixture.detectChanges();
      expect(fixture.componentInstance.settingsWorkspaceId()).toBe('abc123');
    });

    it('should return null workspaceName when no user', async () => {
      const authService = TestBed.inject(AuthService);
      authService.currentUser.set(null);
      const fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();
      expect(fixture.componentInstance.workspaceName()).toBeNull();
    });

    it('should return Admin role when no user workspaces', () => {
      const authService = TestBed.inject(AuthService);
      authService.currentUser.set({
        id: 'u1', email: 'a@b.com', displayName: 'Test', workspaces: [],
      });
      const fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();
      expect(fixture.componentInstance.currentRole()).toBe('Admin');
    });
  });
});
