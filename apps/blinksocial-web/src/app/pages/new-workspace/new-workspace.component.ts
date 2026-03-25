import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  StepIndicatorComponent,
  WizardStep,
} from './step-indicator/step-indicator.component';
import { StepWorkspaceBasicsComponent } from './steps/step-workspace-basics/step-workspace-basics.component';
import { StepPlatformConfigComponent } from './steps/step-platform-config/step-platform-config.component';
import { StepContentStrategyComponent } from './steps/step-content-strategy/step-content-strategy.component';
import { StepAgentsComponent } from './steps/step-agents/step-agents.component';
import { StepReviewComponent } from './steps/step-review/step-review.component';
import { NewWorkspaceFormService } from './new-workspace-form.service';
import { NewWorkspaceApiService } from './new-workspace-api.service';
import { ToastService } from '../../core/toast/toast.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-new-workspace',
  imports: [
    StepIndicatorComponent,
    StepWorkspaceBasicsComponent,
    StepPlatformConfigComponent,
    StepContentStrategyComponent,
    StepAgentsComponent,
    StepReviewComponent,
  ],
  providers: [NewWorkspaceFormService],
  templateUrl: './new-workspace.component.html',
  styleUrl: './new-workspace.component.scss',
})
export class NewWorkspaceComponent {
  private readonly router = inject(Router);
  private readonly apiService = inject(NewWorkspaceApiService);
  private readonly toastService = inject(ToastService);
  private readonly authService = inject(AuthService);
  protected readonly formService = inject(NewWorkspaceFormService);

  currentStep = signal(1);
  isSubmitting = signal(false);

  readonly STEPS: WizardStep[] = [
    { id: 1, title: 'Workspace' },
    { id: 2, title: 'Platforms' },
    { id: 3, title: 'Content' },
    { id: 4, title: 'Agents' },
    { id: 5, title: 'Review' },
  ];

  get isFirstStep(): boolean {
    return this.currentStep() === 1;
  }

  get isLastStep(): boolean {
    return this.currentStep() === this.STEPS.length;
  }

  onNext(): void {
    const validation = this.formService.stepValidation(this.currentStep());
    if (!validation.valid) {
      this.toastService.showError(validation.error);
      return;
    }

    if (this.isLastStep) {
      this.submitWorkspace();
    } else {
      this.currentStep.update((s) => s + 1);
    }
  }

  onBack(): void {
    this.currentStep.update((s) => s - 1);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  private submitWorkspace(): void {
    this.isSubmitting.set(true);

    this.apiService.createWorkspace(this.formService.formData()).subscribe({
      next: () => {
        // Refresh auth status to pick up new workspace access, then navigate
        this.authService.checkStatus().then(() => {
          this.isSubmitting.set(false);
          this.router.navigate(['/']);
        });
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.toastService.showError(
          err?.error?.message ?? 'Failed to create workspace. Please try again.'
        );
      },
    });
  }
}
