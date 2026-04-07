import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  type ChannelStrategyEntry,
  type Platform,
} from '../../strategy-research.types';

const CONTENT_TYPE_OPTIONS = [
  'Reels', 'Stories', 'Carousels', 'Long-form', 'Shorts',
  'Lives', 'Threads', 'Polls', 'Articles', 'Tutorials',
];

const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
};

const PLATFORM_ICONS: Record<Platform, string> = {
  instagram: 'M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2Zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6ZM16.5 6.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  tiktok: 'M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5',
  youtube: 'M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17ZM10 15l5-3-5-3v6Z',
  facebook: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z',
  linkedin: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
};

@Component({
  selector: 'app-channel-strategy',
  imports: [CommonModule, FormsModule],
  templateUrl: './channel-strategy.component.html',
  styleUrl: './channel-strategy.component.scss',
})
export class ChannelStrategyComponent {
  private readonly destroyRef = inject(DestroyRef);
  private timerId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.timerId !== null) clearTimeout(this.timerId);
    });
  }

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
    this.expandedPlatforms.update(set => {
      const next = new Set(set);
      if (next.has(platform)) {
        next.delete(platform);
      } else {
        next.add(platform);
      }
      return next;
    });
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
    this.timerId = setTimeout(() => {
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
      this.timerId = null;
    }, 2500);
  }
}
