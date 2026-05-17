import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { IconComponent } from '../../../../../../shared/icons/icon.component';

/**
 * #146: Live Post Link card on the Published detail screen.
 *
 * Two variants based on `[isExported]`:
 *  - Publish Now (`isExported=false`): URL is auto-set at finish time;
 *    rendered as plain text + external-link icon. Not editable.
 *  - Export Packet (`isExported=true`): URL starts empty; input is
 *    editable. Saves on blur OR Enter. First save also emits
 *    `(publishedAtAutoSet)` for the parent to stamp the timestamp.
 *
 * The parent (post-detail-published) wires `(urlChange)` to
 * `store.setLivePostUrl(url)`, which encapsulates the
 * publishedAt-auto-stamp logic itself; the `(publishedAtAutoSet)`
 * output here is purely informational so tests can observe it.
 */
@Component({
  selector: 'app-live-post-link-card',
  imports: [IconComponent],
  templateUrl: './live-post-link-card.component.html',
  styleUrl: './live-post-link-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LivePostLinkCardComponent {
  /* v8 ignore next 4 — V8's function-call-throws branches on input()/output() declarations are unreachable */
  readonly url = input<string | null | undefined>(undefined);
  readonly isExported = input(false);
  readonly publishedAt = input<string | null | undefined>(undefined);
  readonly urlChange = output<string>();
  readonly publishedAtAutoSet = output<void>();

  /* v8 ignore next 1 — V8's function-call-throws branches on signal() declarations are unreachable */
  protected readonly draftUrl = signal('');

  protected readonly editable = computed<boolean>(() => !!this.isExported());
  protected readonly resolvedUrl = computed<string>(() => this.url()?.trim() ?? '');

  protected onInput(event: Event): void {
    this.draftUrl.set((event.target as HTMLInputElement).value);
  }

  protected onFocus(event: FocusEvent): void {
    this.draftUrl.set((event.target as HTMLInputElement).value);
  }

  protected onBlur(event: FocusEvent): void {
    this.commit((event.target as HTMLInputElement).value);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      (event.target as HTMLInputElement).blur();
    }
  }

  private commit(value: string): void {
    const trimmed = value.trim();
    const previous = this.resolvedUrl();
    if (trimmed === previous) return;                  // no-op
    this.urlChange.emit(trimmed);
    if (this.isExported() && !this.publishedAt() && trimmed) {
      this.publishedAtAutoSet.emit();
    }
  }
}
