import { Component, inject } from '@angular/core';
import { IdeaDetailStore } from '../idea-detail.store';
import { ConceptOptionCardComponent } from './concept-option-card.component';

@Component({
  selector: 'app-concept-options-panel',
  imports: [ConceptOptionCardComponent],
  templateUrl: './concept-options-panel.component.html',
  styleUrl: './concept-options-panel.component.scss',
})
export class ConceptOptionsPanelComponent {
  protected readonly store = inject(IdeaDetailStore);

  // Six placeholder slots for the loading skeleton grid.
  protected readonly skeletonSlots = [0, 1, 2, 3, 4, 5];

  protected onGenerate(): void {
    this.store.generateOptions();
  }

  protected onRegenerate(): void {
    this.store.regenerate();
  }

  protected onToggle(id: string): void {
    this.store.selectOption(id);
  }
}
