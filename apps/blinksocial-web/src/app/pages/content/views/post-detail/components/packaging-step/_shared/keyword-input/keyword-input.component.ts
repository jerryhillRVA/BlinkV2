import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

/**
 * Chip input for non-hash-prefixed terms (YouTube tags, X topic
 * keywords, per-platform SEO suggestions). Mirrors hashtag-input
 * keyboard semantics — Enter adds, Backspace-from-empty removes the
 * last chip, case-insensitive dedupe. AI suggestions render as
 * outlined chips below the input row.
 */
@Component({
  selector: 'app-keyword-input',
  imports: [FormsModule],
  templateUrl: './keyword-input.component.html',
  styleUrl: './keyword-input.component.scss',
})
export class KeywordInputComponent {
  /* v8 ignore next 4 — V8's function-call-throws branches on input()/signal() declarations are unreachable (Angular class-field init time; ESM exports not spy-able) */
  readonly keywords = input<string[]>([]);
  readonly placeholder = input('Add a keyword and press Enter');
  readonly aiSuggestions = input<string[]>([]);
  readonly disabled = input(false);

  readonly keywordsChange = output<string[]>();
  /* v8 ignore next 1 — V8's function-call-throws branches on input()/signal() declarations are unreachable (Angular class-field init time; ESM exports not spy-able) */
  protected readonly draft = signal('');

  protected onKeydown(e: KeyboardEvent): void {
    if (this.disabled()) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      this.commitDraft();
      return;
    }
    if (e.key === 'Backspace' && this.draft() === '') {
      const current = this.keywords();
      if (current.length === 0) return;
      e.preventDefault();
      this.keywordsChange.emit(current.slice(0, -1));
    }
  }

  protected commitDraft(): void {
    const trimmed = this.draft().trim();
    if (!trimmed) return;
    const current = this.keywords();
    const lower = trimmed.toLowerCase();
    if (current.some((k) => k.toLowerCase() === lower)) {
      this.draft.set('');
      return;
    }
    this.keywordsChange.emit([...current, trimmed]);
    this.draft.set('');
  }

  protected onRemove(kw: string): void {
    if (this.disabled()) return;
    this.keywordsChange.emit(this.keywords().filter((k) => k !== kw));
  }

  protected onSuggestion(kw: string): void {
    if (this.disabled()) return;
    const current = this.keywords();
    const lower = kw.toLowerCase();
    if (current.some((k) => k.toLowerCase() === lower)) return;
    this.keywordsChange.emit([...current, kw]);
  }
}
