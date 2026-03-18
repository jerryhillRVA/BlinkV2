import { Component, inject } from '@angular/core';
import { NewWorkspaceFormService } from '../../new-workspace-form.service';

@Component({
  selector: 'app-step-agents',
  templateUrl: './step-agents.component.html',
  styleUrl: './step-agents.component.scss',
})
export class StepAgentsComponent {
  protected readonly formService = inject(NewWorkspaceFormService);
}
