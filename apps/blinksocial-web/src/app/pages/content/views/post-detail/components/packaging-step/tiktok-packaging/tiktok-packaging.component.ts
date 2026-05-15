import { Component, computed, input, output } from '@angular/core';
import type {
  ContentTypeContract,
  PackagingAudioPlanningContract,
  PackagingPlatformControlsContract,
  PackagingTikTokContract,
  PackagingUtmContract,
} from '@blinksocial/contracts';
import { HashtagInputComponent } from '../../draft-step/_shared/hashtag-input/hashtag-input.component';
import { MediaSelectionsCardComponent } from '../_shared/media-selections-card/media-selections-card.component';
import { PlatformControlsComponent } from '../_shared/platform-controls/platform-controls.component';
import { UtmBuilderComponent } from '../_shared/utm-builder/utm-builder.component';

const CAPTION_MAX = 2200;
const WARN_RATIO = 0.9;

@Component({
  selector: 'app-tiktok-packaging',
  imports: [
    HashtagInputComponent,
    UtmBuilderComponent,
    MediaSelectionsCardComponent,
    PlatformControlsComponent,
  ],
  templateUrl: './tiktok-packaging.component.html',
  styleUrl: './tiktok-packaging.component.scss',
})
export class TiktokPackagingComponent {
  /* v8 ignore next 3 — V8's function-call-throws branches on input()/signal() declarations are unreachable (Angular class-field init time; ESM exports not spy-able) */
  readonly value = input<PackagingTikTokContract | undefined>(undefined);
  readonly contentType = input<ContentTypeContract | null | undefined>(undefined);
  readonly disabled = input(false);

  readonly valueChange = output<PackagingTikTokContract>();

  protected readonly captionMax = CAPTION_MAX;
  protected readonly platform = 'tiktok' as const;

  protected readonly caption = computed(() => this.value()?.caption ?? '');
  protected readonly hashtags = computed(() => this.value()?.hashtags ?? []);
  protected readonly link = computed(() => this.value()?.link ?? '');
  protected readonly utm = computed(() => this.value()?.utm);
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

  protected onAudioPlanningChange(audioPlanning: PackagingAudioPlanningContract): void {
    this.patch({ audioPlanning });
  }

  protected onControlsChange(controls: PackagingPlatformControlsContract): void {
    this.patch({ platformControls: controls });
  }

  private patch(delta: Partial<PackagingTikTokContract>): void {
    this.valueChange.emit({ ...(this.value() ?? {}), ...delta });
  }
}
