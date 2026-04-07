import { Component, DestroyRef, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  type ResearchSource,
  type ContentPillar,
  MOCK_RESEARCH_SOURCES,
  DEFAULT_PILLARS,
} from '../../strategy-research.types';

const TYPE_COLORS: Record<ResearchSource['type'], { bg: string; text: string }> = {
  article: { bg: 'var(--blink-icon-blue-bg)', text: 'var(--blink-icon-blue)' },
  report: { bg: 'var(--blink-icon-purple-bg)', text: 'var(--blink-icon-purple)' },
  social: { bg: 'var(--blink-icon-green-bg)', text: 'var(--blink-icon-green)' },
  news: { bg: 'var(--blink-icon-orange-bg)', text: 'var(--blink-icon-orange)' },
  video: { bg: 'var(--blink-brand-primary-lightest-bg)', text: 'var(--blink-brand-primary)' },
};

@Component({
  selector: 'app-research-sources',
  imports: [CommonModule, FormsModule],
  templateUrl: './research-sources.component.html',
  styleUrl: './research-sources.component.scss',
})
export class ResearchSourcesComponent {
  private readonly destroyRef = inject(DestroyRef);
  private timerId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.timerId !== null) clearTimeout(this.timerId);
    });
  }

  readonly sources = signal<ResearchSource[]>([...MOCK_RESEARCH_SOURCES]);
  readonly pillars = signal<ContentPillar[]>([...DEFAULT_PILLARS]);
  readonly filterPillarId = signal<string>('all');
  readonly isDiscovering = signal(false);

  readonly typeColors = TYPE_COLORS;

  readonly filteredSources = computed(() => {
    const filter = this.filterPillarId();
    const all = this.sources();
    if (filter === 'all') return all;
    return all.filter(s => s.pillarIds.includes(filter));
  });

  getPillarName(pillarId: string): string {
    return this.pillars().find(p => p.id === pillarId)?.name ?? pillarId;
  }

  getPillarColor(pillarId: string): string {
    return this.pillars().find(p => p.id === pillarId)?.color ?? 'var(--blink-on-surface-muted)';
  }

  getTypeBadgeStyle(type: ResearchSource['type']): { background: string; color: string } {
    const colors = this.typeColors[type] ?? { bg: 'var(--blink-surface-container-low)', text: 'var(--blink-on-surface-muted)' };
    return { background: colors.bg, color: colors.text };
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  discoverSources(): void {
    this.isDiscovering.set(true);
    this.timerId = setTimeout(() => {
      const newSource: ResearchSource = {
        id: `rs-${Date.now()}`,
        title: 'AI-Discovered: Perimenopause Exercise Guidelines 2026',
        url: 'https://example.com/ai-discovered',
        type: 'report',
        relevance: 94,
        pillarIds: ['p1', 'p3'],
        summary: 'New research on optimal exercise protocols for women experiencing perimenopause, including strength training and yoga recommendations.',
        discoveredAt: new Date().toISOString(),
      };
      this.sources.update(list => [newSource, ...list]);
      this.isDiscovering.set(false);
      this.timerId = null;
    }, 2500);
  }

  createIdea(_source: ResearchSource): void {
    // Placeholder for future implementation
  }

  startProduction(_source: ResearchSource): void {
    // Placeholder for future implementation
  }
}
