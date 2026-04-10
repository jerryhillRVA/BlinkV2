import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { CompetitorInsight, CompetitorIntel, Platform } from '../../strategy-research.types';
import { PLATFORM_LABELS, AI_SIMULATION_DELAY_MS } from '../../strategy-research.constants';
import { MOCK_COMPETITOR_INSIGHTS, MOCK_COMPETITOR_INTEL_FALLBACK } from '../../strategy-research.mock-data';
import { safeTimeout, generateId, toggleSetItem } from '../../strategy-research.utils';
import { PlatformIconComponent } from '../../../../shared/platform-icon/platform-icon.component';
import { DropdownComponent, DropdownOption } from '../../../../shared/dropdown/dropdown.component';

@Component({
  selector: 'app-competitor-deep-dive',
  imports: [CommonModule, FormsModule, PlatformIconComponent, DropdownComponent],
  templateUrl: './competitor-deep-dive.component.html',
  styleUrl: './competitor-deep-dive.component.scss',
})
export class CompetitorDeepDiveComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly competitors = signal<CompetitorInsight[]>([...MOCK_COMPETITOR_INSIGHTS]);
  readonly showAddForm = signal(false);
  readonly intelOpenIds = signal<Set<string>>(new Set());
  readonly runningIntelIds = signal<Set<string>>(new Set());
  readonly deleteConfirmId = signal<string | null>(null);
  readonly isFinding = signal(false);
  readonly isRefreshingAll = signal(false);

  newCompetitor = '';
  newPlatform: Platform = 'instagram';

  readonly platformDropdownOptions: DropdownOption[] = [
    { value: 'instagram', label: 'Instagram' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'facebook', label: 'Facebook' },
  ];

  setNewPlatform(value: string): void {
    this.newPlatform = value as Platform;
  }

  readonly platformLabels = PLATFORM_LABELS;

  getRelevancyClass(level: string): string {
    switch (level) {
      case 'Very High': return 'relevancy--very-high';
      case 'High': return 'relevancy--high';
      case 'Medium': return 'relevancy--medium';
      default: return '';
    }
  }

  engagementClass(level: string): string {
    if (level === 'Very High') return 'engagement--very-high';
    if (level === 'High') return 'engagement--high';
    return 'engagement--medium';
  }

  hasIntel(c: CompetitorInsight): boolean {
    return !!c.intel;
  }

  isIntelOpen(id: string): boolean {
    return this.intelOpenIds().has(id);
  }

  toggleIntel(id: string): void {
    this.intelOpenIds.update(set => toggleSetItem(set, id));
  }

  isRunningIntel(id: string): boolean {
    return this.runningIntelIds().has(id);
  }

  private cloneFallbackIntel(): CompetitorIntel {
    return {
      ...MOCK_COMPETITOR_INTEL_FALLBACK,
      positioning: { ...MOCK_COMPETITOR_INTEL_FALLBACK.positioning },
      contentStrategy: { ...MOCK_COMPETITOR_INTEL_FALLBACK.contentStrategy },
      gaps: {
        ...MOCK_COMPETITOR_INTEL_FALLBACK.gaps,
        uncoveredAngles: [...MOCK_COMPETITOR_INTEL_FALLBACK.gaps.uncoveredAngles],
        missedPainPoints: [...MOCK_COMPETITOR_INTEL_FALLBACK.gaps.missedPainPoints],
      },
      recommendedActions: [...MOCK_COMPETITOR_INTEL_FALLBACK.recommendedActions],
      lastUpdated: new Date().toISOString(),
    };
  }

  generateIntel(id: string): void {
    this.runningIntelIds.update(set => {
      const next = new Set(set);
      next.add(id);
      return next;
    });
    this.intelOpenIds.update(set => {
      const next = new Set(set);
      next.add(id);
      return next;
    });
    safeTimeout(() => {
      this.competitors.update(list =>
        list.map(c => (c.id === id ? { ...c, intel: c.intel ?? this.cloneFallbackIntel() } : c))
      );
      this.runningIntelIds.update(set => {
        const next = new Set(set);
        next.delete(id);
        return next;
      });
    }, AI_SIMULATION_DELAY_MS, this.destroyRef);
  }

  refreshIntel(id: string): void {
    this.competitors.update(list =>
      list.map(c =>
        c.id === id && c.intel
          ? { ...c, intel: { ...c.intel, lastUpdated: new Date().toISOString() } }
          : c
      )
    );
  }

  refreshAll(): void {
    this.isRefreshingAll.set(true);
    safeTimeout(() => {
      const stamp = new Date().toISOString();
      this.competitors.update(list =>
        list.map(c => (c.intel ? { ...c, intel: { ...c.intel, lastUpdated: stamp } } : c))
      );
      this.isRefreshingAll.set(false);
    }, AI_SIMULATION_DELAY_MS, this.destroyRef);
  }

  findCompetitors(): void {
    this.isFinding.set(true);
    safeTimeout(() => {
      const insight: CompetitorInsight = {
        id: generateId('ci'),
        competitor: 'AI-Discovered: Strong After 50',
        platform: 'instagram',
        contentType: 'Reels',
        topic: 'Strength training for women 50+',
        relevancyLevel: 'High',
        frequency: '3x/week',
        insight: 'Newly discovered competitor focused on accessible strength training for women 50+.',
      };
      this.competitors.update(list => [insight, ...list]);
      this.isFinding.set(false);
    }, AI_SIMULATION_DELAY_MS, this.destroyRef);
  }

  requestDelete(id: string): void {
    this.deleteConfirmId.set(id);
  }

  confirmDelete(id: string): void {
    this.competitors.update(list => list.filter(c => c.id !== id));
    this.deleteConfirmId.set(null);
  }

  cancelDelete(): void {
    this.deleteConfirmId.set(null);
  }

  createIdeaFromAction(_id: string, _action: string): void {
    // Placeholder — wired to ideation flow in a future task.
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  openAddForm(): void {
    this.newCompetitor = '';
    this.newPlatform = 'instagram';
    this.showAddForm.set(true);
  }

  cancelAdd(): void {
    this.showAddForm.set(false);
  }

  addCompetitor(): void {
    if (!this.newCompetitor.trim()) return;
    const insight: CompetitorInsight = {
      id: generateId('ci'),
      competitor: this.newCompetitor.trim(),
      platform: this.newPlatform,
      contentType: 'TBD',
      topic: 'TBD',
      relevancyLevel: 'Medium',
      frequency: 'Unknown',
      insight: 'Pending analysis...',
    };
    this.competitors.update(list => [...list, insight]);
    this.showAddForm.set(false);
  }
}
