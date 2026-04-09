import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { ChannelStrategyEntry, Platform } from '../../strategy-research.types';
import { PLATFORM_LABELS, PLATFORM_ICONS, AI_SIMULATION_DELAY_MS } from '../../strategy-research.constants';
import { safeTimeout, toggleSetItem } from '../../strategy-research.utils';
import { DropdownComponent, DropdownOption } from '../../../../shared/dropdown/dropdown.component';

const PLATFORM_CONTENT_TYPES: Record<Platform, string[]> = {
  instagram: ['Reel', 'Carousel', 'Feed Post', 'Stories', 'Guide', 'Live'],
  tiktok: ['Short-form Video', 'Photo Carousel'],
  youtube: ['Long-form Video', 'Shorts', 'Live Stream', 'Community Post'],
  facebook: ['Feed Post', 'Link Post', 'Reel', 'Story', 'Live'],
  linkedin: ['Text Post', 'Document / Carousel', 'Article', 'Video'],
};

const AUDIENCE_OPTIONS: DropdownOption[] = [
  { value: 'active-40s', label: 'Active 40s' },
  { value: 'thriving-50s', label: 'Thriving 50s' },
  { value: 'yoga-enthusiasts', label: 'Yoga Enthusiasts' },
  { value: 'fitness-beginners', label: 'Fitness Beginners' },
  { value: 'holistic-health-seekers', label: 'Holistic Health Seekers' },
];

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
  imports: [FormsModule, DropdownComponent],
  templateUrl: './channel-strategy.component.html',
  styleUrl: './channel-strategy.component.scss',
})
export class ChannelStrategyComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly channels = signal<ChannelStrategyEntry[]>([
    { platform: 'instagram', active: true, role: 'Primary engagement and community building', primaryContentTypes: ['Reels', 'Stories', 'Carousels'], toneAdjustment: 'Warm, casual, motivational', postingCadence: '5x/week', primaryAudience: 'Active 40s', primaryGoal: 'Engagement', notes: '' },
    { platform: 'tiktok', active: true, role: 'Reach and trend-driven discovery', primaryContentTypes: ['Shorts', 'Tutorials'], toneAdjustment: 'Fun, energetic, relatable', postingCadence: '4x/week', primaryAudience: 'Active 40s', primaryGoal: 'Awareness', notes: '' },
    { platform: 'youtube', active: true, role: 'Long-form education and authority', primaryContentTypes: ['Long-form', 'Shorts', 'Tutorials'], toneAdjustment: 'Professional, supportive, thorough', postingCadence: '2x/week', primaryAudience: 'Thriving 50s', primaryGoal: 'Authority', notes: '' },
    { platform: 'facebook', active: false, role: '', primaryContentTypes: [], toneAdjustment: '', postingCadence: '', primaryAudience: '', primaryGoal: '', notes: '' },
    { platform: 'linkedin', active: false, role: '', primaryContentTypes: [], toneAdjustment: '', postingCadence: '', primaryAudience: '', primaryGoal: '', notes: '' },
  ]);

  /* v8 ignore start */
  readonly expandedPlatforms = signal<Set<Platform>>(new Set(['instagram']));
  readonly generatingPlatform = signal<Platform | null>(null);
  readonly generatingAll = signal(false);
  /* v8 ignore stop */

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
      this.generatingAll.set(false);
    }, AI_SIMULATION_DELAY_MS, this.destroyRef);
  }

  contentTypesFor(platform: Platform): string[] {
    /* v8 ignore next */
    return PLATFORM_CONTENT_TYPES[platform] ?? [];
  }
  readonly platformLabels = PLATFORM_LABELS;
  readonly platformIcons = PLATFORM_ICONS;
  readonly audienceOptions = AUDIENCE_OPTIONS;
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
  }

  updateChannel(platform: Platform, field: keyof ChannelStrategyEntry, value: string): void {
    this.channels.update(list =>
      list.map(c => c.platform === platform ? { ...c, [field]: value } : c)
    );
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
      this.generatingPlatform.set(null);
    }, AI_SIMULATION_DELAY_MS, this.destroyRef);
  }
}
