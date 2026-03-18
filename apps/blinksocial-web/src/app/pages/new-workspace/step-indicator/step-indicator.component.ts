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
  steps = input.required<WizardStep[]>();
  currentStep = input.required<number>();

  isCompleted(step: WizardStep): boolean {
    return this.currentStep() > step.id;
  }

  isActive(step: WizardStep): boolean {
    return this.currentStep() === step.id;
  }
}
