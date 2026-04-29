import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TabTeamComponent } from './tab-team.component';
import { WorkspaceSettingsStateService } from '../../workspace-settings-state.service';
import { AuthService } from '../../../../core/auth/auth.service';

function makeMockSettings() {
  return {
    members: [
      { id: 'u1', name: 'Brett Lewis', email: 'blewis@jackreiley.com', role: 'Admin' as const, status: 'active' as const, joinedAt: '2026-01-15T10:00:00Z' },
      { id: 'u2', name: 'Maya Rodriguez', email: 'maya@hivecollective.io', role: 'Viewer' as const, status: 'active' as const, joinedAt: '2026-02-01T10:00:00Z' },
    ],
  };
}

function makeMockSettingsWithBootstrap() {
  return {
    members: [
      { id: 'u1', name: 'Brett Lewis', email: 'blewis@jackreiley.com', role: 'Admin' as const, status: 'active' as const, joinedAt: '2026-01-15T10:00:00Z' },
      { id: 'u-bootstrap', name: 'Blink Admin', email: 'blinkadmin@blinksocial.com', role: 'Admin' as const, status: 'active' as const, joinedAt: '2026-01-01T00:00:00Z' },
      { id: 'u2', name: 'Maya Rodriguez', email: 'maya@hivecollective.io', role: 'Viewer' as const, status: 'active' as const, joinedAt: '2026-02-01T10:00:00Z' },
    ],
  };
}

function setupAuthAsAdmin(authService: AuthService) {
  authService.currentUser.set({
    id: 'u1',
    email: 'blewis@jackreiley.com',
    displayName: 'Brett Lewis',
    workspaces: [{ workspaceId: 'test-ws', role: 'Admin' }],
  });
}

describe('TabTeamComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TabTeamComponent>>;
  let state: WorkspaceSettingsStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabTeamComponent],
      providers: [
        WorkspaceSettingsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    state = TestBed.inject(WorkspaceSettingsStateService);
    state.workspaceId.set('test-ws');
    state.teamSettings.set(makeMockSettings());

    const authService = TestBed.inject(AuthService);
    setupAuthAsAdmin(authService);

    fixture = TestBed.createComponent(TabTeamComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render card with tab-card class', () => {
    const card = fixture.nativeElement.querySelector('.tab-card');
    expect(card).toBeTruthy();
  });

  it('should render card header with Users icon', () => {
    const icon = fixture.nativeElement.querySelector('.card-header-icon');
    expect(icon).toBeTruthy();
  });

  it('should render "Workspace Users" title', () => {
    const title = fixture.nativeElement.querySelector('.card-title');
    expect(title?.textContent).toContain('Workspace Users');
  });

  it('should render Add User button for admins', () => {
    const btn = fixture.nativeElement.querySelector('.add-user-btn');
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('Add User');
  });

  it('should render member rows', () => {
    const rows = fixture.nativeElement.querySelectorAll('.member-row');
    expect(rows.length).toBe(2);
  });

  it('should show avatar initial', () => {
    const avatars = fixture.nativeElement.querySelectorAll('.member-avatar');
    expect(avatars[0].textContent.trim()).toBe('B');
    expect(avatars[1].textContent.trim()).toBe('M');
  });

  it('should render member names', () => {
    const names = fixture.nativeElement.querySelectorAll('.member-name');
    expect(names[0].textContent.trim()).toBe('Brett Lewis');
    expect(names[1].textContent.trim()).toBe('Maya Rodriguez');
  });

  it('should render member emails', () => {
    const emails = fixture.nativeElement.querySelectorAll('.member-email');
    expect(emails[0].textContent.trim()).toBe('blewis@jackreiley.com');
    expect(emails[1].textContent.trim()).toBe('maya@hivecollective.io');
  });

  it('should render role dropdowns for admin', () => {
    const dropdowns = fixture.nativeElement.querySelectorAll('app-dropdown');
    expect(dropdowns.length).toBe(2);
  });

  it('should display role labels in dropdowns using displayRole mapping', () => {
    const triggers = fixture.nativeElement.querySelectorAll('.member-role app-dropdown .dropdown-trigger');
    expect(triggers[0].textContent).toContain('Admin');
    expect(triggers[1].textContent).toContain('User');
  });

  it('should highlight admin row', () => {
    const rows = fixture.nativeElement.querySelectorAll('.member-row');
    expect(rows[0].classList.contains('admin')).toBe(true);
    expect(rows[1].classList.contains('admin')).toBe(false);
  });

  it('should render remove buttons for admins', () => {
    const btns = fixture.nativeElement.querySelectorAll('.member-remove-btn');
    expect(btns.length).toBe(2);
  });

  it('should display "User" for Viewer role', () => {
    expect(fixture.componentInstance.displayRole('Viewer')).toBe('User');
  });

  it('should display role name as-is for non-Viewer', () => {
    expect(fixture.componentInstance.displayRole('Admin')).toBe('Admin');
  });
});

