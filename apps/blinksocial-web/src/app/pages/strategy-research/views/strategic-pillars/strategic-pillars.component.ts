import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { ContentPillar, PillarGoal } from '../../strategy-research.types';
import { PRESET_COLORS, AI_SIMULATION_DELAY_MS } from '../../strategy-research.constants';
import { DEFAULT_PILLARS } from '../../strategy-research.mock-data';
import { safeTimeout, generateId } from '../../strategy-research.utils';

@Component({
  selector: 'app-strategic-pillars',
  imports: [CommonModule, FormsModule],
  templateUrl: './strategic-pillars.component.html',
  styleUrl: './strategic-pillars.component.scss',
})
export class StrategicPillarsComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly pillars = signal<ContentPillar[]>([...DEFAULT_PILLARS]);
  readonly showAddForm = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly isAnalyzing = signal(false);
  readonly postsPerWeek = signal(7);

  readonly presetColors = PRESET_COLORS;

  // Add form state
  newPillarName = '';
  newPillarDescription = '';
  newPillarColor = PRESET_COLORS[0];

  // Edit form state
  editName = '';
  editDescription = '';
  editColor = '';

  openAddForm(): void {
    this.newPillarName = '';
    this.newPillarDescription = '';
    this.newPillarColor = PRESET_COLORS[0];
    this.showAddForm.set(true);
    this.editingId.set(null);
  }

  cancelAdd(): void {
    this.showAddForm.set(false);
  }

  addPillar(): void {
    if (!this.newPillarName.trim()) return;
    const pillar: ContentPillar = {
      id: generateId('p'),
      name: this.newPillarName.trim(),
      description: this.newPillarDescription.trim(),
      color: this.newPillarColor,
      goals: [],
    };
    this.pillars.update(list => [...list, pillar]);
    this.showAddForm.set(false);
  }

  startEdit(pillar: ContentPillar): void {
    this.editingId.set(pillar.id);
    this.editName = pillar.name;
    this.editDescription = pillar.description;
    this.editColor = pillar.color;
    this.showAddForm.set(false);
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  saveEdit(id: string): void {
    this.pillars.update(list =>
      list.map(p =>
        p.id === id
          ? { ...p, name: this.editName.trim(), description: this.editDescription.trim(), color: this.editColor }
          : p
      )
    );
    this.editingId.set(null);
  }

  deletePillar(id: string): void {
    this.pillars.update(list => list.filter(p => p.id !== id));
  }

  getGoalProgress(goal: PillarGoal): number {
    if (!goal.current || goal.target <= 0) return 0;
    return Math.min(100, Math.round((goal.current / goal.target) * 100));
  }

  analyzeDistribution(): void {
    this.isAnalyzing.set(true);
    safeTimeout(() => {
      this.isAnalyzing.set(false);
    }, AI_SIMULATION_DELAY_MS, this.destroyRef);
  }
}
