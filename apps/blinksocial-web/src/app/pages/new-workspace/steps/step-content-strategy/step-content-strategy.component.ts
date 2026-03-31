import { Component, computed, inject } from '@angular/core';
import { NewWorkspaceFormService } from '../../new-workspace-form.service';
import { UIContentPillar } from '../../../../models';
import { DropdownComponent, type DropdownOption } from '../../../../shared/dropdown/dropdown.component';
import { OutlineButtonComponent } from '../../../../shared/outline-button/outline-button.component';

@Component({
  selector: 'app-step-content-strategy',
  imports: [DropdownComponent, OutlineButtonComponent],
  templateUrl: './step-content-strategy.component.html',
  styleUrl: './step-content-strategy.component.scss',
})
export class StepContentStrategyComponent {
  protected readonly formService = inject(NewWorkspaceFormService);

  readonly objectiveDropdownOptions = computed<DropdownOption[]>(() => {
    const none: DropdownOption = { value: '', label: '\u2014 None \u2014' };
    const objectives = this.formService.businessObjectives()
      .filter((o) => o.statement.trim())
      .map((o) => ({ value: `obj-${o.id}`, label: o.statement }));
    return [none, ...objectives];
  });

  isAudienceSelected(pillar: UIContentPillar, segment: string): boolean {
    return this.formService.isAudienceSelected(pillar, segment);
  }

  isPlatformSelected(pillar: UIContentPillar, platform: string): boolean {
    return this.formService.isPlatformSelected(pillar, platform);
  }
}