describe('TabTeamComponent (add user form)', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TabTeamComponent>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabTeamComponent],
      providers: [
        WorkspaceSettingsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    const state = TestBed.inject(WorkspaceSettingsStateService);
    state.workspaceId.set('test-ws');
    state.teamSettings.set(makeMockSettings());

    const authService = TestBed.inject(AuthService);
    setupAuthAsAdmin(authService);

    fixture = TestBed.createComponent(TabTeamComponent);
    fixture.detectChanges();
  });

  it('should show add form on button click', () => {
    fixture.componentInstance.openAddForm();
    fixture.detectChanges();
    const form = fixture.nativeElement.querySelector('.add-user-form');
    expect(form).toBeTruthy();
  });

  it('should render dropdown for role selection in add form', () => {
    fixture.componentInstance.openAddForm();
    fixture.detectChanges();
    const dropdown = fixture.nativeElement.querySelector('.add-user-fields app-dropdown');
    expect(dropdown).toBeTruthy();
  });

  it('should hide add form on cancel', () => {
    fixture.componentInstance.openAddForm();
    fixture.detectChanges();
    fixture.componentInstance.closeAddForm();
    fixture.detectChanges();
    const form = fixture.nativeElement.querySelector('.add-user-form');
    expect(form).toBeNull();
  });

  it('should bind email input via ngModel in add form', async () => {
    fixture.componentInstance.openAddForm();
    fixture.detectChanges();
    await fixture.whenStable();

    const emailInput = fixture.nativeElement.querySelector('.add-user-fields input[type="email"]') as HTMLInputElement;
    emailInput.value = 'new@example.com';
    emailInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.newUserEmail).toBe('new@example.com');
  });

  it('should set new user role via setNewUserRole', () => {
    fixture.componentInstance.setNewUserRole('Editor');
    expect(fixture.componentInstance.newUserRole).toBe('Editor');
  });
});

