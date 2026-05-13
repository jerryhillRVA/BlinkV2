import { Component, Input, computed, signal } from '@angular/core';
import { ICONS, type IconName } from './icons';

/**
 * Renders a Lucide-style icon from the centralized registry.
 *
 * Usage: `<app-icon name="sparkles" size="14" />`
 *
 * The icon inherits the surrounding text color (stroke = currentColor).
 * It's marked `aria-hidden="true"` by default — pass `[ariaLabel]` for
 * meaningful icons (e.g. on a sole-content icon button).
 */
@Component({
  selector: 'app-icon',
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.scss',
})
export class IconComponent {
  /* v8 ignore next 1 — V8's function-call-throws branches on input()/signal() declarations are unreachable (Angular class-field init time; ESM exports not spy-able) */
  protected readonly nameSignal = signal<IconName | null>(null);

  @Input({ required: true }) set name(v: IconName) {
    this.nameSignal.set(v);
  }

  @Input() size: number | string = 16;
  @Input() strokeWidth: number | string = 2;
  @Input() ariaLabel: string | null = null;

  protected readonly def = computed(() => {
    const n = this.nameSignal();
    return n ? ICONS[n] : null;
  });

  protected get sizeValue(): string {
    return typeof this.size === 'number' ? `${this.size}` : this.size;
  }
}
