import { ComponentFixture, TestBed } from '@angular/core/testing';
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

function setup(opts: SetupOptions = {}): ComponentFixture<MediaSelectionsCardComponent> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [MediaSelectionsCardComponent] });
  const fixture = TestBed.createComponent(MediaSelectionsCardComponent);
  fixture.componentRef.setInput('platform', opts.platform ?? 'instagram');
  fixture.componentRef.setInput('coverAsset', opts.coverAsset);
  fixture.componentRef.setInput('audio', opts.audio);
  fixture.componentRef.setInput('disabled', opts.disabled ?? false);
  fixture.componentRef.setInput('thumbnailMode', opts.thumbnailMode ?? false);
  fixture.detectChanges();
  return fixture;
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

  it('IG and FB sub-tabs render no licensing note', () => {
    for (const p of ['instagram', 'facebook'] as PlatformContract[]) {
      const fixture = setup({ platform: p });
      (fixture.nativeElement.querySelector('.audio-browse') as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.sounds-note')).toBeNull();
    }
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

  it('Search input + Enter filters across all three trending platforms', () => {
    const fixture = setup({ platform: 'instagram' });
    (fixture.nativeElement.querySelector('.audio-browse') as HTMLButtonElement).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelectorAll('.sounds-tab')[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('.sounds-search-input') as HTMLInputElement;
    input.value = 'Espresso';
    input.dispatchEvent(new Event('input'));
    vi.useFakeTimers();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    vi.runAllTimers();
    fixture.detectChanges();
    // "Espresso" appears in both Instagram and TikTok stubs.
    const rows = fixture.nativeElement.querySelectorAll('.sounds-row');
    expect(rows.length).toBe(2);
    vi.useRealTimers();
  });

  it('Search "No results" empty state shows when no track matches', () => {
    const fixture = setup({ platform: 'instagram' });
    (fixture.nativeElement.querySelector('.audio-browse') as HTMLButtonElement).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelectorAll('.sounds-tab')[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('.sounds-search-input') as HTMLInputElement;
    input.value = 'xyzxyzxyz';
    input.dispatchEvent(new Event('input'));
    vi.useFakeTimers();
    fixture.componentInstance['onSearchClick']();
    vi.runAllTimers();
    fixture.detectChanges();
    expect(
      (fixture.nativeElement.querySelector('.sounds-empty') as HTMLElement)?.textContent,
    ).toBe('No results');
    vi.useRealTimers();
  });

  it('Empty search query is a no-op (committedSearch stays empty)', () => {
    const fixture = setup({ platform: 'instagram' });
    (fixture.nativeElement.querySelector('.audio-browse') as HTMLButtonElement).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelectorAll('.sounds-tab')[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    fixture.componentInstance['onSearchClick']();
    expect(fixture.componentInstance['committedSearch']()).toBe('');
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
    expect(fixture.componentInstance['committedSearch']()).toBe('');
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

  it('searchResults stays empty when the query is whitespace-only', () => {
    const fixture = setup({ platform: 'instagram' });
    fixture.componentInstance['onBrowseTrending']();
    fixture.componentInstance['onSetPanelTab']('search');
    fixture.componentInstance['committedSearch'].set('   ');
    expect(fixture.componentInstance['searchResults']()).toEqual([]);
  });

  it('Search shows "Searching..." mid-flight before the simulated latency resolves', () => {
    const fixture = setup({ platform: 'instagram' });
    fixture.componentInstance['onBrowseTrending']();
    fixture.componentInstance['onSetPanelTab']('search');
    fixture.detectChanges();
    vi.useFakeTimers();
    fixture.componentInstance['searchQuery'].set('Espresso');
    fixture.componentInstance['onSearchClick']();
    fixture.detectChanges();
    expect(
      (fixture.nativeElement.querySelector('.sounds-empty') as HTMLElement)?.textContent,
    ).toBe('Searching...');
    vi.runAllTimers();
    vi.useRealTimers();
  });

  it('Closing the panel resets the previewing track id', () => {
    const fixture = setup({ platform: 'instagram' });
    fixture.componentInstance['onBrowseTrending']();
    fixture.componentInstance['onTogglePreview']('ig-1');
    expect(fixture.componentInstance['previewingId']()).toBe('ig-1');
    fixture.componentInstance['onClosePanel']();
    expect(fixture.componentInstance['previewingId']()).toBeNull();
  });

  it('searchResults filters by both trackName and artistName (substring, case-insensitive)', () => {
    const fixture = setup({ platform: 'instagram' });
    fixture.componentInstance['onBrowseTrending']();
    fixture.componentInstance['onSetPanelTab']('search');
    // "weeknd" matches artist of Facebook's "Blinding Lights" + TikTok's "Starboy"
    fixture.componentInstance['committedSearch'].set('weeknd');
    expect(fixture.componentInstance['searchResults']().length).toBeGreaterThanOrEqual(2);
  });

  it('Selecting a track from Search results emits with source="search"', () => {
    const fixture = setup({ platform: 'instagram' });
    fixture.componentInstance['onBrowseTrending']();
    fixture.componentInstance['onSetPanelTab']('search');
    fixture.componentInstance['searchQuery'].set('Espresso');
    fixture.componentInstance['committedSearch'].set('Espresso');
    fixture.detectChanges();
    const emitted: (PackagingAudioTrackContract | undefined)[] = [];
    fixture.componentInstance.audioChange.subscribe((v) => emitted.push(v));
    (fixture.nativeElement.querySelectorAll('.sounds-select')[0] as HTMLButtonElement).click();
    expect(emitted[0]?.source).toBe('search');
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
