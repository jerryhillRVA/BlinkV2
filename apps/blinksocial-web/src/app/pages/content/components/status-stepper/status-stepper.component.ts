import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass } from '@angular/common';
import type { ContentStatus } from '../../content.types';
import { STATUS_CONFIG } from '../../content.constants';

interface Step {
  value: ContentStatus;
  label: string;
}

const STEPS: Step[] = [
  { value: 'draft', label: STATUS_CONFIG.draft.label },
  { value: 'in-progress', label: STATUS_CONFIG['in-progress'].label },
  { value: 'review', label: STATUS_CONFIG.review.label },
  { value: 'scheduled', label: STATUS_CONFIG.scheduled.label },
  { value: 'published', label: STATUS_CONFIG.published.label },
];

@Component({
  selector: 'app-status-stepper',
  imports: [NgClass],
  templateUrl: './status-stepper.component.html',
  styleUrl: './status-stepper.component.scss',
})
export class StatusStepperComponent {
  @Input({ required: true }) value!: ContentStatus;

  @Output() statusChange = new EventEmitter<ContentStatus>();

  protected readonly steps = STEPS;

  protected activeIndex(): number {
    return STEPS.findIndex((s) => s.value === this.value);
  }

  protected stepClass(index: number): 'is-done' | 'is-current' | 'is-upcoming' {
    const active = this.activeIndex();
    if (index < active) return 'is-done';
    if (index === active) return 'is-current';
    return 'is-upcoming';
  }

  protected onPick(value: ContentStatus): void {
    if (value === this.value) return;
    this.statusChange.emit(value);
  }
}
