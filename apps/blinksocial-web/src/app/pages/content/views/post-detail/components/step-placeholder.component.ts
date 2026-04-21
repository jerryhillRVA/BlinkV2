import { Component, input } from '@angular/core';

@Component({
  selector: 'app-step-placeholder',
  templateUrl: './step-placeholder.component.html',
  styleUrl: './step-placeholder.component.scss',
})
export class StepPlaceholderComponent {
  readonly label = input.required<string>();
}
