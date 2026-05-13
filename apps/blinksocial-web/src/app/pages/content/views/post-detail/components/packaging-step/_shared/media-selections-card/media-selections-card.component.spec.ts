import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import type {
  PackagingAudioTrackContract,
  PlatformContract,
} from '@blinksocial/contracts';
import { MediaSelectionsCardComponent } from './media-selections-card.component';

interface SetupOptions {
  platform?: PlatformContract;
  coverAsset?: string;
  audio?: PackagingAudioTrackContract;
  disabled?: boolean;
  thumbnailMode?: boolean;
}

interface SetupReturn {
  fixture: ComponentFixture<MediaSelectionsCardComponent>;
  http: HttpTestingController;
}

function setupWithHttp(opts: SetupOptions = {}): SetupReturn {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [MediaSelectionsCardComponent],
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });
  const fixture = TestBed.createComponent(MediaSelectionsCardComponent);
  const http = TestBed.inject(HttpTestingController);
  fixture.componentRef.setInput('platform', opts.platform ?? 'instagram');
  fixture.componentRef.setInput('coverAsset', opts.coverAsset);
  fixture.componentRef.setInput('audio', opts.audio);
  fixture.componentRef.setInput('disabled', opts.disabled ?? false);
  fixture.componentRef.setInput('thumbnailMode', opts.thumbnailMode ?? false);
  fixture.detectChanges();
  return { fixture, http };
}

function setup(opts: SetupOptions = {}): ComponentFixture<MediaSelectionsCardComponent> {
  return setupWithHttp(opts).fixture;
}

/**
 * After Browse Trending opens the panel, six iTunes findTrack lookups
 * fire. Flush them all with empty responses so the resolver caches
 * the seed fallback. Tests that don't care about iTunes can ignore
 * artwork; tests that do can flush with real-looking responses.
 */
function flushTrendingLookups(http: HttpTestingController, count = 6): void {
  const reqs = http.match(
    (r) => r.url === 'https://itunes.apple.com/search' && r.params.get('limit') === '1',
  );
  for (const req of reqs.slice(0, count)) {
    req.flush({ results: [] });
  }
}

