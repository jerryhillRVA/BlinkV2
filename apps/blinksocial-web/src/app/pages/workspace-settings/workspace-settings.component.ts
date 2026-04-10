import { Component, inject, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WorkspaceSettingsStateService } from './workspace-settings-state.service';
import { TabGeneralComponent } from './tabs/tab-general/tab-general.component';
import { TabPlatformsComponent } from './tabs/tab-platforms/tab-platforms.component';
import { TabAgentsComponent } from './tabs/tab-agents/tab-agents.component';
import { TabTeamComponent } from './tabs/tab-team/tab-team.component';
import { TabNotificationsComponent } from './tabs/tab-notifications/tab-notifications.component';
import { TabCalendarComponent } from './tabs/tab-calendar/tab-calendar.component';
import { TabSecurityComponent } from './tabs/tab-security/tab-security.component';
import { AuthService } from '../../core/auth/auth.service';
import type { SettingsTab } from '@blinksocial/contracts';

interface TabDef {
  id: SettingsTab;
  label: string;
  saveLabel: string;
  icon: string;
}

@Component({
  selector: 'app-workspace-settings',
  imports: [
    CommonModule,
    TabGeneralComponent,
    TabPlatformsComponent,
    TabAgentsComponent,
    TabTeamComponent,
    TabNotificationsComponent,
    TabCalendarComponent,
    TabSecurityComponent,
  ],
  providers: [WorkspaceSettingsStateService],
  templateUrl: './workspace-settings.component.html',
  styleUrl: './workspace-settings.component.scss',
})
export class WorkspaceSettingsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly state = inject(WorkspaceSettingsStateService);
  protected readonly authService = inject(AuthService);

  readonly isAdmin = computed(() => {
    const wsId = this.state.workspaceId();
    return wsId ? this.authService.isAdmin(wsId) : false;
  });

  readonly tabs: TabDef[] = [
    { id: 'general', label: 'General', saveLabel: 'Save Workspace Identity', icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z' },
    { id: 'platforms', label: 'Platforms', saveLabel: 'Save Platform Settings', icon: 'M21 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM9 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 19a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM8.59 13.51L15.42 17.49M15.41 6.51L8.59 10.49' },
    { id: 'agents', label: 'Agents', saveLabel: 'Save All Agents', icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
    { id: 'team', label: 'Team', saveLabel: 'Save Team Settings', icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM16 11l2 2 4-4' },
    { id: 'notifications', label: 'Notifications', saveLabel: 'Save Notification Settings', icon: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0' },
    { id: 'calendar', label: 'Calendar', saveLabel: 'Save Templates', icon: 'M8 2v4M16 2v4M3 10h18M21 8v13H3V8zM3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2H3zM8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01' },
    { id: 'security', label: 'Security', saveLabel: 'Save Security Settings', icon: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .6-.92l7-3.11a1 1 0 0 1 .8 0l7 3.11A1 1 0 0 1 20 6zM9 12l2 2 4-4' },
  ];

  private currentWsId = '';

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const id = params.get('id') ?? '';
        if (id !== this.currentWsId) {
          this.currentWsId = id;
          this.state.workspaceId.set(id);
          this.state.loadTab('general');
        }
      });
  }

  get activeTabDef(): TabDef {
    return this.tabs.find((t) => t.id === this.state.activeTab()) ?? this.tabs[0];
  }

  onTabChange(tab: SettingsTab): void {
    this.state.loadTab(tab);
  }

  onSave(): void {
    this.state.saveTab(this.state.activeTab());
  }
}
