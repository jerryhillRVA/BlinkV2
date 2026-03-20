import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceSettingsStateService } from '../../workspace-settings-state.service';

@Component({
  selector: 'app-tab-security',
  imports: [CommonModule],
  templateUrl: './tab-security.component.html',
  styleUrl: './tab-security.component.scss',
})
export class TabSecurityComponent {
  protected readonly state = inject(WorkspaceSettingsStateService);

  get settings() {
    return this.state.securitySettings();
  }
}
