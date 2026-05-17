import { A11yModule } from '@angular/cdk/a11y';
import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  PLATFORM_ID,
  ViewChild,
  effect,
  inject,
  input,
  output,
} from '@angular/core';

export type ConfirmDialogTone = 'primary' | 'destructive';

/**
 * #140: Generic confirmation dialog. Used for the Export Packet confirm
 * in Approve & Schedule; designed to be reused by #146's Archive flow.
 *
 * Behavior:
 *  - `[open]=true` mounts the backdrop + dialog and traps focus.
 *  - ESC and backdrop click both emit `(cancel)`.
 *  - Initial focus lands on the confirm button (matches the spec's
 *    "initial focus on Download" requirement).
 *  - When `[open]` flips from true → false, the host that owned the
 *    trigger button is responsible for returning focus; this component
 *    fires `(cancel)`/`(confirm)` and unmounts.
 */
@Component({
  selector: 'app-confirm-dialog',
  imports: [A11yModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  /* v8 ignore next 7 — V8's function-call-throws branches on input()/output() declarations are unreachable (Angular class-field init time; ESM exports not spy-able) */
  readonly open = input(false);
  readonly title = input.required<string>();
  readonly body = input<string>('');
  readonly confirmLabel = input<string>('Confirm');
  readonly cancelLabel = input<string>('Cancel');
  readonly tone = input<ConfirmDialogTone>('primary');
  readonly confirm = output<void>();
  readonly cancelled = output<void>();

  @ViewChild('confirmBtn') private confirmBtn?: ElementRef<HTMLButtonElement>;

  private readonly platformId = inject(PLATFORM_ID);

  constructor() {
    effect(() => {
      // Move focus to the confirm button on open. Wait one microtask so
      // the @ViewChild ref is populated.
      if (!this.open()) return;
      if (!isPlatformBrowser(this.platformId)) return;
      queueMicrotask(() => this.confirmBtn?.nativeElement.focus());
    });
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.open()) this.cancelled.emit();
  }

  protected onBackdropClick(event: MouseEvent): void {
    // Only fire cancel when the backdrop itself is the click target —
    // inner content clicks must NOT bubble through.
    if (event.target === event.currentTarget) {
      this.cancelled.emit();
    }
  }

  protected onConfirmClick(): void {
    this.confirm.emit();
  }

  protected onCancelClick(): void {
    this.cancelled.emit();
  }
}
