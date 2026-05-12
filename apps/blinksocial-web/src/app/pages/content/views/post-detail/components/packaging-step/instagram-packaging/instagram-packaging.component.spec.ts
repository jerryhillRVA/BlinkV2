import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { PackagingInstagramContract } from '@blinksocial/contracts';
import { InstagramPackagingComponent } from './instagram-packaging.component';

interface SetupOptions {
  value?: PackagingInstagramContract | undefined;
  disabled?: boolean;
  isCarousel?: boolean;
  publishingMode?: 'ORGANIC' | 'PAID_BOOSTED';
  draftCaptionSeed?: string;
}

function setup(opts: SetupOptions = {}): ComponentFixture<InstagramPackagingComponent> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [InstagramPackagingComponent] });
  const fixture = TestBed.createComponent(InstagramPackagingComponent);
  fixture.componentRef.setInput('value', opts.value);
  fixture.componentRef.setInput('disabled', opts.disabled ?? false);
  fixture.componentRef.setInput('isCarousel', opts.isCarousel ?? false);
  fixture.componentRef.setInput('publishingMode', opts.publishingMode);
  fixture.componentRef.setInput('draftCaptionSeed', opts.draftCaptionSeed);
  fixture.detectChanges();
  return fixture;
}

describe('InstagramPackagingComponent', () => {
  it('renders the always-visible IG fields (caption, hashtags, audio, platform-controls)', () => {
    const fixture = setup();
    expect(fixture.nativeElement.querySelector('#ig-caption')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-pkg-hashtag-bank')).not.toBeNull();
    // Audio Planning is rendered inline inside the Media Selections card
    // (Browse Trending Sounds / Use Original buttons + selected chip).
    expect(fixture.nativeElement.querySelector('app-media-selections-card')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-platform-controls')).not.toBeNull();
  });

  it('Link + UTM are hidden under ORGANIC publishing mode (prototype-aligned)', () => {
    const fixture = setup({ publishingMode: 'ORGANIC' });
    expect(fixture.nativeElement.querySelector('#ig-link')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-utm-builder')).toBeNull();
  });

  it('Link + UTM appear under PAID_BOOSTED publishing mode', () => {
    const fixture = setup({ publishingMode: 'PAID_BOOSTED' });
    expect(fixture.nativeElement.querySelector('#ig-link')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-utm-builder')).not.toBeNull();
  });

  it('does NOT render the slide-order picker unless isCarousel is true', () => {
    const fixture = setup({ isCarousel: false });
    expect(fixture.nativeElement.querySelector('app-slide-order-picker')).toBeNull();
  });

  it('renders the slide-order picker when isCarousel=true', () => {
    const fixture = setup({ isCarousel: true });
    expect(fixture.nativeElement.querySelector('app-slide-order-picker')).not.toBeNull();
  });

  it('typing a plain-text caption emits the caption + empty hashtag array (caption is source of truth)', () => {
    const fixture = setup({ value: { hashtags: ['#a'] } });
    const emitted: PackagingInstagramContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    const ta = fixture.nativeElement.querySelector('#ig-caption') as HTMLTextAreaElement;
    ta.value = 'hello';
    ta.dispatchEvent(new Event('input'));
    // The pre-existing chip #a was a stale carryover that doesn't appear
    // in the new caption text — chips re-derive from caption, so they
    // empty out.
    expect(emitted[0]?.caption).toBe('hello');
    expect(emitted[0]?.hashtags).toEqual([]);
  });

  it('typing a #tag in the caption auto-adds it to the chip array', () => {
    const fixture = setup({ value: { caption: '' } });
    const emitted: PackagingInstagramContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    const ta = fixture.nativeElement.querySelector('#ig-caption') as HTMLTextAreaElement;
    ta.value = 'Try this #wellness today';
    ta.dispatchEvent(new Event('input'));
    expect(emitted[0]?.hashtags).toEqual(['#wellness']);
  });

  it('deleting a #tag from the caption auto-removes the matching chip', () => {
    const fixture = setup({ value: { caption: 'Hello #wellness', hashtags: ['#wellness'] } });
    const emitted: PackagingInstagramContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    const ta = fixture.nativeElement.querySelector('#ig-caption') as HTMLTextAreaElement;
    ta.value = 'Hello'; // user erased the #wellness suffix
    ta.dispatchEvent(new Event('input'));
    expect(emitted[0]?.hashtags).toEqual([]);
  });

  it('char counter switches to warn when caption length crosses 90% of cap', () => {
    const longCaption = 'x'.repeat(Math.ceil(2200 * 0.9) + 1);
    const fixture = setup({ value: { caption: longCaption } });
    const counter = fixture.nativeElement.querySelector('.char-counter') as HTMLElement;
    expect(counter.classList.contains('warn')).toBe(true);
  });

  it('disabled state propagates: caption textarea is readOnly', () => {
    const fixture = setup({ disabled: true });
    const ta = fixture.nativeElement.querySelector('#ig-caption') as HTMLTextAreaElement;
    expect(ta.readOnly).toBe(true);
  });

  it('caption label is programmatically linked via for=id', () => {
    const fixture = setup();
    const label = fixture.nativeElement.querySelector('label[for="ig-caption"]');
    expect(label).not.toBeNull();
  });

  it('hashtagsChange / linkInput / utm / order / audio / controls all emit patched value', () => {
    const fixture = setup({ value: { caption: 'pre' } });
    const emitted: PackagingInstagramContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['onHashtagsChange'](['#a']);
    fixture.componentInstance['onLinkInput']({ target: { value: 'https://x' } } as unknown as Event);
    fixture.componentInstance['onUtmChange']({ source: 's' });
    fixture.componentInstance['onOrderChange']([1, 0]);
    fixture.componentInstance['onAudioChange']({
      trackId: 't', trackName: 'n', artistName: 'a', source: 'trending',
    });
    fixture.componentInstance['onControlsChange']({ visibility: 'private' });
    expect(emitted.length).toBe(6);
    // onHashtagsChange now syncs the caption: adding #a to caption 'pre'
    // appends it (no duplicate already-in-caption). Other handlers
    // preserve the caption verbatim.
    expect(emitted[0]).toEqual({ caption: 'pre #a', hashtags: ['#a'] });
    expect(emitted[1]).toEqual({ caption: 'pre', link: 'https://x' });
    expect(emitted[2]).toEqual({ caption: 'pre', utm: { source: 's' } });
    expect(emitted[3]).toEqual({ caption: 'pre', slideOrder: { order: [1, 0] } });
    expect(emitted[5]).toEqual({ caption: 'pre', platformControls: { visibility: 'private' } });
  });

  it('adding a hashtag appends it to the caption with no duplicates', () => {
    const fixture = setup({ value: { caption: 'Already #wellness here', hashtags: [] } });
    const emitted: PackagingInstagramContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['onHashtagsChange'](['#wellness', '#mobility']);
    // #wellness was already in caption — not re-appended; #mobility is new.
    expect(emitted[0]?.caption).toBe('Already #wellness here #mobility');
    expect(emitted[0]?.hashtags).toEqual(['#wellness', '#mobility']);
  });

  it('removing a hashtag strips it (with leading whitespace) from the caption', () => {
    const fixture = setup({
      value: { caption: 'Try this #wellness today', hashtags: ['#wellness'] },
    });
    const emitted: PackagingInstagramContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['onHashtagsChange']([]);
    expect(emitted[0]?.caption).toBe('Try this today');
    expect(emitted[0]?.hashtags).toEqual([]);
  });

  it('caption marks fail class at or above the cap', () => {
    const fixture = setup({ value: { caption: 'x'.repeat(2200) } });
    const counter = fixture.nativeElement.querySelector('.char-counter') as HTMLElement;
    expect(counter.classList.contains('fail')).toBe(true);
  });

  it('all computed defaults resolve when value() is undefined or empty', () => {
    const fixture = setup({ value: {} });
    expect(fixture.componentInstance['caption']()).toBe('');
    expect(fixture.componentInstance['hashtags']()).toEqual([]);
    expect(fixture.componentInstance['link']()).toBe('');
    expect(fixture.componentInstance['utm']()).toBeUndefined();
    expect(fixture.componentInstance['slideOrder']()).toEqual([]);
    expect(fixture.componentInstance['audio']()).toBeUndefined();
    expect(fixture.componentInstance['controls']()).toBeUndefined();
    expect(fixture.componentInstance['captionState']()).toBe('ok');
  });

  it('from-Draft hint appears when caption matches the draft seed', () => {
    const fixture = setup({ value: { caption: 'shared' }, draftCaptionSeed: 'shared' });
    expect(fixture.nativeElement.querySelector('.from-draft')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.revert-btn')).toBeNull();
  });

  it('Revert-to-Draft button appears when caption has diverged from the seed', () => {
    const fixture = setup({ value: { caption: 'edited' }, draftCaptionSeed: 'original' });
    expect(fixture.nativeElement.querySelector('.revert-btn')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.from-draft')).toBeNull();
  });

  it('clicking Revert-to-Draft emits valueChange with the seed restored', () => {
    const fixture = setup({ value: { caption: 'edited' }, draftCaptionSeed: 'original' });
    const emitted: PackagingInstagramContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    (fixture.nativeElement.querySelector('.revert-btn') as HTMLButtonElement).click();
    expect(emitted[0]?.caption).toBe('original');
  });

  it('AI Generate Caption sets the loading flag synchronously and emits the stub on tick', async () => {
    const fixture = setup();
    const emitted: PackagingInstagramContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    vi.useFakeTimers();
    fixture.componentInstance['onGenerateCaption']();
    expect(fixture.componentInstance['aiGeneratingCaption']()).toBe(true);
    // Second call while loading should be a no-op
    fixture.componentInstance['onGenerateCaption']();
    vi.runAllTimers();
    expect(fixture.componentInstance['aiGeneratingCaption']()).toBe(false);
    expect(emitted.length).toBe(1);
    expect(emitted[0]?.caption).toContain('60-second mobility');
    vi.useRealTimers();
  });

  it('AI Generate Caption extracts inline hashtags into the chip array', () => {
    const fixture = setup({ value: { hashtags: ['#carryover'] } });
    const emitted: PackagingInstagramContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    vi.useFakeTimers();
    fixture.componentInstance['onGenerateCaption']();
    vi.runAllTimers();
    // STUB_CAPTION ends with #MorningRoutine and #Wellness — those are
    // the ONLY chips after AI Generate. The pre-existing #carryover chip
    // is not in the new caption, so it's dropped (chips re-derive from
    // caption — caption is the source of truth).
    expect(emitted[0]?.hashtags).toEqual(['#MorningRoutine', '#Wellness']);
    expect(emitted[0]?.caption).toContain('#MorningRoutine');
    expect(emitted[0]?.caption).toContain('#Wellness');
    vi.useRealTimers();
  });

  it('AI Generate Caption produces a single entry per inline hashtag (no dupes)', () => {
    const fixture = setup({ value: { hashtags: ['#MorningRoutine'] } });
    const emitted: PackagingInstagramContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    vi.useFakeTimers();
    fixture.componentInstance['onGenerateCaption']();
    vi.runAllTimers();
    expect(
      emitted[0]?.hashtags?.filter((t) => t === '#MorningRoutine').length,
    ).toBe(1);
    vi.useRealTimers();
  });

  it('AI Suggest Hashtags appends suggestions to caption and chip array (no duplicates)', async () => {
    // Pre-seed caption with #wellness so the chip exists in the
    // source-of-truth caption. AI Suggest then appends the rest.
    const fixture = setup({ value: { caption: 'My caption #wellness', hashtags: ['#wellness'] } });
    const emitted: PackagingInstagramContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    vi.useFakeTimers();
    fixture.componentInstance['onSuggestHashtags']();
    vi.runAllTimers();
    expect(emitted[0]?.hashtags).toContain('#wellness');
    expect(emitted[0]?.hashtags).toContain('#mobility');
    // Caption gets the suggestions appended too.
    expect(emitted[0]?.caption).toContain('#mobility');
    // No duplicate of #wellness
    expect(emitted[0]?.hashtags?.filter((t) => t === '#wellness').length).toBe(1);
    vi.useRealTimers();
  });

  it('AI buttons are no-ops while disabled', () => {
    const fixture = setup({ disabled: true });
    const emitted: PackagingInstagramContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['onGenerateCaption']();
    fixture.componentInstance['onSuggestHashtags']();
    expect(emitted).toEqual([]);
    expect(fixture.componentInstance['aiGeneratingCaption']()).toBe(false);
    expect(fixture.componentInstance['aiSuggestingHashtags']()).toBe(false);
  });

  it('Publishing Mode pill reflects the active mode via aria-checked', () => {
    const organic = setup({ publishingMode: 'ORGANIC' });
    const organicPill = organic.nativeElement.querySelectorAll('.mode-pill')[0];
    expect(organicPill.getAttribute('aria-checked')).toBe('true');

    const paid = setup({ publishingMode: 'PAID_BOOSTED' });
    const paidPill = paid.nativeElement.querySelectorAll('.mode-pill')[1];
    expect(paidPill.getAttribute('aria-checked')).toBe('true');
  });

  it('Revert handler is a no-op when draftCaptionSeed is undefined', () => {
    const fixture = setup({ value: { caption: 'x' } });
    const emitted: PackagingInstagramContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['onRevertToDraft']();
    expect(emitted).toEqual([]);
  });

  it('toggleBank flips the bankOpen signal', () => {
    const fixture = setup();
    expect(fixture.componentInstance['bankOpen']()).toBe(false);
    fixture.componentInstance['toggleBank']();
    expect(fixture.componentInstance['bankOpen']()).toBe(true);
    fixture.componentInstance['toggleBank']();
    expect(fixture.componentInstance['bankOpen']()).toBe(false);
  });

  it('all computed accessors read explicit value-fields when provided', () => {
    const fixture = setup({
      value: {
        caption: 'c', hashtags: ['#h'], link: 'https://x',
        utm: { source: 's' },
        slideOrder: { order: [1, 0] },
        audio: { trackId: 't', trackName: 'n', artistName: 'a', source: 'trending' },
        platformControls: { allowComments: false },
      },
    });
    expect(fixture.componentInstance['caption']()).toBe('c');
    expect(fixture.componentInstance['hashtags']()).toEqual(['#h']);
    expect(fixture.componentInstance['link']()).toBe('https://x');
    expect(fixture.componentInstance['utm']()).toEqual({ source: 's' });
    expect(fixture.componentInstance['slideOrder']()).toEqual([1, 0]);
    expect(fixture.componentInstance['audio']()?.trackId).toBe('t');
    expect(fixture.componentInstance['controls']()?.allowComments).toBe(false);
  });
});
