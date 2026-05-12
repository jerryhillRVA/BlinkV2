import { Component, computed, input, output, signal } from '@angular/core';
import type {
  PackagingAudioTrackContract,
  PlatformContract,
} from '@blinksocial/contracts';
import { AiButtonComponent } from '../../../draft-step/_shared/ai-button/ai-button.component';
import { AudioPickerComponent } from '../audio-picker/audio-picker.component';

const AI_DELAY_MS = 2500;
const STUB_COVER_REF = 'AI Generated Cover.png';

/**
 * "Media Selections" card from the prototype's PackagingStudio. Hosts the
 * Cover image sub-section (filename input + Upload button + AI Generate)
 * and the Audio Planning sub-section (delegates to `<app-audio-picker>`).
 *
 * Currently scoped to the caption-driven platforms that need both
 * surfaces (Instagram / TikTok / Facebook). YouTube uses its own
 * Thumbnail field elsewhere; LinkedIn / X don't render this card.
 *
 * Cover-asset persistence: real file upload is a follow-up epic. The
 * Upload control captures the chosen file's filename so the user sees
 * which file they picked; AI Generate sets a stub reference. The
 * "from Assets" read-only chip variant is reserved for when assets-step
 * uploads start populating the parent component.
 */
@Component({
  selector: 'app-media-selections-card',
  imports: [AiButtonComponent, AudioPickerComponent],
  templateUrl: './media-selections-card.component.html',
  styleUrl: './media-selections-card.component.scss',
})
export class MediaSelectionsCardComponent {
  readonly platform = input.required<PlatformContract>();
  readonly coverAsset = input<string | undefined>(undefined);
  readonly audio = input<PackagingAudioTrackContract | undefined>(undefined);
  readonly disabled = input(false);
  /**
   * When true, render the cover label as "Thumbnail" + required-asterisk
   * (YouTube long-form). Defaults to "Cover image" with a "Recommended"
   * hint (IG / TT / FB short-form).
   */
  readonly thumbnailMode = input(false);

  readonly coverAssetChange = output<string | undefined>();
  readonly audioChange = output<PackagingAudioTrackContract | undefined>();

  protected readonly aiGeneratingCover = signal(false);

  protected readonly hasCover = computed(() => {
    const v = this.coverAsset();
    return !!v && v.trim().length > 0;
  });

  protected readonly coverLabel = computed(() =>
    this.thumbnailMode() ? 'Thumbnail' : 'Cover image',
  );

  protected onCoverInput(e: Event): void {
    const v = (e.target as HTMLInputElement).value ?? '';
    this.coverAssetChange.emit(v.length > 0 ? v : undefined);
  }

  protected onUploadChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    // Capture filename only — real file persistence is a follow-up.
    this.coverAssetChange.emit(file.name);
    // Reset so re-uploading the same filename still fires (browsers
    // skip change events on identical file selection otherwise).
    input.value = '';
  }

  protected onClearCover(): void {
    if (this.disabled()) return;
    this.coverAssetChange.emit(undefined);
  }

  protected onAiGenerate(): void {
    if (this.disabled() || this.aiGeneratingCover()) return;
    this.aiGeneratingCover.set(true);
    setTimeout(() => {
      this.coverAssetChange.emit(STUB_COVER_REF);
      this.aiGeneratingCover.set(false);
    }, AI_DELAY_MS);
  }

  protected onAudioChange(track: PackagingAudioTrackContract | undefined): void {
    this.audioChange.emit(track);
  }
}
