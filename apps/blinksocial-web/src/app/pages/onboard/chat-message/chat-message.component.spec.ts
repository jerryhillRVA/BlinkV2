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
});
