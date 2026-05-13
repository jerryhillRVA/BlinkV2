import { Component, ElementRef, inject, input } from '@angular/core';
import type { TooltipIconType } from './tooltip.types';
import { TooltipService } from './tooltip.service';

@Component({
  selector: 'app-tooltip',
  templateUrl: './tooltip.component.html',
  styleUrl: './tooltip.component.scss',
})
export class TooltipComponent {
  private readonly elRef = inject(ElementRef);
  private readonly tooltipService = inject(TooltipService);

  /* v8 ignore next — signal-input default-value branch unreachable from TestBed */
  text = input.required<string>();
  /* v8 ignore next — signal-input default-value branch unreachable from TestBed */
  type = input<TooltipIconType>('info');

  show(): void {
    const trigger = this.elRef.nativeElement.querySelector('.tooltip-trigger') as HTMLElement;
    if (trigger) {
      this.tooltipService.show(trigger, this.text());
    }
  }

  hide(): void {
    this.tooltipService.hide();
  }
}
