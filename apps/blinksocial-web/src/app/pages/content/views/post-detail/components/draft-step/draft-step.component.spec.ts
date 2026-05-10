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

  // The Continue-to-Packaging button moved to <app-step-action-bar>.
  // See step-action-bar.component.spec.ts for gating + advance tests.

  it('Unsupported branch renders the builder-placeholder', () => {
    const { fixture } = setup(
      makeApprovedItem({ platform: 'instagram', contentType: 'story' }),
    );
    const placeholder = fixture.nativeElement.querySelector('app-builder-placeholder');
    expect(placeholder).toBeTruthy();
    expect(placeholder.querySelector('.placeholder-title').textContent).toContain('Story');
  });

  it('persists the canonical mode to draft.mode on init via effect', () => {
    const { store } = setup();
    expect(store.draft()?.mode).toBe('VIDEO');
  });

  // The field-count summary block ("Ready to continue." / "N fields
  // remaining.") was removed — the disabled state of the Continue button
  // in the action bar plus the inline "1 shot required" badge convey
  // the same gating info. Per-field error semantics still live in
  // store.draftErrors() if other components need them.
});
