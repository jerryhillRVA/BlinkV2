import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { ContentTypeContract, PlatformContract } from '@blinksocial/contracts';
import { PostPreviewCardComponent } from './post-preview-card.component';

interface SetupOptions {
  platform?: PlatformContract | null;
  contentType?: ContentTypeContract | null;
  caption?: string;
  handle?: string;
  slides?: string[];
  coverAsset?: string;
  audioTrackName?: string;
}

function setup(opts: SetupOptions = {}): ComponentFixture<PostPreviewCardComponent> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [PostPreviewCardComponent] });
  const fixture = TestBed.createComponent(PostPreviewCardComponent);
  fixture.componentRef.setInput('platform', opts.platform ?? 'instagram');
  fixture.componentRef.setInput('contentType', opts.contentType ?? null);
  fixture.componentRef.setInput('caption', opts.caption ?? '');
  fixture.componentRef.setInput('handle', opts.handle ?? '@your_handle');
  fixture.componentRef.setInput('slides', opts.slides ?? []);
  fixture.componentRef.setInput('coverAsset', opts.coverAsset);
  fixture.componentRef.setInput('audioTrackName', opts.audioTrackName);
  fixture.detectChanges();
  return fixture;
}

function expand(fixture: ComponentFixture<PostPreviewCardComponent>): void {
  (fixture.nativeElement.querySelector('.pp-header') as HTMLButtonElement).click();
  fixture.detectChanges();
}

describe('PostPreviewCardComponent', () => {
  it('renders the card for Instagram', () => {
    const fixture = setup({ platform: 'instagram' });
    expect(fixture.nativeElement.querySelector('.post-preview')).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('.pp-title')?.textContent?.trim(),
    ).toBe('Post Preview');
    expect(
      fixture.nativeElement.querySelector('.pp-platform')?.textContent?.trim(),
    ).toBe('Instagram');
  });

  it('renders the card for TikTok', () => {
    const fixture = setup({ platform: 'tiktok' });
    expect(fixture.nativeElement.querySelector('.post-preview')).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('.pp-platform')?.textContent?.trim(),
    ).toBe('Tiktok');
  });

  it('renders nothing for non-IG/TT platforms', () => {
    const fixture = setup({ platform: 'youtube' });
    expect(fixture.nativeElement.querySelector('.post-preview')).toBeNull();
  });

  it('is collapsed by default — body is not rendered', () => {
    const fixture = setup({ platform: 'instagram' });
    expect(fixture.nativeElement.querySelector('.pp-body')).toBeNull();
  });

  it('clicking the header expands the body (IG layout shown)', () => {
    const fixture = setup({ platform: 'instagram', caption: 'hello' });
    expand(fixture);
    expect(fixture.nativeElement.querySelector('.pp-body')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.pp-ig')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.pp-tt')).toBeNull();
  });

  it('IG: header shows handle + Follow chip; caption renders below', () => {
    const fixture = setup({
      platform: 'instagram',
      handle: '@brand',
      caption: 'New drop today!',
    });
    expand(fixture);
    expect(
      fixture.nativeElement.querySelector('.pp-ig-handle')?.textContent?.trim(),
    ).toBe('@brand');
    expect(
      fixture.nativeElement.querySelector('.pp-ig-follow')?.textContent?.trim(),
    ).toBe('Follow');
    expect(
      fixture.nativeElement.querySelector('.pp-ig-caption')?.textContent,
    ).toContain('New drop today!');
  });

  it('IG: reel uses 4/5 aspect ratio; feed-post uses 1/1', () => {
    const reel = setup({ platform: 'instagram', contentType: 'reel' });
    expand(reel);
    expect(
      (reel.nativeElement.querySelector('.pp-ig-media') as HTMLElement).style
        .aspectRatio,
    ).toBe('4 / 5');

    const feed = setup({ platform: 'instagram', contentType: 'feed-post' });
    expand(feed);
    expect(
      (feed.nativeElement.querySelector('.pp-ig-media') as HTMLElement).style
        .aspectRatio,
    ).toBe('1 / 1');
  });

  it('IG carousel: dots, counter, and next arrow visible when slides > 1', () => {
    const fixture = setup({
      platform: 'instagram',
      contentType: 'carousel',
      slides: ['a.jpg', 'b.jpg', 'c.jpg'],
    });
    expand(fixture);
    expect(fixture.nativeElement.querySelectorAll('.pp-ig-dot').length).toBe(3);
    expect(
      fixture.nativeElement.querySelector('.pp-ig-counter')?.textContent?.trim(),
    ).toBe('1/3');
    // First slide: no prev arrow, has next arrow
    expect(fixture.nativeElement.querySelector('.pp-ig-arrow--left')).toBeNull();
    expect(fixture.nativeElement.querySelector('.pp-ig-arrow--right')).not.toBeNull();
  });

  it('IG carousel: clicking next advances the slideIndex and updates the counter', () => {
    const fixture = setup({
      platform: 'instagram',
      contentType: 'carousel',
      slides: ['a.jpg', 'b.jpg'],
    });
    expand(fixture);
    (fixture.nativeElement.querySelector('.pp-ig-arrow--right') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.pp-ig-counter')?.textContent?.trim(),
    ).toBe('2/2');
    // Prev arrow now visible, next arrow gone (last slide)
    expect(fixture.nativeElement.querySelector('.pp-ig-arrow--left')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.pp-ig-arrow--right')).toBeNull();
  });

  it('IG: empty slides + no coverAsset shows Media placeholder', () => {
    const fixture = setup({ platform: 'instagram', slides: [] });
    expand(fixture);
    expect(
      fixture.nativeElement.querySelector('.pp-ig-media-placeholder')?.textContent?.trim(),
    ).toBe('Media');
  });

  it('IG: slides[0] renders as the media <img>', () => {
    const fixture = setup({ platform: 'instagram', slides: ['https://x/a.jpg'] });
    expand(fixture);
    const img = fixture.nativeElement.querySelector('.pp-ig-media-img') as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img.src).toContain('a.jpg');
  });

  it('TikTok: sound bar uses audioTrackName when provided, else "Original audio"', () => {
    const named = setup({ platform: 'tiktok', audioTrackName: 'My Song' });
    expand(named);
    expect(
      named.nativeElement.querySelector('.pp-tt-sound-name')?.textContent?.trim(),
    ).toBe('My Song');

    const fallback = setup({ platform: 'tiktok' });
    expand(fallback);
    expect(
      fallback.nativeElement.querySelector('.pp-tt-sound-name')?.textContent?.trim(),
    ).toBe('Original audio');
  });

  it('TikTok: handle + caption render in the bottom-left overlay', () => {
    const fixture = setup({
      platform: 'tiktok',
      handle: '@creator',
      caption: 'check this out',
    });
    expand(fixture);
    expect(
      fixture.nativeElement.querySelector('.pp-tt-handle')?.textContent?.trim(),
    ).toBe('@creator');
    expect(
      fixture.nativeElement.querySelector('.pp-tt-caption')?.textContent?.trim(),
    ).toBe('check this out');
  });

  it('clicking the header a second time collapses the body', () => {
    const fixture = setup({ platform: 'instagram' });
    expand(fixture);
    expand(fixture);
    expect(fixture.nativeElement.querySelector('.pp-body')).toBeNull();
  });
});
