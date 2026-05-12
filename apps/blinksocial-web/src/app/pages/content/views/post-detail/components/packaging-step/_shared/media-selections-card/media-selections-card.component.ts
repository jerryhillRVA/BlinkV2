import { Component, computed, inject, input, output, signal } from '@angular/core';
import type {
  PackagingAudioTrackContract,
  PlatformContract,
} from '@blinksocial/contracts';
import { TooltipComponent } from '../../../../../../../../shared/tooltip/tooltip.component';
import { AiButtonComponent } from '../../../draft-step/_shared/ai-button/ai-button.component';
import { TRENDING_STUB } from '../audio-picker/audio-picker.component';
import { ITunesService, type ITunesTrack } from '../itunes.service';

const AI_DELAY_MS = 2500;
const STUB_COVER_REF = 'AI Generated Cover.png';

const COVER_TOOLTIP =
  'The static image viewers see before they tap play. The single highest-impact element for click-through rate. Upload a custom image or select a frame from your video.';
const AUDIO_TOOLTIP =
  "Plan which audio to use during video editing. This is a production reference — select your track in the platform's native app when you post. Your video editor applies the audio before export if embedding in the file.";

/** Platforms the Trending Sounds panel surfaces (matches prototype). */
const TRENDING_PANEL_PLATFORMS = ['instagram', 'tiktok', 'facebook'] as const;
type TrendingPanelPlatform = (typeof TRENDING_PANEL_PLATFORMS)[number];

const TRENDING_PANEL_LABEL: Record<TrendingPanelPlatform, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  facebook: 'Facebook',
};

/** Per-platform licensing note shown in the trending tab. Verbatim from
 *  the prototype's PLATFORM_AUDIO_NOTES (PackagingStudio.tsx:259-263). */
