import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-detail-back-button',
  templateUrl: './detail-back-button.component.html',
  styleUrl: './detail-back-button.component.scss',
})
export class DetailBackButtonComponent {
  readonly ariaLabel = input<string>('Back to pipeline');
  readonly back = output<void>();

  protected onClick(): void {
    this.back.emit();
  }
}
