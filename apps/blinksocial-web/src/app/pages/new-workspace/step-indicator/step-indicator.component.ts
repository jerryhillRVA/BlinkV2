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
  /* v8 ignore next 2 — V8's function-call-throws branches on input()/signal() declarations are unreachable (Angular class-field init time; ESM exports not spy-able) */
  steps = input.required<WizardStep[]>();
  currentStep = input.required<number>();

  isCompleted(step: WizardStep): boolean {
    return this.currentStep() > step.id;
  }

  isActive(step: WizardStep): boolean {
    return this.currentStep() === step.id;
  }
}
