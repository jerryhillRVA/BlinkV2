import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { OnboardApiService } from './onboard-api.service';

describe('OnboardApiService', () => {
  let service: OnboardApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(OnboardApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create a session', () => {
    service.createSession({ workspaceName: 'My WS', businessName: 'Acme' }).subscribe((res) => {
      expect(res.sessionId).toBe('abc-123');
    });

    const req = httpMock.expectOne('/api/onboarding/sessions');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ workspaceName: 'My WS', businessName: 'Acme' });
    req.flush({ sessionId: 'abc-123', workspaceId: 'ws-1', status: 'active', initialMessage: 'Hi', sections: [] });
  });

  it('should send a message', () => {
    service.sendMessage('abc-123', 'We sell widgets').subscribe((res) => {
      expect(res.agentMessage).toBeTruthy();
    });

    const req = httpMock.expectOne('/api/onboarding/sessions/abc-123/messages');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ content: 'We sell widgets' });
    req.flush({ agentMessage: 'Great!', sections: [], currentSection: 'business', readyToGenerate: false });
  });

  it('should get session state', () => {
    service.getSession('abc-123').subscribe((res) => {
      expect(res.sessionId).toBe('abc-123');
    });

    const req = httpMock.expectOne('/api/onboarding/sessions/abc-123');
    expect(req.request.method).toBe('GET');
    req.flush({ sessionId: 'abc-123', status: 'active', messages: [], sections: [], currentSection: 'business', readyToGenerate: false, blueprint: null });
  });

  it('should create session with workspace name only', () => {
    service.createSession({ workspaceName: 'Test WS' }).subscribe((res) => {
      expect(res.sessionId).toBe('abc-456');
    });

    const req = httpMock.expectOne('/api/onboarding/sessions');
    expect(req.request.body).toEqual({ workspaceName: 'Test WS' });
    req.flush({ sessionId: 'abc-456', workspaceId: 'ws-2', status: 'active', initialMessage: 'Hi', sections: [] });
  });

  it('should generate blueprint', () => {
    service.generateBlueprint('abc-123').subscribe((res) => {
      expect(res.markdownDocument).toContain('Blueprint');
    });

    const req = httpMock.expectOne('/api/onboarding/sessions/abc-123/generate');
    expect(req.request.method).toBe('POST');
    req.flush({ blueprint: {}, markdownDocument: '# Blueprint' });
  });

  it('should create workspace from blueprint', () => {
    service.createWorkspaceFromBlueprint('abc-123').subscribe((res) => {
      expect(res.workspaceId).toBe('ws-1');
      expect(res.tenantId).toBe('tenant-1');
    });

    const req = httpMock.expectOne('/api/onboarding/sessions/abc-123/create-workspace');
    expect(req.request.method).toBe('POST');
    req.flush({ workspaceId: 'ws-1', tenantId: 'tenant-1', wizardData: {} });
  });

  it('should resume session by workspace', () => {
    service.resumeSession('tenant-abc').subscribe((res) => {
      expect(res.sessionId).toBe('resumed-1');
    });

    const req = httpMock.expectOne('/api/onboarding/sessions/by-workspace/tenant-abc');
    expect(req.request.method).toBe('GET');
    req.flush({
      sessionId: 'resumed-1',
      status: 'active',
      messages: [],
      sections: [],
      currentSection: 'business',
      readyToGenerate: false,
      blueprint: null,
    });
  });
});
