import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { PackagingYouTubeContract } from '@blinksocial/contracts';
import { YoutubePackagingComponent } from './youtube-packaging.component';

interface SetupOptions {
  value?: PackagingYouTubeContract | undefined;
  disabled?: boolean;
}

function setup(opts: SetupOptions = {}): ComponentFixture<YoutubePackagingComponent> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [YoutubePackagingComponent] });
  const fixture = TestBed.createComponent(YoutubePackagingComponent);
  fixture.componentRef.setInput('value', opts.value);
  fixture.componentRef.setInput('disabled', opts.disabled ?? false);
  fixture.detectChanges();
  return fixture;
}

describe('YoutubePackagingComponent', () => {
  it('renders title, description, tags, category, thumbnail, platform-controls', () => {
    const fixture = setup();
    expect(fixture.nativeElement.querySelector('#yt-title')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#yt-description')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-keyword-input')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#yt-category')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-asset-uploader')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-platform-controls')).not.toBeNull();
  });

  it('does NOT render UTM builder, slide-order picker, or audio picker', () => {
    const fixture = setup();
    expect(fixture.nativeElement.querySelector('app-utm-builder')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-slide-order-picker')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-audio-picker')).toBeNull();
  });

  it('typing a title emits a valueChange with the patched title', () => {
    const fixture = setup();
    const emitted: PackagingYouTubeContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    const inp = fixture.nativeElement.querySelector('#yt-title') as HTMLInputElement;
    inp.value = 'My Vid';
    inp.dispatchEvent(new Event('input'));
    expect(emitted).toEqual([{ title: 'My Vid' }]);
  });

  it('title counter switches to warn above 90% of the 100-char cap', () => {
    const fixture = setup({ value: { title: 'x'.repeat(91) } });
    const counter = fixture.nativeElement.querySelector('#yt-title')?.parentElement?.querySelector('.char-counter') as HTMLElement;
    expect(counter.classList.contains('warn')).toBe(true);
  });

  it('description counter switches to warn above 90% of the 5000-char cap', () => {
    const fixture = setup({ value: { description: 'x'.repeat(4501) } });
    const counters = fixture.nativeElement.querySelectorAll('.char-counter');
    expect((counters[1] as HTMLElement).classList.contains('warn')).toBe(true);
  });

  it('changing the category select emits the patched categoryId', () => {
    const fixture = setup();
    const emitted: PackagingYouTubeContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    const sel = fixture.nativeElement.querySelector('#yt-category') as HTMLSelectElement;
    sel.value = 'education';
    sel.dispatchEvent(new Event('change'));
    expect(emitted).toEqual([{ categoryId: 'education' }]);
  });

  it('disabled propagates to title input, description, and category', () => {
    const fixture = setup({ disabled: true });
    expect((fixture.nativeElement.querySelector('#yt-title') as HTMLInputElement).readOnly).toBe(true);
    expect((fixture.nativeElement.querySelector('#yt-description') as HTMLTextAreaElement).readOnly).toBe(true);
    expect((fixture.nativeElement.querySelector('#yt-category') as HTMLSelectElement).disabled).toBe(true);
  });

  it('renders a programmatic label for the title', () => {
    const fixture = setup();
    expect(fixture.nativeElement.querySelector('label[for="yt-title"]')).not.toBeNull();
  });

  it('description / tags / thumbnail / controls handlers all emit patched value', () => {
    const fixture = setup();
    const emitted: PackagingYouTubeContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['onDescriptionInput']({ target: { value: 'desc' } } as unknown as Event);
    fixture.componentInstance['onTagsChange'](['vlog', 'how-to']);
    fixture.componentInstance['onThumbnailChange']({ name: 'thumb.png', size: 1 });
    fixture.componentInstance['onThumbnailChange'](null);
    fixture.componentInstance['onControlsChange']({ visibility: 'unlisted' });
    expect(emitted.length).toBe(5);
    expect(emitted[0]).toEqual({ description: 'desc' });
    expect(emitted[1]).toEqual({ tags: ['vlog', 'how-to'] });
    expect(emitted[2]).toEqual({ thumbnailRef: 'thumb.png' });
    expect(emitted[3]).toEqual({ thumbnailRef: '' });
    expect(emitted[4]).toEqual({ platformControls: { visibility: 'unlisted' } });
  });

  it('description marks fail class at or above the cap', () => {
    const fixture = setup({ value: { description: 'x'.repeat(5000) } });
    const counters = fixture.nativeElement.querySelectorAll('.char-counter');
    expect((counters[1] as HTMLElement).classList.contains('fail')).toBe(true);
  });

  it('title marks fail class at or above 100-char cap', () => {
    const fixture = setup({ value: { title: 'x'.repeat(100) } });
    const counters = fixture.nativeElement.querySelectorAll('.char-counter');
    expect((counters[0] as HTMLElement).classList.contains('fail')).toBe(true);
  });

  it('all computed defaults resolve when value() is empty', () => {
    const fixture = setup({ value: {} });
    expect(fixture.componentInstance['title']()).toBe('');
    expect(fixture.componentInstance['description']()).toBe('');
    expect(fixture.componentInstance['tags']()).toEqual([]);
    expect(fixture.componentInstance['categoryId']()).toBe('');
    expect(fixture.componentInstance['thumbnailRef']()).toBeUndefined();
    expect(fixture.componentInstance['controls']()).toBeUndefined();
    expect(fixture.componentInstance['titleState']()).toBe('ok');
    expect(fixture.componentInstance['descriptionState']()).toBe('ok');
  });

  it('all computed accessors read explicit value-fields when provided', () => {
    const fixture = setup({
      value: {
        title: 't', description: 'd', tags: ['a'], categoryId: 'tech',
        thumbnailRef: 'thumb.png',
        platformControls: { visibility: 'unlisted' },
      },
    });
    expect(fixture.componentInstance['title']()).toBe('t');
    expect(fixture.componentInstance['description']()).toBe('d');
    expect(fixture.componentInstance['tags']()).toEqual(['a']);
    expect(fixture.componentInstance['categoryId']()).toBe('tech');
    expect(fixture.componentInstance['thumbnailRef']()).toBe('thumb.png');
    expect(fixture.componentInstance['controls']()?.visibility).toBe('unlisted');
  });

  it('builds with all defaults (exercises signal-input default-value branches)', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [YoutubePackagingComponent] });
    const fixture = TestBed.createComponent(YoutubePackagingComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance['title']()).toBe('');
    expect(fixture.componentInstance['description']()).toBe('');
    expect(fixture.componentInstance['tags']()).toEqual([]);
    expect(fixture.componentInstance['categoryId']()).toBe('');
    expect(fixture.componentInstance['thumbnailRef']()).toBeUndefined();
    expect(fixture.componentInstance['controls']()).toBeUndefined();
  });
});
