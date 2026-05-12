import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { PackagingInstagramContract } from '@blinksocial/contracts';
import { InstagramPackagingComponent } from './instagram-packaging.component';

interface SetupOptions {
  value?: PackagingInstagramContract | undefined;
  disabled?: boolean;
  isCarousel?: boolean;
}

function setup(opts: SetupOptions = {}): ComponentFixture<InstagramPackagingComponent> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [InstagramPackagingComponent] });
  const fixture = TestBed.createComponent(InstagramPackagingComponent);
  fixture.componentRef.setInput('value', opts.value);
  fixture.componentRef.setInput('disabled', opts.disabled ?? false);
  fixture.componentRef.setInput('isCarousel', opts.isCarousel ?? false);
  fixture.detectChanges();
  return fixture;
}

describe('InstagramPackagingComponent', () => {
  it('renders the core IG fields (caption, hashtags, link, UTM, audio, platform-controls)', () => {
    const fixture = setup();
    expect(fixture.nativeElement.querySelector('#ig-caption')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-hashtag-input')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#ig-link')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-utm-builder')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-audio-picker')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-platform-controls')).not.toBeNull();
  });

  it('does NOT render the slide-order picker unless isCarousel is true', () => {
    const fixture = setup({ isCarousel: false });
    expect(fixture.nativeElement.querySelector('app-slide-order-picker')).toBeNull();
  });

  it('renders the slide-order picker when isCarousel=true', () => {
    const fixture = setup({ isCarousel: true });
    expect(fixture.nativeElement.querySelector('app-slide-order-picker')).not.toBeNull();
  });

  it('typing in the caption emits a valueChange with the patched caption', () => {
    const fixture = setup({ value: { hashtags: ['#a'] } });
    const emitted: PackagingInstagramContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    const ta = fixture.nativeElement.querySelector('#ig-caption') as HTMLTextAreaElement;
    ta.value = 'hello';
    ta.dispatchEvent(new Event('input'));
    expect(emitted).toEqual([{ hashtags: ['#a'], caption: 'hello' }]);
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
    expect(emitted[0]).toEqual({ caption: 'pre', hashtags: ['#a'] });
    expect(emitted[1]).toEqual({ caption: 'pre', link: 'https://x' });
    expect(emitted[2]).toEqual({ caption: 'pre', utm: { source: 's' } });
    expect(emitted[3]).toEqual({ caption: 'pre', slideOrder: { order: [1, 0] } });
    expect(emitted[5]).toEqual({ caption: 'pre', platformControls: { visibility: 'private' } });
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
