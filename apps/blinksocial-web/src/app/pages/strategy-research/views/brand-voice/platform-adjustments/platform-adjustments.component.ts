import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { Platform } from '../../../strategy-research.types';
import { PLATFORM_LABELS } from '../../../strategy-research.constants';
import { safeTimeout } from '../../../strategy-research.utils';

const ALL_PLATFORMS: Platform[] = ['instagram', 'tiktok', 'youtube', 'facebook', 'linkedin'];

const MOCK_PLATFORM_SUGGESTIONS: Record<string, string> = {
  instagram: 'Warm, visual storytelling. Use emojis sparingly. Captions can be medium-length with a strong hook.',
  tiktok: 'Fast-paced and conversational — mirror trending audio language. Hook within 2 seconds.',
  youtube: 'Thorough and evidence-backed. Viewers opt in for depth — reward them with real value.',
  facebook: 'Community-first. Ask questions, celebrate wins, invite discussion.',
  linkedin: 'Professional but human — share expertise with personal context.',
};

@Component({
  selector: 'app-platform-adjustments',
  imports: [FormsModule],
  templateUrl: './platform-adjustments.component.html',
  styleUrl: './platform-adjustments.component.scss',
})
export class PlatformAdjustmentsComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly adjustments = signal(ALL_PLATFORMS.map(p => ({ platform: p, adjustment: '' })));
  readonly suggestingPlatform = signal<Platform | null>(null);

  readonly platformLabels = PLATFORM_LABELS;

  updateAdjustment(platform: Platform, value: string): void {
    this.adjustments.update(list =>
      list.map(p => p.platform === platform ? { ...p, adjustment: value } : p)
    );
  }

  suggestTone(platform: Platform): void {
    this.suggestingPlatform.set(platform);
    safeTimeout(() => {
      const suggestion = MOCK_PLATFORM_SUGGESTIONS[platform] ?? '';
      this.updateAdjustment(platform, suggestion);
      this.suggestingPlatform.set(null);
    }, 1500, this.destroyRef);
  }
}
