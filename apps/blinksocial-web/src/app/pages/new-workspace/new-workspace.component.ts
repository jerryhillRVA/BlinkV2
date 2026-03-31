import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
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
export class NewWorkspaceComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly apiService = inject(NewWorkspaceApiService);
  private readonly toastService = inject(ToastService);
  private readonly authService = inject(AuthService);
  protected readonly formService = inject(NewWorkspaceFormService);

  currentStep = signal(1);
  isSubmitting = signal(false);
  resumeWorkspaceId = signal<string | null>(null);

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

  ngOnInit(): void {
    const resumeId = this.route.snapshot.queryParamMap.get('resume');
    if (resumeId) {
      this.resumeWorkspaceId.set(resumeId);
      this.apiService.getWizardState(resumeId).subscribe({
        next: (state) => {
          if (state.formData) {
            this.formService.populateFromWizardData(state.formData);
          }
          if (state.currentStep) {
            this.currentStep.set(state.currentStep);
          }
        },
        error: (err) => {
          this.toastService.showError(
            err?.error?.message ?? 'Failed to load wizard state.'
          );
        },
      });
    }
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
      const nextStep = this.currentStep() + 1;
      this.currentStep.set(nextStep);
      this.saveWizardState(nextStep);
    }
  }

  onBack(): void {
    this.currentStep.update((s) => s - 1);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  private saveWizardState(step: number): void {
    const workspaceId = this.resumeWorkspaceId();
    if (!workspaceId) return;

    this.apiService.saveWizardState(workspaceId, {
      currentStep: step,
      completedSteps: Array.from({ length: step - 1 }, (_, i) => i + 1),
      formData: this.formService.formData(),
    }).subscribe();
  }

  private submitWorkspace(): void {
    this.isSubmitting.set(true);

    const workspaceId = this.resumeWorkspaceId();
    if (workspaceId) {
      // Finalize existing workspace
      this.apiService.finalizeWorkspace(workspaceId).subscribe({
        next: () => {
          this.authService.checkStatus().then(() => {
            this.isSubmitting.set(false);
            this.router.navigate(['/']);
          });
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.toastService.showError(
            err?.error?.message ?? 'Failed to finalize workspace. Please try again.'
          );
        },
      });
    } else {
      // Create new workspace from scratch
      this.apiService.createWorkspace(this.formService.formData()).subscribe({
        next: () => {
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
}
