import { Component, DestroyRef, HostBinding, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../../../core/mock-data/mock-data.service';
import { StrategyResearchStateService } from '../../strategy-research-state.service';
import type { ChannelStrategyEntry, Platform } from '../../strategy-research.types';
import { PLATFORM_LABELS, AI_SIMULATION_DELAY_MS } from '../../strategy-research.constants';
import { safeTimeout, toggleSetItem } from '../../strategy-research.utils';
import { DropdownComponent, DropdownOption } from '../../../../shared/dropdown/dropdown.component';
import { PlatformIconComponent } from '../../../../shared/platform-icon/platform-icon.component';

const PLATFORM_CONTENT_TYPES: Record<Platform, string[]> = {
  instagram: ['Reel', 'Carousel', 'Feed Post', 'Stories', 'Guide', 'Live'],
  tiktok: ['Short-form Video', 'Photo Carousel'],
  youtube: ['Long-form Video', 'Shorts', 'Live Stream', 'Community Post'],
  facebook: ['Feed Post', 'Link Post', 'Reel', 'Story', 'Live'],
  linkedin: ['Text Post', 'Document / Carousel', 'Article', 'Video'],
};

// Audience options are now derived dynamically from workspace segments (see audienceOptions computed)

const GOAL_OPTIONS: DropdownOption[] = [
  { value: 'awareness', label: 'Awareness' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'conversion', label: 'Conversion' },
  { value: 'authority', label: 'Authority' },
  { value: 'community', label: 'Community' },
  { value: 'retention', label: 'Retention' },
];

@Component({
  selector: 'app-channel-strategy',
  imports: [FormsModule, DropdownComponent, PlatformIconComponent],
  templateUrl: './channel-strategy.component.html',
  styleUrl: './channel-strategy.component.scss',
})
export class ChannelStrategyComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly mockData = inject(MockDataService);
  private readonly stateService = inject(StrategyResearchStateService);

  @HostBinding('class.is-mock-source')
  get isMockSource(): boolean {
    return this.mockData.isMock('channel-strategy');
  }

  readonly channels = this.stateService.channelStrategy;
  readonly showPlatformPicker = computed(() => this.channels().length === 0);
  readonly selectedNewPlatforms = signal<Set<Platform>>(new Set(['instagram', 'tiktok', 'youtube', 'facebook']));

  /* v8 ignore start */
  readonly expandedPlatforms = signal<Set<Platform>>(new Set(['instagram']));
  readonly generatingPlatform = signal<Platform | null>(null);
  readonly generatingAll = signal(false);
  /* v8 ignore stop */

  readonly allPlatforms: Platform[] = ['instagram', 'tiktok', 'youtube', 'facebook', 'linkedin'];

  isNewPlatformSelected(platform: Platform): boolean {
    return this.selectedNewPlatforms().has(platform);
  }

  toggleNewPlatform(platform: Platform): void {
    this.selectedNewPlatforms.update(set => toggleSetItem(set, platform));
  }

  initializeChannels(): void {
    const selected = Array.from(this.selectedNewPlatforms());
    if (selected.length === 0) return;
    const entries: ChannelStrategyEntry[] = selected.map(platform => ({
      platform,
      active: true,
      role: '',
      primaryContentTypes: [],
      toneAdjustment: '',
      postingCadence: '',
      primaryAudience: '',
      primaryGoal: '',
      notes: '',
    }));
    this.channels.set(entries);
    this.stateService.saveChannelStrategy(entries);
  }

  aiGenerateAll(): void {
    this.generatingAll.set(true);
    safeTimeout(() => {
      this.channels.update(list =>
        list.map(c => ({
          ...c,
          active: true,
          role: c.role || `AI-generated role for ${PLATFORM_LABELS[c.platform]}`,
          primaryContentTypes: c.primaryContentTypes.length ? c.primaryContentTypes : ['Reels', 'Stories', 'Tutorials'],
          toneAdjustment: c.toneAdjustment || 'Warm, authentic, and encouraging',
          postingCadence: c.postingCadence || '3x/week',
          primaryAudience: c.primaryAudience || 'Active 40s',
          primaryGoal: c.primaryGoal || 'Engagement & Growth',
          notes: c.notes || 'AI-generated strategy based on audience analysis.',
        })),
      );
      this.stateService.saveChannelStrategy(this.channels());
      this.generatingAll.set(false);
    }, AI_SIMULATION_DELAY_MS, this.destroyRef);
  }

  contentTypesFor(platform: Platform): string[] {
    /* v8 ignore next */
    return PLATFORM_CONTENT_TYPES[platform] ?? [];
  }
  readonly platformLabels = PLATFORM_LABELS;
  readonly audienceOptions = computed<DropdownOption[]>(() => {
    const segments = this.stateService.segments();
    if (segments.length === 0) return [{ value: 'general', label: 'General Audience' }];
    return segments.map(s => ({ value: s.id, label: s.name }));
  });
  readonly goalOptions = GOAL_OPTIONS;

  isExpanded(platform: Platform): boolean {
    return this.expandedPlatforms().has(platform);
  }

  toggleExpand(platform: Platform): void {
    this.expandedPlatforms.update(set => toggleSetItem(set, platform));
  }

  toggleActive(platform: Platform): void {
    this.channels.update(list =>
      list.map(c => c.platform === platform ? { ...c, active: !c.active } : c)
    );
    this.stateService.saveChannelStrategy(this.channels());
  }

  updateChannel(platform: Platform, field: keyof ChannelStrategyEntry, value: string): void {
    this.channels.update(list =>
      list.map(c => c.platform === platform ? { ...c, [field]: value } : c)
    );
    this.stateService.saveChannelStrategy(this.channels());
  }

  isContentTypeActive(channel: ChannelStrategyEntry, contentType: string): boolean {
    return channel.primaryContentTypes.includes(contentType);
  }

  toggleContentType(platform: Platform, contentType: string): void {
    this.channels.update(list =>
      list.map(c => {
        if (c.platform !== platform) return c;
        const types = c.primaryContentTypes.includes(contentType)
          ? c.primaryContentTypes.filter(t => t !== contentType)
          : [...c.primaryContentTypes, contentType];
        return { ...c, primaryContentTypes: types };
      })
    );
    this.stateService.saveChannelStrategy(this.channels());
  }

  getChannel(platform: Platform): ChannelStrategyEntry {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.channels().find(c => c.platform === platform)!;
  }

  aiGenerate(platform: Platform): void {
    this.generatingPlatform.set(platform);
    safeTimeout(() => {
      this.channels.update(list =>
        list.map(c => {
          if (c.platform !== platform) return c;
          return {
            ...c,
            active: true,
            role: `AI-generated role for ${PLATFORM_LABELS[platform]}`,
            primaryContentTypes: ['Reels', 'Stories', 'Tutorials'],
            toneAdjustment: 'Warm, authentic, and encouraging',
            postingCadence: '3x/week',
            primaryAudience: 'Active 40s',
            primaryGoal: 'Engagement & Growth',
            notes: 'AI-generated strategy based on audience analysis.',
          };
        })
      );
      this.stateService.saveChannelStrategy(this.channels());
      this.generatingPlatform.set(null);
    }, AI_SIMULATION_DELAY_MS, this.destroyRef);
  }
}
