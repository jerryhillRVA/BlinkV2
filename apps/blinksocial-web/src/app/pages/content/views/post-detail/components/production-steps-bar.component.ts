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

  protected isPast(index: number): boolean {
    return index < this.unlockedThroughIndex();
  }

  protected isClickable(index: number): boolean {
    // Past + current-next-up are reachable. Active step always stays
    // clickable so a user sitting on it after a gate regression (e.g.
    // unlockBrief) isn't stranded.
    return index <= this.unlockedThroughIndex() || this.isActive(this.steps[index]?.id);
  }
}
