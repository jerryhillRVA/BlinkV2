import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceSettingsStateService } from '../../workspace-settings-state.service';
import { TooltipComponent } from '../../../../shared/tooltip/tooltip.component';

@Component({
  selector: 'app-tab-general',
  imports: [CommonModule, TooltipComponent],
  templateUrl: './tab-general.component.html',
  styleUrl: './tab-general.component.scss',
})
export class TabGeneralComponent {
  protected readonly state = inject(WorkspaceSettingsStateService);

  get settings() {
    return this.state.generalSettings();
  }

  get brandVoice(): string {
    return this.settings?.brandVoice ?? '';
  }

  updateField(field: string, value: string): void {
    const current = this.state.generalSettings();
    if (!current) return;
    this.state.generalSettings.set({ ...current, [field]: value });
  }

  updateBrandVoice(value: string): void {
    this.updateField('brandVoice', value);
  }
}
