import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { ChannelStrategyEntry, Platform } from '../../strategy-research.types';
import { PLATFORM_LABELS, PLATFORM_ICONS, AI_SIMULATION_DELAY_MS } from '../../strategy-research.constants';
import { safeTimeout, toggleSetItem } from '../../strategy-research.utils';

const CONTENT_TYPE_OPTIONS = [
  'Reels', 'Stories', 'Carousels', 'Long-form', 'Shorts',
  'Lives', 'Threads', 'Polls', 'Articles', 'Tutorials',
];

@Component({
  selector: 'app-channel-strategy',
  imports: [FormsModule],
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

  readonly expandedPlatforms = signal<Set<Platform>>(new Set(['instagram']));
  readonly generatingPlatform = signal<Platform | null>(null);

  readonly contentTypeOptions = CONTENT_TYPE_OPTIONS;
  readonly platformLabels = PLATFORM_LABELS;
  readonly platformIcons = PLATFORM_ICONS;

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
