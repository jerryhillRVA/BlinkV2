import { Component, EventEmitter, Input, Output, computed, input } from '@angular/core';
import { NgClass } from '@angular/common';
import type { ContentStage, ContentStatus } from '../../content.types';
import { STATUS_CONFIG, STATUSES_BY_STAGE } from '../../content.constants';

interface Step {
  value: ContentStatus;
  label: string;
}

@Component({
  selector: 'app-status-stepper',
  imports: [NgClass],
  templateUrl: './status-stepper.component.html',
  styleUrl: './status-stepper.component.scss',
})
export class StatusStepperComponent {
  @Input({ required: true }) value!: ContentStatus;
  @Input({ required: true }) stage!: ContentStage;
  /* v8 ignore next — signal-input default-value branch unreachable from TestBed */
  readonly interactive = input(true);

  @Output() statusChange = new EventEmitter<ContentStatus>();

  protected get steps(): Step[] {
    return STATUSES_BY_STAGE[this.stage].map((v) => ({
      value: v,
      label: STATUS_CONFIG[v].label,
    }));
  }

  protected activeIndex(): number {
    return this.steps.findIndex((s) => s.value === this.value);
  }

  protected stepClass(index: number): 'is-done' | 'is-current' | 'is-upcoming' {
    const active = this.activeIndex();
    if (index < active) return 'is-done';
    if (index === active) return 'is-current';
    return 'is-upcoming';
  }

  // Used in read-only mode so screen readers announce the current value via a
  // single aria-label on the host list (no interactive children).
  protected readonly currentLabel = computed(() => {
    const v = this.value;
    return v ? (STATUS_CONFIG[v]?.label ?? v) : '';
  });

  protected onPick(value: ContentStatus): void {
    if (!this.interactive()) return;
    if (value === this.value) return;
    this.statusChange.emit(value);
  }
}
