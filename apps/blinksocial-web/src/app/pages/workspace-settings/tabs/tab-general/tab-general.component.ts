import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceSettingsStateService } from '../../workspace-settings-state.service';
import type { AudienceSegment } from '@blinksocial/contracts';
import { TooltipComponent } from '../../../../shared/tooltip/tooltip.component';

@Component({
  selector: 'app-tab-general',
  imports: [CommonModule, TooltipComponent],
  templateUrl: './tab-general.component.html',
  styleUrl: './tab-general.component.scss',
})
export class TabGeneralComponent {
  protected readonly state = inject(WorkspaceSettingsStateService);

  readonly ageRanges = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];

  get settings() {
    return this.state.generalSettings();
  }

  get segments(): AudienceSegment[] {
    return this.settings?.audienceSegments ?? [];
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

  addSegment(): void {
    const current = this.state.generalSettings();
    if (!current) return;
    const segments = [...(current.audienceSegments ?? [])];
    segments.push({ id: crypto.randomUUID(), description: '', ageRange: '25-34' });
    this.state.generalSettings.set({ ...current, audienceSegments: segments });
  }

  removeSegment(index: number): void {
    const current = this.state.generalSettings();
    if (!current) return;
    const segments = [...(current.audienceSegments ?? [])];
    segments.splice(index, 1);
    this.state.generalSettings.set({ ...current, audienceSegments: segments });
  }

  updateSegment(index: number, field: keyof AudienceSegment, value: string): void {
    const current = this.state.generalSettings();
    if (!current) return;
    const segments = [...(current.audienceSegments ?? [])].map((s) => ({ ...s }));
    if (segments[index]) {
      segments[index][field] = value;
      this.state.generalSettings.set({ ...current, audienceSegments: segments });
    }
  }
}
