import { Component, computed, input, output } from '@angular/core';
import type {
  ContentTypeContract,
  PackagingAudioPlanningContract,
  PackagingFacebookContract,
  PackagingPlatformControlsContract,
  PackagingSlideOrderContract,
  PackagingUtmContract,
} from '@blinksocial/contracts';
import { HashtagInputComponent } from '../../draft-step/_shared/hashtag-input/hashtag-input.component';
import { MediaSelectionsCardComponent } from '../_shared/media-selections-card/media-selections-card.component';
import { PlatformControlsComponent } from '../_shared/platform-controls/platform-controls.component';
import {
  SlideOrderPickerComponent,
  type SlideOrderItem,
} from '../_shared/slide-order-picker/slide-order-picker.component';
import { UtmBuilderComponent } from '../_shared/utm-builder/utm-builder.component';

const CAPTION_MAX = 63206;
const WARN_RATIO = 0.9;

@Component({
  selector: 'app-facebook-packaging',
  imports: [
    HashtagInputComponent,
    UtmBuilderComponent,
    SlideOrderPickerComponent,
    MediaSelectionsCardComponent,
    PlatformControlsComponent,
  ],
  templateUrl: './facebook-packaging.component.html',
  styleUrl: './facebook-packaging.component.scss',
})
export class FacebookPackagingComponent {
  /* v8 ignore next 5 — V8's function-call-throws branches on input()/signal() declarations are unreachable (Angular class-field init time; ESM exports not spy-able) */
  readonly value = input<PackagingFacebookContract | undefined>(undefined);
  readonly contentType = input<ContentTypeContract | null | undefined>(undefined);
  readonly disabled = input(false);
  readonly isCarousel = input(false);
  readonly slides = input<ReadonlyArray<SlideOrderItem>>([]);

  readonly valueChange = output<PackagingFacebookContract>();

  protected readonly captionMax = CAPTION_MAX;
  protected readonly platform = 'facebook' as const;

  protected readonly caption = computed(() => this.value()?.caption ?? '');
  protected readonly hashtags = computed(() => this.value()?.hashtags ?? []);
  protected readonly link = computed(() => this.value()?.link ?? '');
  protected readonly utm = computed(() => this.value()?.utm);
  protected readonly slideOrder = computed(() => this.value()?.slideOrder?.order ?? []);
  protected readonly audioPlanning = computed(() => this.value()?.audioPlanning);
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

  protected onOrderChange(order: number[]): void {
    const next: PackagingSlideOrderContract = { order };
    this.patch({ slideOrder: next });
  }

  protected onAudioPlanningChange(audioPlanning: PackagingAudioPlanningContract): void {
    this.patch({ audioPlanning });
  }

  protected onControlsChange(controls: PackagingPlatformControlsContract): void {
    this.patch({ platformControls: controls });
  }

  private patch(delta: Partial<PackagingFacebookContract>): void {
    this.valueChange.emit({ ...(this.value() ?? {}), ...delta });
  }
}
