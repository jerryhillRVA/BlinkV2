import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceSettingsStateService } from '../../workspace-settings-state.service';

@Component({
  selector: 'app-tab-notifications',
  imports: [CommonModule],
  templateUrl: './tab-notifications.component.html',
  styleUrl: './tab-notifications.component.scss',
})
export class TabNotificationsComponent {
  protected readonly state = inject(WorkspaceSettingsStateService);

  get settings() {
    return this.state.notificationSettings();
  }

  toggleTrigger(trigger: string): void {
    const current = this.state.notificationSettings();
    if (!current) return;
    this.state.notificationSettings.set({
      ...current,
      triggers: {
        ...current.triggers,
        [trigger]: !current.triggers[trigger as keyof typeof current.triggers],
      },
    });
  }
}
