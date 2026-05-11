import { Component, Input } from '@angular/core';
import type { DraftModeContract } from '@blinksocial/contracts';
import { draftModeLabel } from '../draft-canonical.utils';

@Component({
  selector: 'app-builder-placeholder',
  templateUrl: './builder-placeholder.component.html',
  styleUrl: './builder-placeholder.component.scss',
})
export class BuilderPlaceholderComponent {
  @Input({ required: true }) mode!: DraftModeContract;

  protected get label(): string {
    return draftModeLabel(this.mode);
  }

  protected get copy(): string {
    return `The ${this.label.toLowerCase()} builder isn't ready yet. Use the brief to plan; we'll add this builder soon.`;
  }
}
