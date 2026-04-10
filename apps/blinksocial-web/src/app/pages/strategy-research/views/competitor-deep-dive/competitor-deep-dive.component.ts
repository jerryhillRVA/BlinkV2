import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { CompetitorInsight, Platform } from '../../strategy-research.types';
import { PLATFORM_LABELS, PLATFORM_ICONS, AI_SIMULATION_DELAY_MS } from '../../strategy-research.constants';
import { safeTimeout, generateId, toggleSetItem } from '../../strategy-research.utils';
import { StrategyResearchStateService } from '../../strategy-research-state.service';

@Component({
  selector: 'app-competitor-deep-dive',
  imports: [CommonModule, FormsModule],
  templateUrl: './competitor-deep-dive.component.html',
  styleUrl: './competitor-deep-dive.component.scss',
})
export class CompetitorDeepDiveComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly stateService = inject(StrategyResearchStateService);

  readonly competitors = this.stateService.competitorInsights;
  readonly showAddForm = signal(false);
  readonly expandedIds = signal<Set<string>>(new Set());
  readonly isScanning = signal(false);

  // Add form state
  newCompetitor = '';
  newPlatform: Platform = 'instagram';
  newContentType = '';
  newTopic = '';
  newRelevancy: CompetitorInsight['relevancyLevel'] = 'Medium';
  newFrequency = '';

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
      const scannedInsights: CompetitorInsight[] = [
        {
          id: generateId('ci'),
          competitor: 'Competitor A (AI-discovered)',
          platform: 'instagram',
          contentType: 'Reels & Carousels',
          topic: 'Industry tips and behind-the-scenes',
          relevancyLevel: 'High',
          frequency: '4x/week',
          insight: 'Strong engagement on educational Reels. Carousels drive saves. Opportunity to differentiate with more authentic storytelling.',
        },
        {
          id: generateId('ci'),
          competitor: 'Competitor B (AI-discovered)',
          platform: 'tiktok',
          contentType: 'Short-form Video',
          topic: 'Trending challenges and tutorials',
          relevancyLevel: 'Very High',
          frequency: 'Daily',
          insight: 'Rapid follower growth via trend-jacking. Weak on educational depth — a gap you can fill with expert-backed content.',
        },
        {
          id: generateId('ci'),
          competitor: 'Competitor C (AI-discovered)',
          platform: 'youtube',
          contentType: 'Long-form Video',
          topic: 'In-depth guides and reviews',
          relevancyLevel: 'Medium',
          frequency: '1x/week',
          insight: 'High watch time on 10-15 min videos. Low posting frequency leaves room for consistent competitors to capture search traffic.',
        },
      ];
      const updated = [...scannedInsights, ...this.competitors()];
      this.stateService.saveCompetitorInsights(updated);
      this.isScanning.set(false);
    }, AI_SIMULATION_DELAY_MS, this.destroyRef);
  }

  runTeardown(id: string): void {
    this.competitors.update(list => list.filter(c => c.id !== id));
    this.stateService.saveCompetitorInsights(this.competitors());
  }

  openAddForm(): void {
    this.newCompetitor = '';
    this.newPlatform = 'instagram';
    this.newContentType = '';
    this.newTopic = '';
    this.newRelevancy = 'Medium';
    this.newFrequency = '';
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
      relevancyLevel: this.newRelevancy,
      frequency: this.newFrequency.trim() || 'Unknown',
      insight: '',
    };
    const updated = [...this.competitors(), insight];
    this.stateService.saveCompetitorInsights(updated);
    this.showAddForm.set(false);
  }
}
