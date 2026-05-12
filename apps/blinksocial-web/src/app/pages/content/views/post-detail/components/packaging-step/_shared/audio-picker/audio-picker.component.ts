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

// Mirror of the prototype's TRENDING_TRACKS constant (PackagingStudio.tsx:
// 232-256). Six real-world tracks per platform — IG / TikTok / FB only
// (the prototype's Browse Trending Sounds panel only surfaces those
// three). The remaining `Platform` entries get short stub lists for
// completeness so the Record stays exhaustive against the union type.
export const TRENDING_STUB: Record<PlatformContract, ReadonlyArray<TrendingStub>> = {
  instagram: [
    { trackId: 'ig-1', trackName: 'Espresso', artistName: 'Sabrina Carpenter' },
    { trackId: 'ig-2', trackName: 'APT.', artistName: 'ROSÉ & Bruno Mars' },
    { trackId: 'ig-3', trackName: 'Die With A Smile', artistName: 'Lady Gaga & Bruno Mars' },
    { trackId: 'ig-4', trackName: 'Birds of a Feather', artistName: 'Billie Eilish' },
    { trackId: 'ig-5', trackName: 'Good Luck Babe!', artistName: 'Chappell Roan' },
    { trackId: 'ig-6', trackName: 'Taste', artistName: 'Sabrina Carpenter' },
  ],
  tiktok: [
    { trackId: 'tt-1', trackName: 'APT.', artistName: 'ROSÉ & Bruno Mars' },
    { trackId: 'tt-2', trackName: 'Espresso', artistName: 'Sabrina Carpenter' },
    { trackId: 'tt-3', trackName: 'Luther', artistName: 'Kendrick Lamar & SZA' },
    { trackId: 'tt-4', trackName: '360', artistName: 'Charli XCX' },
    { trackId: 'tt-5', trackName: 'Starboy', artistName: 'The Weeknd' },
    { trackId: 'tt-6', trackName: 'Good Luck Babe!', artistName: 'Chappell Roan' },
  ],
  facebook: [
    { trackId: 'fb-1', trackName: 'Die With A Smile', artistName: 'Lady Gaga & Bruno Mars' },
    { trackId: 'fb-2', trackName: 'Blinding Lights', artistName: 'The Weeknd' },
    { trackId: 'fb-3', trackName: 'As It Was', artistName: 'Harry Styles' },
    { trackId: 'fb-4', trackName: 'Unholy', artistName: 'Sam Smith & Kim Petras' },
    { trackId: 'fb-5', trackName: 'Flowers', artistName: 'Miley Cyrus' },
    { trackId: 'fb-6', trackName: 'Levitating', artistName: 'Dua Lipa' },
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
