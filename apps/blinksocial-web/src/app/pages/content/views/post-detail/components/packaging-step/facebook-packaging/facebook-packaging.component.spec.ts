import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { PackagingFacebookContract } from '@blinksocial/contracts';
import { FacebookPackagingComponent } from './facebook-packaging.component';

interface SetupOptions {
  value?: PackagingFacebookContract | undefined;
  disabled?: boolean;
  isCarousel?: boolean;
}

function setup(opts: SetupOptions = {}): ComponentFixture<FacebookPackagingComponent> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [FacebookPackagingComponent] });
  const fixture = TestBed.createComponent(FacebookPackagingComponent);
  fixture.componentRef.setInput('value', opts.value);
  fixture.componentRef.setInput('disabled', opts.disabled ?? false);
  fixture.componentRef.setInput('isCarousel', opts.isCarousel ?? false);
  fixture.detectChanges();
  return fixture;
}

describe('FacebookPackagingComponent', () => {
  it('renders caption, hashtags, link, UTM, audio, platform-controls', () => {
    const fixture = setup();
    expect(fixture.nativeElement.querySelector('#fb-caption')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-hashtag-input')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#fb-link')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-utm-builder')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-audio-picker')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-platform-controls')).not.toBeNull();
  });

  it('renders the slide-order picker only when isCarousel=true', () => {
    const fixtureA = setup({ isCarousel: false });
    expect(fixtureA.nativeElement.querySelector('app-slide-order-picker')).toBeNull();
    const fixtureB = setup({ isCarousel: true });
    expect(fixtureB.nativeElement.querySelector('app-slide-order-picker')).not.toBeNull();
  });

  it('typing in caption emits valueChange with patched caption', () => {
    const fixture = setup();
    const emitted: PackagingFacebookContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    const ta = fixture.nativeElement.querySelector('#fb-caption') as HTMLTextAreaElement;
    ta.value = 'fb body';
    ta.dispatchEvent(new Event('input'));
    expect(emitted).toEqual([{ caption: 'fb body' }]);
  });

  it('disabled propagates to caption + link', () => {
    const fixture = setup({ disabled: true });
    expect((fixture.nativeElement.querySelector('#fb-caption') as HTMLTextAreaElement).readOnly).toBe(true);
    expect((fixture.nativeElement.querySelector('#fb-link') as HTMLInputElement).readOnly).toBe(true);
  });

  it('renders a programmatic label for caption', () => {
    const fixture = setup();
    expect(fixture.nativeElement.querySelector('label[for="fb-caption"]')).not.toBeNull();
  });

  it('hashtags / link / utm / order / audio / controls handlers emit patched value', () => {
    const fixture = setup();
    const emitted: PackagingFacebookContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['onHashtagsChange'](['#fb']);
    fixture.componentInstance['onLinkInput']({ target: { value: 'https://x' } } as unknown as Event);
    fixture.componentInstance['onUtmChange']({ medium: 'social' });
    fixture.componentInstance['onOrderChange']([2, 0, 1]);
    fixture.componentInstance['onAudioChange']({
      trackId: 't', trackName: 'n', artistName: 'a', source: 'trending',
    });
    fixture.componentInstance['onControlsChange']({ boostEnabled: true });
    expect(emitted.length).toBe(6);
    expect(emitted[3]).toEqual({ slideOrder: { order: [2, 0, 1] } });
  });

  it('caption above 90% triggers warn class', () => {
    const fixture = setup({ value: { caption: 'x'.repeat(Math.ceil(63206 * 0.9) + 1) } });
    const counter = fixture.nativeElement.querySelector('.char-counter') as HTMLElement;
    expect(counter.classList.contains('warn')).toBe(true);
  });

  it('all computed defaults resolve when value() is empty', () => {
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

  it('captionState reports "fail" when caption length hits the cap', () => {
    const fixture = setup({ value: { caption: 'x'.repeat(63206) } });
    expect(fixture.componentInstance['captionState']()).toBe('fail');
  });

  it('captionState reports "ok" for short captions', () => {
    const fixture = setup({ value: { caption: 'short' } });
    expect(fixture.componentInstance['captionState']()).toBe('ok');
  });

  it('all computed accessors read explicit value-fields when provided', () => {
    const fixture = setup({
      value: {
        caption: 'c', hashtags: ['#h'], link: 'https://x',
        utm: { medium: 'm' },
        slideOrder: { order: [2, 1, 0] },
        audio: { trackId: 't', trackName: 'n', artistName: 'a', source: 'trending' },
        platformControls: { boostEnabled: true },
      },
    });
    expect(fixture.componentInstance['caption']()).toBe('c');
    expect(fixture.componentInstance['slideOrder']()).toEqual([2, 1, 0]);
    expect(fixture.componentInstance['audio']()?.trackId).toBe('t');
    expect(fixture.componentInstance['controls']()?.boostEnabled).toBe(true);
  });
});
