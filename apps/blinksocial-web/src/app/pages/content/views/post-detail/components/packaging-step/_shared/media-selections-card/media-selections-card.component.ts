import { Component, computed, input, output, signal } from '@angular/core';
import type {
  PackagingAudioTrackContract,
  PlatformContract,
} from '@blinksocial/contracts';
import { TooltipComponent } from '../../../../../../../../shared/tooltip/tooltip.component';
import { AiButtonComponent } from '../../../draft-step/_shared/ai-button/ai-button.component';
import { TRENDING_STUB } from '../audio-picker/audio-picker.component';

const AI_DELAY_MS = 2500;
const STUB_COVER_REF = 'AI Generated Cover.png';
const SEARCH_DELAY_MS = 600;

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

/** Per-platform licensing note shown in the trending tab (TikTok-only per prototype). */
const PLATFORM_AUDIO_NOTES: Partial<Record<TrendingPanelPlatform, string>> = {
  tiktok:
    "Business accounts on TikTok are restricted from most trending audio. Use TikTok's Commercial Music Library for brand content.",
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

  protected readonly aiGeneratingCover = signal(false);

  // ── Trending Sounds panel state ────────────────────────────────────
  protected readonly panelOpen = signal(false);
  protected readonly panelTab = signal<'trending' | 'search'>('trending');
  protected readonly panelPlatform = signal<TrendingPanelPlatform>('instagram');
  protected readonly searchQuery = signal('');
  protected readonly committedSearch = signal('');
  protected readonly searching = signal(false);
  protected readonly previewingId = signal<string | null>(null);

  protected readonly trendingPanelPlatforms = TRENDING_PANEL_PLATFORMS;
  protected readonly trendingPanelLabel = TRENDING_PANEL_LABEL;

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

  protected readonly currentPanelTracks = computed(() =>
    TRENDING_STUB[this.panelPlatform()] ?? [],
  );

  protected readonly currentPlatformNote = computed(
    () => PLATFORM_AUDIO_NOTES[this.panelPlatform()] ?? null,
  );

  /**
   * Search results: union of every Trending Panel platform's tracks
   * filtered by `committedSearch`. Case-insensitive substring match on
   * trackName + artistName.
   */
  protected readonly searchResults = computed(() => {
    const q = this.committedSearch().trim().toLowerCase();
    if (!q) return [];
    const all = TRENDING_PANEL_PLATFORMS.flatMap((p) => TRENDING_STUB[p] ?? []);
    return all.filter(
      (t) =>
        t.trackName.toLowerCase().includes(q) ||
        t.artistName.toLowerCase().includes(q),
    );
  });

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

  protected onSelectTrack(
    track: { trackId: string; trackName: string; artistName: string },
    source: 'trending' | 'search',
  ): void {
    if (this.disabled()) return;
    this.audioChange.emit({
      trackId: track.trackId,
      trackName: track.trackName,
      artistName: track.artistName,
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
      this.committedSearch.set('');
      return;
    }
    this.searching.set(true);
    // Brief simulated latency so the "Searching…" state is visible.
    setTimeout(() => {
      this.committedSearch.set(q);
      this.searching.set(false);
    }, SEARCH_DELAY_MS);
  }
}