const PLATFORM_AUDIO_NOTES: Record<TrendingPanelPlatform, string> = {
  instagram:
    'Meta licensing covers most trending songs for business accounts on Instagram Reels.',
  tiktok:
    "Business accounts on TikTok are restricted from most trending audio. Use TikTok's Commercial Music Library for brand content.",
  facebook:
    'Meta licensing covers most trending songs for business accounts on Facebook.',
};

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
  imports: [AiButtonComponent, TooltipComponent],
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

  private readonly itunes = inject(ITunesService);

  protected readonly aiGeneratingCover = signal(false);

  // ── Trending Sounds panel state ────────────────────────────────────
  protected readonly panelOpen = signal(false);
  protected readonly panelTab = signal<'trending' | 'search'>('trending');
  protected readonly panelPlatform = signal<TrendingPanelPlatform>('instagram');
  protected readonly searchQuery = signal('');
  protected readonly searching = signal(false);
  protected readonly previewingId = signal<string | null>(null);

  protected readonly trendingPanelPlatforms = TRENDING_PANEL_PLATFORMS;
  protected readonly trendingPanelLabel = TRENDING_PANEL_LABEL;

  /**
   * Per-platform iTunes-resolved trending tracks. `undefined` means
   * "haven't fetched yet" (loading state); `[]` means "fetched but
   * empty" (fallback to local stubs in the UI). Caches across panel
   * close/reopen — only refetched on cache miss.
   */
  private readonly trendingResolved = signal<
    Partial<Record<TrendingPanelPlatform, ITunesTrack[] | 'loading'>>
  >({});

  /** Search results from the iTunes Search API (free-text query). */
  protected readonly searchResultsSig = signal<ITunesTrack[]>([]);
  /** Whether a search has been run at least once (gates the "No results" copy). */
  protected readonly hasSearched = signal(false);

  protected readonly hasCover = computed(() => {
    const v = this.coverAsset();
    return !!v && v.trim().length > 0;
  });

  protected readonly coverLabel = computed(() =>
    this.thumbnailMode() ? 'Thumbnail' : 'Cover image',
  );

  protected readonly coverTooltip = COVER_TOOLTIP;
  protected readonly audioTooltip = AUDIO_TOOLTIP;

  protected readonly showAudioSection = computed(() => {
    const p = this.platform();
    return p === 'instagram' || p === 'tiktok' || p === 'facebook';
  });

  /**
   * Current platform's tracks. When iTunes has resolved real data we
   * render that (with artwork + previewUrl); otherwise we render the
   * local seed entries so the list never appears empty during the
   * network round-trip. Synthetic gradient fallback handles missing
   * artwork on a per-row basis.
   */
  protected readonly currentPanelTracks = computed<ITunesTrack[]>(() => {
    const p = this.panelPlatform();
    const cached = this.trendingResolved()[p];
    if (Array.isArray(cached) && cached.length > 0) return cached;
    return (TRENDING_STUB[p] ?? []).map((s) => ({
      trackId: s.trackId,
      trackName: s.trackName,
      artistName: s.artistName,
    }));
  });

  protected readonly trendingLoading = computed(
    () => this.trendingResolved()[this.panelPlatform()] === 'loading',
  );

  protected readonly currentPlatformNote = computed(
    () => PLATFORM_AUDIO_NOTES[this.panelPlatform()] ?? null,
  );

  /**
   * Per-track artwork: prefer iTunes' artworkUrl when present, otherwise
   * fall back to a deterministic synthetic gradient. The template uses
   * `artworkUrl(track)` for the image src + `artworkStyle(trackId)` for
   * the fallback span's background.
   */
  protected artworkUrl(track: ITunesTrack): string | null {
    return track.artworkUrl ?? null;
  }

  protected artworkStyle(trackId: string): { background: string } {
    const hue1 = this.hashHue(trackId);
    const hue2 = (hue1 + 40) % 360;
    return {
      background: `linear-gradient(135deg, hsl(${hue1}, 70%, 55%), hsl(${hue2}, 75%, 45%))`,
    };
  }

  protected artworkLetter(name: string): string {
    return (name?.trim()?.[0] ?? '?').toUpperCase();
  }

  private hashHue(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = (h * 31 + s.charCodeAt(i)) | 0;
    }
    return Math.abs(h) % 360;
  }

  /** Search results passthrough — fed by the iTunes service. */
  protected readonly searchResults = computed(() => this.searchResultsSig());

  protected readonly trackSourceLabel = computed(() => {
    const t = this.audio();
    if (!t) return '';
    switch (t.source) {
      case 'trending':
        return 'Trending';
      case 'search':
        return 'Platform Library';
      case 'custom':
        return t.trackName === 'Original Audio' ? 'Original' : 'Custom';
      default:
        return '';
    }
  });

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

  /**
   * Browse Trending Sounds — opens the inline panel underneath the
   * action buttons (mirrors the prototype's setAudioPanel(true) flow).
   * The panel defaults to the Trending tab and the user's current
   * platform if that platform supports trending sounds; otherwise
   * Instagram (first entry).
   */
  protected onBrowseTrending(): void {
    if (this.disabled()) return;
    if (this.panelOpen()) {
      this.onClosePanel();
      return;
    }
    const current = this.platform();
    const initial = TRENDING_PANEL_PLATFORMS.includes(
      current as TrendingPanelPlatform,
    )
      ? (current as TrendingPanelPlatform)
      : 'instagram';
    this.panelPlatform.set(initial);
    this.panelTab.set('trending');
    this.panelOpen.set(true);
    this.loadTrendingForPlatform(initial);
  }

  protected onClosePanel(): void {
    this.panelOpen.set(false);
    this.previewingId.set(null);
  }

  protected onSetPanelTab(tab: 'trending' | 'search'): void {
    this.panelTab.set(tab);
  }

  protected onSetPanelPlatform(p: TrendingPanelPlatform): void {
    this.panelPlatform.set(p);
    this.loadTrendingForPlatform(p);
  }

  /**
   * Fetch real iTunes metadata for the platform's seed list. Skips if
   * we've already resolved (or are currently resolving) this platform.
   * On error / missing iTunes hit per seed, we keep the seed values
   * (no artwork) — the UI falls back to the synthetic gradient.
   */
  private loadTrendingForPlatform(p: TrendingPanelPlatform): void {
    const current = this.trendingResolved()[p];
    if (current !== undefined) return; // already loading or resolved
    this.trendingResolved.update((r) => ({ ...r, [p]: 'loading' }));

    const seeds = TRENDING_STUB[p] ?? [];
    const lookups = seeds.map((seed) =>
      this.itunes.findTrack(seed.trackName, seed.artistName),
    );

    if (lookups.length === 0) {
      this.trendingResolved.update((r) => ({ ...r, [p]: [] }));
      return;
    }

    // Resolve all lookups in parallel; substitute the seed when iTunes
    // returns null so the row still renders with its known name/artist.
    let remaining = lookups.length;
    const out: ITunesTrack[] = new Array(lookups.length);
    lookups.forEach((obs, i) => {
      obs.subscribe({
        next: (track) => {
          out[i] = track ?? {
            trackId: seeds[i].trackId,
            trackName: seeds[i].trackName,
            artistName: seeds[i].artistName,
          };
        },
        complete: () => {
          if (--remaining === 0) {
            this.trendingResolved.update((r) => ({ ...r, [p]: out.filter(Boolean) }));
          }
        },
      });
    });
  }

  protected onSearchInput(e: Event): void {
    this.searchQuery.set((e.target as HTMLInputElement).value ?? '');
  }

  protected onSearchKeydown(e: KeyboardEvent): void {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    this.runSearch();
  }

  protected onSearchClick(): void {
    this.runSearch();
  }

  protected onTogglePreview(trackId: string): void {
    this.previewingId.update((cur) => (cur === trackId ? null : trackId));
  }

  protected isPreviewing(trackId: string): boolean {
    return this.previewingId() === trackId;
  }

  protected onSelectTrack(track: ITunesTrack, source: 'trending' | 'search'): void {
    if (this.disabled()) return;
    this.audioChange.emit({
      trackId: track.trackId,
      trackName: track.trackName,
      artistName: track.artistName,
      artworkUrl: track.artworkUrl,
      previewUrl: track.previewUrl,
      source,
    });
    this.onClosePanel();
  }

  protected onUseOriginal(): void {
    if (this.disabled()) return;
    this.audioChange.emit({
      trackId: 'original',
      trackName: 'Original Audio',
      artistName: '',
      source: 'custom',
    });
  }

  protected onClearAudio(): void {
    if (this.disabled()) return;
    this.audioChange.emit(undefined);
  }

  private runSearch(): void {
    const q = this.searchQuery().trim();
    if (!q) {
      this.searchResultsSig.set([]);
      this.hasSearched.set(false);
      return;
    }
    this.searching.set(true);
    this.itunes.search(q).subscribe({
      next: (results) => {
        this.searchResultsSig.set(results);
      },
      complete: () => {
        this.hasSearched.set(true);
        this.searching.set(false);
      },
    });
  }
}
