import { Component, DestroyRef, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { ContentMixTarget, ContentCategory } from '../../strategy-research.types';
import { AI_SIMULATION_DELAY_MS } from '../../strategy-research.constants';
import { safeTimeout } from '../../strategy-research.utils';

interface ContentMixEntry extends ContentMixTarget {
  actualPercent: number;
}

const DEFAULT_MIX: ContentMixEntry[] = [
  { category: 'educational', label: 'Educational', targetPercent: 35, color: 'var(--blink-accent-blue)', description: 'Tutorials, tips, how-tos', actualPercent: 32 },
  { category: 'entertaining', label: 'Entertaining', targetPercent: 25, color: 'var(--blink-accent-amber)', description: 'Fun, relatable, trending content', actualPercent: 28 },
  { category: 'community', label: 'Community', targetPercent: 20, color: 'var(--blink-accent-green)', description: 'Q&A, polls, user-generated content', actualPercent: 18 },
  { category: 'promotional', label: 'Promotional', targetPercent: 15, color: 'var(--blink-brand-primary)', description: 'Product launches, offers, CTAs', actualPercent: 17 },
  { category: 'trending', label: 'Trending', targetPercent: 5, color: 'var(--blink-accent-purple)', description: 'Trend-jacking, viral formats', actualPercent: 5 },
];

@Component({
  selector: 'app-content-mix',
  imports: [CommonModule, FormsModule],
  templateUrl: './content-mix.component.html',
  styleUrl: './content-mix.component.scss',
})
export class ContentMixComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly mix = signal<ContentMixEntry[]>(DEFAULT_MIX.map(m => ({ ...m })));
  readonly isSuggesting = signal(false);

  readonly total = computed(() =>
    this.mix().reduce((sum, m) => sum + m.targetPercent, 0)
  );

  readonly isValid = computed(() => this.total() === 100);

  updateTarget(category: ContentCategory, value: number): void {
    this.mix.update(list =>
      list.map(m => m.category === category ? { ...m, targetPercent: value } : m)
    );
  }

  reset(): void {
    this.mix.set(DEFAULT_MIX.map(m => ({ ...m })));
  }

  aiSuggest(): void {
    const suggestedTargets: Record<ContentCategory, number> = {
      educational: 30, entertaining: 25, community: 25, promotional: 10, trending: 10,
    };
    this.isSuggesting.set(true);
    safeTimeout(() => {
      this.mix.update(list =>
        list.map(m => ({ ...m, targetPercent: suggestedTargets[m.category] ?? m.targetPercent }))
      );
      this.isSuggesting.set(false);
    }, AI_SIMULATION_DELAY_MS, this.destroyRef);
  }
}