describe('TabTeamComponent (API interactions)', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TabTeamComponent>>;
  let httpMock: import('@angular/common/http/testing').HttpTestingController;

  beforeEach(async () => {
    const { HttpTestingController } = await import('@angular/common/http/testing');
    TestBed.resetTestingModule();

    await TestBed.configureTestingModule({
      imports: [TabTeamComponent],
      providers: [
        WorkspaceSettingsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    const state = TestBed.inject(WorkspaceSettingsStateService);
    state.workspaceId.set('test-ws');
    state.teamSettings.set(makeMockSettings());

    const authService = TestBed.inject(AuthService);
    setupAuthAsAdmin(authService);

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(TabTeamComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    // Flush any pending team reload requests
    httpMock.match(() => true).forEach((r) => r.flush({}));
  });

  it('should show error when submitting add user with empty fields', async () => {
    fixture.componentInstance.openAddForm();
    fixture.detectChanges();
    await fixture.componentInstance.submitAddUser();
    fixture.detectChanges();
    expect(fixture.componentInstance.addError()).toBe('Email and display name are required');
  });

  it('should call create user API on valid submit', async () => {
    fixture.componentInstance.openAddForm();
    fixture.componentInstance.newUserName = 'New User';
    fixture.componentInstance.newUserEmail = 'new@test.com';
    fixture.componentInstance.newUserRole = 'Viewer';
    fixture.detectChanges();

    const promise = fixture.componentInstance.submitAddUser();
    const req = httpMock.expectOne('/api/account/test-ws/users');
    expect(req.request.body.email).toBe('new@test.com');
    req.flush({
      user: { id: 'u3', email: 'new@test.com', displayName: 'New User', workspaces: [] },
      temporaryPassword: 'abc123xyz',
      message: 'User created',
    });

    // The component reloads team data after creating — flush the reload
    httpMock.match('/api/workspaces/test-ws/settings/team').forEach((r) => r.flush({ members: [] }));

    await promise;
    fixture.detectChanges();
    expect(fixture.componentInstance.tempPassword()).toBe('abc123xyz');
    expect(fixture.componentInstance.showAddForm()).toBe(false);
  });

  it('should dismiss temp password', () => {
    const state = fixture.debugElement.injector.get(WorkspaceSettingsStateService);
    state.tempPassword.set('abc123');
    state.tempPasswordEmail.set('test@test.com');
    fixture.detectChanges();
    // Verify banner is shown
    expect(fixture.nativeElement.querySelector('.temp-password-banner')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.temp-password-code')?.textContent).toBe('abc123');

    fixture.componentInstance.dismissTempPassword();
    fixture.detectChanges();
    expect(fixture.componentInstance.tempPassword()).toBeNull();
    expect(fixture.nativeElement.querySelector('.temp-password-banner')).toBeNull();
  });

  it('should call update role API', async () => {
    const promise = fixture.componentInstance.updateMemberRole('u2', 'Editor');
    const req = httpMock.expectOne('/api/account/test-ws/users/u2/role');
    expect(req.request.body.role).toBe('Editor');
    req.flush({ message: 'ok' });
    httpMock.match('/api/workspaces/test-ws/settings/team').forEach((r) => r.flush({ members: [] }));
    await promise;
  });

  it('should call remove user API', async () => {
    const promise = fixture.componentInstance.removeMember('u2');
    const req = httpMock.expectOne('/api/account/test-ws/users/u2');
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'ok' });
    httpMock.match('/api/workspaces/test-ws/settings/team').forEach((r) => r.flush({ members: [] }));
    await promise;
  });

  it('should show add error in form', () => {
    fixture.componentInstance.openAddForm();
    fixture.componentInstance.addError.set('Some error');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.add-user-error')?.textContent).toContain('Some error');
  });

  it('should show loading state in add form', () => {
    fixture.componentInstance.openAddForm();
    fixture.componentInstance.addLoading.set(true);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.add-user-submit');
    expect(btn?.textContent?.trim()).toContain('Adding');
  });

  it('should not call APIs when not admin', async () => {
    const authService = TestBed.inject(AuthService);
    authService.currentUser.set({
      id: 'u2',
      email: 'maya@test.com',
      displayName: 'Maya',
      workspaces: [{ workspaceId: 'test-ws', role: 'Viewer' }],
    });
    fixture.detectChanges();

    await fixture.componentInstance.updateMemberRole('u1', 'Editor');
    await fixture.componentInstance.removeMember('u1');
    // No HTTP requests should be made
  });
});

describe('TabTeamComponent (null settings)', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TabTeamComponent>>;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [TabTeamComponent],
      providers: [
        WorkspaceSettingsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TabTeamComponent);
    fixture.detectChanges();
  });

  it('should render nothing when settings is null', () => {
    const el = fixture.nativeElement;
    expect(el.querySelector('.tab-card')).toBeNull();
    expect(el.textContent.trim()).toBe('');
  });

  it('should return empty members when settings is null', () => {
    expect(fixture.componentInstance.members).toEqual([]);
  });
});

describe('TabTeamComponent (non-admin)', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TabTeamComponent>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabTeamComponent],
      providers: [
        WorkspaceSettingsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    const state = TestBed.inject(WorkspaceSettingsStateService);
    state.workspaceId.set('test-ws');
    state.teamSettings.set(makeMockSettings());

    const authService = TestBed.inject(AuthService);
    authService.currentUser.set({
      id: 'u2',
      email: 'maya@hivecollective.io',
      displayName: 'Maya Rodriguez',
      workspaces: [{ workspaceId: 'test-ws', role: 'Viewer' }],
    });

    fixture = TestBed.createComponent(TabTeamComponent);
    fixture.detectChanges();
  });

  it('should not render Add User button for non-admins', () => {
    const btn = fixture.nativeElement.querySelector('.add-user-btn');
    expect(btn).toBeNull();
  });

  it('should not render remove buttons for non-admins', () => {
    const btns = fixture.nativeElement.querySelectorAll('.member-remove-btn');
    expect(btns.length).toBe(0);
  });

  it('should show role labels instead of dropdowns for non-admins', () => {
    const labels = fixture.nativeElement.querySelectorAll('.member-role-label');
    expect(labels.length).toBe(2);
    const dropdowns = fixture.nativeElement.querySelectorAll('app-dropdown');
    expect(dropdowns.length).toBe(0);
  });
});

