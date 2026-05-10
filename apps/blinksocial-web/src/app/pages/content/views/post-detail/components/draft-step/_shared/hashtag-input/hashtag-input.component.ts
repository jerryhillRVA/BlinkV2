import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

const AI_SUGGESTED_HASHTAGS = [
  '#yoga',
  '#wellness40',
  '#womenover40',
  '#fitnessjourney',
  '#mindfulness',
  '#healthylifestyle',
  '#selfcare',
  '#activeliving',
];

@Component({
  selector: 'app-hashtag-input',
  imports: [FormsModule],
  templateUrl: './hashtag-input.component.html',
  styleUrl: './hashtag-input.component.scss',
})
export class HashtagInputComponent {
  @Input() hashtags: string[] = [];
  @Input() disabled = false;

  @Output() hashtagsChange = new EventEmitter<string[]>();

  protected readonly draft = signal('');
  protected readonly bankOpen = signal(false);

  protected readonly suggestions = AI_SUGGESTED_HASHTAGS;

  protected onSubmit(): void {
    if (this.disabled) return;
    const v = this.draft().trim();
    if (!v) return;
    const normalized = v.startsWith('#') ? v : `#${v}`;
    if (this.hashtags.includes(normalized)) {
      this.draft.set('');
      return;
    }
    this.hashtagsChange.emit([...this.hashtags, normalized]);
    this.draft.set('');
  }

  protected onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.onSubmit();
      return;
    }
    if (e.key === 'Backspace' && this.draft() === '' && this.hashtags.length > 0) {
      e.preventDefault();
      const next = this.hashtags.slice(0, -1);
      this.hashtagsChange.emit(next);
    }
  }

  protected onRemove(tag: string): void {
    if (this.disabled) return;
    this.hashtagsChange.emit(this.hashtags.filter((t) => t !== tag));
  }

  protected onSuggested(tag: string): void {
    if (this.disabled) return;
    if (this.hashtags.includes(tag)) return;
    this.hashtagsChange.emit([...this.hashtags, tag]);
  }

  protected toggleBank(): void {
    this.bankOpen.update((v) => !v);
  }
}
