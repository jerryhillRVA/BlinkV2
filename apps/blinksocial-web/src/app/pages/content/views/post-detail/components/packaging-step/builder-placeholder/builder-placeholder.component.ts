import { Component, computed, input } from '@angular/core';
import type { PlatformContract } from '@blinksocial/contracts';
import { PLATFORM_OPTIONS } from '../../../../../content.constants';

@Component({
  selector: 'app-packaging-builder-placeholder',
  templateUrl: './builder-placeholder.component.html',
  styleUrl: './builder-placeholder.component.scss',
})
export class PackagingBuilderPlaceholderComponent {
  /* v8 ignore next — signal-input default-value branch is unreachable from TestBed */
  readonly platform = input<PlatformContract | null>(null);

  protected readonly label = computed(() => {
    const p = this.platform();
    if (!p || p === 'tbd') return 'this platform';
    return PLATFORM_OPTIONS.find((o) => o.value === p)?.label ?? p;
  });

  protected readonly isTbd = computed(() => {
    const p = this.platform();
    return !p || p === 'tbd';
  });
}
