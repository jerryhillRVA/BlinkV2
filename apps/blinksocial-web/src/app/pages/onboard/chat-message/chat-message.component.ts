import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { marked } from 'marked';
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

  /**
   * Markdown-rendered HTML for the assistant role. Bound via `[innerHTML]`
   * so Angular's `DomSanitizer` strips any embedded `<script>`, event
   * handlers, or `javascript:` URLs automatically — we deliberately do NOT
   * call `bypassSecurityTrustHtml` on this output because it originates
   * from the LLM and is therefore untrusted (ticket #89).
   *
   * On parse failure (very defensive — `marked` is robust), fall back to
   * the raw text so the user still sees their reply rather than a blank
   * bubble. Angular's interpolation in the user-role branch handles the
   * non-markdown path natively.
   */
  renderedContent = computed<string>(() => {
    const content = this.message().content ?? '';
    try {
      return marked.parse(content, {
        async: false,
        gfm: true,
        breaks: true,
      }) as string;
    } catch {
      return content;
    }
  });
}
