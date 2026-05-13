import { Component, DestroyRef, HostBinding, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type {
  ContentPillar,
  HashtagEntry,
  HashtagTab,
  Platform,
  SeoData,
} from '../../strategy-research.types';
import { MockDataService } from '../../../../core/mock-data/mock-data.service';
import { AI_SIMULATION_DELAY_MS, SEO_GOAL_OPTIONS } from '../../strategy-research.constants';
import { DEFAULT_PILLARS, MOCK_SEO } from '../../strategy-research.mock-data';
import { safeTimeout, toggleSetItem } from '../../strategy-research.utils';
import { DropdownComponent, DropdownOption } from '../../../../shared/dropdown/dropdown.component';

@Component({
  selector: 'app-seo-hashtags',
  imports: [FormsModule, DropdownComponent],
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

  /* v8 ignore start */
  readonly pillars = signal<ContentPillar[]>([...DEFAULT_PILLARS]);
  readonly selectedPillarId = signal<string>(DEFAULT_PILLARS[0]?.id ?? '');
  readonly selectedPlatform = signal<Platform>('instagram');
  readonly selectedGoal = signal<string>(SEO_GOAL_OPTIONS[0]);
  readonly isGenerating = signal(false);
  readonly seoData = signal<SeoData | null>(null);
  readonly activeTab = signal<HashtagTab>('reach');
  readonly checkedItems = signal<Set<number>>(new Set());
  readonly copiedHashtag = signal<string | null>(null);
  readonly copiedTab = signal<HashtagTab | null>(null);
  readonly copiedBio = signal(false);
  readonly angleTitles = signal<Record<number, string>>({});
  readonly angleIdeaTitles = signal<Record<number, string>>({});
  readonly savedAngles = signal<Set<number>>(new Set());
  /* v8 ignore stop */

  readonly canGenerate = computed(() =>
    !!this.selectedPillarId() && !!this.selectedPlatform() && !!this.selectedGoal()
  );

  readonly selectedPillar = computed(() =>
    this.pillars().find(p => p.id === this.selectedPillarId()) ?? null
  );

  readonly pillarDropdownOptions: DropdownOption[] = DEFAULT_PILLARS.map(p => ({ value: p.id, label: p.name, color: p.color }));
  readonly goalDropdownOptions: DropdownOption[] = SEO_GOAL_OPTIONS.map(g => ({ value: g, label: g }));
  readonly platformDropdownOptions: DropdownOption[] = [
    { value: 'instagram', label: 'Instagram' },
    { value: 'tiktok',    label: 'TikTok'    },
    { value: 'youtube',   label: 'YouTube'   },
    { value: 'linkedin',  label: 'LinkedIn'  },
    { value: 'facebook',  label: 'Facebook'  },
  ];

  readonly hashtagTabs: { id: HashtagTab; label: string }[] = [
    { id: 'reach',     label: 'Reach' },
    { id: 'niche',     label: 'Niche' },
    { id: 'community', label: 'Community' },
  ];

  setPillar(value: string): void { this.selectedPillarId.set(value); }
  setPlatform(value: string): void { this.selectedPlatform.set(value as Platform); }
  setGoal(value: string): void { this.selectedGoal.set(value); }
  setTab(tab: HashtagTab): void { this.activeTab.set(tab); }

  generate(): void {
    if (!this.canGenerate() || this.isGenerating()) return;
    this.isGenerating.set(true);
    this.seoData.set(null);
    this.checkedItems.set(new Set());
    this.copiedHashtag.set(null);
    this.copiedTab.set(null);
    this.copiedBio.set(false);
    this.angleTitles.set({});
    this.savedAngles.set(new Set());
    this.angleIdeaTitles.set({});
    safeTimeout(() => {
      const cloned: SeoData = {
        hashtags: {
          reach:     MOCK_SEO.hashtags.reach.map(h => ({ ...h })),
          niche:     MOCK_SEO.hashtags.niche.map(h => ({ ...h })),
          community: MOCK_SEO.hashtags.community.map(h => ({ ...h })),
        },
        keywords:      [...MOCK_SEO.keywords],
        searchIntents: [...MOCK_SEO.searchIntents],
        exampleBio:    MOCK_SEO.exampleBio,
        checklist:     MOCK_SEO.checklist.map(c => ({ ...c })),
        trending:      MOCK_SEO.trending.map(t => ({ ...t })),
      };
      this.seoData.set(cloned);
      const titles: Record<number, string> = {};
      const ideaTitles: Record<number, string> = {};
      cloned.trending.forEach((t, i) => {
        titles[i] = t.title;
        ideaTitles[i] = t.title;
      });
      this.angleTitles.set(titles);
      this.angleIdeaTitles.set(ideaTitles);
      this.isGenerating.set(false);
    }, AI_SIMULATION_DELAY_MS, this.destroyRef);
  }

  getActiveHashtags(): HashtagEntry[] {
    const data = this.seoData();
    return data ? data.hashtags[this.activeTab()] : [];
  }

  toggleCheckItem(index: number): void {
    this.checkedItems.update(set => toggleSetItem(set, index));
  }

  isChecked(index: number): boolean {
    return this.checkedItems().has(index);
  }

  getViralityClass(virality: string): string {
    if (virality === 'Very High') return 'virality--very-high';
    if (virality === 'High') return 'virality--high';
    if (virality === 'Medium') return 'virality--medium';
    return '';
  }

  copyTag(tag: string): void {
    /* v8 ignore next */
    navigator.clipboard?.writeText(tag);
    this.copiedHashtag.set(tag);
    safeTimeout(() => {
      if (this.copiedHashtag() === tag) this.copiedHashtag.set(null);
    }, 2000, this.destroyRef);
  }

  isCopiedHashtag(tag: string): boolean {
    return this.copiedHashtag() === tag;
  }

  copyAll(tab: HashtagTab): void {
    const data = this.seoData();
    if (!data) return;
    const joined = data.hashtags[tab].map(h => h.tag).join(' ');
    /* v8 ignore next */
    navigator.clipboard?.writeText(joined);
    this.copiedTab.set(tab);
    safeTimeout(() => {
      if (this.copiedTab() === tab) this.copiedTab.set(null);
    }, 2000, this.destroyRef);
  }

  isCopiedTab(tab: HashtagTab): boolean {
    return this.copiedTab() === tab;
  }

  copyBio(): void {
    const data = this.seoData();
    if (!data) return;
    /* v8 ignore next */
    navigator.clipboard?.writeText(data.exampleBio);
    this.copiedBio.set(true);
    safeTimeout(() => {
      this.copiedBio.set(false);
    }, 2000, this.destroyRef);
  }

  setAngleTitle(index: number, value: string): void {
    this.angleTitles.update(m => ({ ...m, [index]: value }));
  }

  setAngleIdeaTitle(index: number, value: string): void {
    this.angleIdeaTitles.update(m => ({ ...m, [index]: value }));
  }

  isAngleSaved(index: number): boolean {
    return this.savedAngles().has(index);
  }

  createIdeaForAngle(index: number): void {
    if (this.savedAngles().has(index)) return;
    this.savedAngles.update(set => new Set(set).add(index));
  }
}