describe('TabTeamComponent (reset password — visibility)', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TabTeamComponent>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabTeamComponent],
      providers: [
        WorkspaceSettingsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    const state = TestBed.inject(WorkspaceSettingsStateService);
    state.workspaceId.set('test-ws');
    state.teamSettings.set(makeMockSettingsWithBootstrap());

    const authService = TestBed.inject(AuthService);
    setupAuthAsAdmin(authService);

    fixture = TestBed.createComponent(TabTeamComponent);
    fixture.detectChanges();
  });

  it('renders reset button on a non-self, non-bootstrap admin row with aria-label', () => {
    const btn = fixture.nativeElement.querySelector(
      '.member-reset-btn[data-member-id="u2"]',
    );
    expect(btn).toBeTruthy();
    expect(btn?.getAttribute('aria-label')).toBe('Reset password');
  });

  it('hides reset button on the admin\'s own row', () => {
    const btn = fixture.nativeElement.querySelector(
      '.member-reset-btn[data-member-id="u1"]',
    );
    expect(btn).toBeNull();
  });

  it('hides reset button on the bootstrap admin row', () => {
    const btn = fixture.nativeElement.querySelector(
      '.member-reset-btn[data-member-id="u-bootstrap"]',
    );
    expect(btn).toBeNull();
  });

  it('hides reset button for non-admin viewers', () => {
    const authService = TestBed.inject(AuthService);
    authService.currentUser.set({
      id: 'u2',
      email: 'maya@hivecollective.io',
      displayName: 'Maya',
      workspaces: [{ workspaceId: 'test-ws', role: 'Viewer' }],
    });
    fixture.detectChanges();
    const btns = fixture.nativeElement.querySelectorAll('.member-reset-btn');
    expect(btns.length).toBe(0);
  });
});

