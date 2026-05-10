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
  readonly briefApproved = input(false);

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
    if (this.steps[index]?.id === 'brief') return this.briefApproved();
    return index < this.activeIndex() && this.briefApproved();
  }

  protected isClickable(index: number): boolean {
    if (this.briefApproved()) return true;
    return index <= this.activeIndex() + 1;
  }
}
