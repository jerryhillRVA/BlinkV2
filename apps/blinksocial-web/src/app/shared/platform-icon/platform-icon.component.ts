import { Component, input } from '@angular/core';

export type PlatformName =
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'facebook'
  | 'linkedin'
  | 'twitter'
  | 'slack'
  | 'discord'
  | 'tbd'
  | 'pinterest'
  | 'threads'
  | 'x';

@Component({
  selector: 'app-platform-icon',
  templateUrl: './platform-icon.component.html',
  styleUrl: './platform-icon.component.scss',
})
export class PlatformIconComponent {
  readonly platform = input.required<PlatformName>();
  readonly size = input(14);
}
