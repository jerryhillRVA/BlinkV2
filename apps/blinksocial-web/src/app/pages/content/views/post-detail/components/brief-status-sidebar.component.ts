import { DatePipe } from '@angular/common';
import {
  Component,
  EventEmitter,
  Output,
  computed,
  input,
} from '@angular/core';
import type { BriefValidationIssue } from '../post-detail.types';

@Component({
  selector: 'app-brief-status-sidebar',
  imports: [DatePipe],
  templateUrl: './brief-status-sidebar.component.html',
  styleUrl: './brief-status-sidebar.component.scss',
})
export class BriefStatusSidebarComponent {
  readonly approved = input(false);
  readonly approvedAt = input<string | undefined>(undefined);
  readonly approvedBy = input<string | undefined>(undefined);
  readonly requiredDone = input.required<number>();
  readonly requiredTotal = input.required<number>();
  readonly errors = input<BriefValidationIssue[]>([]);
  readonly warnings = input<BriefValidationIssue[]>([]);
  readonly canApprove = input(false);

  @Output() approve = new EventEmitter<void>();
  @Output() unlock = new EventEmitter<void>();
  @Output() continueToBuilder = new EventEmitter<void>();

  protected readonly progressPercent = computed(() => {
    const total = this.requiredTotal();
    if (total <= 0) return 0;
    return Math.min(100, Math.round((this.requiredDone() / total) * 100));
  });

  protected readonly progressComplete = computed(
    () => this.requiredDone() >= this.requiredTotal(),
  );

  protected readonly continueLabel = computed(() =>
    this.approved() ? 'Continue to Builder' : 'Approve & Continue',
  );

  protected readonly continueDisabled = computed(() => !this.canApprove());

  protected onApproveToggle(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.approve.emit();
    } else {
      this.unlock.emit();
    }
  }

  protected onContinue(): void {
    if (!this.approved()) {
      this.approve.emit();
    }
    this.continueToBuilder.emit();
  }

  protected onUnlock(): void {
    this.unlock.emit();
  }
}
