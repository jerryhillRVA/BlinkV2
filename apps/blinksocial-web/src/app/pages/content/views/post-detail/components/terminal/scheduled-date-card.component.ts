import { A11yModule } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { IconComponent } from '../../../../../../shared/icons/icon.component';

/**
 * #146: editable Scheduled Date sidebar card. Renders a formatted
 * `scheduledAt` plus a Pencil affordance; clicking opens a popover
 * with `<input type="datetime-local">` + Save / Cancel. ESC = cancel,
 * focus trap inside the popover, returns focus to the Pencil button
 * on close. Emits `(scheduledAtChange)` with a `datetime-local`
 * string on Save.
 */
@Component({
  selector: 'app-scheduled-date-card',
  imports: [A11yModule, IconComponent],
  templateUrl: './scheduled-date-card.component.html',
  styleUrl: './scheduled-date-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduledDateCardComponent {
  /* v8 ignore next 3 — V8's function-call-throws branches on input()/output() declarations are unreachable */
  readonly scheduledAt = input<string | null | undefined>(undefined);
  readonly disabled = input(false);
  readonly scheduledAtChange = output<string>();

  @ViewChild('triggerBtn') private triggerBtn?: ElementRef<HTMLButtonElement>;

  /* v8 ignore next 1 — V8's function-call-throws branches on signal() declarations are unreachable */
  protected readonly popoverOpen = signal(false);
  /* v8 ignore next 1 */
  protected readonly draftLocal = signal('');

  protected readonly formattedDate = computed<string>(() => {
    const iso = this.scheduledAt();
    if (!iso) return 'No date set';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return 'No date set';
    return d.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  });

  protected onOpen(): void {
    if (this.disabled()) return;
    this.draftLocal.set(toLocalInputValue(this.scheduledAt() ?? ''));
    this.popoverOpen.set(true);
  }

  protected onCancel(): void {
    this.popoverOpen.set(false);
    queueMicrotask(() => this.triggerBtn?.nativeElement.focus());
  }

  protected onInputChange(event: Event): void {
    this.draftLocal.set((event.target as HTMLInputElement).value);
  }

  protected onSave(): void {
    const value = this.draftLocal();
    this.popoverOpen.set(false);
    this.scheduledAtChange.emit(value);
    queueMicrotask(() => this.triggerBtn?.nativeElement.focus());
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.popoverOpen()) this.onCancel();
  }
}

/**
 * Convert an ISO timestamp to the `YYYY-MM-DDTHH:mm` shape that the
 * native `datetime-local` input expects. Treats the source ISO as UTC
 * and slices to local minutes — matches the store's
 * `isoToDatetimeLocal()` semantic.
 */
function toLocalInputValue(iso: string): string {
  if (!iso) return '';
  // Strip trailing seconds + Z to land on YYYY-MM-DDTHH:mm.
  return iso.slice(0, 16);
}
