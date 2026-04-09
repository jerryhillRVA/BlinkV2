import { Component, DestroyRef, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { ContentMixTarget, ContentCategory } from '../../strategy-research.types';
import { AI_SIMULATION_DELAY_MS } from '../../strategy-research.constants';
import { safeTimeout } from '../../strategy-research.utils';

interface ContentMixEntry extends ContentMixTarget {
  actualPercent: number;
}

const DEFAULT_MIX: ContentMixEntry[] = [
  { category: 'educational',  label: 'Educational',         targetPercent: 35, color: '#3b82f6', description: 'How-tos, tips, tutorials, expert insights', actualPercent: 32 },
  { category: 'entertaining', label: 'Entertaining',        targetPercent: 25, color: '#f59e0b', description: 'Relatable content, humor, storytelling, trends', actualPercent: 28 },
  { category: 'community',    label: 'Community',           targetPercent: 20, color: '#10b981', description: 'UGC, Q&As, behind the scenes, audience spotlights', actualPercent: 18 },
  { category: 'promotional',  label: 'Promotional',         targetPercent: 15, color: '#d94e33', description: 'Products, services, offers, launches', actualPercent: 17 },
  { category: 'trending',     label: 'Trending / Reactive', targetPercent: 5,  color: '#8b5cf6', description: 'Timely content, news hooks, cultural moments', actualPercent: 5 },
];

@Component({
  selector: 'app-content-mix',
  imports: [FormsModule],
  templateUrl: './content-mix.component.html',
  styleUrl: './content-mix.component.scss',
})
export class ContentMixComponent {
  private readonly destroyRef = inject(DestroyRef);

  /* v8 ignore start */
  readonly mix = signal<ContentMixEntry[]>(DEFAULT_MIX.map(m => ({ ...m })));
  readonly isSuggesting = signal(false);
  /* v8 ignore stop */

  /* v8 ignore start */
  readonly total = computed(() =>
    this.mix().reduce((sum, m) => sum + m.targetPercent, 0)
  );

  readonly isValid = computed(() => this.total() === 100);
  /* v8 ignore stop */

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
