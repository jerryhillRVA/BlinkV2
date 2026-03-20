import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceSettingsStateService } from '../../workspace-settings-state.service';
import { expandPanel } from '../../../../core/animations/expand-panel.animation';
import type { SkillConfigContract } from '@blinksocial/contracts';

@Component({
  selector: 'app-tab-agents',
  imports: [CommonModule],
  templateUrl: './tab-agents.component.html',
  styleUrl: './tab-agents.component.scss',
  animations: [expandPanel],
})
export class TabAgentsComponent {
  protected readonly state = inject(WorkspaceSettingsStateService);
  editingIndex = signal<number | null>(null);

  get settings() {
    return this.state.skillSettings();
  }

  get agents(): SkillConfigContract[] {
    return this.settings?.skills ?? [];
  }

  toggleEdit(index: number): void {
    this.editingIndex.set(this.editingIndex() === index ? null : index);
  }

  updateAgentField(index: number, field: 'name' | 'role' | 'persona', value: string): void {
    const current = this.state.skillSettings();
    if (!current) return;
    const skills = current.skills.map((s, i) =>
      i === index ? { ...s, [field]: value } : s
    );
    this.state.skillSettings.set({ ...current, skills });
  }

  addAgent(): void {
    const current = this.state.skillSettings();
    if (!current) return;
    const newAgent: SkillConfigContract = {
      id: `agent-${Date.now()}`,
      skillId: '',
      name: 'New Agent',
      role: '',
      persona: '',
      responsibilities: [],
      enabled: true,
    };
    const skills = [...current.skills, newAgent];
    this.state.skillSettings.set({ ...current, skills });
    this.editingIndex.set(skills.length - 1);
  }

  removeAgent(index: number): void {
    const current = this.state.skillSettings();
    if (!current) return;
    const skills = current.skills.filter((_, i) => i !== index);
    this.state.skillSettings.set({ ...current, skills });
  }
}
