import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface PillOption<T extends string = string> {
  value: T;
  label: string;
}

/**
 * Horizontal pill selector. Used in the production builder for things
 * like Target Duration. Active pill is coral; inactive is white with
 * a faint border. Behaves like a single-select radio group with full
 * keyboard navigation (Arrow keys move selection, matching the WAI-ARIA
 * radio-group pattern).
 */
@Component({
  selector: 'app-pill-group',
  templateUrl: './pill-group.component.html',
  styleUrl: './pill-group.component.scss',
})
export class PillGroupComponent<T extends string = string> {
  @Input({ required: true }) options: ReadonlyArray<PillOption<T>> = [];
  @Input() value: T | null = null;
  @Input() disabled = false;
  @Input() ariaLabel = 'Choose an option';

  @Output() valueChange = new EventEmitter<T>();

  protected onSelect(v: T): void {
    if (this.disabled) return;
    if (this.value === v) return;
    this.valueChange.emit(v);
  }

  protected onKeydown(e: KeyboardEvent): void {
    if (this.disabled) return;
    const key = e.key;
    if (key !== 'ArrowRight' && key !== 'ArrowLeft' && key !== 'ArrowUp' && key !== 'ArrowDown') {
      return;
    }
    e.preventDefault();
    const idx = this.options.findIndex((o) => o.value === this.value);
    const dir = key === 'ArrowRight' || key === 'ArrowDown' ? 1 : -1;
    const len = this.options.length;
    const next = ((idx === -1 ? 0 : idx) + dir + len) % len;
    this.valueChange.emit(this.options[next].value);
  }
}
