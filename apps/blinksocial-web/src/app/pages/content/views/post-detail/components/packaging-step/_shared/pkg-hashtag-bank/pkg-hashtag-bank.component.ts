import { Component, computed, input, output, signal } from '@angular/core';
import { AiButtonComponent } from '../../../draft-step/_shared/ai-button/ai-button.component';

export interface HashtagBankGroup {
  name: string;
  tags: string[];
}

/**
 * Hashtags surface for the Packaging step. Distinct from the draft-step's
 * `<app-hashtag-input>` (which uses a bordered chip box and a coral
 * palette) — the packaging version matches the prototype's
 * PackagingStudio hashtag flow: flat gray-100 chips above a separate
 * "Add hashtag..." input + Add-button row, plus a "View Full Bank"
 * toggle that reveals categorized suggestion groups.
 *
 * The AI Suggest button lives inside the component header so callers
 * don't have to re-implement the loading-flag dance.
 */
@Component({
  selector: 'app-pkg-hashtag-bank',
  imports: [AiButtonComponent],
  templateUrl: './pkg-hashtag-bank.component.html',
  styleUrl: './pkg-hashtag-bank.component.scss',
})
export class PkgHashtagBankComponent {
  /* v8 ignore next 4 — V8's function-call-throws branches on input()/signal() declarations are unreachable (Angular class-field init time; ESM exports not spy-able) */
  readonly hashtags = input<string[]>([]);
  readonly disabled = input(false);
  readonly aiSuggesting = input(false);
  readonly groups = input<HashtagBankGroup[]>([]);

  readonly hashtagsChange = output<string[]>();
  readonly aiSuggest = output<void>();
  /* v8 ignore next 2 — V8's function-call-throws branches on input()/signal() declarations are unreachable (Angular class-field init time; ESM exports not spy-able) */
  protected readonly bankOpen = signal(false);
  protected readonly addInput = signal('');

  protected readonly isEmpty = computed(() => this.hashtags().length === 0);

  protected toggleBank(): void {
    this.bankOpen.update((v) => !v);
  }

  protected onAddInput(e: Event): void {
    this.addInput.set((e.target as HTMLInputElement).value ?? '');
  }

  protected onAddKeydown(e: KeyboardEvent): void {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    this.commitDraft();
  }

  protected onAddClick(): void {
    this.commitDraft();
  }

  protected onSuggestClick(): void {
    if (this.disabled() || this.aiSuggesting()) return;
    this.aiSuggest.emit();
  }

  protected onChipRemove(tag: string): void {
    if (this.disabled()) return;
    this.hashtagsChange.emit(this.hashtags().filter((t) => t !== tag));
  }

  protected onBankChipClick(tag: string): void {
    if (this.disabled()) return;
    if (this.hashtags().includes(tag)) return;
    this.hashtagsChange.emit([...this.hashtags(), tag]);
  }

  protected isInBank(tag: string): boolean {
    return this.hashtags().includes(tag);
  }

  private commitDraft(): void {
    const raw = this.addInput().trim();
    if (!raw || this.disabled()) return;
    const normalized = raw.startsWith('#') ? raw : `#${raw}`;
    if (this.hashtags().includes(normalized)) {
      this.addInput.set('');
      return;
    }
    this.hashtagsChange.emit([...this.hashtags(), normalized]);
    this.addInput.set('');
  }
}
