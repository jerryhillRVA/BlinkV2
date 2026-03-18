import { Component, inject } from '@angular/core';
import { NewWorkspaceFormService } from '../../new-workspace-form.service';
import { UIContentPillar } from '../../../../models';

@Component({
  selector: 'app-step-content-strategy',
  templateUrl: './step-content-strategy.component.html',
  styleUrl: './step-content-strategy.component.scss',
})
export class StepContentStrategyComponent {
  protected readonly formService = inject(NewWorkspaceFormService);

  isAudienceSelected(pillar: UIContentPillar, segment: string): boolean {
    return this.formService.isAudienceSelected(pillar, segment);
  }

  isPlatformSelected(pillar: UIContentPillar, platform: string): boolean {
    return this.formService.isPlatformSelected(pillar, platform);
  }
}
