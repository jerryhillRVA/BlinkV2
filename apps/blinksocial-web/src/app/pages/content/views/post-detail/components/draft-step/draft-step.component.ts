import { Component, computed, effect, inject } from '@angular/core';
import { PostDetailStore } from '../../post-detail.store';
import {
  draftModeLabel,
  getDraftMode,
  isDraftModeSupported,
} from './draft-canonical.utils';
import { BuilderPlaceholderComponent } from './builder-placeholder/builder-placeholder.component';

@Component({
  selector: 'app-draft-step',
  imports: [BuilderPlaceholderComponent],
  templateUrl: './draft-step.component.html',
  styleUrl: './draft-step.component.scss',
})
export class DraftStepComponent {
  protected readonly store = inject(PostDetailStore);

  // Derived mode from (platform, contentType). Recomputes when the post
  // changes platform/contentType.
  protected readonly mode = computed(() => {
    const item = this.store.item();
    return getDraftMode(item?.platform ?? null, item?.contentType ?? null);
  });

  protected readonly modeLabel = computed(() => draftModeLabel(this.mode()));

  protected readonly supported = computed(() =>
    isDraftModeSupported(this.mode()),
  );

  protected readonly draftErrors = computed(() => this.store.draftErrors());
  protected readonly canContinue = computed(() =>
    this.store.canContinueFromDraft(),
  );

  protected readonly errorSummary = computed(() => {
    const n = this.draftErrors().length;
    if (n === 0) return 'Ready to continue.';
    if (n === 1) return '1 field remaining.';
    return `${n} fields remaining.`;
  });

  constructor() {
    // Persist the canonical mode at brief-approval time so a later platform
    // / contentType change can't silently retarget the draft.
    effect(() => {
      const item = this.store.item();
      if (!item?.briefApproved) return;
      const derived = this.mode();
      if (item.production?.draft?.mode !== derived) {
        this.store.setDraftMode(derived);
      }
    });
  }

  protected onContinueToPackaging(): void {
    if (!this.canContinue()) return;
    this.store.setActiveStep('packaging');
  }
}
