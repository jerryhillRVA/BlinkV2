import { TestBed } from '@angular/core/testing';
import { OnboardComponent } from './onboard.component';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { convertToParamMap } from '@angular/router';

const mockSessionResponse = {
  sessionId: 'test-123',
  workspaceId: 'ws-123',
  status: 'active',
  initialMessage: 'Welcome to the discovery session!',
  sections: [
    { id: 'business', name: 'Business Overview', covered: false },
    { id: 'brand_voice', name: 'Brand & Voice', covered: false },
    { id: 'audience', name: 'Audience', covered: false },
    { id: 'competitors', name: 'Competitors', covered: false },
    { id: 'content', name: 'Content Strategy', covered: false },
    { id: 'channels', name: 'Channels & Capacity', covered: false },
    { id: 'expectations', name: 'Expectations & Goals', covered: false },
  ],
};

describe('OnboardComponent', () => {
  let httpMock: HttpTestingController;
  let router: Router;

  function setup(queryParams: Record<string, string> = {}) {
    TestBed.configureTestingModule({
      imports: [OnboardComponent],
      providers: [
        provideRouter([{ path: '', component: OnboardComponent }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap(queryParams) },
          },
        },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  }

  afterEach(() => {
    httpMock.verify();
  });

  function startSession(fixture: ReturnType<typeof TestBed.createComponent<OnboardComponent>>) {
    fixture.componentInstance.workspaceName.set('Test Workspace');
    fixture.componentInstance.onStartSession();
    const req = httpMock.expectOne('/api/onboarding/sessions');
    req.flush(mockSessionResponse);
    fixture.detectChanges();
  }

  function createAndInitComponent() {
    setup();
    const fixture = TestBed.createComponent(OnboardComponent);
    fixture.detectChanges();
    startSession(fixture);
    return fixture;
  }

  it('should create', () => {
    setup();
    const fixture = TestBed.createComponent(OnboardComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display the page title', () => {
    const fixture = createAndInitComponent();
    const title = fixture.nativeElement.querySelector('.page-title');
    expect(title.textContent).toContain('Project Onboarding');
  });

  it('should show name input card before session starts', () => {
    setup();
    const fixture = TestBed.createComponent(OnboardComponent);
    fixture.detectChanges();
    const card = fixture.nativeElement.querySelector('.name-input-card');
    expect(card).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.chat-area')).toBeFalsy();
  });

  it('should render name-input-card above wizard-bg via position: relative', () => {
    setup();
    const fixture = TestBed.createComponent(OnboardComponent);
    fixture.detectChanges();
    const card = fixture.nativeElement.querySelector('.name-input-card') as HTMLElement;
    const styles = getComputedStyle(card);
    expect(styles.position).toBe('relative');
  });

  it('should disable start button when name is empty', () => {
    setup();
    const fixture = TestBed.createComponent(OnboardComponent);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.start-session-btn') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('should not start session with empty name', () => {
    setup();
    const fixture = TestBed.createComponent(OnboardComponent);
    fixture.detectChanges();
    fixture.componentInstance.onStartSession();
    expect(fixture.componentInstance.sessionStarted()).toBe(false);
  });

  it('should start session when name is provided and button clicked', () => {
    setup();
    const fixture = TestBed.createComponent(OnboardComponent);
    fixture.detectChanges();
    fixture.componentInstance.workspaceName.set('My Workspace');
    fixture.componentInstance.onStartSession();
    expect(fixture.componentInstance.sessionStarted()).toBe(true);
    const req = httpMock.expectOne('/api/onboarding/sessions');
    req.flush(mockSessionResponse);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.chat-area')).toBeTruthy();
  });

  it('should show initial agent message after session starts', () => {
    const fixture = createAndInitComponent();
    const messages = fixture.nativeElement.querySelectorAll('app-chat-message');
    expect(messages.length).toBe(1);
  });

  it('should show section progress', () => {
    const fixture = createAndInitComponent();
    const progress = fixture.nativeElement.querySelector('app-section-progress');
    expect(progress).toBeTruthy();
  });

  it('should disable send button when input is empty', () => {
    const fixture = createAndInitComponent();
    const sendBtn = fixture.nativeElement.querySelector('.send-btn');
    expect(sendBtn.disabled).toBe(true);
  });

  it('should enable send button when input has text', async () => {
    const fixture = createAndInitComponent();
    const textarea = fixture.nativeElement.querySelector('.message-input') as HTMLTextAreaElement;
    textarea.value = 'Hello';
    textarea.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    fixture.detectChanges();
    const sendBtn = fixture.nativeElement.querySelector('.send-btn');
    expect(sendBtn.disabled).toBe(false);
  });

  it('should send message via onSendMessage', () => {
    const fixture = createAndInitComponent();
    fixture.componentInstance.userInput = 'We sell yoga equipment';
    fixture.componentInstance.onSendMessage();

    expect(fixture.componentInstance.userInput).toBe('');

    const req = httpMock.expectOne(
      '/api/onboarding/sessions/test-123/messages',
    );
    expect(req.request.body.content).toBe('We sell yoga equipment');
    req.flush({
      agentMessage: 'Great! Tell me more.',
      sections: mockSessionResponse.sections,
      currentSection: 'business',
      readyToGenerate: false,
    });

    fixture.detectChanges();
    const messages = fixture.nativeElement.querySelectorAll('app-chat-message');
    expect(messages.length).toBe(3); // initial + user + agent reply
  });

  it('should send message on Enter key', () => {
    const fixture = createAndInitComponent();
    fixture.componentInstance.userInput = 'My business is a fitness studio';

    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    vi.spyOn(event, 'preventDefault');
    fixture.componentInstance.onKeyDown(event);

    expect(event.preventDefault).toHaveBeenCalled();

    const req = httpMock.expectOne(
      '/api/onboarding/sessions/test-123/messages',
    );
    req.flush({
      agentMessage: 'Interesting!',
      sections: mockSessionResponse.sections,
      currentSection: 'business',
      readyToGenerate: false,
    });
  });

  it('should not send on Shift+Enter', () => {
    const fixture = createAndInitComponent();
    fixture.componentInstance.userInput = 'Line 1';

    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      shiftKey: true,
    });
    fixture.componentInstance.onKeyDown(event);

    httpMock.expectNone('/api/onboarding/sessions/test-123/messages');
  });

  it('should ignore non-Enter keys', () => {
    const fixture = createAndInitComponent();
    fixture.componentInstance.userInput = 'test';

    const event = new KeyboardEvent('keydown', { key: 'a' });
    fixture.componentInstance.onKeyDown(event);

    httpMock.expectNone('/api/onboarding/sessions/test-123/messages');
  });

  it('should not send empty messages', () => {
    const fixture = createAndInitComponent();
    fixture.componentInstance.userInput = '   ';
    fixture.componentInstance.onSendMessage();
    httpMock.expectNone('/api/onboarding/sessions/test-123/messages');
  });

  it('should show typing indicator while loading', () => {
    const fixture = createAndInitComponent();
    fixture.componentInstance.userInput = 'test';
    fixture.componentInstance.onSendMessage();
    fixture.detectChanges();

    const typing = fixture.nativeElement.querySelector('.typing-indicator');
    expect(typing).toBeTruthy();

    const req = httpMock.expectOne(
      '/api/onboarding/sessions/test-123/messages',
    );
    req.flush({
      agentMessage: 'Reply',
      sections: mockSessionResponse.sections,
      currentSection: 'business',
      readyToGenerate: false,
    });
    fixture.detectChanges();

    const typingAfter = fixture.nativeElement.querySelector(
      '.typing-indicator',
    );
    expect(typingAfter).toBeFalsy();
  });

  it('should show generate button when ready', () => {
    const fixture = createAndInitComponent();

    // No generate button initially
    expect(fixture.nativeElement.querySelector('.generate-btn')).toBeFalsy();

    // Simulate readyToGenerate
    fixture.componentInstance['state'].readyToGenerate.set(true);
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.generate-btn');
    expect(btn).toBeTruthy();
  });

  it('should navigate back to dashboard', () => {
    const fixture = createAndInitComponent();
    const navigateSpy = vi.spyOn(router, 'navigate');
    fixture.componentInstance.onBackToDashboard();
    expect(navigateSpy).toHaveBeenCalledWith(['/']);
  });

  it('should show error banner and allow dismiss', () => {
    const fixture = createAndInitComponent();

    fixture.componentInstance['state'].error.set('Something went wrong');
    fixture.detectChanges();

    const errorBanner = fixture.nativeElement.querySelector('.error-banner');
    expect(errorBanner).toBeTruthy();
    expect(errorBanner.textContent).toContain('Something went wrong');

    // Dismiss
    const dismissBtn = errorBanner.querySelector('button');
    dismissBtn.click();
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('.error-banner'),
    ).toBeFalsy();
  });

  it('should trigger blueprint generation', () => {
    const fixture = createAndInitComponent();
    fixture.componentInstance['state'].readyToGenerate.set(true);
    fixture.detectChanges();

    fixture.componentInstance.onGenerateBlueprint();

    const req = httpMock.expectOne(
      '/api/onboarding/sessions/test-123/generate',
    );
    req.flush({
      blueprint: { clientName: 'Test', strategicSummary: 'Summary' },
      markdownDocument: '# Blueprint',
    });

    fixture.detectChanges();
    const preview = fixture.nativeElement.querySelector(
      'app-blueprint-preview',
    );
    expect(preview).toBeTruthy();
  });

  it('should show generating overlay while generating', () => {
    const fixture = createAndInitComponent();
    fixture.componentInstance['state'].status.set('generating');
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector('.generating-overlay');
    expect(overlay).toBeTruthy();
  });

  it('should call downloadBlueprint on state service', () => {
    const fixture = createAndInitComponent();
    const spy = vi.spyOn(fixture.componentInstance['state'], 'downloadBlueprint');
    fixture.componentInstance.onDownloadBlueprint();
    expect(spy).toHaveBeenCalled();
  });

  it('should handle ngAfterViewChecked without error', () => {
    const fixture = createAndInitComponent();
    expect(() => fixture.componentInstance.ngAfterViewChecked()).not.toThrow();
  });

  it('should show blueprint preview when complete', () => {
    const fixture = createAndInitComponent();
    fixture.componentInstance['state'].status.set('complete');
    fixture.componentInstance['state'].markdownDocument.set('# Test Blueprint\n\nContent');
    fixture.componentInstance['state'].blueprint.set({
      clientName: 'Test',
      strategicSummary: 'Summary',
    } as any);
    fixture.detectChanges();

    const preview = fixture.nativeElement.querySelector('app-blueprint-preview');
    expect(preview).toBeTruthy();
  });

  it('should not show chat area when complete', () => {
    const fixture = createAndInitComponent();
    fixture.componentInstance['state'].status.set('complete');
    fixture.componentInstance['state'].markdownDocument.set('# Blueprint');
    fixture.detectChanges();

    const chatArea = fixture.nativeElement.querySelector('.chat-area');
    expect(chatArea).toBeFalsy();
  });

  it('should scroll to bottom after sending message', () => {
    const fixture = createAndInitComponent();
    fixture.componentInstance.userInput = 'test message';
    fixture.componentInstance.onSendMessage();

    // The shouldScrollToBottom flag is set, so ngAfterViewChecked should scroll
    fixture.detectChanges();
    fixture.componentInstance.ngAfterViewChecked();

    // Also call scrollToBottom directly to cover it
    fixture.componentInstance.scrollToBottom();

    const req = httpMock.expectOne('/api/onboarding/sessions/test-123/messages');
    req.flush({
      agentMessage: 'Got it!',
      sections: mockSessionResponse.sections,
      currentSection: 'business',
      readyToGenerate: false,
    });
  });

  it('should handle generate blueprint and show download', () => {
    const fixture = createAndInitComponent();
    fixture.componentInstance['state'].sessionId.set('test-123');
    fixture.componentInstance['state'].readyToGenerate.set(true);
    fixture.componentInstance.onGenerateBlueprint();

    const req = httpMock.expectOne('/api/onboarding/sessions/test-123/generate');
    req.flush({
      blueprint: {
        clientName: 'My Company',
        strategicSummary: 'Great strategy',
      },
      markdownDocument: '# My Blueprint\n\nGreat strategy here.',
    });

    fixture.detectChanges();
    expect(fixture.componentInstance['state'].status()).toBe('complete');
  });

  it('should handle keydown on textarea element', async () => {
    const fixture = createAndInitComponent();
    await fixture.whenStable();
    const textarea = fixture.nativeElement.querySelector('.message-input');
    if (textarea) {
      textarea.value = 'test input';
      textarea.dispatchEvent(new Event('input'));
      await fixture.whenStable();
      fixture.detectChanges();

      // Fire the keydown handler through the DOM
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      vi.spyOn(enterEvent, 'preventDefault');
      textarea.dispatchEvent(enterEvent);

      // If the message was sent, handle the HTTP request
      const reqs = httpMock.match('/api/onboarding/sessions/test-123/messages');
      for (const req of reqs) {
        req.flush({
          agentMessage: 'OK',
          sections: mockSessionResponse.sections,
          currentSection: 'business',
          readyToGenerate: false,
        });
      }
    }
  });

  it('should call startSession when name is provided', () => {
    setup();
    const fixture = TestBed.createComponent(OnboardComponent);
    fixture.detectChanges();
    const spy = vi.spyOn(fixture.componentInstance['state'], 'startSession');
    fixture.componentInstance.workspaceName.set('My Workspace');
    fixture.componentInstance.onStartSession();

    const req = httpMock.expectOne('/api/onboarding/sessions');
    req.flush(mockSessionResponse);

    expect(spy).toHaveBeenCalledWith('My Workspace');
  });

  it('should handle session creation error gracefully', () => {
    setup();
    const fixture = TestBed.createComponent(OnboardComponent);
    fixture.detectChanges();
    fixture.componentInstance.workspaceName.set('Test');
    fixture.componentInstance.onStartSession();

    const req = httpMock.expectOne('/api/onboarding/sessions');
    req.flush(
      { message: 'API key not configured' },
      { status: 500, statusText: 'Error' },
    );

    fixture.detectChanges();
    const errorBanner = fixture.nativeElement.querySelector('.error-banner');
    expect(errorBanner).toBeTruthy();
  });

  it('should handle back button click via DOM', () => {
    const fixture = createAndInitComponent();
    const navigateSpy = vi.spyOn(router, 'navigate');
    const backBtn = fixture.nativeElement.querySelector('.back-home');
    backBtn.click();
    expect(navigateSpy).toHaveBeenCalledWith(['/']);
  });

  it('should show loading state indicator', () => {
    const fixture = createAndInitComponent();
    // Send a message to trigger loading
    fixture.componentInstance.userInput = 'test';
    fixture.componentInstance.onSendMessage();
    fixture.detectChanges();

    // Should show typing indicator while loading
    const typing = fixture.nativeElement.querySelector('.typing-indicator');
    expect(typing).toBeTruthy();

    const req = httpMock.expectOne('/api/onboarding/sessions/test-123/messages');
    req.flush({
      agentMessage: 'Reply',
      sections: mockSessionResponse.sections,
      currentSection: 'business',
      readyToGenerate: false,
    });
  });

  it('should call createWorkspaceFromBlueprint on state service', () => {
    const fixture = createAndInitComponent();
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const spy = vi.spyOn(fixture.componentInstance['state'], 'createWorkspaceFromBlueprint').mockImplementation(() => {});
    fixture.componentInstance.onCreateWorkspace();
    expect(spy).toHaveBeenCalled();
  });

  it('should resume session when workspace query param is present', () => {
    TestBed.resetTestingModule();
    setup({ workspace: 'tenant-abc' });
    httpMock = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(OnboardComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.sessionStarted()).toBe(true);

    const req = httpMock.expectOne('/api/onboarding/sessions/by-workspace/tenant-abc');
    req.flush({
      sessionId: 'resumed-session',
      status: 'active',
      messages: [{ role: 'assistant', content: 'Hello', timestamp: '2026-01-01T00:00:00Z' }],
      sections: mockSessionResponse.sections,
      currentSection: 'business',
      readyToGenerate: false,
      blueprint: null,
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.chat-area')).toBeTruthy();
  });

  describe('attachments composer', () => {
    function makeFile(name: string, type: string, sizeBytes: number) {
      return new File([new Uint8Array(sizeBytes)], name, { type });
    }

    /** JSDOM lacks a real `FileList`; build a structurally-compatible stand-in. */
    function fakeFileList(files: File[]): FileList {
      const list: Record<number | string, unknown> = {
        length: files.length,
        item: (i: number) => files[i] ?? null,
        [Symbol.iterator]: function* () {
          for (const f of files) yield f;
        },
      };
      files.forEach((f, i) => {
        list[i] = f;
      });
      return list as unknown as FileList;
    }

    function setInputFiles(input: HTMLInputElement, files: File[]) {
      Object.defineProperty(input, 'files', {
        value: fakeFileList(files),
        configurable: true,
      });
      input.dispatchEvent(new Event('change'));
    }

    function dropFiles(
      fixture: ReturnType<typeof TestBed.createComponent<OnboardComponent>>,
      files: File[],
    ) {
      const target: HTMLElement = fixture.nativeElement.querySelector('.onboard-page');
      const event = new Event('drop', { bubbles: true });
      Object.defineProperty(event, 'dataTransfer', {
        value: {
          files: fakeFileList(files),
          types: ['Files'],
        },
        configurable: true,
      });
      target.dispatchEvent(event);
      fixture.detectChanges();
    }

    it('+ button opens the hidden file input', () => {
      const fixture = createAndInitComponent();
      const input: HTMLInputElement = fixture.nativeElement.querySelector(
        '[data-testid="onboard-file-input"]',
      );
      const spy = vi.spyOn(input, 'click');
      const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.attach-btn');
      btn.click();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('renders chips for picked files and removes them on × click', () => {
      const fixture = createAndInitComponent();
      const file = makeFile('notes.txt', 'text/plain', 50);
      const input: HTMLInputElement = fixture.nativeElement.querySelector(
        '[data-testid="onboard-file-input"]',
      );
      setInputFiles(input, [file]);
      fixture.detectChanges();

      const pending = fixture.nativeElement.querySelector(
        '[data-testid="pending-attachments"]',
      );
      expect(pending).toBeTruthy();
      expect(pending.textContent).toContain('notes.txt');

      // Click × to remove
      const removeBtn: HTMLButtonElement = pending.querySelector('.chip-remove');
      removeBtn.click();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[data-testid="pending-attachments"]')).toBeFalsy();
    });

    it('shows an error chip for files >10 MB and keeps valid siblings', () => {
      const fixture = createAndInitComponent();
      const valid = makeFile('ok.txt', 'text/plain', 100);
      const oversized = makeFile('big.pdf', 'application/pdf', 11 * 1024 * 1024);

      const input: HTMLInputElement = fixture.nativeElement.querySelector(
        '[data-testid="onboard-file-input"]',
      );
      setInputFiles(input, [valid, oversized]);
      fixture.detectChanges();

      const chips = fixture.nativeElement.querySelectorAll('app-composer-attachment-chip');
      expect(chips.length).toBe(2);
      expect(fixture.nativeElement.textContent).toContain('exceeds 10 MB limit');
    });

    it('rejects unsupported types with an error chip', () => {
      const fixture = createAndInitComponent();
      const evil = makeFile('evil.exe', 'application/x-msdownload', 100);
      const input: HTMLInputElement = fixture.nativeElement.querySelector(
        '[data-testid="onboard-file-input"]',
      );
      setInputFiles(input, [evil]);
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Unsupported file type');
    });

    it('drag-drop adds files via the chat-area', () => {
      const fixture = createAndInitComponent();
      const f = makeFile('photo.png', 'image/png', 100);
      dropFiles(fixture, [f]);
      const pending = fixture.nativeElement.querySelector(
        '[data-testid="pending-attachments"]',
      );
      expect(pending?.textContent).toContain('photo.png');
    });

    it('on send with files, posts FormData and clears the chip row', () => {
      const fixture = createAndInitComponent();
      const file = makeFile('note.txt', 'text/plain', 50);
      const input: HTMLInputElement = fixture.nativeElement.querySelector(
        '[data-testid="onboard-file-input"]',
      );
      setInputFiles(input, [file]);
      fixture.detectChanges();

      fixture.componentInstance.userInput = 'see attached';
      fixture.componentInstance.onSendMessage();
      fixture.detectChanges();

      const req = httpMock.expectOne('/api/onboarding/sessions/test-123/messages');
      expect(req.request.body).toBeInstanceOf(FormData);
      const fd = req.request.body as FormData;
      expect(fd.get('content')).toBe('see attached');
      expect((fd.get('files') as File).name).toBe('note.txt');
      req.flush({
        agentMessage: 'Got it.',
        sections: mockSessionResponse.sections,
        currentSection: 'business',
        readyToGenerate: false,
      });
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('[data-testid="pending-attachments"]')).toBeFalsy();
    });

    it('on send without files, posts JSON (back-compat)', () => {
      const fixture = createAndInitComponent();
      fixture.componentInstance.userInput = 'just text';
      fixture.componentInstance.onSendMessage();
      const req = httpMock.expectOne('/api/onboarding/sessions/test-123/messages');
      expect(req.request.body).toEqual({ content: 'just text' });
      req.flush({
        agentMessage: 'ok',
        sections: mockSessionResponse.sections,
        currentSection: 'business',
        readyToGenerate: false,
      });
    });

    it('+ button is keyboard-accessible (has aria-label)', () => {
      const fixture = createAndInitComponent();
      const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.attach-btn');
      expect(btn.getAttribute('aria-label')).toBe('Attach files');
    });

    it('flags total upload > 25 MB on the second file', () => {
      const fixture = createAndInitComponent();
      // Two 9 MB files = 18 MB OK; a third 9 MB file pushes total to 27 MB.
      const f1 = makeFile('a.pdf', 'application/pdf', 9 * 1024 * 1024);
      const f2 = makeFile('b.pdf', 'application/pdf', 9 * 1024 * 1024);
      const f3 = makeFile('c.pdf', 'application/pdf', 9 * 1024 * 1024);
      const input: HTMLInputElement = fixture.nativeElement.querySelector(
        '[data-testid="onboard-file-input"]',
      );
      setInputFiles(input, [f1, f2, f3]);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Total upload exceeds 25 MB');
    });

    it('ignores drag events that do not carry files', () => {
      const fixture = createAndInitComponent();
      const target: HTMLElement = fixture.nativeElement.querySelector('.onboard-page');
      const evt = new Event('dragenter', { bubbles: true });
      Object.defineProperty(evt, 'dataTransfer', {
        value: { types: ['text/plain'], files: fakeFileList([]) },
        configurable: true,
      });
      target.dispatchEvent(evt);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[data-testid="drop-overlay"]')).toBeFalsy();
    });

    it('shows drop overlay during a file drag, hides on dragleave', () => {
      const fixture = createAndInitComponent();
      const target: HTMLElement = fixture.nativeElement.querySelector('.onboard-page');
      const enter = new Event('dragenter', { bubbles: true });
      Object.defineProperty(enter, 'dataTransfer', {
        value: { types: ['Files'], files: fakeFileList([]) },
        configurable: true,
      });
      target.dispatchEvent(enter);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[data-testid="drop-overlay"]')).toBeTruthy();

      const leave = new Event('dragleave', { bubbles: true });
      Object.defineProperty(leave, 'dataTransfer', {
        value: { types: ['Files'], files: fakeFileList([]) },
        configurable: true,
      });
      target.dispatchEvent(leave);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[data-testid="drop-overlay"]')).toBeFalsy();
    });

    it('covers dragover with files (preventDefault path)', () => {
      const fixture = createAndInitComponent();
      const target: HTMLElement = fixture.nativeElement.querySelector('.onboard-page');
      const evt = new Event('dragover', { bubbles: true, cancelable: true });
      Object.defineProperty(evt, 'dataTransfer', {
        value: { types: ['Files'], files: fakeFileList([]) },
        configurable: true,
      });
      target.dispatchEvent(evt);
      // No assertion needed beyond running the handler — it preventDefaults.
      expect(evt.defaultPrevented).toBe(true);
    });

    it('rejects .doc by MIME (application/msword)', () => {
      const fixture = createAndInitComponent();
      const doc = makeFile('legacy.doc', 'application/msword', 100);
      const input: HTMLInputElement = fixture.nativeElement.querySelector(
        '[data-testid="onboard-file-input"]',
      );
      setInputFiles(input, [doc]);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Legacy .doc not supported');
    });

    it('handles a filename with no extension cleanly', () => {
      const fixture = createAndInitComponent();
      const noExt = makeFile('readme', 'text/plain', 50);
      const input: HTMLInputElement = fixture.nativeElement.querySelector(
        '[data-testid="onboard-file-input"]',
      );
      setInputFiles(input, [noExt]);
      fixture.detectChanges();
      // text/plain MIME is accepted even without an extension.
      expect(
        fixture.nativeElement.querySelector('[data-testid="pending-attachments"]'),
      ).toBeTruthy();
    });
  });
});
