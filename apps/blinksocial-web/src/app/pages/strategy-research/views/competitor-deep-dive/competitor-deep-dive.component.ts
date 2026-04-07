import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  type CompetitorInsight,
  type Platform,
  MOCK_COMPETITOR_INSIGHTS,
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

  readonly platformLabels: Record<Platform, string> = {
    instagram: 'Instagram',
    tiktok: 'TikTok',
    youtube: 'YouTube',
    facebook: 'Facebook',
    linkedin: 'LinkedIn',
  };

  readonly platformIcons: Record<Platform, string> = {
    instagram: 'M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 0 2.5 1.25 1.25 0 0 1 0-2.5M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10m0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
    tiktok: 'M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5',
    youtube: 'M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17M10 15l5-3-5-3z',
    facebook: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z',
    linkedin: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  };

  getRelevancyClass(level: string): string {
    switch (level) {
      case 'Very High': return 'relevancy--very-high';
      case 'High': return 'relevancy--high';
      case 'Medium': return 'relevancy--medium';
      default: return '';
    }
  }

  toggleExpand(id: string): void {
    this.expandedIds.update(set => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
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
