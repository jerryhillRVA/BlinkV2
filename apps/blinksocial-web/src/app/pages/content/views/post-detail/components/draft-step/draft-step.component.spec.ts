import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DraftStepComponent } from './draft-step.component';
import { PostDetailStore } from '../../post-detail.store';
import { ContentStateService } from '../../../../content-state.service';
import { provideContentItemsApiStubs } from '../../../../content-items-api.test-util';
import type { ContentItem } from '../../../../content.types';

function makeApprovedItem(partial: Partial<ContentItem> = {}): ContentItem {
  const now = new Date().toISOString();
  return {
    id: 'post-1',
    stage: 'post',
    status: 'in-progress',
    title: 'Post',
    description: 'x'.repeat(80),
    pillarIds: ['p1'],
    segmentIds: ['s1'],
    platform: 'instagram',
    contentType: 'reel',
    keyMessage: 'set',
    owner: 'user-sarah',
    cta: { type: 'learn-more', text: 'go' },
    briefApproved: true,
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

function setup(item: ContentItem = makeApprovedItem()): {
  fixture: ComponentFixture<DraftStepComponent>;
  store: PostDetailStore;
} {
  TestBed.configureTestingModule({
    imports: [DraftStepComponent],
    providers: [
      ...provideContentItemsApiStubs(),
      ContentStateService,
      PostDetailStore,
    ],
  });
  const state = TestBed.inject(ContentStateService);
  state.setItems([item]);
  const store = TestBed.inject(PostDetailStore);
  store.setItemId(item.id);
  store.setActiveStep('draft');
  const fixture = TestBed.createComponent(DraftStepComponent);
  fixture.detectChanges();
  return { fixture, store };
}

describe('DraftStepComponent — shell + factory routing', () => {
  it('mounts with role="region" and aria-label="Draft builder"', () => {
    const { fixture } = setup();
    const region = fixture.nativeElement.querySelector(
      '.draft-step[role="region"][aria-label="Draft builder"]',
    );
    expect(region).toBeTruthy();
  });

  it.each([
    ['instagram', 'reel', 'app-video-builder'],
    ['youtube', 'long-form', 'app-video-long-builder'],
    ['instagram', 'feed-post', 'app-image-single-builder'],
    ['instagram', 'carousel', 'app-carousel-builder'],
    ['linkedin', 'ln-text-post', 'app-text-builder'],
  ] as const)(
    '(%s, %s) routes to %s',
    (platform, contentType, selector) => {
      const { fixture } = setup(
        makeApprovedItem({
          platform: platform as ContentItem['platform'],
          contentType: contentType as ContentItem['contentType'],
        }),
      );
      expect(fixture.nativeElement.querySelector(selector)).toBeTruthy();
    },
  );

  it.each([
    ['instagram', 'story', 'STORY'],
    ['facebook', 'fb-story', 'STORY'],
    ['instagram', 'live', 'LIVE'],
  ] as const)(
    '(%s, %s) routes to placeholder for unsupported mode %s',
    (platform, contentType, mode) => {
      const { fixture } = setup(
        makeApprovedItem({
          platform: platform as ContentItem['platform'],
          contentType: contentType as ContentItem['contentType'],
        }),
      );
      const placeholder = fixture.nativeElement.querySelector(
        'app-builder-placeholder',
      );
      expect(placeholder).toBeTruthy();
      const labels: Record<string, string> = {
        STORY: 'Story',
        LIVE: 'Live broadcast',
      };
      expect(placeholder.querySelector('.placeholder-title').textContent).toContain(labels[mode]);
    },
  );

  it('Continue button is disabled when there are draft errors', () => {
    const { fixture } = setup();
    const btn = fixture.nativeElement.querySelector(
      '.continue-btn',
    ) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.getAttribute('aria-disabled')).toBe('true');
    expect(btn.getAttribute('aria-describedby')).toBe('draft-status-summary');
  });

  it('Continue button advances to Packaging when all required fields present', () => {
    const { fixture, store } = setup();
    store.setVideoHook('h');
    store.setVideoShotList([
      { id: 's1', type: 'Shot', description: 'd', duration: '5s' },
    ]);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector(
      '.continue-btn',
    ) as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
    btn.click();
    fixture.detectChanges();
    expect(store.activeStep()).toBe('packaging');
  });

  it('Unsupported branch shows "isn\'t ready yet" status and a disabled CTA', () => {
    const { fixture } = setup(
      makeApprovedItem({ platform: 'instagram', contentType: 'story' }),
    );
    const status = fixture.nativeElement.querySelector(
      '.status-summary--unsupported',
    );
    expect(status).toBeTruthy();
    const btn = fixture.nativeElement.querySelector(
      '.continue-btn',
    ) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.getAttribute('aria-disabled')).toBe('true');
  });

  it('persists the canonical mode to draft.mode on init via effect', () => {
    const { store } = setup();
    expect(store.draft()?.mode).toBe('VIDEO');
  });

  it('error summary renders aria-live region with field count', () => {
    const { fixture } = setup();
    const liveRegion = fixture.nativeElement.querySelector('.draft-status');
    expect(liveRegion).toBeTruthy();
    expect(liveRegion.getAttribute('role')).toBe('status');
    expect(liveRegion.getAttribute('aria-live')).toBe('polite');
    expect(liveRegion.textContent).toContain('2 fields remaining.');
  });
});
