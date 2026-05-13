import { Component, computed, inject } from '@angular/core';
import type {
  ConnectedAccountOption,
} from './publish-config-block/publish-config-block.component';
import { PostDetailStore } from '../../post-detail.store';
import { ApprovalStatusBannerComponent } from './approval-status-banner/approval-status-banner.component';
import {
  ApprovalStatusChange,
  ApprovalWorkflowCardComponent,
} from './approval-workflow-card/approval-workflow-card.component';
import { PublishConfigBlockComponent } from './publish-config-block/publish-config-block.component';
import type { PublishConfigContract } from '@blinksocial/contracts';

/**
 * Approve & Schedule step shell. Routes store-derived state into three
 * child cards (status banner, approval workflow, publish config) and
 * pipes their events back through the store mutators.
 *
 * V1 ships with an empty connectedAccounts list — the publish-config
 * block renders the "Connect one in Workspace Settings → Accounts"
 * empty-state prompt. Real connected-accounts wiring is a follow-up.
 */
@Component({
  selector: 'app-approve-schedule-step',
  imports: [
    ApprovalStatusBannerComponent,
    ApprovalWorkflowCardComponent,
    PublishConfigBlockComponent,
  ],
  templateUrl: './approve-schedule-step.component.html',
  styleUrl: './approve-schedule-step.component.scss',
})
export class ApproveScheduleStepComponent {
  protected readonly store = inject(PostDetailStore);

  protected readonly briefApproved = computed(
    () => !!this.store.item()?.briefApproved,
  );

  protected readonly contentType = computed(
    () => this.store.item()?.contentType ?? null,
  );

  protected readonly isVideoLong = computed(
    () => this.store.draft()?.mode === 'VIDEO_LONG',
  );

  /** Stub list — Workspace Settings → Accounts wiring is a follow-up ticket. */
  protected readonly connectedAccounts: ReadonlyArray<ConnectedAccountOption> = [];

  protected onStatusChange(change: ApprovalStatusChange): void {
    this.store.setApprovalStatus(change.role, change.status, change.note);
  }

  protected onApproveAndPublish(): void {
    this.store.markApproved();
  }

  protected onPublishConfigChange(patch: Partial<PublishConfigContract>): void {
    this.store.setPublishConfig(patch);
  }
}