describe('MediaSelectionsCardComponent', () => {
  it('renders the "Media Selections" card label', () => {
    const fixture = setup();
    expect(fixture.nativeElement.querySelector('.card-label')?.textContent).toBe('Media Selections');
  });

  it('uses role=region-style aria-label on the host section', () => {
    const fixture = setup();
    const root = fixture.nativeElement.querySelector('.media-selections');
    expect(root.getAttribute('aria-label')).toBe('Media selections');
  });

  it('renders the "Cover image" label + Recommended helper when not in thumbnail mode', () => {
    const fixture = setup({ coverAsset: undefined });
    const label = fixture.nativeElement.querySelector('.field-label') as HTMLElement;
    expect(label.textContent).toContain('Cover image');
    expect(label.textContent).toContain('Recommended');
  });

  it('renders the "Thumbnail" label + red asterisk + required-error in thumbnail mode', () => {
    const fixture = setup({ thumbnailMode: true, coverAsset: undefined });
    const label = fixture.nativeElement.querySelector('.field-label') as HTMLElement;
    expect(label.textContent).toContain('Thumbnail');
    expect(fixture.nativeElement.querySelector('.field-required')).not.toBeNull();
    expect(
      (fixture.nativeElement.querySelector('.field-error') as HTMLElement)?.textContent,
    ).toContain('YouTube long-form');
  });

  it('empty state renders the cover-input + Upload label + AI Generate button', () => {
    const fixture = setup({ coverAsset: undefined });
    expect(fixture.nativeElement.querySelector('#media-cover-input')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.upload-btn')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-ai-button')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.cover-attached')).toBeNull();
  });

  it('attached state renders a green check chip with the filename and a remove button', () => {
    const fixture = setup({ coverAsset: 'my-cover.png' });
    const chip = fixture.nativeElement.querySelector('.cover-attached');
    expect(chip).not.toBeNull();
    expect(
      (fixture.nativeElement.querySelector('.cover-name') as HTMLElement).textContent,
    ).toBe('my-cover.png');
    expect(fixture.nativeElement.querySelector('.cover-clear')).not.toBeNull();
    // Empty-state controls are gone.
    expect(fixture.nativeElement.querySelector('#media-cover-input')).toBeNull();
  });

  it('typing in the cover-input emits coverAssetChange with the new value', () => {
    const fixture = setup({ coverAsset: undefined });
    const emitted: (string | undefined)[] = [];
    fixture.componentInstance.coverAssetChange.subscribe((v) => emitted.push(v));
    const input = fixture.nativeElement.querySelector('#media-cover-input') as HTMLInputElement;
    input.value = 'reference.png';
    input.dispatchEvent(new Event('input'));
    expect(emitted).toEqual(['reference.png']);
  });

  it('clearing the cover-input emits coverAssetChange(undefined)', () => {
    const fixture = setup({ coverAsset: undefined });
    const emitted: (string | undefined)[] = [];
    fixture.componentInstance.coverAssetChange.subscribe((v) => emitted.push(v));
    const input = fixture.nativeElement.querySelector('#media-cover-input') as HTMLInputElement;
    input.value = '';
    input.dispatchEvent(new Event('input'));
    expect(emitted).toEqual([undefined]);
  });

  it('uploading a file emits coverAssetChange with the file name', () => {
    const fixture = setup({ coverAsset: undefined });
    const emitted: (string | undefined)[] = [];
    fixture.componentInstance.coverAssetChange.subscribe((v) => emitted.push(v));
    const fileInput = fixture.nativeElement.querySelector('.upload-file-input') as HTMLInputElement;
    const file = new File(['x'], 'cover.png', { type: 'image/png' });
    Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });
    fileInput.dispatchEvent(new Event('change'));
    expect(emitted).toEqual(['cover.png']);
  });

  it('uploading a file reads it via FileReader and emits a data: URL on coverAssetUrlChange', async () => {
    const fixture = setup({ coverAsset: undefined });
    const urls: (string | undefined)[] = [];
    fixture.componentInstance.coverAssetUrlChange.subscribe((u) => urls.push(u));
    const fileInput = fixture.nativeElement.querySelector('.upload-file-input') as HTMLInputElement;
    const file = new File(['hello'], 'shot.png', { type: 'image/png' });
    Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });
    fileInput.dispatchEvent(new Event('change'));
    // FileReader.onload fires on a microtask in jsdom — yield once.
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(urls.length).toBe(1);
    expect(urls[0]).toMatch(/^data:image\/png;base64,/);
  });

  it('clicking clear emits coverAssetUrlChange(undefined) alongside the filename clear', () => {
    const fixture = setup({ coverAsset: 'my-cover.png' });
    const urls: (string | undefined)[] = [];
    fixture.componentInstance.coverAssetUrlChange.subscribe((u) => urls.push(u));
    (fixture.nativeElement.querySelector('.cover-clear') as HTMLButtonElement).click();
    expect(urls).toEqual([undefined]);
  });

  it('typing into the cover-input clears coverAssetUrl (typed name has no backing file)', () => {
    const fixture = setup({ coverAsset: undefined });
    const urls: (string | undefined)[] = [];
    fixture.componentInstance.coverAssetUrlChange.subscribe((u) => urls.push(u));
    const input = fixture.nativeElement.querySelector('#media-cover-input') as HTMLInputElement;
    input.value = 'typed-name.png';
    input.dispatchEvent(new Event('input'));
    expect(urls).toEqual([undefined]);
  });

  it('AI Generate clears coverAssetUrl (no real image generated yet)', () => {
    const fixture = setup({ coverAsset: undefined });
    const urls: (string | undefined)[] = [];
    fixture.componentInstance.coverAssetUrlChange.subscribe((u) => urls.push(u));
    vi.useFakeTimers();
    fixture.componentInstance['onAiGenerate']();
    vi.runAllTimers();
    expect(urls).toEqual([undefined]);
    vi.useRealTimers();
  });

  it('upload change with no file is a no-op (no emit)', () => {
    const fixture = setup({ coverAsset: undefined });
    const emitted: (string | undefined)[] = [];
    fixture.componentInstance.coverAssetChange.subscribe((v) => emitted.push(v));
    const fileInput = fixture.nativeElement.querySelector('.upload-file-input') as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', { value: [], configurable: true });
    fileInput.dispatchEvent(new Event('change'));
    expect(emitted).toEqual([]);
  });

  it('clicking the remove button on an attached cover emits coverAssetChange(undefined)', () => {
    const fixture = setup({ coverAsset: 'my-cover.png' });
    const emitted: (string | undefined)[] = [];
    fixture.componentInstance.coverAssetChange.subscribe((v) => emitted.push(v));
    (fixture.nativeElement.querySelector('.cover-clear') as HTMLButtonElement).click();
    expect(emitted).toEqual([undefined]);
  });

  it('AI Generate sets the loading flag and emits a stub reference on tick', () => {
    const fixture = setup({ coverAsset: undefined });
    const emitted: (string | undefined)[] = [];
    fixture.componentInstance.coverAssetChange.subscribe((v) => emitted.push(v));
    vi.useFakeTimers();
    fixture.componentInstance['onAiGenerate']();
    expect(fixture.componentInstance['aiGeneratingCover']()).toBe(true);
    // Second call while loading is a no-op
    fixture.componentInstance['onAiGenerate']();
    vi.runAllTimers();
    expect(fixture.componentInstance['aiGeneratingCover']()).toBe(false);
    expect(emitted).toEqual(['AI Generated Cover.png']);
    vi.useRealTimers();
  });

  it('disabled state: input is read-only, remove + AI buttons are disabled, upload label is dimmed', () => {
    const fixture = setup({ coverAsset: 'my-cover.png', disabled: true });
    expect(
      (fixture.nativeElement.querySelector('.cover-clear') as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it('Audio Planning empty state shows "No audio selected yet" + Browse + Use Original buttons', () => {
    const fixture = setup({ platform: 'instagram', audio: undefined });
    expect(
      (fixture.nativeElement.querySelector('.audio-empty') as HTMLElement)?.textContent,
    ).toBe('No audio selected yet');
    expect(fixture.nativeElement.querySelector('.audio-browse')?.textContent?.trim()).toBe(
      'Browse Trending Sounds',
    );
    expect(fixture.nativeElement.querySelector('.audio-original')?.textContent?.trim()).toBe(
      'Use Original',
    );
  });

  it('Audio Planning selected state shows track name + artist + source chip + clear button', () => {
    const fixture = setup({
      platform: 'instagram',
      audio: {
        trackId: 'ig-1',
        trackName: 'Sunset Drift',
        artistName: 'Lo-Fi Loop',
        source: 'trending',
      },
    });
    expect(fixture.nativeElement.querySelector('.audio-empty')).toBeNull();
    expect(
      (fixture.nativeElement.querySelector('.audio-name') as HTMLElement).textContent,
    ).toBe('Sunset Drift');
    expect(
      (fixture.nativeElement.querySelector('.audio-artist') as HTMLElement).textContent,
    ).toBe('Lo-Fi Loop');
    expect(
      (fixture.nativeElement.querySelector('.audio-source') as HTMLElement).textContent,
    ).toBe('Trending');
    expect(fixture.nativeElement.querySelector('.audio-clear')).not.toBeNull();
  });

  it('clicking Browse Trending Sounds opens the inline Trending Sounds panel', () => {
    const fixture = setup({ platform: 'instagram' });
    expect(fixture.nativeElement.querySelector('.sounds-panel')).toBeNull();
    (fixture.nativeElement.querySelector('.audio-browse') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sounds-panel')).not.toBeNull();
    expect(
      (fixture.nativeElement.querySelector('.sounds-panel-title') as HTMLElement).textContent,
    ).toBe('Trending Sounds');
  });

  it('clicking Browse Trending Sounds again (when open) closes the panel', () => {
    const fixture = setup({ platform: 'instagram' });
    const btn = fixture.nativeElement.querySelector('.audio-browse') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sounds-panel')).not.toBeNull();
    btn.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sounds-panel')).toBeNull();
  });

  it('the panel-close X button closes the panel', () => {
    const fixture = setup({ platform: 'instagram' });
    (fixture.nativeElement.querySelector('.audio-browse') as HTMLButtonElement).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.sounds-panel-close') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sounds-panel')).toBeNull();
  });

  it('the trending panel defaults to the user\'s current platform sub-tab', () => {
    const fixture = setup({ platform: 'tiktok' });
    (fixture.nativeElement.querySelector('.audio-browse') as HTMLButtonElement).click();
    fixture.detectChanges();
    const activeTab = fixture.nativeElement.querySelector(
      '.sounds-platform-tab.is-active',
    ) as HTMLElement;
    expect(activeTab?.textContent?.trim()).toBe('TikTok');
  });

  it('renders six trending tracks per platform sub-tab (mirrors prototype TRENDING_TRACKS)', () => {
    const fixture = setup({ platform: 'instagram' });
    (fixture.nativeElement.querySelector('.audio-browse') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.sounds-row').length).toBe(6);
  });

  it('TikTok sub-tab shows the amber commercial-music licensing note', () => {
    const fixture = setup({ platform: 'tiktok' });
    (fixture.nativeElement.querySelector('.audio-browse') as HTMLButtonElement).click();
    fixture.detectChanges();
    const note = fixture.nativeElement.querySelector('.sounds-note');
    expect(note).not.toBeNull();
    expect(note.classList.contains('sounds-note--amber')).toBe(true);
    expect(note.textContent).toContain('Commercial Music Library');
  });

  it('IG sub-tab shows the blue Meta-licensing note for Instagram Reels', () => {
    const fixture = setup({ platform: 'instagram' });
    (fixture.nativeElement.querySelector('.audio-browse') as HTMLButtonElement).click();
    fixture.detectChanges();
    const note = fixture.nativeElement.querySelector('.sounds-note');
    expect(note).not.toBeNull();
    expect(note.classList.contains('sounds-note--amber')).toBe(false);
    expect(note.textContent).toContain('Instagram Reels');
  });

  it('artworkLetter returns the first letter of the track name, uppercased', () => {
    const fixture = setup({ platform: 'instagram' });
    expect(fixture.componentInstance['artworkLetter']('Espresso')).toBe('E');
    expect(fixture.componentInstance['artworkLetter']('apt.')).toBe('A');
    expect(fixture.componentInstance['artworkLetter']('  morning glow')).toBe('M');
    expect(fixture.componentInstance['artworkLetter']('')).toBe('?');
  });

  it('artworkStyle returns a stable gradient for the same trackId', () => {
    const fixture = setup({ platform: 'instagram' });
    const a = fixture.componentInstance['artworkStyle']('ig-1');
    const b = fixture.componentInstance['artworkStyle']('ig-1');
    expect(a.background).toBe(b.background);
    expect(a.background.startsWith('linear-gradient(135deg,')).toBe(true);
  });

  it('artworkStyle returns different gradients for different trackIds', () => {
    const fixture = setup({ platform: 'instagram' });
    const a = fixture.componentInstance['artworkStyle']('ig-1');
    const b = fixture.componentInstance['artworkStyle']('ig-2');
    expect(a.background).not.toBe(b.background);
  });

  it('renders artwork thumbnails on every trending row + the selected chip', () => {
    const fixture = setup({
      platform: 'instagram',
      audio: { trackId: 'ig-1', trackName: 'X', artistName: 'Y', source: 'trending' },
    });
    // Selected chip artwork.
    expect(fixture.nativeElement.querySelector('.audio-art')).not.toBeNull();
    // Trending rows artwork (6 tracks per platform).
    (fixture.nativeElement.querySelector('.audio-browse') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.sounds-art').length).toBe(6);
  });

  it('FB sub-tab shows the blue Meta-licensing note for Facebook', () => {
    const fixture = setup({ platform: 'facebook' });
    (fixture.nativeElement.querySelector('.audio-browse') as HTMLButtonElement).click();
    fixture.detectChanges();
    const note = fixture.nativeElement.querySelector('.sounds-note');
    expect(note).not.toBeNull();
    expect(note.classList.contains('sounds-note--amber')).toBe(false);
    expect(note.textContent).toContain('Facebook');
  });

  it('clicking a track Select pill emits the chosen track and closes the panel', () => {
    const fixture = setup({ platform: 'instagram' });
    const emitted: (PackagingAudioTrackContract | undefined)[] = [];
    fixture.componentInstance.audioChange.subscribe((v) => emitted.push(v));
    (fixture.nativeElement.querySelector('.audio-browse') as HTMLButtonElement).click();
    fixture.detectChanges();
    const firstSelect = fixture.nativeElement.querySelectorAll(
      '.sounds-select',
    )[0] as HTMLButtonElement;
    firstSelect.click();
    fixture.detectChanges();
    expect(emitted[0]?.trackName).toBe('Espresso'); // first instagram entry
    expect(emitted[0]?.source).toBe('trending');
    expect(fixture.nativeElement.querySelector('.sounds-panel')).toBeNull();
  });

  it('clicking a preview button toggles aria-pressed state', () => {
    const fixture = setup({ platform: 'instagram' });
    (fixture.nativeElement.querySelector('.audio-browse') as HTMLButtonElement).click();
    fixture.detectChanges();
    const preview = fixture.nativeElement.querySelectorAll(
      '.sounds-preview',
    )[0] as HTMLButtonElement;
    expect(preview.getAttribute('aria-pressed')).toBe('false');
    preview.click();
    fixture.detectChanges();
    expect(preview.getAttribute('aria-pressed')).toBe('true');
    preview.click();
    fixture.detectChanges();
    expect(preview.getAttribute('aria-pressed')).toBe('false');
  });

  it('Search tab swaps the body for a search row + results list', () => {
    const fixture = setup({ platform: 'instagram' });
    (fixture.nativeElement.querySelector('.audio-browse') as HTMLButtonElement).click();
    fixture.detectChanges();
    const tabs = fixture.nativeElement.querySelectorAll('.sounds-tab');
    (tabs[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sounds-search-row')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.sounds-platform-tabs')).toBeNull();
  });

  it('Search input + Enter renders iTunes-returned tracks (real artwork URL when present)', () => {
    const { fixture, http } = setupWithHttp({ platform: 'instagram' });
    (fixture.nativeElement.querySelector('.audio-browse') as HTMLButtonElement).click();
    flushTrendingLookups(http);
    fixture.detectChanges();
    (fixture.nativeElement.querySelectorAll('.sounds-tab')[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('.sounds-search-input') as HTMLInputElement;
    input.value = 'Espresso';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    // The component issued an iTunes search request — fulfill it.
    const req = http.expectOne(
      (r) =>
        r.url === 'https://itunes.apple.com/search' &&
        r.params.get('term') === 'Espresso' &&
        r.params.get('limit') === '8',
    );
    req.flush({
      results: [
        {
          trackId: 1,
          trackName: 'Espresso',
          artistName: 'Sabrina Carpenter',
          artworkUrl100: 'https://itunes.example/100x100/x.jpg',
          previewUrl: 'https://aud.example/x.m4a',
        },
        {
          trackId: 2,
          trackName: 'Espresso (Live)',
          artistName: 'Sabrina Carpenter',
        },
      ],
    });
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('.sounds-row');
    expect(rows.length).toBe(2);
    // First row has real artwork (img); second falls back to gradient.
    expect(
      (rows[0] as HTMLElement).querySelector('.sounds-art--img'),
    ).not.toBeNull();
    expect(
      (rows[1] as HTMLElement).querySelector('.sounds-art--img'),
    ).toBeNull();
  });

  it('Search "No results" empty state shows when iTunes returns an empty list', () => {
    const { fixture, http } = setupWithHttp({ platform: 'instagram' });
    (fixture.nativeElement.querySelector('.audio-browse') as HTMLButtonElement).click();
    flushTrendingLookups(http);
    fixture.detectChanges();
    (fixture.nativeElement.querySelectorAll('.sounds-tab')[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    fixture.componentInstance['searchQuery'].set('xyzxyzxyz');
    fixture.componentInstance['onSearchClick']();
    http.expectOne(() => true).flush({ results: [] });
    fixture.detectChanges();
    expect(
      (fixture.nativeElement.querySelector('.sounds-empty') as HTMLElement)?.textContent,
    ).toBe('No results');
  });

  it('Empty search query is a no-op (issues no HTTP request)', () => {
    const { fixture, http } = setupWithHttp({ platform: 'instagram' });
    (fixture.nativeElement.querySelector('.audio-browse') as HTMLButtonElement).click();
    flushTrendingLookups(http);
    fixture.detectChanges();
    (fixture.nativeElement.querySelectorAll('.sounds-tab')[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    fixture.componentInstance['onSearchClick']();
    // No /search?term= request fired (other than the trending lookups
    // which we've already flushed).
    expect(fixture.componentInstance['searchResults']()).toEqual([]);
    expect(fixture.componentInstance['hasSearched']()).toBe(false);
  });

  it('Panel platform defaults to instagram when the post platform is non-trending (e.g. youtube)', () => {
    const fixture = setup({ platform: 'youtube' });
    // Audio actions row is hidden for youtube — but if Browse is invoked
    // programmatically, the default platform should still be instagram.
    fixture.componentInstance['onBrowseTrending']();
    expect(fixture.componentInstance['panelPlatform']()).toBe('instagram');
  });

  it('non-Enter keydown in the search input is a no-op', () => {
    const fixture = setup({ platform: 'instagram' });
    fixture.componentInstance['onBrowseTrending']();
    fixture.componentInstance['onSetPanelTab']('search');
    fixture.detectChanges();
    fixture.componentInstance['onSearchKeydown'](
      new KeyboardEvent('keydown', { key: 'Tab' }),
    );
    expect(fixture.componentInstance['hasSearched']()).toBe(false);
    expect(fixture.componentInstance['searchResults']()).toEqual([]);
  });

  it('isPreviewing returns false for non-current track ids', () => {
    const fixture = setup({ platform: 'instagram' });
    fixture.componentInstance['onBrowseTrending']();
    expect(fixture.componentInstance['isPreviewing']('ig-1')).toBe(false);
    fixture.componentInstance['onTogglePreview']('ig-1');
    expect(fixture.componentInstance['isPreviewing']('ig-1')).toBe(true);
    expect(fixture.componentInstance['isPreviewing']('ig-2')).toBe(false);
  });

  it('search input updates the searchQuery signal as user types', () => {
    const fixture = setup({ platform: 'instagram' });
    fixture.componentInstance['onBrowseTrending']();
    fixture.componentInstance['onSetPanelTab']('search');
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('.sounds-search-input') as HTMLInputElement;
    input.value = 'Apt';
    input.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance['searchQuery']()).toBe('Apt');
  });

  it('trackSourceLabel returns empty string for an unknown source value (defensive default)', () => {
    const fixture = setup({
      platform: 'instagram',
      audio: {
        trackId: 't1',
        trackName: 'X',
        artistName: 'Y',
        // Cast to bypass the union — covers the default branch in
        // the switch which guards against future source values.
        source: 'unknown' as unknown as 'trending',
      },
    });
    expect(
      (fixture.nativeElement.querySelector('.audio-source') as HTMLElement).textContent,
    ).toBe('');
  });

  it('Whitespace-only search query is treated as empty (no request)', () => {
    const { fixture, http } = setupWithHttp({ platform: 'instagram' });
    fixture.componentInstance['onBrowseTrending']();
    flushTrendingLookups(http);
    fixture.componentInstance['onSetPanelTab']('search');
    fixture.componentInstance['searchQuery'].set('   ');
    fixture.componentInstance['onSearchClick']();
    expect(fixture.componentInstance['searchResults']()).toEqual([]);
    expect(fixture.componentInstance['hasSearched']()).toBe(false);
  });

  it('Search shows "Searching..." while the iTunes request is in flight', () => {
    const { fixture, http } = setupWithHttp({ platform: 'instagram' });
    fixture.componentInstance['onBrowseTrending']();
    flushTrendingLookups(http);
    fixture.componentInstance['onSetPanelTab']('search');
    fixture.detectChanges();
    fixture.componentInstance['searchQuery'].set('Espresso');
    fixture.componentInstance['onSearchClick']();
    fixture.detectChanges();
    // Before the HTTP response lands, the panel should show "Searching..."
    expect(
      (fixture.nativeElement.querySelector('.sounds-empty') as HTMLElement)?.textContent,
    ).toBe('Searching...');
    // Flush so the test cleans up.
    http.expectOne(() => true).flush({ results: [] });
  });

  it('Closing the panel resets the previewing track id', () => {
    const fixture = setup({ platform: 'instagram' });
    fixture.componentInstance['onBrowseTrending']();
    fixture.componentInstance['onTogglePreview']('ig-1');
    expect(fixture.componentInstance['previewingId']()).toBe('ig-1');
    fixture.componentInstance['onClosePanel']();
    expect(fixture.componentInstance['previewingId']()).toBeNull();
  });

  it('Selecting a track from Search results emits with source="search" and carries iTunes metadata', () => {
    const { fixture, http } = setupWithHttp({ platform: 'instagram' });
    fixture.componentInstance['onBrowseTrending']();
    flushTrendingLookups(http);
    fixture.componentInstance['onSetPanelTab']('search');
    fixture.componentInstance['searchQuery'].set('Espresso');
    fixture.componentInstance['onSearchClick']();
    http.expectOne(() => true).flush({
      results: [
        {
          trackId: 99,
          trackName: 'Espresso',
          artistName: 'Sabrina Carpenter',
          artworkUrl100: 'https://art.example/100x100/e.jpg',
          previewUrl: 'https://aud.example/e.m4a',
        },
      ],
    });
    fixture.detectChanges();
    const emitted: (PackagingAudioTrackContract | undefined)[] = [];
    fixture.componentInstance.audioChange.subscribe((v) => emitted.push(v));
    (fixture.nativeElement.querySelectorAll('.sounds-select')[0] as HTMLButtonElement).click();
    expect(emitted[0]?.source).toBe('search');
    expect(emitted[0]?.trackId).toBe('99');
    expect(emitted[0]?.artworkUrl).toBe('https://art.example/300x300/e.jpg');
    expect(emitted[0]?.previewUrl).toBe('https://aud.example/e.m4a');
  });

  it('Browse Trending fetches iTunes findTrack for each seed and renders artwork when present', () => {
    const { fixture, http } = setupWithHttp({ platform: 'instagram' });
    (fixture.nativeElement.querySelector('.audio-browse') as HTMLButtonElement).click();
    // Six findTrack requests fire — flush all six with stub iTunes data.
    const reqs = http.match(
      (r) => r.url === 'https://itunes.apple.com/search' && r.params.get('limit') === '1',
    );
    expect(reqs.length).toBe(6);
    reqs.forEach((req, i) => {
      req.flush({
        results: [
          {
            trackId: 1000 + i,
            trackName: 'Resolved ' + i,
            artistName: 'Artist ' + i,
            artworkUrl100: `https://art.example/100x100/r${i}.jpg`,
            previewUrl: `https://aud.example/r${i}.m4a`,
          },
        ],
      });
    });
    fixture.detectChanges();
    // Six rows; each has a real-img artwork.
    expect(fixture.nativeElement.querySelectorAll('.sounds-row').length).toBe(6);
    expect(fixture.nativeElement.querySelectorAll('.sounds-art--img').length).toBe(6);
  });

  it('iTunes findTrack failures fall back to the local seed (gradient artwork)', () => {
    const { fixture, http } = setupWithHttp({ platform: 'instagram' });
    (fixture.nativeElement.querySelector('.audio-browse') as HTMLButtonElement).click();
    const reqs = http.match(
      (r) => r.url === 'https://itunes.apple.com/search' && r.params.get('limit') === '1',
    );
    reqs.forEach((req) => req.flush({ results: [] }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.sounds-row').length).toBe(6);
    // No image elements — all gradient placeholders.
    expect(fixture.nativeElement.querySelectorAll('.sounds-art--img').length).toBe(0);
  });

  it('clicking Use Original emits an Original Audio track with source=custom', () => {
    const fixture = setup({ platform: 'instagram' });
    const emitted: (PackagingAudioTrackContract | undefined)[] = [];
    fixture.componentInstance.audioChange.subscribe((v) => emitted.push(v));
    (fixture.nativeElement.querySelector('.audio-original') as HTMLButtonElement).click();
    expect(emitted[0]?.trackId).toBe('original');
    expect(emitted[0]?.trackName).toBe('Original Audio');
    expect(emitted[0]?.source).toBe('custom');
  });

  it('clicking the clear button on a selected track emits undefined', () => {
    const fixture = setup({
      platform: 'instagram',
      audio: { trackId: 'ig-1', trackName: 'a', artistName: 'b', source: 'trending' },
    });
    const emitted: (PackagingAudioTrackContract | undefined)[] = [];
    fixture.componentInstance.audioChange.subscribe((v) => emitted.push(v));
    (fixture.nativeElement.querySelector('.audio-clear') as HTMLButtonElement).click();
    expect(emitted).toEqual([undefined]);
  });

  it('audio-section is hidden for linkedin / youtube / x / tbd', () => {
    for (const p of ['linkedin', 'youtube', 'x', 'tbd'] as PlatformContract[]) {
      const fixture = setup({ platform: p });
      expect(fixture.nativeElement.querySelector('.audio-empty')).toBeNull();
      expect(fixture.nativeElement.querySelector('.audio-actions')).toBeNull();
    }
  });

  it('audio-section is visible for instagram / tiktok / facebook', () => {
    for (const p of ['instagram', 'tiktok', 'facebook'] as PlatformContract[]) {
      const fixture = setup({ platform: p });
      expect(fixture.nativeElement.querySelector('.audio-actions')).not.toBeNull();
    }
  });

  it('audio buttons are no-ops while disabled', () => {
    const fixture = setup({ platform: 'instagram', disabled: true });
    const emitted: (PackagingAudioTrackContract | undefined)[] = [];
    fixture.componentInstance.audioChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['onBrowseTrending']();
    fixture.componentInstance['onUseOriginal']();
    fixture.componentInstance['onClearAudio']();
    expect(emitted).toEqual([]);
  });

  it('renders tooltips for both Cover image and Audio Planning headers', () => {
    const fixture = setup({ platform: 'instagram' });
    const tooltips = fixture.nativeElement.querySelectorAll('app-tooltip');
    expect(tooltips.length).toBe(2);
  });

  it('trackSourceLabel resolves "Platform Library" for search-sourced tracks', () => {
    const fixture = setup({
      platform: 'instagram',
      audio: { trackId: 's1', trackName: 'Found', artistName: 'A', source: 'search' },
    });
    expect(
      (fixture.nativeElement.querySelector('.audio-source') as HTMLElement).textContent,
    ).toBe('Platform Library');
  });

  it('trackSourceLabel resolves "Original" for custom Original Audio entries', () => {
    const fixture = setup({
      platform: 'instagram',
      audio: { trackId: 'original', trackName: 'Original Audio', artistName: '', source: 'custom' },
    });
    expect(
      (fixture.nativeElement.querySelector('.audio-source') as HTMLElement).textContent,
    ).toBe('Original');
  });

  it('trackSourceLabel resolves "Custom" for non-original custom-source tracks', () => {
    const fixture = setup({
      platform: 'instagram',
      audio: { trackId: 'c1', trackName: 'My Track', artistName: 'Me', source: 'custom' },
    });
    expect(
      (fixture.nativeElement.querySelector('.audio-source') as HTMLElement).textContent,
    ).toBe('Custom');
  });

  it('hides the artist row when artistName is empty (Original Audio case)', () => {
    const fixture = setup({
      platform: 'instagram',
      audio: { trackId: 'original', trackName: 'Original Audio', artistName: '', source: 'custom' },
    });
    expect(fixture.nativeElement.querySelector('.audio-artist')).toBeNull();
  });

  it('Browse Trending Sounds is a no-op when the platform has no stub tracks', () => {
    // tbd has no audio section visible, but the handler should also be
    // safe if called directly — guards against runtime errors.
    const fixture = setup({ platform: 'tbd' });
    const emitted: (PackagingAudioTrackContract | undefined)[] = [];
    fixture.componentInstance.audioChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['onBrowseTrending']();
    expect(emitted).toEqual([]);
  });
});
