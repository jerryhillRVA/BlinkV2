import { Component, input } from '@angular/core';

export interface WizardStep {
  id: number;
  title: string;
}

@Component({
  selector: 'app-step-indicator',
  templateUrl: './step-indicator.component.html',
  styleUrl: './step-indicator.component.scss',
})
export class StepIndicatorComponent {
  /* v8 ignore next — signal-input default-value branch unreachable from TestBed */
  steps = input.required<WizardStep[]>();
  /* v8 ignore next — signal-input default-value branch unreachable from TestBed */
  currentStep = input.required<number>();

  isCompleted(step: WizardStep): boolean {
    return this.currentStep() > step.id;
  }

  isActive(step: WizardStep): boolean {
    return this.currentStep() === step.id;
  }
}
