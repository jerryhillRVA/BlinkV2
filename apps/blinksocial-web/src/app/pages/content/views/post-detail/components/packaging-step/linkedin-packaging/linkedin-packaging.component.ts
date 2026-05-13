import { Component, computed, input, output } from '@angular/core';
import type {
  PackagingLinkedInContract,
  PackagingPlatformControlsContract,
  PackagingUtmContract,
} from '@blinksocial/contracts';
import { HashtagInputComponent } from '../../draft-step/_shared/hashtag-input/hashtag-input.component';
import { PlatformControlsComponent } from '../_shared/platform-controls/platform-controls.component';
import { UtmBuilderComponent } from '../_shared/utm-builder/utm-builder.component';

const CAPTION_MAX = 3000;
const WARN_RATIO = 0.9;

@Component({
  selector: 'app-linkedin-packaging',
  imports: [HashtagInputComponent, UtmBuilderComponent, PlatformControlsComponent],
  templateUrl: './linkedin-packaging.component.html',
  styleUrl: './linkedin-packaging.component.scss',
})
export class LinkedinPackagingComponent {
  /* v8 ignore next 2 — signal-input default-value branches are unreachable from TestBed */
  readonly value = input<PackagingLinkedInContract | undefined>(undefined);
  readonly disabled = input(false);

  readonly valueChange = output<PackagingLinkedInContract>();

  protected readonly captionMax = CAPTION_MAX;

  protected readonly caption = computed(() => this.value()?.caption ?? '');
  protected readonly hashtags = computed(() => this.value()?.hashtags ?? []);
  protected readonly link = computed(() => this.value()?.link ?? '');
  protected readonly utm = computed(() => this.value()?.utm);
  protected readonly controls = computed(() => this.value()?.platformControls);

  protected readonly captionState = computed(() => {
    const len = this.caption().length;
    if (len >= CAPTION_MAX) return 'fail';
    if (len >= CAPTION_MAX * WARN_RATIO) return 'warn';
    return 'ok';
  });

  protected onCaptionInput(e: Event): void {
    this.patch({ caption: (e.target as HTMLTextAreaElement).value ?? '' });
  }

  protected onHashtagsChange(tags: string[]): void {
    this.patch({ hashtags: tags });
  }

  protected onLinkInput(e: Event): void {
    this.patch({ link: (e.target as HTMLInputElement).value ?? '' });
  }

  protected onUtmChange(utm: PackagingUtmContract): void {
    this.patch({ utm });
  }

  protected onControlsChange(controls: PackagingPlatformControlsContract): void {
    this.patch({ platformControls: controls });
  }

  private patch(delta: Partial<PackagingLinkedInContract>): void {
    this.valueChange.emit({ ...(this.value() ?? {}), ...delta });
  }
}
