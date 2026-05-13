import { Component, computed, input } from '@angular/core';
import { IconComponent } from '../../../../../../../shared/icons/icon.component';

export type ApprovalBannerState = 'approved' | 'changes-requested' | 'pending';

/**
 * Approval status banner. Derived state — the parent passes in the three
 * inputs and the component renders the appropriate color/icon/copy.
 * State derivation lives in the store; this component only renders.
 *
 * Accessibility: role="status" + aria-live="polite" so screen readers
 * announce state transitions when the underlying approvals change.
 */
@Component({
  selector: 'app-approval-status-banner',
  imports: [IconComponent],
  templateUrl: './approval-status-banner.component.html',
  styleUrl: './approval-status-banner.component.scss',
})
export class ApprovalStatusBannerComponent {
  /* v8 ignore next 3 — V8's function-call-throws branches on input() declarations are unreachable (Angular class-field init time; ESM exports not spy-able) */
  readonly canApprove = input.required<boolean>();
  readonly hasChanges = input.required<boolean>();
  readonly pendingCount = input.required<number>();

  protected readonly state = computed<ApprovalBannerState>(() => {
    if (this.canApprove()) return 'approved';
    if (this.hasChanges()) return 'changes-requested';
    return 'pending';
  });

  protected readonly label = computed<string>(() => {
    switch (this.state()) {
      case 'approved':
        return 'Approved';
      case 'changes-requested':
        return 'Changes Requested';
      case 'pending':
        return 'Pending Review';
    }
  });

  protected readonly secondary = computed<string | null>(() => {
    if (this.state() !== 'pending') return null;
    const n = this.pendingCount();
    if (n <= 0) return null;
    return `· ${n} required approval${n === 1 ? '' : 's'} pending`;
  });

  protected readonly iconName = computed<'check-circle' | 'alert-triangle'>(
    () => (this.state() === 'approved' ? 'check-circle' : 'alert-triangle'),
  );
}
