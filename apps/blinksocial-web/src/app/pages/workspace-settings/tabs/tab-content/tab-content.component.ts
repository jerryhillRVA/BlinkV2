import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceSettingsStateService } from '../../workspace-settings-state.service';
import { PLATFORM_OPTIONS, PLATFORM_DISPLAY_NAMES } from '@blinksocial/contracts';
import type { Platform } from '@blinksocial/contracts';
import type { ContentPillarContract } from '@blinksocial/contracts';
import { TooltipComponent } from '../../../../shared/tooltip/tooltip.component';

@Component({
  selector: 'app-tab-content',
  imports: [CommonModule, TooltipComponent],
  templateUrl: './tab-content.component.html',
  styleUrl: './tab-content.component.scss',
})
export class TabContentComponent {
  protected readonly state = inject(WorkspaceSettingsStateService);

  readonly platformOptions = PLATFORM_OPTIONS;

  get settings() {
    return this.state.brandVoiceSettings();
  }

  get pillars(): ContentPillarContract[] {
    return this.settings?.contentPillars ?? [];
  }

  get audienceOptions(): string[] {
    return this.settings?.audienceOptions ?? [];
  }

  audienceDisplayName(id: string): string {
    const settings = this.settings as Record<string, unknown> | null;
    const segments = (settings?.['audienceSegments'] as { id: string; description?: string }[]) ?? [];
    const match = segments.find((s) => s.id === id);
    return match?.description ?? id;
  }

  platformDisplayName(id: string): string {
    return PLATFORM_DISPLAY_NAMES[id as Platform] ?? id;
  }

  themesDisplay(pillar: ContentPillarContract): string {
    return (pillar.themes ?? []).join(', ');
  }

  addPillar(): void {
    const current = this.state.brandVoiceSettings();
    if (!current) return;
    const newPillar: ContentPillarContract = {
      id: `pillar-${Date.now()}`,
      name: '',
      description: '',
      color: '#d94e33',
      themes: [],
      audienceSegmentIds: [],
      targetPlatforms: [],
    };
    this.state.brandVoiceSettings.set({
      ...current,
      contentPillars: [...(current.contentPillars ?? []), newPillar],
    });
  }

  removePillar(index: number): void {
    const current = this.state.brandVoiceSettings();
    if (!current) return;
    const pillars = [...(current.contentPillars ?? [])];
    pillars.splice(index, 1);
    this.state.brandVoiceSettings.set({ ...current, contentPillars: pillars });
  }

  updatePillarField(index: number, field: 'name' | 'description', value: string): void {
    const current = this.state.brandVoiceSettings();
    if (!current) return;
    const pillars = (current.contentPillars ?? []).map((p, i) =>
      i === index ? { ...p, [field]: value } : p
    );
    this.state.brandVoiceSettings.set({ ...current, contentPillars: pillars });
  }

  updatePillarThemes(index: number, value: string): void {
    const current = this.state.brandVoiceSettings();
    if (!current) return;
    const themes = value.split(',').map((t) => t.trim()).filter((t) => t.length > 0);
    const pillars = (current.contentPillars ?? []).map((p, i) =>
      i === index ? { ...p, themes } : p
    );
    this.state.brandVoiceSettings.set({ ...current, contentPillars: pillars });
  }

  toggleAudience(pillarIndex: number, audience: string): void {
    const current = this.state.brandVoiceSettings();
    if (!current) return;
    const pillars = (current.contentPillars ?? []).map((p, i) => {
      if (i !== pillarIndex) return p;
      const ids = [...(p.audienceSegmentIds ?? [])];
      const pos = ids.indexOf(audience);
      if (pos >= 0) {
        ids.splice(pos, 1);
      } else {
        ids.push(audience);
      }
      return { ...p, audienceSegmentIds: ids };
    });
    this.state.brandVoiceSettings.set({ ...current, contentPillars: pillars });
  }

  togglePlatform(pillarIndex: number, platform: string): void {
    const current = this.state.brandVoiceSettings();
    if (!current) return;
    const pillars = (current.contentPillars ?? []).map((p, i) => {
      if (i !== pillarIndex) return p;
      const platforms = [...(p.targetPlatforms ?? [])];
      const pos = platforms.indexOf(platform);
      if (pos >= 0) {
        platforms.splice(pos, 1);
      } else {
        platforms.push(platform);
      }
      return { ...p, targetPlatforms: platforms };
    });
    this.state.brandVoiceSettings.set({ ...current, contentPillars: pillars });
  }

  isAudienceSelected(pillar: ContentPillarContract, audience: string): boolean {
    return (pillar.audienceSegmentIds ?? []).includes(audience);
  }

  isPlatformSelected(pillar: ContentPillarContract, platform: string): boolean {
    return (pillar.targetPlatforms ?? []).includes(platform);
  }
}
