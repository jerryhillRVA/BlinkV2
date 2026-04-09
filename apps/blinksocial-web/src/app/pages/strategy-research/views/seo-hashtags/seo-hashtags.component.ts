import { Component, DestroyRef, HostBinding, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { Platform } from '../../strategy-research.types';
import { MockDataService } from '../../../../core/mock-data/mock-data.service';
import { PLATFORM_OPTIONS, SEO_GOAL_OPTIONS, AI_SIMULATION_DELAY_MS } from '../../strategy-research.constants';
import { DEFAULT_PILLARS } from '../../strategy-research.mock-data';
import { safeTimeout, toggleSetItem } from '../../strategy-research.utils';

type HashtagTab = 'reach' | 'niche' | 'community';

interface HashtagEntry {
  tag: string;
  posts: string;
}

interface TrendingAngle {
  title: string;
  hook: string;
  virality: string;
}

interface SeoData {
  hashtags: Record<HashtagTab, HashtagEntry[]>;
  keywords: string[];
  exampleBio: string;
  checklist: string[];
  trending: TrendingAngle[];
}

const MOCK_SEO: SeoData = {
  hashtags: {
    reach: [{ tag: '#fitness', posts: '450M' }, { tag: '#workout', posts: '320M' }, { tag: '#healthylifestyle', posts: '180M' }],
    niche: [{ tag: '#over40fitness', posts: '2.1M' }, { tag: '#perimenopause', posts: '890K' }, { tag: '#midlifestrength', posts: '340K' }],
    community: [{ tag: '#strongafter40', posts: '120K' }, { tag: '#menopausewarrior', posts: '95K' }, { tag: '#agingwithgrace', posts: '67K' }],
  },
  keywords: ['perimenopause fitness', 'strength training women 40+', 'midlife wellness', 'hormone health exercise'],
  exampleBio: 'Helping women 40+ build strength, balance hormones, and thrive through perimenopause. Evidence-backed movement + community.',
  checklist: ['Open with primary keyword', 'Use keyword naturally 2-3 times', 'Include branded hashtag', 'Add location if relevant', 'Front-load value in first line', 'Use alt text on all images', 'Include a clear CTA', 'Mix hashtag tiers (reach + niche)'],
  trending: [
    { title: 'Perimenopause Fitness Myths', hook: 'Everything you were told about working out after 40 is wrong...', virality: 'Very High' },
    { title: 'Morning Routine for Hormone Balance', hook: 'I changed one thing about my morning and my energy transformed...', virality: 'High' },
  ],
};

@Component({
  selector: 'app-seo-hashtags',
  imports: [CommonModule, FormsModule],
  templateUrl: './seo-hashtags.component.html',
  styleUrl: './seo-hashtags.component.scss',
})
export class SeoHashtagsComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly mockData = inject(MockDataService);

  @HostBinding('class.is-mock-source')
  get isMockSource(): boolean {
    return this.mockData.isMock('seo-hashtags');
  }

  readonly isGenerating = signal(false);
  readonly seoData = signal<SeoData | null>(null);
  readonly activeTab = signal<HashtagTab>('reach');
  readonly checkedItems = signal<Set<number>>(new Set());

  selectedPillar = DEFAULT_PILLARS[0].name;
  selectedPlatform: Platform = 'instagram';
  selectedGoal = SEO_GOAL_OPTIONS[0];

  readonly pillarOptions = DEFAULT_PILLARS.map(p => p.name);
  readonly goalOptions = SEO_GOAL_OPTIONS;
  readonly platformOptions = PLATFORM_OPTIONS;
  readonly hashtagTabs: { id: HashtagTab; label: string }[] = [
    { id: 'reach', label: 'Reach' },
    { id: 'niche', label: 'Niche' },
    { id: 'community', label: 'Community' },
  ];

  generate(): void {
    this.isGenerating.set(true);
    this.seoData.set(null);
    safeTimeout(() => {
      this.seoData.set(MOCK_SEO);
      this.isGenerating.set(false);
    }, AI_SIMULATION_DELAY_MS, this.destroyRef);
  }

  setTab(tab: HashtagTab): void {
    this.activeTab.set(tab);
  }

  getActiveHashtags(): HashtagEntry[] {
    const data = this.seoData();
    if (!data) return [];
    return data.hashtags[this.activeTab()];
  }

  toggleCheckItem(index: number): void {
    this.checkedItems.update(set => toggleSetItem(set, index));
  }

  isChecked(index: number): boolean {
    return this.checkedItems().has(index);
  }

  getViralityClass(virality: string): string {
    switch (virality) {
      case 'Very High': return 'virality--very-high';
      case 'High': return 'virality--high';
      case 'Medium': return 'virality--medium';
      default: return '';
    }
  }

  copyTag(tag: string): void {
    navigator.clipboard?.writeText(tag);
  }
}
