import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-outline-button',
  templateUrl: './outline-button.component.html',
  styleUrl: './outline-button.component.scss',
})
export class OutlineButtonComponent {
  disabled = input(false);
  clicked = output<void>();

  onClick(): void {
    if (!this.disabled()) {
      this.clicked.emit();
    }
  }
}
