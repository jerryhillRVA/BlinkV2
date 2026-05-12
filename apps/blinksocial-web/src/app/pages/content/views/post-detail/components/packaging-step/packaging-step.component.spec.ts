import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import type { ContentItem } from '../../../../content.types';
import type { PlatformContract } from '@blinksocial/contracts';
import { ContentStateService } from '../../../../content-state.service';
import { provideContentItemsApiStubs } from '../../../../content-items-api.test-util';
import { PostDetailStore } from '../../post-detail.store';
import { PackagingStepComponent } from './packaging-step.component';

const NOW = new Date().toISOString();

function makeItem(partial: Partial<ContentItem> = {}): ContentItem {
  return {
    id: 'post-1',
    conceptId: 'concept-1',
    stage: 'post',
    status: 'in-progress',
    title: 'A post',
    description: 'x'.repeat(80),
    pillarIds: ['p1'],
    segmentIds: ['s1'],
    objective: 'engagement',
    platform: 'instagram',
    contentType: 'reel',
    keyMessage: 'Remember this',
    owner: 'user-sarah',
    cta: { type: 'learn-more', text: 'Read more' },
    briefApproved: true,
    briefApprovedAt: NOW,
    briefApprovedBy: 'You',
    createdAt: NOW,
    updatedAt: NOW,
    ...partial,
  };
}

function setup(
  platform: PlatformContract | null = 'instagram',
): ComponentFixture<PackagingStepComponent> {
  TestBed.configureTestingModule({
    imports: [PackagingStepComponent],
    providers: [
      ...provideContentItemsApiStubs(),
      ContentStateService,
      PostDetailStore,
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            paramMap: { get: () => null },
          },
        },
      },
    ],
  });
  const state = TestBed.inject(ContentStateService) as ContentStateService;
  const store = TestBed.inject(PostDetailStore) as PostDetailStore;
  state.setItems([makeItem({ platform: platform ?? undefined })]);
  store.setItemId('post-1');
  const fixture = TestBed.createComponent(PackagingStepComponent);
  fixture.detectChanges();
  return fixture;
}

describe('PackagingStepComponent', () => {
  it('routes instagram → app-instagram-packaging', () => {
    const fixture = setup('instagram');
    expect(fixture.nativeElement.querySelector('app-instagram-packaging')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-tiktok-packaging')).toBeNull();
  });

  it('routes tiktok → app-tiktok-packaging', () => {
    const fixture = setup('tiktok');
    expect(fixture.nativeElement.querySelector('app-tiktok-packaging')).not.toBeNull();
  });

  it('routes youtube → app-youtube-packaging', () => {
    const fixture = setup('youtube');
    expect(fixture.nativeElement.querySelector('app-youtube-packaging')).not.toBeNull();
  });

  it('routes linkedin → app-linkedin-packaging', () => {
    const fixture = setup('linkedin');
    expect(fixture.nativeElement.querySelector('app-linkedin-packaging')).not.toBeNull();
  });

  it('routes facebook → app-facebook-packaging', () => {
    const fixture = setup('facebook');
    expect(fixture.nativeElement.querySelector('app-facebook-packaging')).not.toBeNull();
  });

  it('routes x → app-x-packaging', () => {
    const fixture = setup('x');
    expect(fixture.nativeElement.querySelector('app-x-packaging')).not.toBeNull();
  });

  it('routes tbd → app-packaging-builder-placeholder', () => {
    const fixture = setup('tbd');
    expect(fixture.nativeElement.querySelector('app-packaging-builder-placeholder')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-instagram-packaging')).toBeNull();
  });

  it('wraps the builder in role=region with aria-label="Packaging builder"', () => {
    const fixture = setup('instagram');
    const region = fixture.nativeElement.querySelector('.packaging-step');
    expect(region.getAttribute('role')).toBe('region');
    expect(region.getAttribute('aria-label')).toBe('Packaging builder');
  });

  type DraftSeedComp = { draftCaptionSeed: () => string | undefined };
  type DraftHooks = {
    setDraftMode: (m: string) => void;
    setVideoHook: (v: string) => void;
    setVideoLongHook: (v: string) => void;
    setImageSingleHook: (v: string) => void;
    setCarouselHook: (v: string) => void;
    setTextCaption: (v: string) => void;
  };

  it('draftCaptionSeed → VIDEO mode resolves to video.hook', () => {
    const fixture = setup('instagram');
    const store = (fixture.componentInstance as unknown as { store: DraftHooks }).store;
    store.setDraftMode('VIDEO');
    store.setVideoHook('video-hook');
    expect((fixture.componentInstance as unknown as DraftSeedComp).draftCaptionSeed()).toBe('video-hook');
  });

  it('draftCaptionSeed → VIDEO_LONG mode resolves to videoLong.hook', () => {
    const fixture = setup('instagram');
    const store = (fixture.componentInstance as unknown as { store: DraftHooks }).store;
    store.setDraftMode('VIDEO_LONG');
    store.setVideoLongHook('long-hook');
    expect((fixture.componentInstance as unknown as DraftSeedComp).draftCaptionSeed()).toBe('long-hook');
  });

  it('draftCaptionSeed → IMAGE_SINGLE mode resolves to imageSingle.hook', () => {
    const fixture = setup('instagram');
    const store = (fixture.componentInstance as unknown as { store: DraftHooks }).store;
    store.setDraftMode('IMAGE_SINGLE');
    store.setImageSingleHook('image-hook');
    expect((fixture.componentInstance as unknown as DraftSeedComp).draftCaptionSeed()).toBe('image-hook');
  });

  it('draftCaptionSeed → CAROUSEL mode resolves to carousel.hook', () => {
    const fixture = setup('instagram');
    const store = (fixture.componentInstance as unknown as { store: DraftHooks }).store;
    store.setDraftMode('CAROUSEL');
    store.setCarouselHook('carousel-hook');
    expect((fixture.componentInstance as unknown as DraftSeedComp).draftCaptionSeed()).toBe('carousel-hook');
  });

  it('draftCaptionSeed → TEXT mode resolves to text.caption', () => {
    const fixture = setup('instagram');
    const store = (fixture.componentInstance as unknown as { store: DraftHooks }).store;
    store.setDraftMode('TEXT');
    store.setTextCaption('text-caption');
    expect((fixture.componentInstance as unknown as DraftSeedComp).draftCaptionSeed()).toBe('text-caption');
  });

  it('draftCaptionSeed returns undefined when no draft is set', () => {
    const fixture = setup('instagram');
    expect((fixture.componentInstance as unknown as DraftSeedComp).draftCaptionSeed()).toBeUndefined();
  });
});
