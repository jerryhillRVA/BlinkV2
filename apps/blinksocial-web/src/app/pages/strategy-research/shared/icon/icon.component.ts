import { Component, input } from '@angular/core';

export type IconName =
  | 'edit'
  | 'trash'
  | 'plus'
  | 'close'
  | 'sparkles'
  | 'sparkle'
  | 'spinner'
  | 'target'
  | 'microphone'
  | 'message'
  | 'chevron-down'
  | 'chevron-up'
  | 'check'
  | 'book'
  | 'broadcast'
  | 'search';

@Component({
  selector: 'app-icon',
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.scss',
})
export class IconComponent {
  /* v8 ignore next — signal-input default-value branch unreachable from TestBed */
  readonly name = input.required<IconName>();
  /* v8 ignore next — signal-input default-value branch unreachable from TestBed */
  readonly size = input(16);
}
