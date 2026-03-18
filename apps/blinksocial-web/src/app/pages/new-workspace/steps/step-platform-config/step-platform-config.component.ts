import { Component, inject } from '@angular/core';
import { NewWorkspaceFormService } from '../../new-workspace-form.service';

@Component({
  selector: 'app-step-platform-config',
  templateUrl: './step-platform-config.component.html',
  styleUrl: './step-platform-config.component.scss',
})
export class StepPlatformConfigComponent {
  protected readonly formService = inject(NewWorkspaceFormService);

  readonly PLATFORMS = [
    'YouTube', 'LinkedIn', 'Twitter/X', 'Instagram',
    'Facebook', 'Slack', 'Discord',
  ];
}
