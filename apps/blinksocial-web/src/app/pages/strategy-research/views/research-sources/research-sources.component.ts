import { Component, DestroyRef, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { ResearchSource } from '../../strategy-research.types';
import { AI_SIMULATION_DELAY_MS } from '../../strategy-research.constants';
import { safeTimeout, generateId } from '../../strategy-research.utils';
import { StrategyResearchStateService } from '../../strategy-research-state.service';
import { ToastService } from '../../../../core/toast/toast.service';

const TYPE_COLORS: Record<ResearchSource['type'], { bg: string; text: string }> = {
  article: { bg: 'var(--blink-icon-blue-bg)', text: 'var(--blink-icon-blue)' },
  report: { bg: 'var(--blink-icon-purple-bg)', text: 'var(--blink-icon-purple)' },
  social: { bg: 'var(--blink-icon-green-bg)', text: 'var(--blink-icon-green)' },
  news: { bg: 'var(--blink-icon-orange-bg)', text: 'var(--blink-icon-orange)' },
  video: { bg: 'var(--blink-brand-primary-lightest-bg)', text: 'var(--blink-brand-primary)' },
};

@Component({
  selector: 'app-research-sources',
  imports: [FormsModule],
  templateUrl: './research-sources.component.html',
  styleUrl: './research-sources.component.scss',
})
export class ResearchSourcesComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly stateService = inject(StrategyResearchStateService);
  private readonly toast = inject(ToastService);

  readonly sources = this.stateService.researchSources;
  readonly pillars = this.stateService.pillars;
  readonly filterPillarId = signal<string>('all');
  readonly isDiscovering = signal(false);

  readonly typeColors = TYPE_COLORS;

  readonly showAddForm = signal(false);
  newTitle = '';
  newUrl = '';
  newType: ResearchSource['type'] = 'article';
  newRelevance = 80;
  newPillarIds = signal<Set<string>>(new Set());
  newSummary = '';

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
    safeTimeout(() => {
      const newSource: ResearchSource = {
        id: generateId('rs'),
        title: 'AI-Discovered: Perimenopause Exercise Guidelines 2026',
        url: 'https://example.com/ai-discovered',
        type: 'report',
        relevance: 94,
        pillarIds: ['p1', 'p3'],
        summary: 'New research on optimal exercise protocols for women experiencing perimenopause, including strength training and yoga recommendations.',
        discoveredAt: new Date().toISOString(),
      };
      const updated = [newSource, ...this.sources()];
      this.stateService.saveResearchSources(updated);
      this.isDiscovering.set(false);
      this.toast.showSuccess('New source discovered');
    }, AI_SIMULATION_DELAY_MS, this.destroyRef);
  }

  openAddForm(): void {
    this.newTitle = '';
    this.newUrl = '';
    this.newType = 'article';
    this.newRelevance = 80;
    this.newPillarIds.set(new Set());
    this.newSummary = '';
    this.showAddForm.set(true);
  }

  cancelAdd(): void {
    this.showAddForm.set(false);
  }

  togglePillarTag(pillarId: string): void {
    this.newPillarIds.update(set => {
      const next = new Set(set);
      if (next.has(pillarId)) next.delete(pillarId);
      else next.add(pillarId);
      return next;
    });
  }

  isPillarSelected(pillarId: string): boolean {
    return this.newPillarIds().has(pillarId);
  }

  addSource(): void {
    if (!this.newTitle.trim()) return;
    const source: ResearchSource = {
      id: generateId('rs'),
      title: this.newTitle.trim(),
      url: this.newUrl.trim(),
      type: this.newType,
      relevance: this.newRelevance,
      pillarIds: Array.from(this.newPillarIds()),
      summary: this.newSummary.trim(),
      discoveredAt: new Date().toISOString(),
    };
    const updated = [source, ...this.sources()];
    this.stateService.saveResearchSources(updated);
    this.showAddForm.set(false);
    this.toast.showSuccess('Source added');
  }

  createIdea(_source: ResearchSource): void {
    // Placeholder for future implementation
  }

  startProduction(_source: ResearchSource): void {
    // Placeholder for future implementation
  }
}
