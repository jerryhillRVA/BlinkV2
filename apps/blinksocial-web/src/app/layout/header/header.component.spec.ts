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
});
