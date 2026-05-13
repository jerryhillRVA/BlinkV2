import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { PackagingLinkedInContract } from '@blinksocial/contracts';
import { LinkedinPackagingComponent } from './linkedin-packaging.component';

interface SetupOptions {
  value?: PackagingLinkedInContract | undefined;
  disabled?: boolean;
}

function setup(opts: SetupOptions = {}): ComponentFixture<LinkedinPackagingComponent> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [LinkedinPackagingComponent] });
  const fixture = TestBed.createComponent(LinkedinPackagingComponent);
  fixture.componentRef.setInput('value', opts.value);
  fixture.componentRef.setInput('disabled', opts.disabled ?? false);
  fixture.detectChanges();
  return fixture;
}

describe('LinkedinPackagingComponent', () => {
  it('renders caption, hashtags, link, UTM, platform-controls but NO audio', () => {
    const fixture = setup();
    expect(fixture.nativeElement.querySelector('#li-caption')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-hashtag-input')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#li-link')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-utm-builder')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-platform-controls')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-audio-picker')).toBeNull();
  });

  it('typing in the caption emits valueChange with patched caption', () => {
    const fixture = setup();
    const emitted: PackagingLinkedInContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    const ta = fixture.nativeElement.querySelector('#li-caption') as HTMLTextAreaElement;
    ta.value = 'LinkedIn post body';
    ta.dispatchEvent(new Event('input'));
    expect(emitted).toEqual([{ caption: 'LinkedIn post body' }]);
  });

  it('char counter switches to warn above 90% of 3000-char cap', () => {
    const fixture = setup({ value: { caption: 'x'.repeat(2701) } });
    const counter = fixture.nativeElement.querySelector('.char-counter') as HTMLElement;
    expect(counter.classList.contains('warn')).toBe(true);
  });

  it('disabled propagates to caption + link inputs', () => {
    const fixture = setup({ disabled: true });
    expect((fixture.nativeElement.querySelector('#li-caption') as HTMLTextAreaElement).readOnly).toBe(true);
    expect((fixture.nativeElement.querySelector('#li-link') as HTMLInputElement).readOnly).toBe(true);
  });

  it('renders programmatic labels for caption and link', () => {
    const fixture = setup();
    expect(fixture.nativeElement.querySelector('label[for="li-caption"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('label[for="li-link"]')).not.toBeNull();
  });

  it('hashtag / link / utm / controls handlers emit patched value', () => {
    const fixture = setup();
    const emitted: PackagingLinkedInContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['onHashtagsChange'](['#a']);
    fixture.componentInstance['onLinkInput']({ target: { value: 'https://x' } } as unknown as Event);
    fixture.componentInstance['onUtmChange']({ campaign: 'c' });
    fixture.componentInstance['onControlsChange']({ visibility: 'unlisted' });
    expect(emitted.length).toBe(4);
    expect(emitted[1]).toEqual({ link: 'https://x' });
  });

  it('caption marks fail class at or above the cap', () => {
    const fixture = setup({ value: { caption: 'x'.repeat(3000) } });
    const counter = fixture.nativeElement.querySelector('.char-counter') as HTMLElement;
    expect(counter.classList.contains('fail')).toBe(true);
  });

  it('all computed defaults resolve when value() is empty', () => {
    const fixture = setup({ value: {} });
    expect(fixture.componentInstance['caption']()).toBe('');
    expect(fixture.componentInstance['hashtags']()).toEqual([]);
    expect(fixture.componentInstance['link']()).toBe('');
    expect(fixture.componentInstance['utm']()).toBeUndefined();
    expect(fixture.componentInstance['controls']()).toBeUndefined();
    expect(fixture.componentInstance['captionState']()).toBe('ok');
  });

  it('all computed accessors read explicit value-fields when provided', () => {
    const fixture = setup({
      value: { caption: 'c', hashtags: ['#h'], link: 'https://x', utm: { medium: 'm' }, platformControls: { visibility: 'private' } },
    });
    expect(fixture.componentInstance['caption']()).toBe('c');
    expect(fixture.componentInstance['hashtags']()).toEqual(['#h']);
    expect(fixture.componentInstance['link']()).toBe('https://x');
    expect(fixture.componentInstance['utm']()).toEqual({ medium: 'm' });
    expect(fixture.componentInstance['controls']()?.visibility).toBe('private');
  });

  it('builds with all defaults (exercises signal-input default-value branches)', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [LinkedinPackagingComponent] });
    const fixture = TestBed.createComponent(LinkedinPackagingComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance['caption']()).toBe('');
    expect(fixture.componentInstance['hashtags']()).toEqual([]);
    expect(fixture.componentInstance['link']()).toBe('');
    expect(fixture.componentInstance['utm']()).toBeUndefined();
    expect(fixture.componentInstance['controls']()).toBeUndefined();
  });
});
