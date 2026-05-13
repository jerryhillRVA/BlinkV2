import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-detail-back-button',
  templateUrl: './detail-back-button.component.html',
  styleUrl: './detail-back-button.component.scss',
})
export class DetailBackButtonComponent {
  /* v8 ignore next 1 — V8's function-call-throws branches on input()/signal() declarations are unreachable (Angular class-field init time; ESM exports not spy-able) */
  readonly ariaLabel = input<string>('Back to pipeline');
  readonly back = output<void>();

  protected onClick(): void {
    this.back.emit();
  }
}
