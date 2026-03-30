import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ProfileSettingsComponent } from './profile-settings.component';
import { AuthService } from '../../core/auth/auth.service';

function setupAuth(authService: AuthService) {
  authService.currentUser.set({
    id: 'u1',
    email: 'blewis@jackreiley.com',
    displayName: 'Brett Lewis',
    workspaces: [
      { workspaceId: 'ws1', role: 'Admin' },
      { workspaceId: 'ws2', role: 'Viewer' },
    ],
  });
}

describe('ProfileSettingsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileSettingsComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    setupAuth(TestBed.inject(AuthService));
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

    it('should display Display Name field with real value', () => {
      const fixture = TestBed.createComponent(ProfileSettingsComponent);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      const labels = el.querySelectorAll('.field-label');
      const texts = Array.from(labels).map((l) => l.textContent?.trim());
      expect(texts).toContain('Display Name');
      const values = el.querySelectorAll('.field-value');
      expect(Array.from(values).some((v) => v.textContent?.includes('Brett Lewis'))).toBe(true);
    });

    it('should display Email field', () => {
      const fixture = TestBed.createComponent(ProfileSettingsComponent);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      const labels = el.querySelectorAll('.field-label');
      const texts = Array.from(labels).map((l) => l.textContent?.trim());
      expect(texts).toContain('Email');
    });

    it('should display Current Role field', () => {
      const fixture = TestBed.createComponent(ProfileSettingsComponent);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      const labels = el.querySelectorAll('.field-label');
      const texts = Array.from(labels).map((l) => l.textContent?.trim());
      expect(texts).toContain('Current Role');
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

    it('should bind password inputs via ngModel', async () => {
      const fixture = TestBed.createComponent(ProfileSettingsComponent);
      fixture.detectChanges();
      await fixture.whenStable();

      const currentPwd = fixture.nativeElement.querySelector('#current-password') as HTMLInputElement;
      const newPwd = fixture.nativeElement.querySelector('#new-password') as HTMLInputElement;
      const confirmPwd = fixture.nativeElement.querySelector('#confirm-password') as HTMLInputElement;

      currentPwd.value = 'oldpass';
      currentPwd.dispatchEvent(new Event('input'));
      newPwd.value = 'newpass123';
      newPwd.dispatchEvent(new Event('input'));
      confirmPwd.value = 'newpass123';
      confirmPwd.dispatchEvent(new Event('input'));

      fixture.detectChanges();
      await fixture.whenStable();

      expect(fixture.componentInstance.currentPassword).toBe('oldpass');
      expect(fixture.componentInstance.newPassword).toBe('newpass123');
      expect(fixture.componentInstance.confirmPassword).toBe('newpass123');
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

    it('should show error when fields are empty', async () => {
      const fixture = TestBed.createComponent(ProfileSettingsComponent);
      fixture.detectChanges();
      await fixture.componentInstance.onChangePassword();
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      const msg = el.querySelector('.message-error');
      expect(msg?.textContent).toContain('All fields are required');
    });

    it('should show error when password too short', async () => {
      const fixture = TestBed.createComponent(ProfileSettingsComponent);
      fixture.detectChanges();
      fixture.componentInstance.currentPassword = 'old';
      fixture.componentInstance.newPassword = 'short';
      fixture.componentInstance.confirmPassword = 'short';
      await fixture.componentInstance.onChangePassword();
      fixture.detectChanges();
      expect(fixture.componentInstance.passwordMessage()?.text).toContain('at least 8');
    });

    it('should show error when passwords dont match', async () => {
      const fixture = TestBed.createComponent(ProfileSettingsComponent);
      fixture.detectChanges();
      fixture.componentInstance.currentPassword = 'old12345';
      fixture.componentInstance.newPassword = 'newpassword1';
      fixture.componentInstance.confirmPassword = 'newpassword2';
      await fixture.componentInstance.onChangePassword();
      fixture.detectChanges();
      expect(fixture.componentInstance.passwordMessage()?.text).toContain('do not match');
    });

    it('should show success message', () => {
      const fixture = TestBed.createComponent(ProfileSettingsComponent);
      fixture.detectChanges();
      fixture.componentInstance.passwordMessage.set({ type: 'success', text: 'Password changed' });
      fixture.detectChanges();
      const msg = fixture.nativeElement.querySelector('.message-success');
      expect(msg).toBeTruthy();
      expect(msg?.textContent).toContain('Password changed');
    });

    it('should show error message with correct class', () => {
      const fixture = TestBed.createComponent(ProfileSettingsComponent);
      fixture.detectChanges();
      fixture.componentInstance.passwordMessage.set({ type: 'error', text: 'Wrong password' });
      fixture.detectChanges();
      const msg = fixture.nativeElement.querySelector('.message-error');
      expect(msg).toBeTruthy();
    });

    it('should show loading state on button', () => {
      const fixture = TestBed.createComponent(ProfileSettingsComponent);
      fixture.detectChanges();
      fixture.componentInstance.passwordLoading.set(true);
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('.change-password-btn');
      expect(btn?.textContent?.trim()).toContain('Changing');
    });

    it('should call changePassword API on valid submit', async () => {
      const fixture = TestBed.createComponent(ProfileSettingsComponent);
      const httpMock = TestBed.inject(
        (await import('@angular/common/http/testing')).HttpTestingController
      );
      fixture.detectChanges();
      fixture.componentInstance.currentPassword = 'oldpass123';
      fixture.componentInstance.newPassword = 'newpass123';
      fixture.componentInstance.confirmPassword = 'newpass123';
      const promise = fixture.componentInstance.onChangePassword();
      const req = httpMock.expectOne('/api/account/password');
      req.flush({ message: 'Password changed successfully' });
      await promise;
      fixture.detectChanges();
      expect(fixture.componentInstance.passwordMessage()?.type).toBe('success');
      expect(fixture.componentInstance.currentPassword).toBe('');
      httpMock.verify();
    });
  });
});
