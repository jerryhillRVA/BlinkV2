import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContentCreateStore } from '../content-create.store';
import { MAX_FOCUS_PILLARS } from '../../../content.constants';

@Component({
  selector: 'app-idea-section',
  imports: [FormsModule],
  templateUrl: './idea-section.component.html',
  styleUrl: './idea-section.component.scss',
})
export class IdeaSectionComponent {
  protected readonly store = inject(ContentCreateStore);
  protected readonly maxFocusPillars = MAX_FOCUS_PILLARS;

  protected readonly pillars = this.store.pillars;
  protected readonly segments = this.store.segments;
  protected readonly state = this.store.state;

  protected readonly focusPillarsAtLimit = computed(
    () => this.state().generatePillarIds.length >= MAX_FOCUS_PILLARS,
  );

  protected onTitleChange(value: string): void {
    this.store.patch({ title: value });
  }

  protected onDescriptionChange(value: string): void {
    this.store.patch({ description: value });
  }

  protected setMode(mode: 'manual' | 'generate'): void {
    this.store.setIdeaMode(mode);
  }

  protected toggleFocusPillar(id: string): void {
    const state = this.state();
    const already = state.generatePillarIds.includes(id);
    if (!already && this.focusPillarsAtLimit()) return;
    this.store.toggleGeneratePillar(id);
  }

  protected generateIdeas(): void {
    this.store.generateIdeas();
  }

  protected toggleGenerated(id: string): void {
    this.store.toggleGeneratedSelected(id);
  }

  protected pillarName(id: string): string {
    return this.pillars().find((p) => p.id === id)?.name ?? '';
  }

  protected togglePillar(id: string): void {
    this.store.togglePillar(id);
  }

  protected isPillarSelected(id: string): boolean {
    return this.state().pillarIds.includes(id);
  }

  protected toggleSegment(id: string): void {
    this.store.toggleSegment(id);
  }

  protected isSegmentSelected(id: string): boolean {
    return this.state().segmentIds.includes(id);
  }
}
