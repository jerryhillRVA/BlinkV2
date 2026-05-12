import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { PackagingXContract } from '@blinksocial/contracts';
import { XPackagingComponent } from './x-packaging.component';

interface SetupOptions {
  value?: PackagingXContract | undefined;
  disabled?: boolean;
}

function setup(opts: SetupOptions = {}): ComponentFixture<XPackagingComponent> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [XPackagingComponent] });
  const fixture = TestBed.createComponent(XPackagingComponent);
  fixture.componentRef.setInput('value', opts.value);
  fixture.componentRef.setInput('disabled', opts.disabled ?? false);
  fixture.detectChanges();
  return fixture;
}

describe('XPackagingComponent', () => {
  it('renders caption, hashtags, keywords, link, UTM, platform-controls', () => {
    const fixture = setup();
    expect(fixture.nativeElement.querySelector('#x-caption')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-hashtag-input')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-keyword-input')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#x-link')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-utm-builder')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-platform-controls')).not.toBeNull();
  });

  it('caption textarea enforces maxlength=280', () => {
    const fixture = setup();
    const ta = fixture.nativeElement.querySelector('#x-caption') as HTMLTextAreaElement;
    expect(ta.getAttribute('maxlength')).toBe('280');
  });

  it('typing in caption emits patched caption', () => {
    const fixture = setup();
    const emitted: PackagingXContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    const ta = fixture.nativeElement.querySelector('#x-caption') as HTMLTextAreaElement;
    ta.value = 'hot take';
    ta.dispatchEvent(new Event('input'));
    expect(emitted).toEqual([{ caption: 'hot take' }]);
  });

  it('char counter switches to warn above 90% of the 280-char cap', () => {
    const fixture = setup({ value: { caption: 'x'.repeat(253) } });
    const counter = fixture.nativeElement.querySelector('.char-counter') as HTMLElement;
    expect(counter.classList.contains('warn')).toBe(true);
  });

  it('disabled propagates to caption + link', () => {
    const fixture = setup({ disabled: true });
    expect((fixture.nativeElement.querySelector('#x-caption') as HTMLTextAreaElement).readOnly).toBe(true);
    expect((fixture.nativeElement.querySelector('#x-link') as HTMLInputElement).readOnly).toBe(true);
  });

  it('caption has a programmatic label', () => {
    const fixture = setup();
    expect(fixture.nativeElement.querySelector('label[for="x-caption"]')).not.toBeNull();
  });

  it('hashtags / keywords / link / utm / controls handlers emit patched value', () => {
    const fixture = setup();
    const emitted: PackagingXContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['onHashtagsChange'](['#x']);
    fixture.componentInstance['onKeywordsChange'](['breaking']);
    fixture.componentInstance['onLinkInput']({ target: { value: 'https://x' } } as unknown as Event);
    fixture.componentInstance['onUtmChange']({ term: 't' });
    fixture.componentInstance['onControlsChange']({ allowComments: false });
    expect(emitted.length).toBe(5);
    expect(emitted[1]).toEqual({ keywords: ['breaking'] });
  });

  it('caption marks fail class at or above the 280 cap', () => {
    const fixture = setup({ value: { caption: 'x'.repeat(280) } });
    const counter = fixture.nativeElement.querySelector('.char-counter') as HTMLElement;
    expect(counter.classList.contains('fail')).toBe(true);
  });

  it('all computed defaults resolve when value() is empty', () => {
    const fixture = setup({ value: {} });
    expect(fixture.componentInstance['caption']()).toBe('');
    expect(fixture.componentInstance['hashtags']()).toEqual([]);
    expect(fixture.componentInstance['keywords']()).toEqual([]);
    expect(fixture.componentInstance['link']()).toBe('');
    expect(fixture.componentInstance['utm']()).toBeUndefined();
    expect(fixture.componentInstance['controls']()).toBeUndefined();
    expect(fixture.componentInstance['captionState']()).toBe('ok');
  });

  it('all computed accessors read explicit value-fields when provided', () => {
    const fixture = setup({
      value: { caption: 'c', hashtags: ['#h'], keywords: ['k'], link: 'https://x', utm: { term: 't' }, platformControls: { visibility: 'public' } },
    });
    expect(fixture.componentInstance['caption']()).toBe('c');
    expect(fixture.componentInstance['keywords']()).toEqual(['k']);
    expect(fixture.componentInstance['utm']()?.term).toBe('t');
    expect(fixture.componentInstance['controls']()?.visibility).toBe('public');
  });
});
