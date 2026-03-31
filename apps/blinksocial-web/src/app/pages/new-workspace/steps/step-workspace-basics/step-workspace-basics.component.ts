import { Component, inject } from '@angular/core';
import { NewWorkspaceFormService } from '../../new-workspace-form.service';
import { TooltipComponent } from '../../../../shared/tooltip/tooltip.component';

@Component({
  selector: 'app-step-workspace-basics',
  imports: [TooltipComponent],
  templateUrl: './step-workspace-basics.component.html',
  styleUrl: './step-workspace-basics.component.scss',
})
export class StepWorkspaceBasicsComponent {
  protected readonly formService = inject(NewWorkspaceFormService);
}
