import { Component, input } from '@angular/core';
import type { OnboardingMessageContract } from '@blinksocial/contracts';

@Component({
  selector: 'app-chat-message',
  templateUrl: './chat-message.component.html',
  styleUrl: './chat-message.component.scss',
})
export class ChatMessageComponent {
  message = input.required<OnboardingMessageContract>();
}
