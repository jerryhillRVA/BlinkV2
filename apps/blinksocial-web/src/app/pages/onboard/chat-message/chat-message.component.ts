import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { OnboardingMessageContract } from '@blinksocial/contracts';
import { ComposerAttachmentChipComponent } from '../composer-attachment-chip/composer-attachment-chip.component';

@Component({
  selector: 'app-chat-message',
  imports: [CommonModule, ComposerAttachmentChipComponent],
  templateUrl: './chat-message.component.html',
  styleUrl: './chat-message.component.scss',
})
export class ChatMessageComponent {
  message = input.required<OnboardingMessageContract>();
}
