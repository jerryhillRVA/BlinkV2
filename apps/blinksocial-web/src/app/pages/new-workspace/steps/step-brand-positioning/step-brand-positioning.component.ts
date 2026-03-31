import { Component, inject, signal } from '@angular/core';
import { NewWorkspaceFormService } from '../../new-workspace-form.service';
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
  readonly isGenerating = signal(false);

  readonly TONE_OPTIONS = [
    'Authoritative', 'Playful', 'Educational', 'Inspirational',
    'Conversational', 'Bold', 'Empathetic', 'Direct',
  ];

  generatePositioningStatement(): void {
    const bp = this.formService.brandPositioning();
    if (!bp.targetCustomer && !bp.problemSolved && !bp.solution && !bp.differentiator) return;

    this.isGenerating.set(true);
    setTimeout(() => {
      const statement = `For ${bp.targetCustomer || '[target customer]'} who ${bp.problemSolved || '[face this problem]'}, ${bp.solution || '[our solution]'} is the answer that ${bp.differentiator || '[sets us apart]'}.`;
      this.formService.updateBrandPositioning('positioningStatement', statement);
      this.isGenerating.set(false);
    }, 1500);
  }
}
