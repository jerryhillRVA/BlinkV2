import { Component, input } from '@angular/core';

@Component({
  selector: 'app-step-placeholder',
  templateUrl: './step-placeholder.component.html',
  styleUrl: './step-placeholder.component.scss',
})
export class StepPlaceholderComponent {
  /* v8 ignore next — signal-input default-value branch unreachable from TestBed */
  readonly label = input.required<string>();
}
