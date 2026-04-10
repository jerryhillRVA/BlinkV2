import { Component, DestroyRef, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { ContentMixTarget, ContentCategory } from '../../strategy-research.types';
import { AI_SIMULATION_DELAY_MS } from '../../strategy-research.constants';
import { safeTimeout } from '../../strategy-research.utils';
import { StrategyResearchStateService } from '../../strategy-research-state.service';

interface ContentMixEntry extends ContentMixTarget {
  actualPercent: number;
}

const CATEGORY_COLORS = ['#4F46E5', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

@Component({
  selector: 'app-content-mix',
  imports: [FormsModule],
  templateUrl: './content-mix.component.html',
  styleUrl: './content-mix.component.scss',
})
export class ContentMixComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly stateService = inject(StrategyResearchStateService);
  private initialMix: ContentMixTarget[] = [];

  readonly showAddCategory = signal(false);
  newCategoryName = '';
  newCategoryDescription = '';

  /* v8 ignore start */
  readonly mix = computed<ContentMixEntry[]>(() =>
    this.stateService.contentMix().map(m => ({ ...m, actualPercent: m.targetPercent }))
  );
  readonly isSuggesting = signal(false);
  /* v8 ignore stop */

  /* v8 ignore start */
  readonly total = computed(() =>
    this.mix().reduce((sum, m) => sum + m.targetPercent, 0)
  );

  readonly isValid = computed(() => this.total() === 100);
  /* v8 ignore stop */

  constructor() {
    this.initialMix = this.stateService.contentMix().map(m => ({ ...m }));
  }

  updateTarget(category: ContentCategory, value: number): void {
    const updated = this.stateService.contentMix().map(m =>
      m.category === category ? { ...m, targetPercent: value } : m
    );
    this.stateService.saveContentMix(updated);
  }

  reset(): void {
    this.stateService.saveContentMix(this.initialMix.map(m => ({ ...m })));
  }

  openAddCategory(): void {
    this.newCategoryName = '';
    this.newCategoryDescription = '';
    this.showAddCategory.set(true);
  }

  cancelAddCategory(): void {
    this.showAddCategory.set(false);
  }

  addCategory(): void {
    if (!this.newCategoryName.trim()) return;
    const current = this.stateService.contentMix();
    const colorIndex = current.length % CATEGORY_COLORS.length;
    const category = this.newCategoryName.trim().toLowerCase().replace(/\s+/g, '-');
    const newTarget: ContentMixTarget = {
      category,
      label: this.newCategoryName.trim(),
      targetPercent: 0,
      color: CATEGORY_COLORS[colorIndex],
      description: this.newCategoryDescription.trim(),
    };
    this.stateService.saveContentMix([...current, newTarget]);
    this.showAddCategory.set(false);
  }

  removeCategory(category: ContentCategory): void {
    const updated = this.stateService.contentMix().filter(m => m.category !== category);
    this.stateService.saveContentMix(updated);
  }

  aiSuggest(): void {
    this.isSuggesting.set(true);
    safeTimeout(() => {
      const current = this.stateService.contentMix();
      const count = current.length || 1;
      // Distribute evenly across all existing categories
      const basePercent = Math.floor(100 / count);
      const remainder = 100 - basePercent * count;
      const updated = current.map((m, i) => ({
        ...m,
        targetPercent: basePercent + (i < remainder ? 1 : 0),
      }));
      this.stateService.saveContentMix(updated);
      this.isSuggesting.set(false);
    }, AI_SIMULATION_DELAY_MS, this.destroyRef);
  }
}
