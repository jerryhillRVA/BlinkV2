import { Component, inject } from '@angular/core';
import { NewWorkspaceFormService } from '../../new-workspace-form.service';

@Component({
  selector: 'app-step-review',
  templateUrl: './step-review.component.html',
  styleUrl: './step-review.component.scss',
})
export class StepReviewComponent {
  protected readonly formService = inject(NewWorkspaceFormService);

  get workspaceName(): string {
    return this.formService.workspaceName() || 'Untitled Workspace';
  }

  get pillarCount(): number {
    return this.formService.contentPillars().length;
  }

  get enabledPlatformNames(): string {
    const platforms = Array.from(this.formService.enabledPlatforms());
    return platforms.length > 0 ? platforms.join(', ') : 'None';
  }

  get objectiveCount(): number {
    return this.formService.businessObjectives().filter((o) => o.statement.trim()).length;
  }
}
