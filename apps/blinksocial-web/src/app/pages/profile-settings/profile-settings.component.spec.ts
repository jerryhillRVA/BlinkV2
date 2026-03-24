import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProfileSettingsComponent } from './profile-settings.component';

describe('ProfileSettingsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileSettingsComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ProfileSettingsComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should have a decorative background element', () => {
    const fixture = TestBed.createComponent(ProfileSettingsComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const bg = el.querySelector('.profile-settings-bg');
    expect(bg).toBeTruthy();
    expect(bg?.querySelector('img')).toBeTruthy();
    expect(bg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('should display "Profile Settings" heading', () => {
    const fixture = TestBed.createComponent(ProfileSettingsComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const heading = el.querySelector('h1');
    expect(heading?.textContent?.trim()).toBe('Profile Settings');
  });

  it('should display subtitle text', () => {
    const fixture = TestBed.createComponent(ProfileSettingsComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const subtitle = el.querySelector('.page-subtitle');
    expect(subtitle?.textContent).toContain(
      'Manage your personal information and account security.'
    );
  });

  describe('Profile Card', () => {
    it('should display a Profile card with user icon', () => {
      const fixture = TestBed.createComponent(ProfileSettingsComponent);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      const card = el.querySelector('.profile-card');
      expect(card).toBeTruthy();
      expect(card?.querySelector('.card-title')?.textContent?.trim()).toBe(
        'Profile'
      );
    });

    it('should display Display Name field', () => {
      const fixture = TestBed.createComponent(ProfileSettingsComponent);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      const labels = el.querySelectorAll('.field-label');
      const texts = Array.from(labels).map((l) => l.textContent?.trim());
      expect(texts).toContain('Display Name');
    });

    it('should display Email field', () => {
      const fixture = TestBed.createComponent(ProfileSettingsComponent);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      const labels = el.querySelectorAll('.field-label');
      const texts = Array.from(labels).map((l) => l.textContent?.trim());
      expect(texts).toContain('Email');
    });

    it('should display Current Workspace Role field', () => {
      const fixture = TestBed.createComponent(ProfileSettingsComponent);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      const labels = el.querySelectorAll('.field-label');
      const texts = Array.from(labels).map((l) => l.textContent?.trim());
      expect(texts).toContain('Current Workspace Role');
    });

    it('should display Workspace Access field', () => {
      const fixture = TestBed.createComponent(ProfileSettingsComponent);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      const labels = el.querySelectorAll('.field-label');
      const texts = Array.from(labels).map((l) => l.textContent?.trim());
      expect(texts).toContain('Workspace Access');
    });
  });

  describe('Change Password Card', () => {
    it('should display a Change Password card', () => {
      const fixture = TestBed.createComponent(ProfileSettingsComponent);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      const card = el.querySelector('.password-card');
      expect(card).toBeTruthy();
      expect(card?.querySelector('.card-title')?.textContent?.trim()).toBe(
        'Change Password'
      );
    });

    it('should have Current Password input', () => {
      const fixture = TestBed.createComponent(ProfileSettingsComponent);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      const input = el.querySelector('#current-password') as HTMLInputElement;
      expect(input).toBeTruthy();
      expect(input.type).toBe('password');
    });

    it('should have New Password input', () => {
      const fixture = TestBed.createComponent(ProfileSettingsComponent);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      const input = el.querySelector('#new-password') as HTMLInputElement;
      expect(input).toBeTruthy();
      expect(input.type).toBe('password');
    });

    it('should have Confirm New Password input', () => {
      const fixture = TestBed.createComponent(ProfileSettingsComponent);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      const input = el.querySelector('#confirm-password') as HTMLInputElement;
      expect(input).toBeTruthy();
      expect(input.type).toBe('password');
    });

    it('should show minimum 8 characters hint', () => {
      const fixture = TestBed.createComponent(ProfileSettingsComponent);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      const hint = el.querySelector('.password-hint');
      expect(hint?.textContent).toContain('Minimum 8 characters');
    });

    it('should have a Change Password button', () => {
      const fixture = TestBed.createComponent(ProfileSettingsComponent);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      const btn = el.querySelector('.change-password-btn') as HTMLButtonElement;
      expect(btn).toBeTruthy();
      expect(btn.textContent?.trim()).toBe('Change Password');
    });
  });
});
