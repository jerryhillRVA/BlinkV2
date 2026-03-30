import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceSettingsStateService } from '../../workspace-settings-state.service';
import { PLATFORM_OPTIONS, PLATFORM_DISPLAY_NAMES } from '@blinksocial/contracts';
import type { Platform } from '@blinksocial/contracts';
import { DropdownComponent } from '../../../../shared/dropdown/dropdown.component';
import type { DropdownOption } from '../../../../shared/dropdown/dropdown.component';
import { TooltipComponent } from '../../../../shared/tooltip/tooltip.component';

@Component({
  selector: 'app-tab-platforms',
  imports: [CommonModule, DropdownComponent, TooltipComponent],
  templateUrl: './tab-platforms.component.html',
  styleUrl: './tab-platforms.component.scss',
})
export class TabPlatformsComponent {
  protected readonly state = inject(WorkspaceSettingsStateService);

  readonly platformOptions = PLATFORM_OPTIONS;
  readonly platformDropdownOptions: DropdownOption[] = this.platformOptions.map((p) => ({
    value: p,
    label: PLATFORM_DISPLAY_NAMES[p] ?? p,
  }));

  get settings() {
    return this.state.platformSettings();
  }

  displayName(id: string): string {
    return PLATFORM_DISPLAY_NAMES[id as Platform] ?? id;
  }

  isPlatformEnabled(platformId: string): boolean {
    const match = this.settings?.platforms.find((p) => p.platformId === platformId);
    return match?.enabled ?? false;
  }

  updateDefaultPlatform(value: string): void {
    const current = this.state.platformSettings();
    if (!current) return;
    this.state.platformSettings.set({
      ...current,
      globalRules: { ...current.globalRules, defaultPlatform: value as Platform },
    });
  }

  updateMaxIdeas(value: string): void {
    const current = this.state.platformSettings();
    if (!current) return;
    const num = parseInt(value, 10);
    if (isNaN(num)) return;
    this.state.platformSettings.set({
      ...current,
      globalRules: { ...current.globalRules, maxIdeasPerMonth: num },
    });
  }

  togglePlatform(platformId: string): void {
    const current = this.state.platformSettings();
    if (!current) return;
    const existing = current.platforms.find((p) => p.platformId === platformId);
    if (existing) {
      const platforms = current.platforms.map((p) =>
        p.platformId === platformId ? { ...p, enabled: !p.enabled } : p
      );
      this.state.platformSettings.set({ ...current, platforms });
    } else {
      this.state.platformSettings.set({
        ...current,
        platforms: [...current.platforms, { platformId: platformId as Platform, enabled: true }],
      });
    }
  }
}
