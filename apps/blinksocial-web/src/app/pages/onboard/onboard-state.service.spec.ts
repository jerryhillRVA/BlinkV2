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

  it('sends multipart with files and replaces optimistic chips with persisted records', () => {
    service.sessionId.set('sess-1');
    const file = new File(['hi'], 'note.txt', { type: 'text/plain' });
    service.sendMessage('see attached', [file]);

    // Optimistic user message has a pending attachment chip
    const optimistic = service.messages().at(-1);
    expect(optimistic?.role).toBe('user');
    expect(optimistic?.attachments?.[0].filename).toBe('note.txt');
    expect(optimistic?.attachments?.[0].id.startsWith('pending-')).toBe(true);

    const req = httpMock.expectOne('/api/onboarding/sessions/sess-1/messages');
    expect(req.request.body).toBeInstanceOf(FormData);
    req.flush({
      agentMessage: 'Got it.',
      sections: [],
      currentSection: 'business',
      readyToGenerate: false,
      messageAttachments: [
        {
          id: 'srv-1',
          filename: 'note.txt',
          mimeType: 'text/plain',
          sizeBytes: 2,
          fileId: 'afs-1',
          kind: 'text',
        },
      ],
    });

    // Optimistic id replaced; assistant reply appended.
    const userMsg = service.messages().find((m) => m.role === 'user');
    expect(userMsg?.attachments?.[0].id).toBe('srv-1');
    expect(userMsg?.attachments?.[0].fileId).toBe('afs-1');
    expect(service.messages().at(-1)?.role).toBe('assistant');
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
      blueprint: {
        clientName: 'Test Co',
        strategicSummary: 'Summary',
        targetAudience: 'Test target audience summary spanning fifty plus characters here.',
      },
    });

    expect(service.blueprint()).toBeTruthy();
    expect(service.status()).toBe('complete');
  });

  it('renders Target Audience section when resuming a completed session with that field', () => {
    service.resumeSession('tenant-with-target');

    const req = httpMock.expectOne('/api/onboarding/sessions/by-workspace/tenant-with-target');
    req.flush({
      sessionId: 'resumed-3',
      status: 'complete',
      messages: [],
      sections: [],
      currentSection: 'business',
      readyToGenerate: true,
      blueprint: {
        clientName: 'Acme',
        strategicSummary: 'Strategy.',
        brandVoice: { positioningStatement: 'Pos.', contentMission: 'Mission.' },
        targetAudience: 'Independent fitness coaches building digital practices and seeking systems.',
        audienceProfiles: [{ name: 'Solo coach', demographics: '30-45' }],
      },
    });

    const md = service.markdownDocument() ?? '';
    const brandIdx = md.indexOf('## Brand & Voice');
    const targetIdx = md.indexOf('## Target Audience');
    const audienceIdx = md.indexOf('## Audience Profiles');
    expect(brandIdx).toBeGreaterThan(-1);
    expect(targetIdx).toBeGreaterThan(brandIdx);
    expect(audienceIdx).toBeGreaterThan(targetIdx);
    expect(md).toContain('Independent fitness coaches building digital practices');
  });

  it('omits Target Audience section when resuming a legacy blueprint without that field', () => {
    service.resumeSession('tenant-legacy');

    const req = httpMock.expectOne('/api/onboarding/sessions/by-workspace/tenant-legacy');
    req.flush({
      sessionId: 'resumed-legacy',
      status: 'complete',
      messages: [],
      sections: [],
      currentSection: 'business',
      readyToGenerate: true,
      blueprint: {
        clientName: 'Legacy Co',
        strategicSummary: 'Legacy summary',
        // targetAudience intentionally omitted (legacy session)
      },
    });

    const md = service.markdownDocument() ?? '';
    expect(md).not.toContain('## Target Audience');
    expect(md).toContain('## Strategic Summary');
  });

  // -------------------------------------------------------------------------
  // Post-generation revision flow (#70)
  // -------------------------------------------------------------------------

  describe('post-generation revision flow', () => {
    function flushFirstGeneration(strategicSummary = 'Initial summary') {
      service.sessionId.set('sess-1');
      service.generateBlueprint();
      const req = httpMock.expectOne('/api/onboarding/sessions/sess-1/generate');
      req.flush({
        blueprint: { clientName: 'Acme', strategicSummary },
        markdownDocument: '# Blueprint',
      });
    }

    it('appends a canned post-generation prompt and bumps postGenerationPromptCount on success', () => {
      const before = service.messages().length;
      flushFirstGeneration();
      const messages = service.messages();
      expect(messages.length).toBe(before + 1);
      expect(messages.at(-1)?.role).toBe('assistant');
      expect(messages.at(-1)?.content).toMatch(/Blueprint is ready/i);
      expect(service.postGenerationPromptCount()).toBe(1);
    });

    it('auto-triggers generateBlueprint when sendMessage response carries readyToRevise=true', () => {
      // Seed: status complete + prior blueprint
      service.sessionId.set('sess-1');
      service.status.set('complete');
      service.blueprint.set({ clientName: 'Acme', strategicSummary: 'Old' } as any);
      service.markdownDocument.set('# Old');

      service.sendMessage('yes go ahead');
      const messagesReq = httpMock.expectOne('/api/onboarding/sessions/sess-1/messages');
      messagesReq.flush({
        agentMessage: 'Regenerating now…',
        sections: [],
        currentSection: 'business',
        readyToGenerate: false,
        readyToRevise: true,
      });

      // The generate request should fire automatically.
      const genReq = httpMock.expectOne('/api/onboarding/sessions/sess-1/generate');
      genReq.flush({
        blueprint: { clientName: 'Acme', strategicSummary: 'New tighter summary' },
        markdownDocument: '# New',
      });

      expect(service.blueprint()?.strategicSummary).toBe('New tighter summary');
      expect(service.markdownDocument()).toContain('# New');
      // Canned prompt should have appeared after the revision regeneration too.
      expect(service.messages().at(-1)?.content).toMatch(/Blueprint is ready/i);
    });

    it('does NOT auto-trigger generateBlueprint when readyToRevise is missing or false', () => {
      service.sessionId.set('sess-1');
      service.status.set('complete');
      service.blueprint.set({ clientName: 'Acme', strategicSummary: 'Old' } as any);

      service.sendMessage('Make it punchier please');
      const req = httpMock.expectOne('/api/onboarding/sessions/sess-1/messages');
      req.flush({
        agentMessage: 'Plan: I will trim the summary…',
        sections: [],
        currentSection: 'business',
        readyToGenerate: false,
        // readyToRevise omitted — this is the plan turn, not the confirm turn
      });

      // No second request should fire.
      httpMock.expectNone('/api/onboarding/sessions/sess-1/generate');
      expect(service.status()).toBe('complete');
      expect(service.blueprint()?.strategicSummary).toBe('Old');
    });

    it('does NOT auto-trigger when readyToRevise=true arrives in active (discovery) status', () => {
      service.sessionId.set('sess-1');
      // status defaults to 'active'; no prior blueprint
      service.sendMessage('yes go ahead');
      const req = httpMock.expectOne('/api/onboarding/sessions/sess-1/messages');
      req.flush({
        agentMessage: 'ok',
        sections: [],
        currentSection: 'business',
        readyToGenerate: false,
        readyToRevise: true, // misbehaved/legacy server — must be ignored
      });
      httpMock.expectNone('/api/onboarding/sessions/sess-1/generate');
    });

    it('preserves prior blueprint and resets status to complete when revision regen fails', () => {
      // First, complete a generation.
      flushFirstGeneration('Original summary');
      expect(service.status()).toBe('complete');
      const priorBlueprint = service.blueprint();
      const priorMarkdown = service.markdownDocument();

      // Trigger another generateBlueprint (revision) and have it fail.
      service.generateBlueprint();
      const req = httpMock.expectOne('/api/onboarding/sessions/sess-1/generate');
      req.flush({ message: 'LLM exploded' }, { status: 500, statusText: 'Error' });

      // Status returns to complete (not active), blueprint and markdown preserved.
      expect(service.status()).toBe('complete');
      expect(service.blueprint()).toEqual(priorBlueprint);
      expect(service.markdownDocument()).toBe(priorMarkdown);
      expect(service.error()).toBeTruthy();
    });

    it('first-time generation failure still resets status to active (no prior blueprint to preserve)', () => {
      service.sessionId.set('sess-1');
      // No prior blueprint
      service.generateBlueprint();
      const req = httpMock.expectOne('/api/onboarding/sessions/sess-1/generate');
      req.flush({ message: 'boom' }, { status: 500, statusText: 'Error' });
      expect(service.status()).toBe('active');
    });

    it('does not duplicate the post-generation prompt when called twice in a row', () => {
      flushFirstGeneration('First');
      const countAfterFirst = service.messages().length;
      // Imagine an unexpected re-emission — the helper should be idempotent.
      (service as unknown as { appendPostGenerationPrompt: () => void })
        .appendPostGenerationPrompt();
      expect(service.messages().length).toBe(countAfterFirst);
      // Counter only bumped once.
      expect(service.postGenerationPromptCount()).toBe(1);
    });
  });
});
