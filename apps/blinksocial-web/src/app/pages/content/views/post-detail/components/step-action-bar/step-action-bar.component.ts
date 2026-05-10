import { Component, EventEmitter, Output, computed, inject } from '@angular/core';
import { PostDetailStore } from '../../post-detail.store';
import type { ProductionStep } from '../../post-detail.types';
import { IconComponent } from '../../../../../../shared/icons/icon.component';

const STEP_LABEL: Record<ProductionStep, string> = {
  brief: 'Brief',
  draft: 'Draft',
  packaging: 'Packaging',
  qa: 'Approve & Schedule',
};

/**
 * Fixed-bottom action bar shared across all production-detail steps.
 *
 * Visually: position: sticky; bottom: 0 — stays pinned to the viewport
 * bottom while the post-detail container extends below it, then reaches
 * its natural position when the user scrolls past the content so the
 * page footer is never covered.
 *
 * Behaviorally: a stepper-wizard bar. Back navigates to the previous
 * step (or out to the pipeline when on Brief). Continue advances to the
 * next step via store.advanceProductionStep — which persists
 * production.productionStep so the next visit lands the user there.
 */
@Component({
  selector: 'app-step-action-bar',
  imports: [IconComponent],
  templateUrl: './step-action-bar.component.html',
  styleUrl: './step-action-bar.component.scss',
})
export class StepActionBarComponent {
  protected readonly store = inject(PostDetailStore);

  /** Emitted when Back is clicked on the Brief step (no previous step). */
  @Output() backToList = new EventEmitter<void>();

  protected readonly activeStep = this.store.activeStep;

  protected readonly briefApproved = computed(
    () => !!this.store.item()?.briefApproved,
  );

  protected readonly nextStep = computed<ProductionStep | null>(() => {
    switch (this.activeStep()) {
      case 'brief':
        return 'draft';
      case 'draft':
        return 'packaging';
      case 'packaging':
        return 'qa';
      case 'qa':
        return null;
    }
  });

  protected readonly previousStep = computed<ProductionStep | null>(() => {
    switch (this.activeStep()) {
      case 'brief':
        return null;
      case 'draft':
        return 'brief';
      case 'packaging':
        return 'draft';
      case 'qa':
        return 'packaging';
    }
  });

  protected readonly continueLabel = computed(() => {
    const next = this.nextStep();
    if (!next) return 'Finish';
    return `Continue to ${STEP_LABEL[next]}`;
  });

  protected readonly backLabel = computed(() => {
    const prev = this.previousStep();
    if (!prev) return 'Back to pipeline';
    return `Back to ${STEP_LABEL[prev]}`;
  });

  protected readonly continueEnabled = computed(() => {
    switch (this.activeStep()) {
      case 'brief':
        return this.briefApproved();
      case 'draft':
        return this.store.canContinueFromDraft();
      case 'packaging':
      case 'qa':
        // Not implemented yet — leave the CTA visible but disabled so the
        // affordance is consistent across all four steps.
        return false;
    }
  });

  protected onBack(): void {
    const prev = this.previousStep();
    if (prev) {
      // UI-only navigation. Don't regress the persisted productionStep
      // — the user is reviewing, not undoing progress.
      this.store.setActiveStep(prev);
    } else {
      this.backToList.emit();
    }
  }

  protected onContinue(): void {
    if (!this.continueEnabled()) return;
    const next = this.nextStep();
    if (next) this.store.advanceProductionStep(next);
  }
}
