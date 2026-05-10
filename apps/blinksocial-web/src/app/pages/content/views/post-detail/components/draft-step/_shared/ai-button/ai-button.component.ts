import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * Distinct purple-bordered "AI" button used everywhere in the production
 * builder for AI-driven actions (Hook Bank, AI Assist, AI Generate Shot
 * List, etc). Mirrors the prototype's <AIButton> component visually but
 * is implemented with our design tokens and standalone Angular conventions.
 *
 * Loading state is announced via aria-busy and an optional loadingLabel.
 */
@Component({
  selector: 'app-ai-button',
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
