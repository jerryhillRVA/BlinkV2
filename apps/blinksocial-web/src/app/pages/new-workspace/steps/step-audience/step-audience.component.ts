import { Component, inject } from '@angular/core';
import { NewWorkspaceFormService } from '../../new-workspace-form.service';
import { OutlineButtonComponent } from '../../../../shared/outline-button/outline-button.component';

@Component({
  selector: 'app-step-audience',
  imports: [OutlineButtonComponent],
  templateUrl: './step-audience.component.html',
  styleUrl: './step-audience.component.scss',
})
export class StepAudienceComponent {
  protected readonly formService = inject(NewWorkspaceFormService);
}
