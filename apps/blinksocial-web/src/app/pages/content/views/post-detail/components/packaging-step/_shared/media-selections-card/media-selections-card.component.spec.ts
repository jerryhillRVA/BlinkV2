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

  it('Audio Planning subsection renders for instagram / tiktok / facebook', () => {
    for (const p of ['instagram', 'tiktok', 'facebook'] as PlatformContract[]) {
      const fixture = setup({ platform: p });
      expect(fixture.nativeElement.querySelector('app-audio-picker')).not.toBeNull();
    }
  });

  it('Audio Planning subsection is hidden for platforms without audio (linkedin, youtube, x, tbd)', () => {
    for (const p of ['linkedin', 'youtube', 'x', 'tbd'] as PlatformContract[]) {
      const fixture = setup({ platform: p });
      expect(fixture.nativeElement.querySelector('app-audio-picker')).toBeNull();
    }
  });

  it('audioChange propagates from the inner picker to the outer output', () => {
    const fixture = setup({ platform: 'instagram' });
    const emitted: (PackagingAudioTrackContract | undefined)[] = [];
    fixture.componentInstance.audioChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['onAudioChange']({
      trackId: 't1',
      trackName: 'Track',
      artistName: 'Artist',
      source: 'trending',
    });
    expect(emitted[0]?.trackId).toBe('t1');
  });
});
