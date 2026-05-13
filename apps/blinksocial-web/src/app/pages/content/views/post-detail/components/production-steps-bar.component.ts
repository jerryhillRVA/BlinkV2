import { Component, EventEmitter, Output, computed, input } from '@angular/core';
import {
  PRODUCTION_STEPS,
  type ProductionStep,
  type ProductionStepDef,
} from '../post-detail.types';

@Component({
  selector: 'app-production-steps-bar',
  templateUrl: './production-steps-bar.component.html',
  styleUrl: './production-steps-bar.component.scss',
})
export class ProductionStepsBarComponent {
  /* v8 ignore next 9 — V8's function-call-throws branches on input()/signal() declarations are unreachable (Angular class-field init time; ESM exports not spy-able) */
  readonly activeStep = input.required<ProductionStep>();
  /**
   * Highest step-index whose preceding gate has been satisfied. Drives both
   * `isClickable` (i <= unlockedThroughIndex) and `isPast` (i <
   * unlockedThroughIndex). Computed by the store from briefApproved +
   * canContinueFromDraft + canContinueFromPackaging — see
   * `PostDetailStore.unlockedThroughIndex` for the source of truth.
   */
  readonly unlockedThroughIndex = input(0);

  @Output() stepChange = new EventEmitter<ProductionStep>();

  protected readonly steps = PRODUCTION_STEPS;

  protected readonly activeIndex = computed(() => {
    const idx = this.steps.findIndex((s) => s.id === this.activeStep());
    return idx < 0 ? 0 : idx;
  });

  protected readonly activeStepDef = computed<ProductionStepDef>(
    () => this.steps[this.activeIndex()] ?? this.steps[0],
  );

  protected onStep(step: ProductionStep): void {
    this.stepChange.emit(step);
  }

  protected isActive(step: ProductionStep): boolean {
    return this.activeStep() === step;
  }

  // Strictly behind the active step — renders the green "completed" check.
  // The active step itself is NEVER past, even if its completion gate is
  // satisfied. This keeps the active visual (orange) from being overridden
  // by the past visual (green) when both would otherwise apply.
  protected isPast(index: number): boolean {
    return index < this.activeIndex();
  }

  protected isClickable(index: number): boolean {
    // Past + current are always reachable (you can navigate back, or stay
    // where you are). Only the IMMEDIATELY next step is reachable forward,
    // and only if its completion gate is satisfied. Skipping further ahead
    // is never allowed — the Continue button is how you advance.
    if (index <= this.activeIndex()) return true;
    if (index === this.activeIndex() + 1) return index <= this.unlockedThroughIndex();
    return false;
  }
}
