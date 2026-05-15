import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { PackagingTikTokContract } from '@blinksocial/contracts';
import { TiktokPackagingComponent } from './tiktok-packaging.component';

interface SetupOptions {
  value?: PackagingTikTokContract | undefined;
  contentType?: string;
  disabled?: boolean;
}

function setup(opts: SetupOptions = {}): ComponentFixture<TiktokPackagingComponent> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [TiktokPackagingComponent] });
  const fixture = TestBed.createComponent(TiktokPackagingComponent);
  fixture.componentRef.setInput('value', opts.value);
  // Default to short-video so the audio-planning card renders. Override
  // when a test wants to assert the hidden state.
  fixture.componentRef.setInput('contentType', opts.contentType ?? 'short-video');
  fixture.componentRef.setInput('disabled', opts.disabled ?? false);
  fixture.detectChanges();
  return fixture;
}

describe('TiktokPackagingComponent', () => {
  it('renders caption, hashtags, link, UTM, audio-planning, platform-controls', () => {
    const fixture = setup();
    expect(fixture.nativeElement.querySelector('#tt-caption')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-hashtag-input')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#tt-link')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-utm-builder')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-audio-planning-card')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.audio-planning-card')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-platform-controls')).not.toBeNull();
  });

  it('typing in the caption emits a valueChange with patched caption', () => {
    const fixture = setup();
    const emitted: PackagingTikTokContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    const ta = fixture.nativeElement.querySelector('#tt-caption') as HTMLTextAreaElement;
    ta.value = 'hi';
    ta.dispatchEvent(new Event('input'));
    expect(emitted).toEqual([{ caption: 'hi' }]);
  });

  it('char counter reaches warn class above 90% of cap', () => {
    const fixture = setup({ value: { caption: 'x'.repeat(2000) } });
    const counter = fixture.nativeElement.querySelector('.char-counter') as HTMLElement;
    expect(counter.classList.contains('warn')).toBe(true);
  });

  it('disabled propagates to caption textarea', () => {
    const fixture = setup({ disabled: true });
    const ta = fixture.nativeElement.querySelector('#tt-caption') as HTMLTextAreaElement;
    expect(ta.readOnly).toBe(true);
  });

  it('caption has a programmatic label via for=id', () => {
    const fixture = setup();
    expect(fixture.nativeElement.querySelector('label[for="tt-caption"]')).not.toBeNull();
  });

  it('hashtags / link / utm / audioPlanning / controls handlers emit patched value', () => {
    const fixture = setup();
    const emitted: PackagingTikTokContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['onHashtagsChange'](['#a']);
    fixture.componentInstance['onLinkInput']({ target: { value: 'https://x' } } as unknown as Event);
    fixture.componentInstance['onUtmChange']({ source: 's' });
    fixture.componentInstance['onAudioPlanningChange']({ audioStrategy: 'named' });
    fixture.componentInstance['onControlsChange']({ allowDuetStitch: true });
    expect(emitted.length).toBe(5);
    expect(emitted[0]).toEqual({ hashtags: ['#a'] });
    expect(emitted[2]).toEqual({ utm: { source: 's' } });
    expect(emitted[3]).toEqual({ audioPlanning: { audioStrategy: 'named' } });
  });

  it('caption marks fail class at or above the cap', () => {
    const fixture = setup({ value: { caption: 'x'.repeat(2200) } });
    const counter = fixture.nativeElement.querySelector('.char-counter') as HTMLElement;
    expect(counter.classList.contains('fail')).toBe(true);
  });

  it('all computed defaults resolve when value() is empty', () => {
    const fixture = setup({ value: {} });
    expect(fixture.componentInstance['caption']()).toBe('');
    expect(fixture.componentInstance['hashtags']()).toEqual([]);
    expect(fixture.componentInstance['link']()).toBe('');
    expect(fixture.componentInstance['utm']()).toBeUndefined();
    expect(fixture.componentInstance['audioPlanning']()).toBeUndefined();
    expect(fixture.componentInstance['controls']()).toBeUndefined();
    expect(fixture.componentInstance['captionState']()).toBe('ok');
  });

  it('all computed accessors read explicit value-fields when provided', () => {
    const fixture = setup({
      value: {
        caption: 'c', hashtags: ['#h'], link: 'https://x',
        utm: { source: 's' },
        audioPlanning: { audioStrategy: 'trending-platform', audioMood: 'happy-upbeat' },
        platformControls: { allowDuetStitch: true },
      },
    });
    expect(fixture.componentInstance['caption']()).toBe('c');
    expect(fixture.componentInstance['hashtags']()).toEqual(['#h']);
    expect(fixture.componentInstance['utm']()).toEqual({ source: 's' });
    expect(fixture.componentInstance['audioPlanning']()?.audioMood).toBe('happy-upbeat');
  });

  it('builds with all defaults (exercises signal-input default-value branches)', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [TiktokPackagingComponent] });
    const fixture = TestBed.createComponent(TiktokPackagingComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance['caption']()).toBe('');
    expect(fixture.componentInstance['hashtags']()).toEqual([]);
    expect(fixture.componentInstance['link']()).toBe('');
    expect(fixture.componentInstance['utm']()).toBeUndefined();
    expect(fixture.componentInstance['audioPlanning']()).toBeUndefined();
    expect(fixture.componentInstance['controls']()).toBeUndefined();
  });
});
