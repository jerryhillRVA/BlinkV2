import { Component, EventEmitter, Output, input } from '@angular/core';
import { PRODUCTION_STEPS, type ProductionStep } from '../post-detail.types';

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

  protected onStep(step: ProductionStep): void {
    this.stepChange.emit(step);
  }

  protected isActive(step: ProductionStep): boolean {
    return this.activeStep() === step;
  }

  protected isApprovedBrief(step: ProductionStep): boolean {
    return step === 'brief' && this.briefApproved();
  }
}
