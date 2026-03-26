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