describe('TabTeamComponent (reset password — dialog flow)', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TabTeamComponent>>;
  let httpMock: import('@angular/common/http/testing').HttpTestingController;

  beforeEach(async () => {
    const { HttpTestingController } = await import('@angular/common/http/testing');
    TestBed.resetTestingModule();

    await TestBed.configureTestingModule({
      imports: [TabTeamComponent],
      providers: [
        WorkspaceSettingsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    const state = TestBed.inject(WorkspaceSettingsStateService);
    state.workspaceId.set('test-ws');
    state.teamSettings.set(makeMockSettings());

    const authService = TestBed.inject(AuthService);
    setupAuthAsAdmin(authService);

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(TabTeamComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.match(() => true).forEach((r) => r.flush({}));
  });

  it('opens dialog with the target email when reset button is clicked', () => {
    const target = fixture.componentInstance.members.find((m) => m.id === 'u2');
    fixture.componentInstance.openResetDialog(target!);
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('.confirm-modal');
    expect(dialog).toBeTruthy();
    expect(dialog?.textContent).toContain('maya@hivecollective.io');
    expect(fixture.componentInstance.resetTarget()?.id).toBe('u2');
  });

  it('does not open dialog when canShowResetButton returns false (self-row)', () => {
    const self = fixture.componentInstance.members.find((m) => m.id === 'u1');
    fixture.componentInstance.openResetDialog(self!);
    fixture.detectChanges();
    expect(fixture.componentInstance.resetTarget()).toBeNull();
    expect(fixture.nativeElement.querySelector('.confirm-modal')).toBeNull();
  });

  it('cancel closes the dialog without firing an HTTP request', () => {
    const target = fixture.componentInstance.members.find((m) => m.id === 'u2');
    fixture.componentInstance.openResetDialog(target!);
    fixture.detectChanges();
    fixture.componentInstance.cancelResetDialog();
    fixture.detectChanges();
    expect(fixture.componentInstance.resetTarget()).toBeNull();
    expect(fixture.nativeElement.querySelector('.confirm-modal')).toBeNull();
    httpMock.expectNone(
      '/api/account/test-ws/users/u2/password-reset',
    );
  });

  it('confirm posts to the reset endpoint and populates the temp-password banner', async () => {
    const target = fixture.componentInstance.members.find((m) => m.id === 'u2');
    fixture.componentInstance.openResetDialog(target!);
    fixture.detectChanges();

    const promise = fixture.componentInstance.confirmResetPassword();
    const req = httpMock.expectOne(
      '/api/account/test-ws/users/u2/password-reset',
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({
      user: { id: 'u2', email: 'maya@hivecollective.io', displayName: 'Maya', workspaces: [] },
      temporaryPassword: 'newPassword123',
      message: 'Password reset',
    });
    await promise;
    fixture.detectChanges();

    expect(fixture.componentInstance.tempPassword()).toBe('newPassword123');
    expect(fixture.componentInstance.tempPasswordEmail()).toBe(
      'maya@hivecollective.io',
    );
    expect(fixture.componentInstance.resetTarget()).toBeNull();
    const banner = fixture.nativeElement.querySelector('.temp-password-banner');
    expect(banner).toBeTruthy();
    const code = fixture.nativeElement.querySelector('.temp-password-code');
    expect(code?.textContent).toBe('newPassword123');
  });

  it('keeps the dialog open and shows the server error inline on failure', async () => {
    const target = fixture.componentInstance.members.find((m) => m.id === 'u2');
    fixture.componentInstance.openResetDialog(target!);
    fixture.detectChanges();

    const promise = fixture.componentInstance.confirmResetPassword();
    const req = httpMock.expectOne(
      '/api/account/test-ws/users/u2/password-reset',
    );
    req.flush(
      { message: "Cannot reset bootstrap admin's password" },
      { status: 400, statusText: 'Bad Request' },
    );
    await promise;
    fixture.detectChanges();

    expect(fixture.componentInstance.resetTarget()).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.confirm-modal')).toBeTruthy();
    const err = fixture.nativeElement.querySelector('.confirm-modal-error');
    expect(err?.textContent).toContain("Cannot reset bootstrap admin's password");
    expect(fixture.componentInstance.tempPassword()).toBeNull();
    expect(fixture.nativeElement.querySelector('.temp-password-banner')).toBeNull();
  });

  it('confirmResetPassword no-ops when no target is set', async () => {
    fixture.componentInstance.resetTarget.set(null);
    await fixture.componentInstance.confirmResetPassword();
    httpMock.expectNone(
      () => true,
    );
    expect(fixture.componentInstance.resetLoading()).toBe(false);
  });

  it('cancelResetDialog is a no-op while a reset is in flight', () => {
    const target = fixture.componentInstance.members.find((m) => m.id === 'u2');
    fixture.componentInstance.openResetDialog(target!);
    fixture.componentInstance.resetLoading.set(true);
    fixture.componentInstance.cancelResetDialog();
    expect(fixture.componentInstance.resetTarget()).not.toBeNull();
  });

  it('falls back to "Failed to reset password" when the server returns no message', async () => {
    const target = fixture.componentInstance.members.find((m) => m.id === 'u2');
    fixture.componentInstance.openResetDialog(target!);
    fixture.detectChanges();

    const promise = fixture.componentInstance.confirmResetPassword();
    const req = httpMock.expectOne(
      '/api/account/test-ws/users/u2/password-reset',
    );
    req.flush(null, { status: 500, statusText: 'Server Error' });
    await promise;
    fixture.detectChanges();
    expect(fixture.componentInstance.resetError()).toBe('Failed to reset password');
  });

  it('confirmResetPassword no-ops when already loading', async () => {
    fixture.componentInstance.resetTarget.set({
      id: 'u2',
      name: 'Maya',
      email: 'm@x.co',
      role: 'Viewer',
      status: 'active',
    });
    fixture.componentInstance.resetLoading.set(true);
    await fixture.componentInstance.confirmResetPassword();
    httpMock.expectNone('/api/account/test-ws/users/u2/password-reset');
  });

  it('cancelResetDialog without an open target is a no-op', () => {
    fixture.componentInstance.resetTarget.set(null);
    fixture.componentInstance.cancelResetDialog();
    expect(fixture.componentInstance.resetTarget()).toBeNull();
  });
});

describe('TabTeamComponent (focus trap + helpers)', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TabTeamComponent>>;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [TabTeamComponent],
      providers: [
        WorkspaceSettingsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    const state = TestBed.inject(WorkspaceSettingsStateService);
    state.workspaceId.set('test-ws');
    state.teamSettings.set(makeMockSettings());

    const authService = TestBed.inject(AuthService);
    setupAuthAsAdmin(authService);

    fixture = TestBed.createComponent(TabTeamComponent);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.nativeElement.remove();
  });

  it('canShowResetButton returns false when there is no current user', () => {
    const authService = TestBed.inject(AuthService);
    authService.currentUser.set(null);
    fixture.detectChanges();
    const member = fixture.componentInstance.members[1];
    expect(fixture.componentInstance.canShowResetButton(member)).toBe(false);
  });

  it('trapDialogFocus is a no-op for non-Tab keys', () => {
    fixture.componentInstance.openResetDialog(
      fixture.componentInstance.members[1],
    );
    fixture.detectChanges();
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    const preventSpy = vi.spyOn(event, 'preventDefault');
    fixture.componentInstance.trapDialogFocus(event);
    expect(preventSpy).not.toHaveBeenCalled();
  });

  it('trapDialogFocus is a no-op when the dialog is not rendered', () => {
    const event = new KeyboardEvent('keydown', { key: 'Tab' });
    const preventSpy = vi.spyOn(event, 'preventDefault');
    fixture.componentInstance.trapDialogFocus(event);
    expect(preventSpy).not.toHaveBeenCalled();
  });

  it('trapDialogFocus moves focus to confirm when Tab is pressed from cancel', async () => {
    fixture.componentInstance.openResetDialog(
      fixture.componentInstance.members[1],
    );
    fixture.detectChanges();
    await fixture.whenStable();
    const cancel = fixture.nativeElement.querySelector(
      '.confirm-modal-cancel',
    ) as HTMLButtonElement;
    const confirm = fixture.nativeElement.querySelector(
      '.confirm-modal-confirm',
    ) as HTMLButtonElement;
    cancel.focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab' });
    fixture.componentInstance.trapDialogFocus(event);
    expect(document.activeElement).toBe(confirm);
  });

  it('trapDialogFocus moves focus to cancel when Shift-Tab is pressed from confirm', async () => {
    fixture.componentInstance.openResetDialog(
      fixture.componentInstance.members[1],
    );
    fixture.detectChanges();
    await fixture.whenStable();
    const cancel = fixture.nativeElement.querySelector(
      '.confirm-modal-cancel',
    ) as HTMLButtonElement;
    const confirm = fixture.nativeElement.querySelector(
      '.confirm-modal-confirm',
    ) as HTMLButtonElement;
    confirm.focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true });
    fixture.componentInstance.trapDialogFocus(event);
    expect(document.activeElement).toBe(cancel);
  });

  it('trapDialogFocus from neither button defaults to confirm on Tab and cancel on Shift-Tab', async () => {
    fixture.componentInstance.openResetDialog(
      fixture.componentInstance.members[1],
    );
    fixture.detectChanges();
    await fixture.whenStable();
    const cancel = fixture.nativeElement.querySelector(
      '.confirm-modal-cancel',
    ) as HTMLButtonElement;
    const confirm = fixture.nativeElement.querySelector(
      '.confirm-modal-confirm',
    ) as HTMLButtonElement;
    document.body.focus();
    fixture.componentInstance.trapDialogFocus(
      new KeyboardEvent('keydown', { key: 'Tab' }),
    );
    expect(document.activeElement).toBe(confirm);
    document.body.focus();
    fixture.componentInstance.trapDialogFocus(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true }),
    );
    expect(document.activeElement).toBe(cancel);
  });
});

describe('TabTeamComponent (empty members)', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TabTeamComponent>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabTeamComponent],
      providers: [
        WorkspaceSettingsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    const state = TestBed.inject(WorkspaceSettingsStateService);
    state.workspaceId.set('test-ws');
    state.teamSettings.set({ members: [] });

    const authService = TestBed.inject(AuthService);
    setupAuthAsAdmin(authService);

    fixture = TestBed.createComponent(TabTeamComponent);
    fixture.detectChanges();
  });

  it('should render card with no member rows', () => {
    expect(fixture.nativeElement.querySelector('.tab-card')).toBeTruthy();
    const rows = fixture.nativeElement.querySelectorAll('.member-row');
    expect(rows.length).toBe(0);
  });

  it('should show empty state message', () => {
    const empty = fixture.nativeElement.querySelector('.empty-state');
    expect(empty).toBeTruthy();
  });

  it('should still render Add User button for admins', () => {
    const btn = fixture.nativeElement.querySelector('.add-user-btn');
    expect(btn).toBeTruthy();
  });
});
