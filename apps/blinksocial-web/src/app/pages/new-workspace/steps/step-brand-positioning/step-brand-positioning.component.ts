import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NewWorkspaceFormService } from '../../new-workspace-form.service';
import { NewWorkspaceApiService } from '../../new-workspace-api.service';
import { ToastService } from '../../../../core/toast/toast.service';
import { TooltipComponent } from '../../../../shared/tooltip/tooltip.component';
import { OutlineButtonComponent } from '../../../../shared/outline-button/outline-button.component';

@Component({
  selector: 'app-step-brand-positioning',
  imports: [TooltipComponent, OutlineButtonComponent],
  templateUrl: './step-brand-positioning.component.html',
  styleUrl: './step-brand-positioning.component.scss',
})
export class StepBrandPositioningComponent {
  protected readonly formService = inject(NewWorkspaceFormService);
  private readonly api = inject(NewWorkspaceApiService);
  private readonly toast = inject(ToastService);
  readonly isGenerating = signal(false);

  readonly TONE_OPTIONS = [
    'Authoritative', 'Playful', 'Educational', 'Inspirational',
    'Conversational', 'Bold', 'Empathetic', 'Direct',
  ];

  generatePositioningStatement(): void {
    const bp = this.formService.brandPositioning();
    if (!bp.targetCustomer && !bp.problemSolved && !bp.solution && !bp.differentiator) return;

    this.isGenerating.set(true);
    this.api
      .generatePositioningStatement({
        targetCustomer: bp.targetCustomer || undefined,
        problemSolved: bp.problemSolved || undefined,
        solution: bp.solution || undefined,
        differentiator: bp.differentiator || undefined,
        workspaceName: this.formService.workspaceName() || undefined,
        purpose: this.formService.purpose() || undefined,
        mission: this.formService.mission() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.formService.updateBrandPositioning(
            'positioningStatement',
            res.positioningStatement,
          );
          this.isGenerating.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.toast.showError(this.extractMessage(err, 'Could not generate a positioning statement.'));
          this.isGenerating.set(false);
        },
      });
  }

  private extractMessage(err: HttpErrorResponse, fallback: string): string {
    const status = typeof err?.status === 'number' ? err.status : 0;
    const body = err?.error;
    const bodyMessage =
      body && typeof body === 'object' && typeof body.message === 'string'
        ? body.message
        : '';
    // Suppress Nest's generic 5xx envelope ({ statusCode: 500, message: "Internal server error" })
    // — it leaks an unhelpful string to the user. Keep specific 4xx messages
    // (BadRequestException etc.) which are intentionally human-readable.
    if (bodyMessage && (status < 500 || bodyMessage !== 'Internal server error')) {
      return bodyMessage;
    }
    return fallback;
  }
}
