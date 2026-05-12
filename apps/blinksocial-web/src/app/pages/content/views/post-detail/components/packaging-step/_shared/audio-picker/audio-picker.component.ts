import {
  Component,
  ElementRef,
  computed,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type {
  PackagingAudioTrackContract,
  PlatformContract,
} from '@blinksocial/contracts';

interface TrendingStub {
  trackId: string;
  trackName: string;
  artistName: string;
}

export const TRENDING_STUB: Record<PlatformContract, ReadonlyArray<TrendingStub>> = {
  instagram: [
    { trackId: 'ig-1', trackName: 'Sunset Drift', artistName: 'Lo-Fi Loop' },
    { trackId: 'ig-2', trackName: 'Morning Light', artistName: 'Aria Sky' },
    { trackId: 'ig-3', trackName: 'Slow Motion', artistName: 'Driftwood' },
  ],
  tiktok: [
    { trackId: 'tt-1', trackName: 'Hype Beat', artistName: 'Pulse' },
    { trackId: 'tt-2', trackName: 'Cool Down', artistName: 'Echo Lane' },
    { trackId: 'tt-3', trackName: 'Funk Rev', artistName: 'Neon Rider' },
  ],
  facebook: [
    { trackId: 'fb-1', trackName: 'Weekend Drive', artistName: 'Skyline' },
    { trackId: 'fb-2', trackName: 'Coffee House', artistName: 'Warm Strings' },
    { trackId: 'fb-3', trackName: 'Family Day', artistName: 'Bright Side' },
  ],
  youtube: [
    { trackId: 'yt-1', trackName: 'Cinematic Open', artistName: 'Northstar' },
    { trackId: 'yt-2', trackName: 'Doc Score', artistName: 'Field Notes' },
    { trackId: 'yt-3', trackName: 'Tutorial Pad', artistName: 'Quiet Lab' },
  ],
  linkedin: [
    { trackId: 'li-1', trackName: 'Boardroom', artistName: 'Forward' },
    { trackId: 'li-2', trackName: 'Quarterly', artistName: 'Numbers' },
    { trackId: 'li-3', trackName: 'Steady Build', artistName: 'Index' },
  ],
  x: [
    { trackId: 'x-1', trackName: 'Hot Take', artistName: 'Feed' },
    { trackId: 'x-2', trackName: 'Threadline', artistName: 'Quote' },
    { trackId: 'x-3', trackName: 'Trend Loop', artistName: 'Echo' },
  ],
  tbd: [],
};

export const PLATFORM_AUDIO_NOTE: Partial<Record<PlatformContract, string>> = {
  tiktok:
    "Business accounts on TikTok are restricted from most trending audio. Use TikTok's Commercial Music Library for brand content.",
};

/**
 * Simplified audio picker. Trigger button opens a native `<dialog>`
 * listing three hardcoded trending tracks for the current platform.
 * Selecting a track emits a {@link PackagingAudioTrackContract} and
 * closes the dialog. A `Remove` chip emits `undefined` to clear.
 *
 * The full trending+search prototype UX is intentionally deferred —
 * this scaffold covers the persistence + a11y surface only.
 */
@Component({
  selector: 'app-audio-picker',
  templateUrl: './audio-picker.component.html',
  styleUrl: './audio-picker.component.scss',
})
export class AudioPickerComponent {
  readonly track = input<PackagingAudioTrackContract | undefined>(undefined);
  readonly platform = input.required<PlatformContract>();
  readonly disabled = input(false);

  readonly trackChange = output<PackagingAudioTrackContract | undefined>();

  private readonly triggerRef = viewChild<ElementRef<HTMLButtonElement>>('triggerBtn');
  private readonly dialogRef = viewChild<ElementRef<HTMLDialogElement>>('dialogEl');

  protected readonly previewingId = signal<string | null>(null);

  protected readonly tracks = computed(() => TRENDING_STUB[this.platform()] ?? []);
  protected readonly platformNote = computed(() => PLATFORM_AUDIO_NOTE[this.platform()] ?? null);

  protected readonly triggerLabel = computed(() =>
    this.track() ? 'Replace audio' : 'Add audio',
  );

  protected onOpen(): void {
    if (this.disabled()) return;
    const dialog = this.dialogRef()?.nativeElement;
    if (!dialog) return;
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
  }

  protected onClose(): void {
    const dialog = this.dialogRef()?.nativeElement;
    if (dialog?.open && typeof dialog.close === 'function') {
      dialog.close();
    } else if (dialog?.hasAttribute('open')) {
      dialog.removeAttribute('open');
    }
    this.previewingId.set(null);
    queueMicrotask(() => this.triggerRef()?.nativeElement.focus());
  }

  protected onTogglePreview(trackId: string): void {
    this.previewingId.update((cur) => (cur === trackId ? null : trackId));
  }

  protected onSelect(stub: TrendingStub): void {
    if (this.disabled()) return;
    this.trackChange.emit({
      trackId: stub.trackId,
      trackName: stub.trackName,
      artistName: stub.artistName,
      source: 'trending',
    });
    this.onClose();
  }

  protected onClear(): void {
    if (this.disabled()) return;
    this.trackChange.emit(undefined);
  }

  protected isPreviewing(trackId: string): boolean {
    return this.previewingId() === trackId;
  }
}
