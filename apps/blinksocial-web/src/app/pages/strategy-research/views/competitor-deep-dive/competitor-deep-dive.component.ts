import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { CompetitorInsight, Platform } from '../../strategy-research.types';
import { PLATFORM_LABELS, PLATFORM_ICONS, AI_SIMULATION_DELAY_MS } from '../../strategy-research.constants';
import { MOCK_COMPETITOR_INSIGHTS } from '../../strategy-research.mock-data';
import { safeTimeout, generateId, toggleSetItem } from '../../strategy-research.utils';

@Component({
  selector: 'app-competitor-deep-dive',
  imports: [CommonModule, FormsModule],
  templateUrl: './competitor-deep-dive.component.html',
  styleUrl: './competitor-deep-dive.component.scss',
})
export class CompetitorDeepDiveComponent {
  private readonly destroyRef = inject(DestroyRef);

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
    safeTimeout(() => {
      this.isScanning.set(false);
    }, AI_SIMULATION_DELAY_MS, this.destroyRef);
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
      id: generateId('ci'),
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
