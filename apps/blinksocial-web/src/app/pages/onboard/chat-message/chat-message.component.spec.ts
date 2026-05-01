import { TestBed } from '@angular/core/testing';
import { ChatMessageComponent } from './chat-message.component';
import { Component } from '@angular/core';
import type { OnboardingMessageContract } from '@blinksocial/contracts';

@Component({
  imports: [ChatMessageComponent],
  template: `<app-chat-message [message]="message" />`,
})
class AssistantHostComponent {
  message: OnboardingMessageContract = {
    role: 'assistant',
    content: 'Hello! Let me help you onboard.',
    timestamp: new Date().toISOString(),
  };
}

@Component({
  imports: [ChatMessageComponent],
  template: `<app-chat-message [message]="message" />`,
})
class UserHostComponent {
  message: OnboardingMessageContract = {
    role: 'user',
    content: 'My business is a yoga studio.',
    timestamp: new Date().toISOString(),
  };
}

describe('ChatMessageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssistantHostComponent, UserHostComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AssistantHostComponent);
    fixture.detectChanges();
    const messageEl = fixture.nativeElement.querySelector('.chat-message');
    expect(messageEl).toBeTruthy();
  });

  it('should display assistant message with avatar', () => {
    const fixture = TestBed.createComponent(AssistantHostComponent);
    fixture.detectChanges();
    const avatar = fixture.nativeElement.querySelector('.avatar');
    expect(avatar).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.assistant')).toBeTruthy();
  });

  it('should display user message without avatar', () => {
    const fixture = TestBed.createComponent(UserHostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.user')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.avatar')).toBeFalsy();
  });

  it('should render message content', () => {
    const fixture = TestBed.createComponent(AssistantHostComponent);
    fixture.detectChanges();
    const content = fixture.nativeElement.querySelector('.content');
    expect(content.textContent).toContain('Hello! Let me help you onboard.');
  });

  it('renders attachment chips when message has attachments', async () => {
    @Component({
      imports: [ChatMessageComponent],
      template: `<app-chat-message [message]="message" />`,
    })
    class WithAttachmentsHost {
      message: OnboardingMessageContract = {
        id: 'm1',
        role: 'user',
        content: 'See attached',
        timestamp: new Date().toISOString(),
        attachments: [
          {
            id: 'a1',
            filename: 'brief.pdf',
            mimeType: 'application/pdf',
            sizeBytes: 1500,
            fileId: 'f1',
            kind: 'pdf',
          },
        ],
      };
    }
    await TestBed.resetTestingModule()
      .configureTestingModule({ imports: [WithAttachmentsHost] })
      .compileComponents();
    const fixture = TestBed.createComponent(WithAttachmentsHost);
    fixture.detectChanges();

    const chips = fixture.nativeElement.querySelector('[data-testid="message-attachments"]');
    expect(chips).toBeTruthy();
    expect(chips.textContent).toContain('brief.pdf');
    // Read-only chips should not render the remove button
    const removeBtn = chips.querySelector('.chip-remove');
    expect(removeBtn).toBeFalsy();
  });

  it('omits the attachments block when message has no attachments', () => {
    const fixture = TestBed.createComponent(UserHostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="message-attachments"]')).toBeFalsy();
  });

  // ---------------------------------------------------------------------------
  // Ticket #89 — markdown rendering on assistant messages
  // ---------------------------------------------------------------------------

  describe('markdown rendering (assistant role)', () => {
    /** Helper: build an assistant-host fixture with arbitrary content. */
    async function buildAssistantFixture(content: string) {
      @Component({
        imports: [ChatMessageComponent],
        template: `<app-chat-message [message]="message" />`,
      })
      class Host {
        message: OnboardingMessageContract = {
          role: 'assistant',
          content,
          timestamp: new Date().toISOString(),
        };
      }
      await TestBed.resetTestingModule()
        .configureTestingModule({ imports: [Host] })
        .compileComponents();
      const fixture = TestBed.createComponent(Host);
      fixture.detectChanges();
      return fixture;
    }

    it('renders bold, italics, ordered lists, and fenced code blocks', async () => {
      const md = [
        '**bold text** and *italic text*',
        '',
        '1. first',
        '2. second',
        '3. third',
        '',
        '```',
        'const x = 1;',
        '```',
      ].join('\n');
      const fixture = await buildAssistantFixture(md);
      const bubble = fixture.nativeElement.querySelector('.content.markdown') as HTMLElement;

      expect(bubble).toBeTruthy();
      expect(bubble.querySelector('strong')?.textContent).toBe('bold text');
      expect(bubble.querySelector('em')?.textContent).toBe('italic text');
      const ol = bubble.querySelector('ol');
      expect(ol).toBeTruthy();
      expect(ol?.querySelectorAll('li').length).toBe(3);
      expect(bubble.querySelector('pre code')?.textContent).toContain('const x = 1;');
      // No literal `**` characters left over
      expect(bubble.textContent).not.toContain('**');
      expect(bubble.textContent).not.toContain('```');
    });

    it('strips embedded <script> tags via Angular DomSanitizer', async () => {
      const fixture = await buildAssistantFixture(
        'Hello <script>window.__pwned = true</script> world',
      );
      const bubble = fixture.nativeElement.querySelector('.content.markdown') as HTMLElement;

      expect(bubble.querySelector('script')).toBeNull();
      expect((window as unknown as { __pwned?: boolean }).__pwned).toBeUndefined();
      // Visible text is preserved (modulo whitespace)
      expect(bubble.textContent).toContain('Hello');
      expect(bubble.textContent).toContain('world');
    });

    it('strips inline event handlers like onerror via DomSanitizer', async () => {
      await buildAssistantFixture(
        '<img src="x" onerror="window.__pwned2 = true">',
      );
      // No image with an active onerror handler should fire
      expect((window as unknown as { __pwned2?: boolean }).__pwned2).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Ticket #94 — assistant-error bubble (kind: 'error')
  // ---------------------------------------------------------------------------

  describe('error bubble (kind: "error")', () => {
    async function buildErrorFixture(content: string) {
      @Component({
        imports: [ChatMessageComponent],
        template: `<app-chat-message [message]="message" (retry)="onRetry()" />`,
      })
      class ErrorHost {
        message: OnboardingMessageContract = {
          role: 'assistant',
          content,
          timestamp: new Date().toISOString(),
          kind: 'error',
        };
        retryCount = 0;
        onRetry() {
          this.retryCount += 1;
        }
      }
      await TestBed.resetTestingModule()
        .configureTestingModule({ imports: [ErrorHost] })
        .compileComponents();
      return TestBed.createComponent(ErrorHost);
    }

    it('renders the error bubble with role=alert and a Try again button', async () => {
      const fixture = await buildErrorFixture(
        "We couldn't apply that revision — please try rephrasing or try again.",
      );
      fixture.detectChanges();

      const wrapper = fixture.nativeElement.querySelector(
        '[data-testid="chat-error-message"]',
      );
      expect(wrapper).toBeTruthy();
      expect(wrapper.classList.contains('error')).toBe(true);

      const bubble = wrapper.querySelector('.bubble');
      expect(bubble.getAttribute('role')).toBe('alert');

      const errorContent = wrapper.querySelector('.error-content');
      expect(errorContent.textContent).toContain("couldn't apply that revision");

      const retryBtn = wrapper.querySelector(
        '[data-testid="chat-error-retry"]',
      );
      expect(retryBtn).toBeTruthy();
      expect(retryBtn.textContent.trim()).toBe('Try again');
    });

    it('does not render markdown for error content (kept literal)', async () => {
      const fixture = await buildErrorFixture('**not bold** error text');
      fixture.detectChanges();
      const errorContent = fixture.nativeElement.querySelector('.error-content');
      expect(errorContent).toBeTruthy();
      // Asterisks remain literal — no markdown rendering for error bubbles
      expect(errorContent.textContent).toContain('**not bold**');
      expect(errorContent.querySelector('strong')).toBeNull();
    });

    it('emits retry when the Try again button is clicked', async () => {
      const fixture = await buildErrorFixture('Failed to generate blueprint');
      fixture.detectChanges();

      const host = fixture.componentInstance as { retryCount: number };
      expect(host.retryCount).toBe(0);

      const retryBtn = fixture.nativeElement.querySelector(
        '[data-testid="chat-error-retry"]',
      ) as HTMLButtonElement;
      retryBtn.click();
      fixture.detectChanges();

      expect(host.retryCount).toBe(1);
    });
  });

  describe('user-role messages stay as plain text', () => {
    it('does not render markdown in user messages', async () => {
      @Component({
        imports: [ChatMessageComponent],
        template: `<app-chat-message [message]="message" />`,
      })
      class UserMarkdownHost {
        message: OnboardingMessageContract = {
          role: 'user',
          content: '**not bold** and *not italic*',
          timestamp: new Date().toISOString(),
        };
      }
      await TestBed.resetTestingModule()
        .configureTestingModule({ imports: [UserMarkdownHost] })
        .compileComponents();
      const fixture = TestBed.createComponent(UserMarkdownHost);
      fixture.detectChanges();

      const bubble = fixture.nativeElement.querySelector('.content') as HTMLElement;
      expect(bubble).toBeTruthy();
      expect(bubble.classList.contains('markdown')).toBe(false);
      expect(bubble.querySelector('strong')).toBeNull();
      expect(bubble.querySelector('em')).toBeNull();
      // Asterisks remain literal
      expect(bubble.textContent).toContain('**not bold**');
      expect(bubble.textContent).toContain('*not italic*');
    });
  });
});
