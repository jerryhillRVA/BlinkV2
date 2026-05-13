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
  /* v8 ignore next 2 — V8's function-call-throws branches on input()/signal() declarations are unreachable (Angular class-field init time; ESM exports not spy-able) */
  readonly platform = input.required<PlatformName>();
  readonly size = input(14);

  @HostBinding('attr.data-platform')
  get platformAttr(): PlatformName {
    return this.platform();
  }
}
