import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { Platform } from '../../../strategy-research.types';
import { AI_SIMULATION_DELAY_MS, PLATFORM_LABELS } from '../../../strategy-research.constants';
import { safeTimeout } from '../../../strategy-research.utils';
import { ToastService } from '../../../../../core/toast/toast.service';
import { StrategyResearchStateService } from '../../../strategy-research-state.service';

const FALLBACK_PLATFORMS: Platform[] = ['instagram', 'tiktok', 'youtube', 'facebook', 'linkedin'];

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
  private readonly toast = inject(ToastService);
  private readonly stateService = inject(StrategyResearchStateService);

  readonly activePlatforms = computed<Platform[]>(() => {
    const channels = this.stateService.channelStrategy();
    const active = channels.filter(c => c.active).map(c => c.platform as Platform);
    return active.length > 0 ? active : FALLBACK_PLATFORMS;
  });

  readonly adjustments = computed(() => {
    const stored = this.stateService.brandVoice().platformToneAdjustments;
    const platforms = this.activePlatforms();
    return platforms.map(p => {
      const existing = stored.find(s => s.platform === p);
      return { platform: p, adjustment: existing?.adjustment ?? '' };
    });
  });
  readonly suggestingPlatform = signal<Platform | null>(null);

  readonly platformLabels = PLATFORM_LABELS;

  updateAdjustment(platform: Platform, value: string): void {
    this.stateService.brandVoice.update(bv => {
      const platforms = this.activePlatforms();
      const updated = platforms.map(p => {
        if (p === platform) return { platform: p, adjustment: value };
        const existing = bv.platformToneAdjustments.find(s => s.platform === p);
        return { platform: p, adjustment: existing?.adjustment ?? '' };
      });
      return { ...bv, platformToneAdjustments: updated };
    });
  }

  saveAdjustments(): void {
    this.stateService.saveBrandVoice(this.stateService.brandVoice());
    this.toast.showSuccess('Platform tone updated');
  }

  suggestTone(platform: Platform): void {
    this.suggestingPlatform.set(platform);
    safeTimeout(() => {
      const suggestion = MOCK_PLATFORM_SUGGESTIONS[platform] ?? '';
      this.updateAdjustment(platform, suggestion);
      this.stateService.saveBrandVoice(this.stateService.brandVoice());
      this.toast.showSuccess('Tone suggestion applied');
      this.suggestingPlatform.set(null);
    }, AI_SIMULATION_DELAY_MS, this.destroyRef);
  }
}
