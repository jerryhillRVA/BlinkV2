import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { OnboardStateService } from './onboard-state.service';

describe('OnboardStateService', () => {
  let service: OnboardStateService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OnboardStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(OnboardStateService);
    httpMock = TestBed.inject(HttpTestingController);
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
    service.startSession('Acme Corp');

    expect(service.isLoading()).toBe(true);

    const req = httpMock.expectOne('/api/onboarding/sessions');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ businessName: 'Acme Corp' });

    req.flush({
      sessionId: 'sess-1',
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

  it('should start session without business name', () => {
    service.startSession();

    const req = httpMock.expectOne('/api/onboarding/sessions');
    expect(req.request.body).toEqual({});
    req.flush({
      sessionId: 'sess-2',
      status: 'active',
      initialMessage: 'Hello!',
      sections: [],
    });

    expect(service.sessionId()).toBe('sess-2');
  });

  it('should handle session creation error', () => {
    service.startSession();

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
});
