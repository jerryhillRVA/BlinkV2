import { Component, DestroyRef, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { type ContentMixTarget, type ContentCategory } from '../../strategy-research.types';

interface ContentMixEntry extends ContentMixTarget {
  actualPercent: number;
}

const DEFAULT_MIX: ContentMixEntry[] = [
  { category: 'educational', label: 'Educational', targetPercent: 35, color: '#3b82f6', description: 'Tutorials, tips, how-tos', actualPercent: 32 },
  { category: 'entertaining', label: 'Entertaining', targetPercent: 25, color: '#f59e0b', description: 'Fun, relatable, trending content', actualPercent: 28 },
  { category: 'community', label: 'Community', targetPercent: 20, color: '#10b981', description: 'Q&A, polls, user-generated content', actualPercent: 18 },
  { category: 'promotional', label: 'Promotional', targetPercent: 15, color: 'var(--blink-brand-primary)', description: 'Product launches, offers, CTAs', actualPercent: 17 },
  { category: 'trending', label: 'Trending', targetPercent: 5, color: '#8b5cf6', description: 'Trend-jacking, viral formats', actualPercent: 5 },
];

@Component({
  selector: 'app-content-mix',
  imports: [CommonModule, FormsModule],
  templateUrl: './content-mix.component.html',
  styleUrl: './content-mix.component.scss',
})
export class ContentMixComponent {
  private readonly destroyRef = inject(DestroyRef);
  private timerId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.timerId !== null) clearTimeout(this.timerId);
    });
  }

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
    this.timerId = setTimeout(() => {
      this.mix.update(list =>
        list.map(m => ({ ...m, targetPercent: suggestedTargets[m.category] ?? m.targetPercent }))
      );
      this.isSuggesting.set(false);
      this.timerId = null;
    }, 2500);
  }
}
