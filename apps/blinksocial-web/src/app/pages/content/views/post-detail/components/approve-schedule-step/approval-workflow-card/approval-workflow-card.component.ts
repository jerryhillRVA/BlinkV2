import { Component, computed, input, output, signal } from '@angular/core';
import type {
  ApprovalEntryContract,
  ApprovalStatusContract,
} from '@blinksocial/contracts';
import { IconComponent } from '../../../../../../../shared/icons/icon.component';

export interface ApprovalStatusChange {
  role: string;
  status: ApprovalStatusContract;
  note?: string;
}

/**
 * Approval workflow card. Renders one row per approver with per-row
 * Approve / Request Changes / Revoke buttons, an inline note input for
 * Request Changes, and a sticky-bottom "Approve & Publish" CTA.
 *
 * Inputs are derived state — the parent passes in the approvals list
 * and computed gating flags. Mutations are emitted as events the parent
 * routes into the store (no direct store access).
 *
 * Ephemeral UI state (which row's note input is open, the in-flight
 * note text per row) lives here as signals. Submitting persists.
 */
@Component({
  selector: 'app-approval-workflow-card',
  imports: [IconComponent],
  templateUrl: './approval-workflow-card.component.html',
  styleUrl: './approval-workflow-card.component.scss',
})
export class ApprovalWorkflowCardComponent {
  /* v8 ignore next 4 — V8's function-call-throws branches on input() declarations are unreachable (Angular class-field init time; ESM exports not spy-able) */
  readonly approvals = input.required<ReadonlyArray<ApprovalEntryContract>>();
  readonly canApprove = input.required<boolean>();
  readonly hasChanges = input.required<boolean>();
  readonly pendingCount = input.required<number>();

  readonly statusChange = output<ApprovalStatusChange>();
  readonly approveAndPublish = output<void>();

  /** Role whose Request Changes note input is currently open (one at a time). */
  protected readonly openNoteRole = signal<string | null>(null);

  /** In-flight note text per role. Cleared on submit / cancel. */
  protected readonly noteByRole = signal<Record<string, string>>({});

  /** When a Submit was attempted with an empty note — flag the row to render error copy. */
  protected readonly noteErrorRole = signal<string | null>(null);

  protected readonly disabledMessage = computed<string | null>(() => {
    if (this.canApprove()) return null;
    if (this.hasChanges()) return 'Resolve change requests before approving';
    const n = this.pendingCount();
    return `${n} required approval${n === 1 ? '' : 's'} pending`;
  });

  protected readonly approveCtaLabel = computed<string>(() =>
    this.canApprove() ? 'Approved — Publish' : 'Approve & Publish',
  );

  protected approve(role: string): void {
    this.statusChange.emit({ role, status: 'approved' });
    this.closeNote(role);
  }

  protected revoke(role: string): void {
    this.statusChange.emit({ role, status: 'pending' });
    this.closeNote(role);
  }

  protected onRequestChangesClick(role: string): void {
    // First click opens the textarea. Second click (which becomes "Submit") submits.
    if (this.openNoteRole() !== role) {
      this.openNoteRole.set(role);
      this.noteErrorRole.set(null);
      return;
    }
    const note = (this.noteByRole()[role] ?? '').trim();
    if (!note) {
      this.noteErrorRole.set(role);
      return;
    }
    this.statusChange.emit({ role, status: 'changes-requested', note });
    this.closeNote(role);
  }

  protected onNoteInput(role: string, event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.noteByRole.update((m) => ({ ...m, [role]: value }));
    // Clear the empty-note error as soon as the user starts typing.
    if (value.trim() && this.noteErrorRole() === role) {
      this.noteErrorRole.set(null);
    }
  }

  protected cancelNote(role: string): void {
    this.closeNote(role);
  }

  protected onApproveAndPublish(): void {
    if (!this.canApprove()) return;
    this.approveAndPublish.emit();
  }

  protected requestChangesLabel(role: string): string {
    return this.openNoteRole() === role ? 'Submit' : 'Request Changes';
  }

  protected isNoteOpen(role: string): boolean {
    return this.openNoteRole() === role;
  }

  protected noteValue(role: string): string {
    return this.noteByRole()[role] ?? '';
  }

  protected hasNoteError(role: string): boolean {
    return this.noteErrorRole() === role;
  }

  private closeNote(role: string): void {
    this.openNoteRole.update((open) => (open === role ? null : open));
    this.noteByRole.update((m) => {
      if (!(role in m)) return m;
      const next = { ...m };
      delete next[role];
      return next;
    });
    if (this.noteErrorRole() === role) this.noteErrorRole.set(null);
  }
}
