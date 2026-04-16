import { Component, inject, signal } from '@angular/core';
import { NewWorkspaceFormService } from '../../new-workspace-form.service';
import { OutlineButtonComponent } from '../../../../shared/outline-button/outline-button.component';

@Component({
  selector: 'app-step-objectives',
  imports: [OutlineButtonComponent],
  templateUrl: './step-objectives.component.html',
  styleUrl: './step-objectives.component.scss',
})
export class StepObjectivesComponent {
  protected readonly formService = inject(NewWorkspaceFormService);
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
    this.isSuggesting.set(true);
    setTimeout(() => {
      this.formService.businessObjectives.set([
        { id: Date.now(), category: 'growth', statement: 'Grow combined social following to 25,000', target: '25000', unit: 'followers', timeframe: 'Q4 2026' },
        { id: Date.now() + 1, category: 'engagement', statement: 'Achieve 5% average engagement rate across platforms', target: '5', unit: '%', timeframe: 'Q3 2026' },
      ]);
      this.isSuggesting.set(false);
    }, 1500);
  }
}
