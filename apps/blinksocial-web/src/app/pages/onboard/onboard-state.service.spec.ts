import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { OnboardStateService } from './onboard-state.service';

describe('OnboardStateService', () => {
  let service: OnboardStateService;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [
        OnboardStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    service = TestBed.inject(OnboardStateService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    vi.useRealTimers();
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have initial state', () => {
    expect(service.sessionId()).toBeNull();
    expect(service.messages()).toEqual([]);
    expect(service.sections()).toEqual([]);
    expect(service.isLoading()).toBe(false);
    expect(service.readyToGenerate()).toBe(false);
    expect(service.blueprint()).toBeNull();
    expect(service.markdownDocument()).toBeNull();
    expect(service.status()).toBe('active');
    expect(service.error()).toBeNull();
  });

  it('should compute completedSections correctly', () => {
    service.sections.set([
      { id: 'business', name: 'Business', covered: true },
      { id: 'brand_voice', name: 'Brand', covered: true },
      { id: 'audience', name: 'Audience', covered: false },
    ]);
    expect(service.completedSections()).toBe(2);
    expect(service.totalSections()).toBe(3);
  });

  it('should start session successfully', () => {
    service.startSession('Acme Corp', 'Acme Corp');

    expect(service.isLoading()).toBe(true);

    const req = httpMock.expectOne('/api/onboarding/sessions');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ workspaceName: 'Acme Corp', businessName: 'Acme Corp' });

    req.flush({
      sessionId: 'sess-1',
      workspaceId: 'ws-1',
      status: 'active',
      initialMessage: 'Welcome to Blink!',
      sections: [
        { id: 'business', name: 'Business Overview', covered: false },
      ],
    });

    expect(service.isLoading()).toBe(false);
    expect(service.sessionId()).toBe('sess-1');
    expect(service.messages().length).toBe(1);
    expect(service.messages()[0].role).toBe('assistant');
    expect(service.messages()[0].content).toBe('Welcome to Blink!');
    expect(service.sections().length).toBe(1);
  });

  it('should start session with workspace name only', () => {
    service.startSession('My Workspace');

    const req = httpMock.expectOne('/api/onboarding/sessions');
    expect(req.request.body).toEqual({ workspaceName: 'My Workspace', businessName: undefined });
    req.flush({
      sessionId: 'sess-2',
      workspaceId: 'ws-2',
      status: 'active',
      initialMessage: 'Hello!',
      sections: [],
    });

    expect(service.sessionId()).toBe('sess-2');
  });

  it('should handle session creation error', () => {
    service.startSession('Test');

    const req = httpMock.expectOne('/api/onboarding/sessions');
    req.flush(
      { message: 'LLM not configured' },
      { status: 500, statusText: 'Internal Server Error' },
    );

    expect(service.isLoading()).toBe(false);
    expect(service.error()).toBeTruthy();
  });

  it('should send message successfully', () => {
    service.sessionId.set('sess-1');
    service.sendMessage('We sell widgets');

    expect(service.isLoading()).toBe(true);
    expect(service.messages().length).toBe(1);
    expect(service.messages()[0].role).toBe('user');
    expect(service.messages()[0].content).toBe('We sell widgets');

    const req = httpMock.expectOne('/api/onboarding/sessions/sess-1/messages');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ content: 'We sell widgets' });

    req.flush({
      agentMessage: 'Great, tell me more!',
      sections: [{ id: 'business', name: 'Business', covered: false }],
      currentSection: 'business',
      readyToGenerate: false,
    });

    expect(service.isLoading()).toBe(false);
    expect(service.messages().length).toBe(2);
    expect(service.messages()[1].role).toBe('assistant');
    expect(service.readyToGenerate()).toBe(false);
  });

  it('should not send message without session', () => {
    service.sendMessage('Hello');
    httpMock.expectNone('/api/onboarding/sessions');
    expect(service.messages()).toEqual([]);
  });

  it('should handle send message error', () => {
    service.sessionId.set('sess-1');
    service.sendMessage('test');

    const req = httpMock.expectOne('/api/onboarding/sessions/sess-1/messages');
    req.flush(
      { message: 'Session expired' },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(service.isLoading()).toBe(false);
    expect(service.error()).toBeTruthy();
  });

  it('should have initial progress state', () => {
    expect(service.generationProgress()).toBe(0);
    expect(service.generationStage()).toBe('');
  });

  it('should start progress simulation when generating', () => {
    service.sessionId.set('sess-1');
    service.generateBlueprint();

    expect(service.generationProgress()).toBeGreaterThan(0);
    expect(service.generationStage()).toBeTruthy();

    const req = httpMock.expectOne('/api/onboarding/sessions/sess-1/generate');
    req.flush({
      blueprint: { clientName: 'Acme', strategicSummary: 'Test' },
      markdownDocument: '# Blueprint\n\nContent here',
    });
  });

  it('should advance progress over time', () => {
    service.sessionId.set('sess-1');
    service.generateBlueprint();

    const initialProgress = service.generationProgress();
    vi.advanceTimersByTime(3000);
    expect(service.generationProgress()).toBeGreaterThan(initialProgress);

    const req = httpMock.expectOne('/api/onboarding/sessions/sess-1/generate');
    req.flush({
      blueprint: { clientName: 'Acme', strategicSummary: 'Test' },
      markdownDocument: '# Blueprint',
    });
  });

  it('should never exceed 95% before response arrives', () => {
    service.sessionId.set('sess-1');
    service.generateBlueprint();

    vi.advanceTimersByTime(120000);
    expect(service.generationProgress()).toBeLessThanOrEqual(95);

    const req = httpMock.expectOne('/api/onboarding/sessions/sess-1/generate');
    req.flush({
      blueprint: { clientName: 'Acme', strategicSummary: 'Test' },
      markdownDocument: '# Blueprint',
    });
  });

  it('should complete to 100% when response arrives', () => {
    service.sessionId.set('sess-1');
    service.generateBlueprint();

    const req = httpMock.expectOne('/api/onboarding/sessions/sess-1/generate');
    req.flush({
      blueprint: { clientName: 'Acme', strategicSummary: 'Test' },
      markdownDocument: '# Blueprint\n\nContent here',
    });

    expect(service.generationProgress()).toBe(100);
    expect(service.generationStage()).toBe('Complete!');
  });

  it('should generate blueprint successfully', () => {
    service.sessionId.set('sess-1');
    service.generateBlueprint();

    expect(service.isLoading()).toBe(true);
    expect(service.status()).toBe('generating');

    const req = httpMock.expectOne(
      '/api/onboarding/sessions/sess-1/generate',
    );
    expect(req.request.method).toBe('POST');

    req.flush({
      blueprint: { clientName: 'Acme', strategicSummary: 'Test' },
      markdownDocument: '# Blueprint\n\nContent here',
    });

    expect(service.isLoading()).toBe(false);
    expect(service.status()).toBe('complete');
    expect(service.blueprint()).toBeTruthy();
    expect(service.markdownDocument()).toContain('# Blueprint');
  });

  it('should not generate blueprint without session', () => {
    service.generateBlueprint();
    httpMock.expectNone('/api/onboarding/sessions');
  });

  it('should reset progress on error', () => {
    service.sessionId.set('sess-1');
    service.generateBlueprint();

    expect(service.generationProgress()).toBeGreaterThan(0);

    const req = httpMock.expectOne(
      '/api/onboarding/sessions/sess-1/generate',
    );
    req.flush(
      { message: 'Generation failed' },
      { status: 500, statusText: 'Error' },
    );

    expect(service.generationProgress()).toBe(0);
    expect(service.generationStage()).toBe('');
  });

  it('should handle blueprint generation error', () => {
    service.sessionId.set('sess-1');
    service.generateBlueprint();

    const req = httpMock.expectOne(
      '/api/onboarding/sessions/sess-1/generate',
    );
    req.flush(
      { message: 'Generation failed' },
      { status: 500, statusText: 'Error' },
    );

    expect(service.isLoading()).toBe(false);
    expect(service.status()).toBe('active');
    expect(service.error()).toBeTruthy();
  });

  it('should download blueprint as markdown', () => {
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL');
    const clickSpy = vi.fn();
    vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: clickSpy,
    } as unknown as HTMLAnchorElement);

    service.markdownDocument.set('# My Blueprint');
    service.blueprint.set({ clientName: 'Test Co' } as any);
    service.downloadBlueprint();

    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalled();
  });

  it('should not download when no markdown', () => {
    vi.restoreAllMocks();
    const spy = vi.spyOn(URL, 'createObjectURL');
    service.downloadBlueprint();
    expect(spy).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it('should have isCreatingWorkspace initially false', () => {
    expect(service.isCreatingWorkspace()).toBe(false);
  });

  it('should create workspace from blueprint successfully', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    service.sessionId.set('sess-1');
    service.createWorkspaceFromBlueprint();

    expect(service.isCreatingWorkspace()).toBe(true);

    const req = httpMock.expectOne('/api/onboarding/sessions/sess-1/create-workspace');
    expect(req.request.method).toBe('POST');
    req.flush({ workspaceId: 'ws-new', tenantId: 'tenant-new', wizardData: {} });

    expect(service.isCreatingWorkspace()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/new-workspace'], {
      queryParams: { resume: 'tenant-new' },
    });
  });

  it('should handle create workspace from blueprint error', () => {
    service.sessionId.set('sess-1');
    service.createWorkspaceFromBlueprint();

    const req = httpMock.expectOne('/api/onboarding/sessions/sess-1/create-workspace');
    req.flush(
      { message: 'No blueprint found' },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(service.isCreatingWorkspace()).toBe(false);
    expect(service.error()).toBeTruthy();
  });

  it('should not create workspace from blueprint without session', () => {
    service.createWorkspaceFromBlueprint();
    httpMock.expectNone('/api/onboarding/sessions');
  });

  it('should resume session successfully', () => {
    service.resumeSession('tenant-abc');

    expect(service.isLoading()).toBe(true);

    const req = httpMock.expectOne('/api/onboarding/sessions/by-workspace/tenant-abc');
    expect(req.request.method).toBe('GET');
    req.flush({
      sessionId: 'resumed-1',
      status: 'active',
      messages: [{ role: 'assistant', content: 'Hello', timestamp: '2026-01-01T00:00:00Z' }],
      sections: [{ id: 'business', name: 'Business', covered: true }],
      currentSection: 'audience',
      readyToGenerate: false,
      blueprint: null,
    });

    expect(service.isLoading()).toBe(false);
    expect(service.sessionId()).toBe('resumed-1');
    expect(service.messages().length).toBe(1);
    expect(service.sections().length).toBe(1);
    expect(service.currentSection()).toBe('audience');
  });

  it('should handle resume session error', () => {
    service.resumeSession('bad-tenant');

    const req = httpMock.expectOne('/api/onboarding/sessions/by-workspace/bad-tenant');
    req.flush(
      { message: 'Not found' },
      { status: 404, statusText: 'Not Found' },
    );

    expect(service.isLoading()).toBe(false);
    expect(service.error()).toBeTruthy();
  });

  it('should resume session with blueprint', () => {
    service.resumeSession('tenant-xyz');

    const req = httpMock.expectOne('/api/onboarding/sessions/by-workspace/tenant-xyz');
    req.flush({
      sessionId: 'resumed-2',
      status: 'complete',
      messages: [],
      sections: [],
      currentSection: 'business',
      readyToGenerate: true,
      blueprint: { clientName: 'Test Co', strategicSummary: 'Summary' },
    });

    expect(service.blueprint()).toBeTruthy();
    expect(service.status()).toBe('complete');
  });
});
