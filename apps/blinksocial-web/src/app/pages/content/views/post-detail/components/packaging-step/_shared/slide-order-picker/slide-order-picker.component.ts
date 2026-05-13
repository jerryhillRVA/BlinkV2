import { Component, computed, input, output } from '@angular/core';

export interface SlideOrderItem {
  id: string;
  headline: string;
  imageRef?: string;
}

/**
 * Keyboard-accessible slide-reorder list for carousel posts. Renders a
 * `<ol role="list">` of slides in the current `order`. Each row has Move
 * Up / Move Down buttons; boundary buttons are disabled. A swap emits
 * the new order array. No DnD — keyboard reorder is mandatory per a11y.
 */
@Component({
  selector: 'app-slide-order-picker',
  templateUrl: './slide-order-picker.component.html',
  styleUrl: './slide-order-picker.component.scss',
})
export class SlideOrderPickerComponent {
  /* v8 ignore next 3 — V8's function-call-throws branches on input()/signal() declarations are unreachable (Angular class-field init time; ESM exports not spy-able) */
  readonly slides = input<ReadonlyArray<SlideOrderItem>>([]);
  readonly order = input<number[]>([]);
  readonly disabled = input(false);

  readonly orderChange = output<number[]>();

  protected readonly resolvedOrder = computed(() => {
    const o = this.order();
    if (o.length) return o;
    return this.slides().map((_, i) => i);
  });

  protected readonly rows = computed(() => {
    const slides = this.slides();
    return this.resolvedOrder().map((slideIdx, position) => {
      const slide = slides[slideIdx];
      return { slide, slideIdx, position };
    });
  });

  protected onMoveUp(position: number): void {
    if (this.disabled()) return;
    if (position <= 0) return;
    this.swap(position, position - 1);
  }

  protected onMoveDown(position: number): void {
    if (this.disabled()) return;
    const max = this.resolvedOrder().length - 1;
    if (position >= max) return;
    this.swap(position, position + 1);
  }

  protected initial(headline: string): string {
    const trimmed = headline.trim();
    return trimmed ? trimmed.charAt(0).toUpperCase() : '?';
  }

  protected total(): number {
    return this.resolvedOrder().length;
  }

  private swap(a: number, b: number): void {
    const next = [...this.resolvedOrder()];
    [next[a], next[b]] = [next[b], next[a]];
    this.orderChange.emit(next);
  }
}
