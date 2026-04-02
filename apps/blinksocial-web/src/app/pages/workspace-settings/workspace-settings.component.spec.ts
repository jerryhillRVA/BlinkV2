import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { WorkspaceSettingsComponent } from './workspace-settings.component';
import { WorkspaceSettingsStateService } from './workspace-settings-state.service';
import { AuthService } from '../../core/auth/auth.service';

describe('WorkspaceSettingsComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<WorkspaceSettingsComponent>>;
  let component: WorkspaceSettingsComponent;
  let stateService: WorkspaceSettingsStateService;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkspaceSettingsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => 'hive-collective' } },
          },
        },
      ],
    }).compileComponents();

    const authService = TestBed.inject(AuthService);
    authService.currentUser.set({
      id: 'u1',
      email: 'blewis@jackreiley.com',
      displayName: 'Brett Lewis',
      workspaces: [{ workspaceId: 'hive-collective', role: 'Admin' }],
    });

    fixture = TestBed.createComponent(WorkspaceSettingsComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    stateService = fixture.debugElement.injector.get(WorkspaceSettingsStateService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/workspaces/hive-collective/settings/general');
    expect(component).toBeTruthy();
  });

  it('should render settings title', () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/workspaces/hive-collective/settings/general');
    const title = fixture.nativeElement.querySelector('.settings-title');
    expect(title?.textContent).toContain('Workspace Settings');
  });

  it('should render settings subtitle', () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/workspaces/hive-collective/settings/general');
    const subtitle = fixture.nativeElement.querySelector('.settings-subtitle');
    expect(subtitle?.textContent).toContain('Manage your Blink Social');
  });

  it('should render all 7 tab buttons', () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/workspaces/hive-collective/settings/general');
    const tabs = fixture.nativeElement.querySelectorAll('.tab-button');
    expect(tabs.length).toBe(7);
  });

  it('should render SVG icons in each tab button', () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/workspaces/hive-collective/settings/general');
    const icons = fixture.nativeElement.querySelectorAll('.tab-button .tab-icon');
    expect(icons.length).toBe(7);
  });

  it('should render blurred background image', () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/workspaces/hive-collective/settings/general');
    const bg = fixture.nativeElement.querySelector('.settings-bg');
    expect(bg).toBeTruthy();
    expect(bg?.querySelector('img')).toBeTruthy();
  });

  it('should show loading state while fetching', () => {
    fixture.detectChanges();
    const loading = fixture.nativeElement.querySelector('.loading');
    expect(loading?.textContent).toContain('Loading');
    httpMock.expectOne('/api/workspaces/hive-collective/settings/general');
  });

  it('should switch tabs on click', () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/workspaces/hive-collective/settings/general').flush({});
    fixture.detectChanges();

    const tabButtons = fixture.nativeElement.querySelectorAll('.tab-button');
    tabButtons[3].click(); // Team tab
    fixture.detectChanges();

    httpMock.expectOne('/api/workspaces/hive-collective/settings/team');
    expect(stateService.activeTab()).toBe('team');
  });

  it('should call save on save button click', () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/workspaces/hive-collective/settings/general').flush({
      workspaceName: 'Test',
    });
    fixture.detectChanges();

    const saveBtn = fixture.nativeElement.querySelector('.save-button');
    saveBtn.click();

    const saveReq = httpMock.expectOne('/api/workspaces/hive-collective/settings/general');
    expect(saveReq.request.method).toBe('PUT');
    saveReq.flush({ workspaceName: 'Test' });
  });

  it('should render workspace identity with name after data loads', () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/workspaces/hive-collective/settings/general').flush({
      workspaceName: 'Hive Collective',
    });
    fixture.detectChanges();

    const name = fixture.nativeElement.querySelector('.workspace-identity-name');
    expect(name?.textContent).toContain('Hive Collective');
    expect(name?.textContent).toContain('Active');
  });

  it('should render workspace identity sync text', () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/workspaces/hive-collective/settings/general').flush({
      workspaceName: 'Test',
    });
    fixture.detectChanges();

    const sync = fixture.nativeElement.querySelector('.workspace-identity-sync');
    expect(sync?.textContent).toContain('Last synced');
  });

  it('should render workspace identity sparkles icon', () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/workspaces/hive-collective/settings/general').flush({
      workspaceName: 'Test',
    });
    fixture.detectChanges();

    const icon = fixture.nativeElement.querySelector('.workspace-identity-icon svg');
    expect(icon).toBeTruthy();
  });

  it('should not render workspace identity before data loads', () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/workspaces/hive-collective/settings/general');

    const identity = fixture.nativeElement.querySelector('.workspace-identity');
    expect(identity).toBeFalsy();
  });

  it('should display correct save button label per tab', () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/workspaces/hive-collective/settings/general').flush({});
    fixture.detectChanges();

    const saveBtn = fixture.nativeElement.querySelector('.save-button');
    expect(saveBtn?.textContent?.trim()).toContain('Save Workspace Identity');
  });

  it('should render platforms tab content', () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/workspaces/hive-collective/settings/general').flush({});
    fixture.detectChanges();

    component.onTabChange('platforms');
    fixture.detectChanges();
    httpMock.expectOne('/api/workspaces/hive-collective/settings/platforms').flush({
      globalRules: { defaultPlatform: 'youtube', maxIdeasPerMonth: 30 },
      platforms: [],
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-tab-platforms')).toBeTruthy();
  });

  it('should render agents tab', () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/workspaces/hive-collective/settings/general').flush({});
    fixture.detectChanges();

    component.onTabChange('agents');
    fixture.detectChanges();
    httpMock.expectOne('/api/workspaces/hive-collective/settings/skills').flush({ skills: [] });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-tab-agents')).toBeTruthy();
  });

  it('should render notifications tab', () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/workspaces/hive-collective/settings/general').flush({});
    fixture.detectChanges();

    component.onTabChange('notifications');
    fixture.detectChanges();
    httpMock.expectOne('/api/workspaces/hive-collective/settings/notifications').flush({
      channels: { email: true, inApp: true, slack: false },
      triggers: { researchResults: true, contentPublished: true, teamMentions: true, qaReviewRequired: false, approachingDeadlines: true, weeklyDigest: false },
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-tab-notifications')).toBeTruthy();
  });

  it('should render calendar tab', () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/workspaces/hive-collective/settings/general').flush({});
    fixture.detectChanges();

    component.onTabChange('calendar');
    fixture.detectChanges();
    httpMock.expectOne('/api/workspaces/hive-collective/settings/calendar').flush({
      deadlineTemplates: {},
      reminderSettings: { milestone72h: true, milestone24h: true, milestoneOverdue: false, publish24h: true },
      autoCreateOnPublish: true,
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-tab-calendar')).toBeTruthy();
  });

  it('should render team tab', () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/workspaces/hive-collective/settings/general').flush({});
    fixture.detectChanges();

    component.onTabChange('team');
    fixture.detectChanges();
    httpMock.expectOne('/api/workspaces/hive-collective/settings/team').flush({ members: [] });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-tab-team')).toBeTruthy();
  });

  it('should render security tab', () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/workspaces/hive-collective/settings/general').flush({});
    fixture.detectChanges();

    component.onTabChange('security');
    fixture.detectChanges();
    httpMock.expectOne('/api/workspaces/hive-collective/settings/security').flush({
      twoFactorEnabled: false,
      activeSessions: [],
      apiKeys: [],
      loginHistory: [],
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-tab-security')).toBeTruthy();
  });
});
