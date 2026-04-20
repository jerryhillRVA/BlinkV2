import {
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-inline-edit',
  imports: [FormsModule],
  templateUrl: './inline-edit.component.html',
  styleUrl: './inline-edit.component.scss',
})
export class InlineEditComponent {
  private readonly destroyRef = inject(DestroyRef);

  @Input() value = '';
  @Input() multiline = false;
  @Input() placeholder = '';
  @Input() displayClass = '';
  @Input() inputClass = '';
  @Input() ariaLabel?: string;
  @Input({ transform: (v: unknown): boolean => v !== false && v != null })
  readOnly = false;

  @Output() valueChange = new EventEmitter<string>();

  @ViewChild('inputEl') private inputEl?: ElementRef<HTMLInputElement | HTMLTextAreaElement>;

  protected readonly isEditing = signal(false);
  protected readonly draft = signal('');

  protected startEdit(): void {
    if (this.readOnly) return;
    this.draft.set(this.value);
    this.isEditing.set(true);
    // Focus the input after Angular renders the @if branch.
    const id = setTimeout(() => {
      const el = this.inputEl?.nativeElement;
      if (el) {
        el.focus();
        if ('select' in el && typeof el.select === 'function') el.select();
      }
    }, 0);
    this.destroyRef.onDestroy(() => clearTimeout(id));
  }

  protected onDraftChange(v: string): void {
    this.draft.set(v);
  }

  protected commit(): void {
    const next = this.multiline ? this.draft() : this.draft().trim();
    const current = this.value;
    this.isEditing.set(false);
    if (next !== current) {
      this.valueChange.emit(next);
    }
  }

  protected cancel(): void {
    this.draft.set(this.value);
    this.isEditing.set(false);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancel();
      return;
    }
    if (event.key === 'Enter' && !this.multiline) {
      event.preventDefault();
      this.commit();
    }
  }
}
