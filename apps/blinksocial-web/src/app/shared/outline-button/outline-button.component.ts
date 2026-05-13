import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-outline-button',
  templateUrl: './outline-button.component.html',
  styleUrl: './outline-button.component.scss',
})
export class OutlineButtonComponent {
  /* v8 ignore next — signal-input default-value branch unreachable from TestBed */
  disabled = input(false);
  /* v8 ignore next — signal-input default-value branch unreachable from TestBed */
  compact = input(false);
  clicked = output<void>();

  onClick(): void {
    if (!this.disabled()) {
      this.clicked.emit();
    }
  }
}
