import { Component, HostBinding, input } from '@angular/core';

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
  /* v8 ignore next — signal-input default-value branch unreachable from TestBed */
  readonly platform = input.required<PlatformName>();
  /* v8 ignore next — signal-input default-value branch unreachable from TestBed */
  readonly size = input(14);

  @HostBinding('attr.data-platform')
  get platformAttr(): PlatformName {
    return this.platform();
  }
}
