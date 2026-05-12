import { Component, computed, input, output } from '@angular/core';
import type {
  PackagingAudioTrackContract,
  PackagingInstagramContract,
  PackagingPlatformControlsContract,
  PackagingSlideOrderContract,
  PackagingUtmContract,
} from '@blinksocial/contracts';
import { HashtagInputComponent } from '../../draft-step/_shared/hashtag-input/hashtag-input.component';
import { AudioPickerComponent } from '../_shared/audio-picker/audio-picker.component';
import { PlatformControlsComponent } from '../_shared/platform-controls/platform-controls.component';
import {
  SlideOrderPickerComponent,
  type SlideOrderItem,
} from '../_shared/slide-order-picker/slide-order-picker.component';
import { UtmBuilderComponent } from '../_shared/utm-builder/utm-builder.component';

const CAPTION_MAX = 2200;
const WARN_RATIO = 0.9;

/**
 * Instagram packaging builder scaffold. Caption + hashtags + link + UTM
 * + (CAROUSEL-only) slide-order picker + audio picker + platform
 * controls.
 */
@Component({
  selector: 'app-instagram-packaging',
  imports: [
    HashtagInputComponent,
    UtmBuilderComponent,
    SlideOrderPickerComponent,
    AudioPickerComponent,
    PlatformControlsComponent,
  ],
  templateUrl: './instagram-packaging.component.html',
  styleUrl: './instagram-packaging.component.scss',
})
export class InstagramPackagingComponent {
  readonly value = input<PackagingInstagramContract | undefined>(undefined);
  readonly disabled = input(false);
  readonly isCarousel = input(false);
  readonly slides = input<ReadonlyArray<SlideOrderItem>>([]);

  readonly valueChange = output<PackagingInstagramContract>();

  protected readonly captionMax = CAPTION_MAX;

  protected readonly caption = computed(() => this.value()?.caption ?? '');
  protected readonly hashtags = computed(() => this.value()?.hashtags ?? []);
  protected readonly link = computed(() => this.value()?.link ?? '');
  protected readonly utm = computed(() => this.value()?.utm);
  protected readonly slideOrder = computed(() => this.value()?.slideOrder?.order ?? []);
  protected readonly audio = computed(() => this.value()?.audio);
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

  protected onAudioChange(track: PackagingAudioTrackContract | undefined): void {
    this.patch({ audio: track });
  }

  protected onControlsChange(controls: PackagingPlatformControlsContract): void {
    this.patch({ platformControls: controls });
  }

  private patch(delta: Partial<PackagingInstagramContract>): void {
    this.valueChange.emit({ ...(this.value() ?? {}), ...delta });
  }
}
