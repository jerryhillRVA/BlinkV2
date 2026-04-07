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
  readonly name = input.required<IconName>();
  readonly size = input(16);
}
