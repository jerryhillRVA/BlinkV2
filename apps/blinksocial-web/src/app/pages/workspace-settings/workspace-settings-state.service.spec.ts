import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { WorkspaceSettingsStateService } from './workspace-settings-state.service';

describe('WorkspaceSettingsStateService', () => {
  let service: WorkspaceSettingsStateService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        WorkspaceSettingsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(WorkspaceSettingsStateService);
    httpMock = TestBed.inject(HttpTestingController);
    service.workspaceId.set('hive-collective');
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should default to general tab', () => {
    expect(service.activeTab()).toBe('general');
  });

  it('should have default signal values', () => {
    expect(service.workspaceId()).toBe('hive-collective');
    expect(service.loading()).toBe(false);
    expect(service.saving()).toBe(false);
    expect(service.generalSettings()).toBeNull();
    expect(service.platformSettings()).toBeNull();
    expect(service.brandVoiceSettings()).toBeNull();
    expect(service.skillSettings()).toBeNull();
    expect(service.teamSettings()).toBeNull();
    expect(service.notificationSettings()).toBeNull();
    expect(service.calendarSettings()).toBeNull();
    expect(service.securitySettings()).toBeNull();
  });

  it('should load general settings from API', () => {
    service.loadTab('general');
    expect(service.loading()).toBe(true);

    const req = httpMock.expectOne('/api/workspaces/hive-collective/settings/general');
    req.flush({ workspaceName: 'Hive Collective' });

    expect(service.loading()).toBe(false);
    expect(service.generalSettings()?.workspaceName).toBe('Hive Collective');
  });

  it('should load platform settings from API', () => {
    service.loadTab('platforms');
    const req = httpMock.expectOne('/api/workspaces/hive-collective/settings/platforms');
    req.flush({ globalRules: { defaultPlatform: 'instagram' }, platforms: [] });
    expect(service.platformSettings()?.globalRules.defaultPlatform).toBe('instagram');
  });

  it('should load brand-voice settings from API', () => {
    service.loadTab('brand-voice');
    const req = httpMock.expectOne('/api/workspaces/hive-collective/settings/brand-voice');
    req.flush({ brandVoiceDescription: 'Test voice' });
    expect(service.brandVoiceSettings()?.brandVoiceDescription).toBe('Test voice');
  });

  it('should load content tab using brand-voice API endpoint', () => {
    service.loadTab('content');
    const req = httpMock.expectOne('/api/workspaces/hive-collective/settings/brand-voice');
    req.flush({ brandVoiceDescription: 'Content voice' });
    expect(service.brandVoiceSettings()?.brandVoiceDescription).toBe('Content voice');
  });

  it('should load team settings from API', () => {
    service.loadTab('team');
    const req = httpMock.expectOne('/api/workspaces/hive-collective/settings/team');
    req.flush({ members: [] });
    expect(service.teamSettings()?.members).toEqual([]);
  });

  it('should map agents tab to skills API endpoint', () => {
    service.loadTab('agents');
    const req = httpMock.expectOne('/api/workspaces/hive-collective/settings/skills');
    req.flush({ skills: [] });
    expect(service.skillSettings()?.skills).toEqual([]);
  });

  it('should load notification settings from API', () => {
    service.loadTab('notifications');
    const req = httpMock.expectOne('/api/workspaces/hive-collective/settings/notifications');
    req.flush({ channels: { email: true }, triggers: {} });
    expect(service.notificationSettings()?.channels.email).toBe(true);
  });

  it('should load calendar settings from API', () => {
    service.loadTab('calendar');
    const req = httpMock.expectOne('/api/workspaces/hive-collective/settings/calendar');
    req.flush({ deadlineTemplates: {}, reminderSettings: {}, autoCreateOnPublish: true });
    expect(service.calendarSettings()?.autoCreateOnPublish).toBe(true);
  });

  it('should load security settings from API', () => {
    service.loadTab('security');
    const req = httpMock.expectOne('/api/workspaces/hive-collective/settings/security');
    req.flush({ twoFactorEnabled: true, activeSessions: [], apiKeys: [], loginHistory: [] });
    expect(service.securitySettings()?.twoFactorEnabled).toBe(true);
  });

  it('should save tab data via PUT', () => {
    service.generalSettings.set({ workspaceName: 'Updated' });
    service.saveTab('general');
    expect(service.saving()).toBe(true);

    const req = httpMock.expectOne('/api/workspaces/hive-collective/settings/general');
    expect(req.request.method).toBe('PUT');
    req.flush({ workspaceName: 'Updated' });

    expect(service.saving()).toBe(false);
  });

  it('should not save when data is null', () => {
    service.saveTab('general');
    httpMock.expectNone('/api/workspaces/hive-collective/settings/general');
  });

  it('should handle save error gracefully', () => {
    service.generalSettings.set({ workspaceName: 'Test' });
    service.saveTab('general');

    const req = httpMock.expectOne('/api/workspaces/hive-collective/settings/general');
    req.flush('Error', { status: 500, statusText: 'Server Error' });

    expect(service.saving()).toBe(false);
  });

  it('should track isDirty when data changes', () => {
    service.loadTab('general');
    const req = httpMock.expectOne('/api/workspaces/hive-collective/settings/general');
    req.flush({ workspaceName: 'Hive Collective' });

    expect(service.isDirty()).toBe(false);

    service.generalSettings.set({ workspaceName: 'Changed' });
    expect(service.isDirty()).toBe(true);
  });

  it('should return false for isDirty when no data loaded', () => {
    expect(service.isDirty()).toBe(false);
  });

  it('should return false for isDirty when current has data but original does not', () => {
    // Set data directly without loading (no original stored)
    service.generalSettings.set({ workspaceName: 'Direct set' });
    expect(service.isDirty()).toBe(false);
  });

  it('should handle load error gracefully', () => {
    service.loadTab('general');

    const req = httpMock.expectOne('/api/workspaces/hive-collective/settings/general');
    req.flush('Not found', { status: 404, statusText: 'Not Found' });

    expect(service.loading()).toBe(false);
    expect(service.generalSettings()).toBeNull();
  });

  it('should get current tab data for each tab type', () => {
    service.generalSettings.set({ workspaceName: 'Test' });
    expect(service.getCurrentTabData('general')).toEqual({ workspaceName: 'Test' });

    service.platformSettings.set({ globalRules: {} as never, platforms: [] });
    expect(service.getCurrentTabData('platforms')).toBeDefined();

    service.brandVoiceSettings.set({ brandVoiceDescription: 'Voice' });
    expect(service.getCurrentTabData('brand-voice')).toBeDefined();
    expect(service.getCurrentTabData('content')).toBeDefined();

    service.skillSettings.set({ skills: [] });
    expect(service.getCurrentTabData('agents')).toBeDefined();

    service.teamSettings.set({ members: [] });
    expect(service.getCurrentTabData('team')).toBeDefined();

    service.notificationSettings.set({ channels: {} as never, triggers: {} as never });
    expect(service.getCurrentTabData('notifications')).toBeDefined();

    service.calendarSettings.set({ deadlineTemplates: {}, reminderSettings: {} as never, autoCreateOnPublish: false });
    expect(service.getCurrentTabData('calendar')).toBeDefined();

    service.securitySettings.set({ twoFactorEnabled: false, activeSessions: [], apiKeys: [], loginHistory: [] });
    expect(service.getCurrentTabData('security')).toBeDefined();
  });

  it('should return null for getCurrentTabData when signals are in default state', () => {
    // Create a fresh service to test all defaults
    const freshService = TestBed.inject(WorkspaceSettingsStateService);
    expect(freshService.getCurrentTabData('general')).toBeNull();
    expect(freshService.getCurrentTabData('platforms')).toBeNull();
    expect(freshService.getCurrentTabData('brand-voice')).toBeNull();
    expect(freshService.getCurrentTabData('content')).toBeNull();
    expect(freshService.getCurrentTabData('agents')).toBeNull();
    expect(freshService.getCurrentTabData('team')).toBeNull();
    expect(freshService.getCurrentTabData('notifications')).toBeNull();
    expect(freshService.getCurrentTabData('calendar')).toBeNull();
    expect(freshService.getCurrentTabData('security')).toBeNull();
  });

  it('should save settings for each tab type', () => {
    service.platformSettings.set({ globalRules: {} as never, platforms: [] });
    service.saveTab('platforms');
    const platformReq = httpMock.expectOne('/api/workspaces/hive-collective/settings/platforms');
    platformReq.flush({ globalRules: {}, platforms: [] });
    expect(service.saving()).toBe(false);

    service.brandVoiceSettings.set({ brandVoiceDescription: 'Test' });
    service.saveTab('brand-voice');
    const bvReq = httpMock.expectOne('/api/workspaces/hive-collective/settings/brand-voice');
    bvReq.flush({ brandVoiceDescription: 'Test' });

    service.saveTab('content');
    const contentReq = httpMock.expectOne('/api/workspaces/hive-collective/settings/brand-voice');
    contentReq.flush({ brandVoiceDescription: 'Test' });

    service.skillSettings.set({ skills: [] });
    service.saveTab('agents');
    const agentsReq = httpMock.expectOne('/api/workspaces/hive-collective/settings/skills');
    agentsReq.flush({ skills: [] });

    service.teamSettings.set({ members: [] });
    service.saveTab('team');
    const teamReq = httpMock.expectOne('/api/workspaces/hive-collective/settings/team');
    teamReq.flush({ members: [] });

    service.notificationSettings.set({ channels: {} as never, triggers: {} as never });
    service.saveTab('notifications');
    const notifReq = httpMock.expectOne('/api/workspaces/hive-collective/settings/notifications');
    notifReq.flush({ channels: {}, triggers: {} });

    service.calendarSettings.set({ deadlineTemplates: {}, reminderSettings: {} as never, autoCreateOnPublish: false });
    service.saveTab('calendar');
    const calReq = httpMock.expectOne('/api/workspaces/hive-collective/settings/calendar');
    calReq.flush({ deadlineTemplates: {}, reminderSettings: {}, autoCreateOnPublish: false });

    service.securitySettings.set({ twoFactorEnabled: false, activeSessions: [], apiKeys: [], loginHistory: [] });
    service.saveTab('security');
    const secReq = httpMock.expectOne('/api/workspaces/hive-collective/settings/security');
    secReq.flush({ twoFactorEnabled: false, activeSessions: [], apiKeys: [], loginHistory: [] });
  });

  it('should not save any tab type when data is null', () => {
    service.saveTab('platforms');
    service.saveTab('brand-voice');
    service.saveTab('content');
    service.saveTab('agents');
    service.saveTab('team');
    service.saveTab('notifications');
    service.saveTab('calendar');
    service.saveTab('security');
    httpMock.expectNone(() => true);
  });

  it('should check isDirty across different tabs', () => {
    // Load and modify platforms tab
    service.loadTab('platforms');
    const platformReq = httpMock.expectOne('/api/workspaces/hive-collective/settings/platforms');
    platformReq.flush({ globalRules: { defaultPlatform: 'instagram' }, platforms: [] });

    expect(service.isDirty()).toBe(false);
    service.platformSettings.set({ globalRules: { defaultPlatform: 'youtube' as never, maxIdeasPerMonth: 30 }, platforms: [] });
    expect(service.isDirty()).toBe(true);

    // Switch to team tab and verify dirty tracks active tab
    service.loadTab('team');
    const teamReq = httpMock.expectOne('/api/workspaces/hive-collective/settings/team');
    teamReq.flush({ members: [] });
    expect(service.isDirty()).toBe(false);
  });
});
