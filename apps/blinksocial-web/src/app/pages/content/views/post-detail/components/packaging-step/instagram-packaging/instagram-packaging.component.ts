import { Component, computed, input, output, signal } from '@angular/core';
import type {
  PackagingAudioTrackContract,
  PackagingInstagramContract,
  PackagingPlatformControlsContract,
  PackagingSlideOrderContract,
  PackagingUtmContract,
  PublishingModeContract,
} from '@blinksocial/contracts';
import { AiButtonComponent } from '../../draft-step/_shared/ai-button/ai-button.component';
import { syncCaptionWithHashtags } from '../_shared/caption-hashtag.utils';
import { AudioPickerComponent } from '../_shared/audio-picker/audio-picker.component';
import { PaidBoostedFieldsComponent } from '../_shared/paid-boosted-fields/paid-boosted-fields.component';
import { PkgHashtagBankComponent, type HashtagBankGroup } from '../_shared/pkg-hashtag-bank/pkg-hashtag-bank.component';
import { PlatformControlsComponent } from '../_shared/platform-controls/platform-controls.component';
import {
  SlideOrderPickerComponent,
  type SlideOrderItem,
} from '../_shared/slide-order-picker/slide-order-picker.component';
import { UtmBuilderComponent } from '../_shared/utm-builder/utm-builder.component';

const CAPTION_MAX = 2200;
const WARN_RATIO = 0.9;
const STUB_CAPTION =
  'Stop scrolling — this 60-second mobility flow is what your body needs every morning. Save this for tomorrow. 💪 #MorningRoutine #Wellness';
const STUB_HASHTAGS = ['#mobility', '#morningroutine', '#wellness', '#stretching', '#dailyhabits'];
const AI_DELAY_MS = 2500;

/**
 * Instagram packaging builder scaffold. Caption + hashtags + link + UTM
 * + (CAROUSEL-only) slide-order picker + audio picker + platform
 * controls.
 */
// Hashtag bank groups for IG/TT/FB packaging. Mirrors the prototype's
// HASHTAG_BANK_GROUPS in PackagingStudio.tsx — wellness-brand-flavored
// stub data. Real per-workspace bank wiring is a follow-up.
const HASHTAG_BANK_GROUPS: HashtagBankGroup[] = [
  {
    name: 'Yoga & Movement',
    tags: ['#yoga', '#yogalife', '#yogapractice', '#yogainspiration', '#asana'],
  },
  {
    name: "Women's Wellness",
    tags: ['#womenover40', '#wellness40', '#healthyaging', '#selfcare', '#holistichealth'],
  },
  {
    name: 'Fitness',
    tags: ['#fitnessjourney', '#strengthtraining', '#activeliving', '#fitnessmotivation'],
  },
];

@Component({
  selector: 'app-instagram-packaging',
  imports: [
    AiButtonComponent,
    PkgHashtagBankComponent,
    UtmBuilderComponent,
    SlideOrderPickerComponent,
    AudioPickerComponent,
    PaidBoostedFieldsComponent,
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
  /**
   * Read-only display of the brief's publishingMode. The mode itself is
   * set in the Brief step; we surface it here as the prototype does, but
   * the toggle is informational only on the locked-brief packaging step.
   */
  readonly publishingMode = input<PublishingModeContract | undefined>(undefined);
  /** Read-only display of the parent draft's caption seed, for the "from Draft" hint. */
  readonly draftCaptionSeed = input<string | undefined>(undefined);
  /** Brief-side paid/boosted fields (also editable from packaging). */
  readonly campaignName = input<string | undefined>(undefined);
  readonly destinationUrl = input<string | undefined>(undefined);
  readonly legalApprover = input<string | undefined>(undefined);

  readonly valueChange = output<PackagingInstagramContract>();
  /** User toggled the Publishing Mode pill — parent persists via store.setPublishingMode. */
  readonly publishingModeChange = output<PublishingModeContract>();
  readonly campaignNameChange = output<string>();
  readonly destinationUrlChange = output<string>();
  readonly legalApproverChange = output<string>();

  protected readonly captionMax = CAPTION_MAX;
  protected readonly hashtagBankGroups = HASHTAG_BANK_GROUPS;
  protected readonly aiGeneratingCaption = signal(false);
  protected readonly aiSuggestingHashtags = signal(false);
  protected readonly bankOpen = signal(false);

  protected readonly caption = computed(() => this.value()?.caption ?? '');
  protected readonly hashtags = computed(() => this.value()?.hashtags ?? []);
  protected readonly link = computed(() => this.value()?.link ?? '');
  protected readonly utm = computed(() => this.value()?.utm);
  protected readonly slideOrder = computed(() => this.value()?.slideOrder?.order ?? []);
  protected readonly audio = computed(() => this.value()?.audio);
  protected readonly controls = computed(() => this.value()?.platformControls);

  protected readonly paidBoosted = computed(() => this.publishingMode() === 'PAID_BOOSTED');

  protected readonly captionDivergedFromDraft = computed(() => {
    const seed = this.draftCaptionSeed();
    return !!seed && this.caption() !== seed;
  });

  protected readonly captionState = computed(() => {
    const len = this.caption().length;
    if (len >= CAPTION_MAX) return 'fail';
    if (len >= CAPTION_MAX * WARN_RATIO) return 'warn';
    return 'ok';
  });

  protected onGenerateCaption(): void {
    if (this.aiGeneratingCaption() || this.disabled()) return;
    this.aiGeneratingCaption.set(true);
    setTimeout(() => {
      this.patch({ caption: STUB_CAPTION });
      this.aiGeneratingCaption.set(false);
    }, AI_DELAY_MS);
  }

  protected onSuggestHashtags(): void {
    if (this.aiSuggestingHashtags() || this.disabled()) return;
    this.aiSuggestingHashtags.set(true);
    setTimeout(() => {
      const current = this.hashtags();
      const merged = [...current];
      for (const tag of STUB_HASHTAGS) {
        if (!merged.includes(tag)) merged.push(tag);
      }
      // Route through onHashtagsChange so the caption stays in sync —
      // AI-suggested tags are appended to the caption with the same
      // dedupe / strip semantics as manual adds.
      this.onHashtagsChange(merged);
      this.aiSuggestingHashtags.set(false);
    }, AI_DELAY_MS);
  }

  protected onRevertToDraft(): void {
    const seed = this.draftCaptionSeed();
    if (seed === undefined) return;
    this.patch({ caption: seed });
  }

  protected toggleBank(): void {
    this.bankOpen.update((v) => !v);
  }

  protected onSetPublishingMode(mode: PublishingModeContract): void {
    if (this.disabled()) return;
    if (this.publishingMode() === mode) return;
    this.publishingModeChange.emit(mode);
  }

  protected onCaptionInput(e: Event): void {
    this.patch({ caption: (e.target as HTMLTextAreaElement).value ?? '' });
  }

  protected onHashtagsChange(tags: string[]): void {
    // Keep caption + hashtag chip array in sync: append newly-added
    // tags to the caption (skipping duplicates), strip removed tags.
    const nextCaption = syncCaptionWithHashtags(
      this.caption(),
      this.hashtags(),
      tags,
    );
    this.patch({ hashtags: tags, caption: nextCaption });
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
