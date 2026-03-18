import { Component, inject } from '@angular/core';
import { NewWorkspaceFormService } from '../../new-workspace-form.service';

@Component({
  selector: 'app-step-workspace-basics',
  templateUrl: './step-workspace-basics.component.html',
  styleUrl: './step-workspace-basics.component.scss',
})
export class StepWorkspaceBasicsComponent {
  protected readonly formService = inject(NewWorkspaceFormService);

  readonly AGE_RANGES = ['13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
}
