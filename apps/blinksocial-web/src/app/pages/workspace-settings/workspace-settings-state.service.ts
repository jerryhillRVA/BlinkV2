import { Injectable, inject, signal, computed } from '@angular/core';
import { WorkspaceSettingsApiService } from './workspace-settings-api.service';
import type { SettingsTab } from '@blinksocial/contracts';
import type { GeneralSettingsContract } from '@blinksocial/contracts';
import type { PlatformSettingsContract } from '@blinksocial/contracts';
import type { BrandVoiceSettingsContract } from '@blinksocial/contracts';
import type { SkillSettingsContract } from '@blinksocial/contracts';
import type { TeamSettingsContract } from '@blinksocial/contracts';
import type { NotificationSettingsContract } from '@blinksocial/contracts';
import type { CalendarSettingsContract } from '@blinksocial/contracts';
import type { SecuritySettingsContract } from '@blinksocial/contracts';

@Injectable()
export class WorkspaceSettingsStateService {
  private readonly api = inject(WorkspaceSettingsApiService);

  readonly workspaceId = signal('');
  readonly activeTab = signal<SettingsTab>('general');
  readonly loading = signal(false);
  readonly saving = signal(false);

  /** Temp password from user creation — survives tab reload */
  readonly tempPassword = signal<string | null>(null);
  readonly tempPasswordEmail = signal<string | null>(null);

  readonly generalSettings = signal<GeneralSettingsContract | null>(null);
  readonly platformSettings = signal<PlatformSettingsContract | null>(null);
  readonly brandVoiceSettings = signal<BrandVoiceSettingsContract | null>(null);
  readonly skillSettings = signal<SkillSettingsContract | null>(null);
  readonly teamSettings = signal<TeamSettingsContract | null>(null);
  readonly notificationSettings = signal<NotificationSettingsContract | null>(null);
  readonly calendarSettings = signal<CalendarSettingsContract | null>(null);
  readonly securitySettings = signal<SecuritySettingsContract | null>(null);

  private readonly originalData = new Map<SettingsTab, unknown>();

  readonly isDirty = computed(() => {
    const tab = this.activeTab();
    const current = this.getCurrentTabData(tab);
    const original = this.originalData.get(tab);
    if (!current || !original) return false;
    return JSON.stringify(current) !== JSON.stringify(original);
  });

  private readonly tabToSignalMap: Record<SettingsTab, () => unknown> = {
    general: () => this.generalSettings(),
    platforms: () => this.platformSettings(),
    'brand-voice': () => this.brandVoiceSettings(),
    content: () => this.brandVoiceSettings(),
    agents: () => this.skillSettings(),
    team: () => this.teamSettings(),
    notifications: () => this.notificationSettings(),
    calendar: () => this.calendarSettings(),
    security: () => this.securitySettings(),
  };

  private readonly tabToApiTab: Record<SettingsTab, string> = {
    general: 'general',
    platforms: 'platforms',
    'brand-voice': 'brand-voice',
    content: 'brand-voice',
    agents: 'skills',
    team: 'team',
    notifications: 'notifications',
    calendar: 'calendar',
    security: 'security',
  };

  getCurrentTabData(tab: SettingsTab): unknown {
    return this.tabToSignalMap[tab]();
  }

  loadTab(tab: SettingsTab): void {
    this.activeTab.set(tab);
    const apiTab = this.tabToApiTab[tab];
    this.loading.set(true);

    this.api.getSettings(this.workspaceId(), apiTab).subscribe({
      next: (data) => {
        this.setTabData(tab, data);
        this.originalData.set(tab, structuredClone(data));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  saveTab(tab: SettingsTab): void {
    const data = this.getCurrentTabData(tab);
    if (!data) return;
    const apiTab = this.tabToApiTab[tab];
    this.saving.set(true);

    this.api.saveSettings(this.workspaceId(), apiTab, data).subscribe({
      next: (saved) => {
        this.originalData.set(tab, structuredClone(saved));
        this.saving.set(false);
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }

  private setTabData(tab: SettingsTab, data: unknown): void {
    switch (tab) {
      case 'general':
        this.generalSettings.set(data as GeneralSettingsContract);
        break;
      case 'platforms':
        this.platformSettings.set(data as PlatformSettingsContract);
        break;
      case 'brand-voice':
      case 'content':
        this.brandVoiceSettings.set(data as BrandVoiceSettingsContract);
        break;
      case 'agents':
        this.skillSettings.set(data as SkillSettingsContract);
        break;
      case 'team':
        this.teamSettings.set(data as TeamSettingsContract);
        break;
      case 'notifications':
        this.notificationSettings.set(data as NotificationSettingsContract);
        break;
      case 'calendar':
        this.calendarSettings.set(data as CalendarSettingsContract);
        break;
      case 'security':
        this.securitySettings.set(data as SecuritySettingsContract);
        break;
    }
  }
}
