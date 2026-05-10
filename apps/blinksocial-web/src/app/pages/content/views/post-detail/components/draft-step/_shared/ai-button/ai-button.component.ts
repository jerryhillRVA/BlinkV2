import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IconComponent } from '../../../../../../../../shared/icons/icon.component';

/**
 * Purple-bordered "AI" button used everywhere in the production builder
 * for AI-driven actions (Hook Bank, AI Assist, AI Generate Shot List,
 * etc). The sparkle icon is purple; the label text is the surface text
 * color (matches the prototype).
 *
 * Loading state is announced via aria-busy and an optional loadingLabel.
 */
@Component({
  selector: 'app-ai-button',
  imports: [IconComponent],
  templateUrl: './ai-button.component.html',
  styleUrl: './ai-button.component.scss',
})
export class AiButtonComponent {
  @Input({ required: true }) label!: string;
  @Input() loadingLabel: string | null = null;
  @Input() loading = false;
  @Input() disabled = false;
  @Input() type: 'button' | 'submit' = 'button';
  @Input() variant: 'pill' | 'compact' = 'pill';

  @Output() activate = new EventEmitter<void>();

  protected onClick(): void {
    if (this.disabled || this.loading) return;
    this.activate.emit();
  }

  protected get displayLabel(): string {
    return this.loading && this.loadingLabel ? this.loadingLabel : this.label;
  }
}
