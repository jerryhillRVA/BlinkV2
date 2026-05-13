import { ComponentFixture, TestBed } from '@angular/core/testing';
import type {
  PackagingAudioTrackContract,
  PlatformContract,
} from '@blinksocial/contracts';
import { AudioPickerComponent } from './audio-picker.component';

interface SetupOptions {
  track?: PackagingAudioTrackContract | undefined;
  platform?: PlatformContract;
  disabled?: boolean;
}

function setup(opts: SetupOptions = {}): ComponentFixture<AudioPickerComponent> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [AudioPickerComponent] });
  const fixture = TestBed.createComponent(AudioPickerComponent);
  fixture.componentRef.setInput('track', opts.track);
  fixture.componentRef.setInput('platform', opts.platform ?? 'instagram');
  fixture.componentRef.setInput('disabled', opts.disabled ?? false);
  fixture.detectChanges();
  return fixture;
}

describe('AudioPickerComponent', () => {
  it('trigger button label is "Add audio" when no track is set', () => {
    const fixture = setup();
    const trigger = fixture.nativeElement.querySelector('.trigger-btn');
    expect(trigger.textContent).toContain('Add audio');
  });

  it('trigger button label flips to "Replace audio" when a track is set', () => {
    const fixture = setup({
      track: { trackId: 't1', trackName: 'X', artistName: 'Y', source: 'trending' },
    });
    const trigger = fixture.nativeElement.querySelector('.trigger-btn');
    expect(trigger.textContent).toContain('Replace audio');
  });

  it('opening the dialog renders the platform-specific trending list', () => {
    const fixture = setup({ platform: 'instagram' });
    fixture.componentInstance['onOpen']();
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('.track-row');
    // TRENDING_STUB now ships six tracks for IG/TT/FB to match the
    // prototype's TRENDING_TRACKS literal.
    expect(rows.length).toBe(6);
    expect(rows[0].textContent).toContain('Espresso');
  });

  it('TikTok platform shows the Commercial Music Library warning banner', () => {
    const fixture = setup({ platform: 'tiktok' });
    fixture.componentInstance['onOpen']();
    fixture.detectChanges();
    const note = fixture.nativeElement.querySelector('.platform-note');
    expect(note).not.toBeNull();
    expect(note.textContent).toContain('Commercial Music Library');
  });

  it('non-TikTok platforms do not render the warning banner', () => {
    const fixture = setup({ platform: 'instagram' });
    fixture.componentInstance['onOpen']();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.platform-note')).toBeNull();
  });

  it('preview button toggles aria-pressed', () => {
    const fixture = setup({ platform: 'instagram' });
    fixture.componentInstance['onOpen']();
    fixture.detectChanges();
    const preview = fixture.nativeElement.querySelector('.preview-btn') as HTMLButtonElement;
    expect(preview.getAttribute('aria-pressed')).toBe('false');
    preview.click();
    fixture.detectChanges();
    expect(preview.getAttribute('aria-pressed')).toBe('true');
    preview.click();
    fixture.detectChanges();
    expect(preview.getAttribute('aria-pressed')).toBe('false');
  });

  it('selecting a track emits a PackagingAudioTrackContract with source=trending', () => {
    const fixture = setup({ platform: 'tiktok' });
    const emitted: (PackagingAudioTrackContract | undefined)[] = [];
    fixture.componentInstance.trackChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['onOpen']();
    fixture.detectChanges();
    const select = fixture.nativeElement.querySelector('.select-btn') as HTMLButtonElement;
    select.click();
    expect(emitted.length).toBe(1);
    expect(emitted[0]).toEqual({
      trackId: 'tt-1',
      trackName: 'APT.',
      artistName: 'ROSÉ & Bruno Mars',
      source: 'trending',
    });
  });

  it('Remove button emits undefined to clear the track', () => {
    const fixture = setup({
      track: { trackId: 't1', trackName: 'X', artistName: 'Y', source: 'trending' },
    });
    const emitted: (PackagingAudioTrackContract | undefined)[] = [];
    fixture.componentInstance.trackChange.subscribe((v) => emitted.push(v));
    const remove = fixture.nativeElement.querySelector('.remove-btn') as HTMLButtonElement;
    remove.click();
    expect(emitted).toEqual([undefined]);
  });

  it('preview buttons have aria-label "Play preview of <track name>"', () => {
    const fixture = setup({ platform: 'instagram' });
    fixture.componentInstance['onOpen']();
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('.preview-btn');
    expect(buttons[0].getAttribute('aria-label')).toBe('Play preview of Espresso');
  });

  it('trigger button has aria-haspopup="dialog"', () => {
    const fixture = setup();
    const trigger = fixture.nativeElement.querySelector('.trigger-btn');
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
  });

  it('disabled trigger blocks opening the dialog', () => {
    const fixture = setup({ disabled: true });
    fixture.componentInstance['onOpen']();
    fixture.detectChanges();
    const dialog = fixture.nativeElement.querySelector('dialog');
    expect(dialog.open).toBeFalsy();
  });

  it('disabled blocks track emission from onSelect and onClear', () => {
    const fixture = setup({
      track: { trackId: 't1', trackName: 'X', artistName: 'Y', source: 'trending' },
      disabled: true,
    });
    const emitted: (PackagingAudioTrackContract | undefined)[] = [];
    fixture.componentInstance.trackChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['onSelect']({ trackId: 'a', trackName: 'b', artistName: 'c' });
    fixture.componentInstance['onClear']();
    expect(emitted).toEqual([]);
  });

  it('onClose resets the previewing state', () => {
    const fixture = setup({ platform: 'instagram' });
    fixture.componentInstance['onOpen']();
    fixture.detectChanges();
    fixture.componentInstance['onTogglePreview']('ig-1');
    expect(fixture.componentInstance['previewingId']()).toBe('ig-1');
    fixture.componentInstance['onClose']();
    expect(fixture.componentInstance['previewingId']()).toBeNull();
  });

  it('onOpen + onClose tolerate a dialog with showModal/close defined', () => {
    const fixture = setup({ platform: 'instagram' });
    const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement & {
      showModal: () => void;
      close: () => void;
    };
    let opened = false;
    let closed = false;
    dialog.showModal = () => { opened = true; dialog.setAttribute('open', ''); Object.defineProperty(dialog, 'open', { value: true, configurable: true }); };
    dialog.close = () => { closed = true; dialog.removeAttribute('open'); Object.defineProperty(dialog, 'open', { value: false, configurable: true }); };
    fixture.componentInstance['onOpen']();
    expect(opened).toBe(true);
    fixture.componentInstance['onClose']();
    expect(closed).toBe(true);
  });

  it('Remove emits undefined when not disabled', () => {
    const fixture = setup({
      track: { trackId: 'a', trackName: 'b', artistName: 'c', source: 'trending' },
    });
    const emitted: (PackagingAudioTrackContract | undefined)[] = [];
    fixture.componentInstance.trackChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['onClear']();
    expect(emitted).toEqual([undefined]);
  });

  it('isPreviewing returns false for a non-active track', () => {
    const fixture = setup({ platform: 'instagram' });
    expect(fixture.componentInstance['isPreviewing']('ig-1')).toBe(false);
  });

  it('builds with only required platform input (exercises optional signal-input default branches)', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [AudioPickerComponent] });
    const fixture = TestBed.createComponent(AudioPickerComponent);
    fixture.componentRef.setInput('platform', 'instagram');
    fixture.detectChanges();
    expect(fixture.componentInstance['triggerLabel']()).toBe('Add audio');
    expect(fixture.componentInstance['tracks']().length).toBeGreaterThan(0);
  });

  it('platformNote returns the TikTok-specific licensing note for tiktok', () => {
    const fixture = setup({ platform: 'tiktok' });
    expect(fixture.componentInstance['platformNote']()).toContain('TikTok');
  });

  it('platformNote returns null for platforms without a note (instagram, youtube, etc.)', () => {
    const fixture = setup({ platform: 'youtube' });
    expect(fixture.componentInstance['platformNote']()).toBeNull();
  });
});
