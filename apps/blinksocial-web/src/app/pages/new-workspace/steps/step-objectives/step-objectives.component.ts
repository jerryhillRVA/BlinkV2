import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NewWorkspaceFormService } from '../../new-workspace-form.service';
import { NewWorkspaceApiService } from '../../new-workspace-api.service';
import { ToastService } from '../../../../core/toast/toast.service';
import { OutlineButtonComponent } from '../../../../shared/outline-button/outline-button.component';

@Component({
  selector: 'app-step-objectives',
  imports: [OutlineButtonComponent],
  templateUrl: './step-objectives.component.html',
  styleUrl: './step-objectives.component.scss',
})
export class StepObjectivesComponent {
  protected readonly formService = inject(NewWorkspaceFormService);
  private readonly api = inject(NewWorkspaceApiService);
  private readonly toast = inject(ToastService);
  readonly isSuggesting = signal(false);

  readonly CATEGORIES = [
    { value: 'growth', label: 'Growth', emoji: '\u{1F4C8}' },
    { value: 'revenue', label: 'Revenue', emoji: '\u{1F4B0}' },
    { value: 'awareness', label: 'Awareness', emoji: '\u{1F4E3}' },
    { value: 'trust', label: 'Trust', emoji: '\u{1F91D}' },
    { value: 'community', label: 'Community', emoji: '\u{1F465}' },
    { value: 'engagement', label: 'Engagement', emoji: '\u{1F4AC}' },
  ];

  suggestObjectives(): void {
    const segments = this.formService.audienceSegments()
      .filter((s) => s.name.trim())
      .map((s) => ({ name: s.name }));

    const existing = this.formService.businessObjectives()
      .filter((o) => o.statement.trim())
      .map((o) => ({ statement: o.statement, category: o.category }));

    this.isSuggesting.set(true);
    this.api
      .suggestBusinessObjectives({
        workspaceName: this.formService.workspaceName() || undefined,
        purpose: this.formService.purpose() || undefined,
        mission: this.formService.mission() || undefined,
        audienceSegments: segments.length > 0 ? segments : undefined,
        existingObjectives: existing.length > 0 ? existing : undefined,
      })
      .subscribe({
        next: (res) => {
          this.formService.mergeObjectiveSuggestions(res.suggestions);
          this.isSuggesting.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.toast.showError(this.extractMessage(err, 'Could not suggest objectives.'));
          this.isSuggesting.set(false);
        },
      });
  }

  private extractMessage(err: HttpErrorResponse, fallback: string): string {
    const body = err?.error;
    if (body && typeof body === 'object' && typeof body.message === 'string') {
      return body.message;
    }
    if (typeof err?.message === 'string' && err.message) return err.message;
    return fallback;
  }
}
