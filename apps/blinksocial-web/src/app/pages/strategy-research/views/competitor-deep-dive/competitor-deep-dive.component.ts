import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  type CompetitorInsight,
  type Platform,
  MOCK_COMPETITOR_INSIGHTS,
  PLATFORM_LABELS,
  PLATFORM_ICONS,
  toggleSetItem,
} from '../../strategy-research.types';

@Component({
  selector: 'app-competitor-deep-dive',
  imports: [CommonModule, FormsModule],
  templateUrl: './competitor-deep-dive.component.html',
  styleUrl: './competitor-deep-dive.component.scss',
})
export class CompetitorDeepDiveComponent {
  private readonly destroyRef = inject(DestroyRef);
  private timerId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.timerId !== null) clearTimeout(this.timerId);
    });
  }

  readonly competitors = signal<CompetitorInsight[]>([...MOCK_COMPETITOR_INSIGHTS]);
  readonly showAddForm = signal(false);
  readonly expandedIds = signal<Set<string>>(new Set());
  readonly isScanning = signal(false);

  // Add form state
  newCompetitor = '';
  newPlatform: Platform = 'instagram';
  newContentType = '';
  newTopic = '';

  readonly platformLabels = PLATFORM_LABELS;
  readonly platformIcons = PLATFORM_ICONS;

  getRelevancyClass(level: string): string {
    switch (level) {
      case 'Very High': return 'relevancy--very-high';
      case 'High': return 'relevancy--high';
      case 'Medium': return 'relevancy--medium';
      default: return '';
    }
  }

  toggleExpand(id: string): void {
    this.expandedIds.update(set => toggleSetItem(set, id));
  }

  isExpanded(id: string): boolean {
    return this.expandedIds().has(id);
  }

  runAiScan(): void {
    this.isScanning.set(true);
    this.timerId = setTimeout(() => {
      this.isScanning.set(false);
      this.timerId = null;
    }, 2500);
  }

  runTeardown(_id: string): void {
    // placeholder for teardown action
  }

  openAddForm(): void {
    this.newCompetitor = '';
    this.newPlatform = 'instagram';
    this.newContentType = '';
    this.newTopic = '';
    this.showAddForm.set(true);
  }

  cancelAdd(): void {
    this.showAddForm.set(false);
  }

  addCompetitor(): void {
    if (!this.newCompetitor.trim()) return;
    const insight: CompetitorInsight = {
      id: `ci-${Date.now()}`,
      competitor: this.newCompetitor.trim(),
      platform: this.newPlatform,
      contentType: this.newContentType.trim() || 'General',
      topic: this.newTopic.trim() || 'TBD',
      relevancyLevel: 'Medium',
      frequency: 'Unknown',
      insight: 'Pending analysis...',
    };
    this.competitors.update(list => [...list, insight]);
    this.showAddForm.set(false);
  }
}
