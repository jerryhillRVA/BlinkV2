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
});
