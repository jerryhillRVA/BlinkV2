import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  type BusinessObjective,
  type ObjectiveCategory,
  OBJECTIVE_CATEGORY_CONFIG,
} from '../strategy-research.types';

@Component({
  selector: 'app-objectives-strip',
  imports: [CommonModule, FormsModule],
  templateUrl: './objectives-strip.component.html',
  styleUrl: './objectives-strip.component.scss',
})
export class ObjectivesStripComponent {
  @Input() objectives: BusinessObjective[] = [];
  @Output() objectivesChange = new EventEmitter<BusinessObjective[]>();

  readonly showDrawer = signal(false);
  readonly isSuggesting = signal(false);
  dialogObjectives: BusinessObjective[] = [];

  readonly categoryConfig = OBJECTIVE_CATEGORY_CONFIG;
  readonly categories = Object.entries(OBJECTIVE_CATEGORY_CONFIG) as [ObjectiveCategory, { label: string; emoji: string }][];

  getProgressPercent(obj: BusinessObjective): number {
    if (obj.currentValue === undefined || obj.target <= 0) return 0;
    return Math.min(100, Math.round((obj.currentValue / obj.target) * 100));
  }

  getStatusLabel(status: BusinessObjective['status']): string {
    const labels: Record<string, string> = {
      'on-track': 'On Track', 'at-risk': 'At Risk', 'behind': 'Behind', 'achieved': 'Achieved',
    };
    return labels[status] ?? status;
  }

  openDrawer(): void {
    this.dialogObjectives = this.objectives.length > 0
      ? this.objectives.map(o => ({ ...o }))
      : [this.createBlankObjective()];
    this.showDrawer.set(true);
  }

  closeDrawer(): void {
    this.showDrawer.set(false);
  }

  toggleDrawer(): void {
    if (this.showDrawer()) {
      this.closeDrawer();
    } else {
      this.openDrawer();
    }
  }

  saveObjectives(): void {
    const valid = this.dialogObjectives.filter(o => o.statement.trim());
    this.objectivesChange.emit(valid);
    this.showDrawer.set(false);
  }

  addObjective(): void {
    if (this.dialogObjectives.length < 4) {
      this.dialogObjectives = [...this.dialogObjectives, this.createBlankObjective()];
    }
  }

  removeObjective(id: string): void {
    if (this.dialogObjectives.length > 1) {
      this.dialogObjectives = this.dialogObjectives.filter(o => o.id !== id);
    }
  }

  updateObjective(id: string, updates: Partial<BusinessObjective>): void {
    this.dialogObjectives = this.dialogObjectives.map(o =>
      o.id === id ? { ...o, ...updates } : o
    );
  }

  suggestObjectives(): void {
    this.isSuggesting.set(true);
    setTimeout(() => {
      const suggested: BusinessObjective[] = [
        { id: `obj-${Date.now()}-1`, category: 'growth', statement: 'Grow combined social following to 25,000', target: 25000, unit: 'followers', timeframe: 'Q4 2026', status: 'on-track' },
        { id: `obj-${Date.now()}-2`, category: 'engagement', statement: 'Achieve 5% average engagement rate across platforms', target: 5, unit: '%', timeframe: 'Q3 2026', status: 'on-track' },
      ];
      this.dialogObjectives = [...this.dialogObjectives, ...suggested].slice(0, 4);
      this.isSuggesting.set(false);
    }, 2500);
  }

  private createBlankObjective(): BusinessObjective {
    return {
      id: `obj-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      category: 'growth',
      statement: '',
      target: 0,
      unit: '',
      timeframe: '',
      status: 'on-track',
    };
  }
}
