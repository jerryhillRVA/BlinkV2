import { Component, computed, input, output, signal } from '@angular/core';
import type {
  ContentTypeContract,
  PackagingAudioPlanningContract,
  PlatformContract,
} from '@blinksocial/contracts';
import { TooltipComponent } from '../../../../../../../../shared/tooltip/tooltip.component';
import { AiButtonComponent } from '../../../draft-step/_shared/ai-button/ai-button.component';
import { AudioPlanningSectionComponent } from '../audio-planning-section/audio-planning-section.component';

const AI_DELAY_MS = 2500;
const STUB_COVER_REF = 'AI Generated Cover.png';

const COVER_TOOLTIP =
  'The static image viewers see before they tap play. The single highest-impact element for click-through rate. Upload a custom image or select a frame from your video.';

/**
 * "Media Selections" card from the prototype's PackagingStudio. Hosts
 * the Cover image sub-section + (when content type is eligible) the
 * Audio Planning sub-section beneath it. Matches the prototype's
 * combined single-Card layout (PackagingStudio.tsx:2142-2350).
 *
 * Cover-asset persistence: real file upload is a follow-up epic. The
 * Upload control captures the chosen file's filename so the user sees
 * which file they picked; AI Generate sets a stub reference.
 */
@Component({
  selector: 'app-media-selections-card',
  imports: [AiButtonComponent, AudioPlanningSectionComponent, TooltipComponent],
  templateUrl: './media-selections-card.component.html',
  styleUrl: './media-selections-card.component.scss',
})
export class MediaSelectionsCardComponent {
  /* v8 ignore next 7 — V8's function-call-throws branches on input()/signal() declarations are unreachable (Angular class-field init time; ESM exports not spy-able) */
  readonly platform = input.required<PlatformContract>();
  readonly coverAsset = input<string | undefined>(undefined);
  readonly contentType = input<ContentTypeContract | null | undefined>(undefined);
  readonly audioPlanning = input<PackagingAudioPlanningContract | undefined>(undefined);
  readonly showCover = input<boolean>(true);
  readonly disabled = input(false);
  readonly thumbnailMode = input(false);

  readonly coverAssetChange = output<string | undefined>();
  readonly audioPlanningChange = output<PackagingAudioPlanningContract>();
  /**
   * Resolvable URL for the cover image. Emitted alongside coverAssetChange
   * when the user uploads a file (FileReader → data: URL). Real
   * AgenticFilesystem persistence will swap the data: URL for an https://
   * URL — the downstream <img src> wiring is identical. Emits undefined
   * when the cover is cleared / AI-generated (no real image yet) / typed
   * by hand (no file to read).
   */
  readonly coverAssetUrlChange = output<string | undefined>();

  /* v8 ignore next 1 — V8's function-call-throws branches on input()/signal() declarations are unreachable (Angular class-field init time; ESM exports not spy-able) */
  protected readonly aiGeneratingCover = signal(false);

  protected readonly hasCover = computed(() => {
    const v = this.coverAsset();
    return !!v && v.trim().length > 0;
  });

  protected readonly coverLabel = computed(() =>
    this.thumbnailMode() ? 'Thumbnail' : 'Cover image',
  );

  protected readonly coverTooltip = COVER_TOOLTIP;

  protected onAudioPlanningChange(audioPlanning: PackagingAudioPlanningContract): void {
    this.audioPlanningChange.emit(audioPlanning);
  }

  protected onCoverInput(e: Event): void {
    const v = (e.target as HTMLInputElement).value ?? '';
    this.coverAssetChange.emit(v.length > 0 ? v : undefined);
    // Typed-in filename has no backing file — clear any previously
    // captured data URL so the preview falls back to its placeholder.
    this.coverAssetUrlChange.emit(undefined);
  }

  protected onUploadChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    // Capture filename immediately for display in the Cover field.
    this.coverAssetChange.emit(file.name);
    // Read the file into a data: URL so the Post Preview can render the
    // actual image now. The data: URL slots into the same coverAssetUrl
    // field that AgenticFilesystem will later populate with an https://
    // URL — no downstream wiring changes when real persistence lands.
    const reader = new FileReader();
    reader.onload = () => {
      const url = typeof reader.result === 'string' ? reader.result : undefined;
      this.coverAssetUrlChange.emit(url);
    };
    reader.readAsDataURL(file);
    // Reset so re-uploading the same filename still fires (browsers
    // skip change events on identical file selection otherwise).
    input.value = '';
  }

  protected onClearCover(): void {
    if (this.disabled()) return;
    this.coverAssetChange.emit(undefined);
    this.coverAssetUrlChange.emit(undefined);
  }

  protected onAiGenerate(): void {
    if (this.disabled() || this.aiGeneratingCover()) return;
    this.aiGeneratingCover.set(true);
    setTimeout(() => {
      this.coverAssetChange.emit(STUB_COVER_REF);
      // No real generated image yet — clear any prior URL so the preview
      // doesn't show stale uploaded content under a new filename.
      this.coverAssetUrlChange.emit(undefined);
      this.aiGeneratingCover.set(false);
    }, AI_DELAY_MS);
  }
}
