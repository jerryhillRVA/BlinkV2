import { Component, input } from '@angular/core';

@Component({
  selector: 'app-step-placeholder',
  templateUrl: './step-placeholder.component.html',
  styleUrl: './step-placeholder.component.scss',
})
export class StepPlaceholderComponent {
  /* v8 ignore next 1 — V8's function-call-throws branches on input()/signal() declarations are unreachable (Angular class-field init time; ESM exports not spy-able) */
  readonly label = input.required<string>();
}
