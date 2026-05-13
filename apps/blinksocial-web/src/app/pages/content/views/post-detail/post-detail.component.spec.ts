import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PostDetailComponent } from './post-detail.component';
import { PostDetailStore } from './post-detail.store';
import { ContentStateService } from '../../content-state.service';
import { provideContentItemsApiStubs } from '../../content-items-api.test-util';
import type {
  AudienceSegment,
  ContentItem,
  ContentPillar,
} from '../../content.types';

const PILLARS: ContentPillar[] = [
  { id: 'p1', name: 'Alpha', description: '', color: '#111' },
];
const SEGMENTS: AudienceSegment[] = [
  { id: 's1', name: 'Seg 1', description: '' },
];

function makeItem(partial: Partial<ContentItem> = {}): ContentItem {
  const now = new Date().toISOString();
  return {
    id: 'post-1',
    conceptId: 'concept-1',
    stage: 'post',
    status: 'in-progress',
    title: 'Post title',
    description: 'x'.repeat(80),
    pillarIds: ['p1'],
    segmentIds: ['s1'],
    objective: 'engagement',
    platform: 'instagram',
    contentType: 'reel',
    keyMessage: 'Remember this',
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

function setup(
  item: ContentItem = makeItem(),
  params: { id?: string; itemId?: string } = { id: 'ws-1', itemId: 'post-1' },
): {
  fixture: ComponentFixture<PostDetailComponent>;
  state: ContentStateService;
} {
  TestBed.configureTestingModule({
    imports: [PostDetailComponent],
    providers: [
      ...provideContentItemsApiStubs(),
      ContentStateService,
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            paramMap: {
              get: (k: string) => params[k as 'id' | 'itemId'] ?? null,
            },
          },
        },
      },
    ],
  });
  const state = TestBed.inject(ContentStateService);
  state.setItems([item]);
  state.pillars.set(PILLARS);
  state.segments.set(SEGMENTS);
  const fixture = TestBed.createComponent(PostDetailComponent);
  fixture.componentRef.setInput('itemId', item.id);
  fixture.detectChanges();
  return { fixture, state };
}

describe('PostDetailComponent — composition', () => {
  it('renders header + steps bar + brief step + sidebar (concept / journey / timestamps) when Brief is active', () => {
    const { fixture } = setup();
    expect(fixture.nativeElement.querySelector('app-post-detail-header')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-production-steps-bar')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-brief-step')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-brief-content-concept')).not.toBeNull();
    // Sidebar additions: Content Journey + Timestamps
    expect(fixture.nativeElement.querySelector('.brief-side app-content-journey')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.brief-side .timestamps-panel')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.brief-side .panel-journey')).not.toBeNull();
    // Variation chips, brief-status-sidebar, status-stepper are all gone.
    expect(fixture.nativeElement.querySelector('app-variation-chips')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-brief-status-sidebar')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-status-stepper')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-step-placeholder')).toBeNull();
  });

  it('formatDate returns the prototype-style date for valid input and empty string for missing/invalid', () => {
    const { fixture } = setup();
    const comp = fixture.componentInstance as unknown as {
      formatDate: (iso: string | undefined) => string;
    };
    expect(comp.formatDate(undefined)).toBe('');
    expect(comp.formatDate('')).toBe('');
    expect(comp.formatDate('not-a-date')).toBe('');
    expect(comp.formatDate('2026-05-09T00:00:00Z').length).toBeGreaterThan(0);
  });

  it('renders nothing when the store has no item', () => {
    setup(makeItem(), { id: 'ws-1', itemId: 'missing' });
    // manually: construct with missing id
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [PostDetailComponent],
      providers: [
        ContentStateService,
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => null } } },
        },
      ],
    });
    const fixture = TestBed.createComponent(PostDetailComponent);
    fixture.componentRef.setInput('itemId', 'missing');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.post-detail')).toBeNull();
  });

  it('renders Draft step when stepper sets activeStep=draft', () => {
    const { fixture } = setup();
    const store = (fixture.componentInstance as unknown as { store: PostDetailStore }).store;
    store.setActiveStep('draft');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-brief-step')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-draft-step')).not.toBeNull();
    // Draft uses the same sidebar layout as Brief.
    expect(fixture.nativeElement.querySelector('.brief-side app-brief-content-concept')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.brief-side app-content-journey')).not.toBeNull();
  });

  it('renders Packaging step shell when active', () => {
    const { fixture } = setup();
    const store = (fixture.componentInstance as unknown as { store: PostDetailStore }).store;
    store.setActiveStep('packaging');
    fixture.detectChanges();
    // Packaging now ships as a real step shell that dispatches on platform
    // (no longer the generic app-step-placeholder). The Instagram fixture
    // routes to app-instagram-packaging via the factory.
    expect(fixture.nativeElement.querySelector('app-packaging-step')).not.toBeNull();
  });

  it('renders QA placeholder when active', () => {
    const { fixture } = setup();
    const store = (fixture.componentInstance as unknown as { store: PostDetailStore }).store;
    store.setActiveStep('qa');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-step-placeholder')).not.toBeNull();
  });
});

describe('PostDetailComponent — actions', () => {
  it('onBack emits back output', () => {
    const { fixture } = setup();
    let fired = 0;
    fixture.componentInstance.back.subscribe(() => fired++);
    (fixture.componentInstance as unknown as { onBack: () => void }).onBack();
    expect(fired).toBe(1);
  });

  it('projects app-detail-back-button into the header with the bound aria-label, and clicking it fires back', () => {
    const { fixture } = setup();
    fixture.componentRef.setInput('backLabel', 'Back to calendar');
    fixture.detectChanges();

    const projected = fixture.nativeElement.querySelector(
      'app-post-detail-header app-detail-back-button',
    );
    expect(projected).not.toBeNull();
    const btn = projected.querySelector('.detail-back') as HTMLButtonElement;
    expect(btn).not.toBeNull();
    expect(btn.getAttribute('aria-label')).toBe('Back to calendar');

    let fired = 0;
    fixture.componentInstance.back.subscribe(() => fired++);
    btn.click();
    expect(fired).toBe(1);
  });

  it('default aria-label on the projected back button is "Back to pipeline"', () => {
    const { fixture } = setup();
    const btn = fixture.nativeElement.querySelector(
      'app-post-detail-header app-detail-back-button .detail-back',
    ) as HTMLButtonElement;
    expect(btn.getAttribute('aria-label')).toBe('Back to pipeline');
  });

  it('onTitleChange routes to store.updateTitle', () => {
    const { fixture } = setup();
    const store = (fixture.componentInstance as unknown as { store: PostDetailStore }).store;
    (fixture.componentInstance as unknown as { onTitleChange: (v: string) => void }).onTitleChange('Renamed');
    expect(store.item()?.title).toBe('Renamed');
  });

  describe('onBackToConcept (ticket #118)', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    function setupWithSiblings(
      liveSiblings: number,
      archivedSiblings = 0,
    ): { fixture: ComponentFixture<PostDetailComponent>; state: ContentStateService } {
      const now = new Date().toISOString();
      const current = makeItem({ id: 'post-1', conceptId: 'concept-1' });
      const items: ContentItem[] = [current];
      for (let i = 0; i < liveSiblings; i++) {
        items.push({
          ...makeItem({
            id: `post-sib-${i}`,
            title: `Sibling ${i}`,
            conceptId: 'concept-1',
          }),
          createdAt: now,
          updatedAt: now,
        });
      }
      for (let i = 0; i < archivedSiblings; i++) {
        items.push({
          ...makeItem({
            id: `post-arch-${i}`,
            title: `Archived ${i}`,
            conceptId: 'concept-1',
            archived: true,
          }),
          createdAt: now,
          updatedAt: now,
        });
      }
      const { fixture, state } = setup(current);
      state.setItems(items);
      fixture.detectChanges();
      return { fixture, state };
    }

    it('cancel at the confirm leaves the user on the post — no API call, no navigation', () => {
      const { fixture, state } = setupWithSiblings(1);
      const router = TestBed.inject(Router);
      const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      const sendSpy = vi.spyOn(state, 'sendConceptBack');
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      (fixture.componentInstance as unknown as { onBackToConcept: () => void }).onBackToConcept();

      expect(confirmSpy).toHaveBeenCalledTimes(1);
      expect(sendSpy).not.toHaveBeenCalled();
      expect(navSpy).not.toHaveBeenCalled();
    });

    it('confirm OK calls sendConceptBack then navigates to the concept detail', () => {
      const { fixture, state } = setupWithSiblings(2);
      const router = TestBed.inject(Router);
      const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      const sendSpy = vi.spyOn(state, 'sendConceptBack').mockReturnValue(
        of({
          conceptId: 'concept-1',
          archivedPostIds: ['post-1', 'post-sib-0', 'post-sib-1'],
          alreadyArchivedPostIds: [],
          conceptStatus: 'new',
        }),
      );
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      (fixture.componentInstance as unknown as { onBackToConcept: () => void }).onBackToConcept();

      expect(sendSpy).toHaveBeenCalledWith('concept-1');
      expect(navSpy).toHaveBeenCalledWith(['/workspace', 'ws-1', 'content', 'concept-1']);
    });

    it('error from sendConceptBack does not navigate', () => {
      const { fixture, state } = setupWithSiblings(1);
      const router = TestBed.inject(Router);
      const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      vi.spyOn(state, 'sendConceptBack').mockReturnValue(
        throwError(() => new Error('boom')),
      );
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      (fixture.componentInstance as unknown as { onBackToConcept: () => void }).onBackToConcept();

      expect(navSpy).not.toHaveBeenCalled();
    });

    it('confirm copy uses plural "posts" with the live-sibling count when N > 1', () => {
      const { fixture } = setupWithSiblings(2); // current + 2 siblings = 3 live
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      (fixture.componentInstance as unknown as { onBackToConcept: () => void }).onBackToConcept();

      expect(confirmSpy).toHaveBeenCalledWith(
        'Sending this concept back will permanently delete all 3 posts under it. This cannot be undone. Continue?',
      );
    });

    it('confirm copy uses singular "post" when only the current post is live', () => {
      const { fixture } = setupWithSiblings(0, 2); // current only + 2 archived siblings
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      (fixture.componentInstance as unknown as { onBackToConcept: () => void }).onBackToConcept();

      expect(confirmSpy).toHaveBeenCalledWith(
        'Sending this concept back will permanently delete all 1 post under it. This cannot be undone. Continue?',
      );
    });

    it('is a no-op when the item has no conceptId', () => {
      const { fixture } = setup(makeItem({ conceptId: undefined }));
      const router = TestBed.inject(Router);
      const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      (fixture.componentInstance as unknown as { onBackToConcept: () => void }).onBackToConcept();

      expect(confirmSpy).not.toHaveBeenCalled();
      expect(navSpy).not.toHaveBeenCalled();
    });
  });

  it('onArchive marks the item archived and emits back', () => {
    const { fixture, state } = setup();
    let back = 0;
    fixture.componentInstance.back.subscribe(() => back++);
    (fixture.componentInstance as unknown as { onArchive: () => void }).onArchive();
    expect(state.items().find((i) => i.id === 'post-1')?.archived).toBe(true);
    expect(back).toBe(1);
  });

  // Duplicate + Delete were removed from the post-detail header menu
  // to match the prototype (Send back to Concept + Archive only). The
  // store-level duplicate()/deleteSelf() methods remain in case future
  // entry points (kanban card menu) need them — see post-detail.store.spec.

  it('parentConcept() resolves the linked concept by conceptId', () => {
    const { fixture, state } = setup();
    const now = new Date().toISOString();
    state.setItems([
      makeItem({ id: 'post-1' }),
      {
        id: 'concept-1',
        stage: 'concept',
        status: 'draft',
        title: 'parent',
        description: '',
        pillarIds: [],
        segmentIds: [],
        createdAt: now,
        updatedAt: now,
      },
    ]);
    fixture.detectChanges();
    const comp = fixture.componentInstance as unknown as {
      parentConcept: () => ContentItem | null;
    };
    expect(comp.parentConcept()?.id).toBe('concept-1');
  });

  // ── Preview computeds (post-preview-card inputs) ──────────────────

  it('previewCaption pulls from instagramPackaging.caption when platform=instagram', () => {
    const item = makeItem({
      platform: 'instagram',
      production: {
        packaging: { instagram: { caption: 'IG caption' } },
      },
    });
    const { fixture } = setup(item);
    const comp = fixture.componentInstance as unknown as {
      previewCaption: () => string;
    };
    expect(comp.previewCaption()).toBe('IG caption');
  });

  it('previewCaption pulls from tiktokPackaging.caption when platform=tiktok', () => {
    const item = makeItem({
      platform: 'tiktok',
      contentType: 'short-video',
      production: {
        packaging: { tiktok: { caption: 'TT caption' } },
      },
    });
    const { fixture } = setup(item);
    const comp = fixture.componentInstance as unknown as {
      previewCaption: () => string;
    };
    expect(comp.previewCaption()).toBe('TT caption');
  });

  it('previewCaption returns empty string for non-IG/TT platforms', () => {
    const item = makeItem({ platform: 'youtube', contentType: 'long-form' });
    const { fixture } = setup(item);
    const comp = fixture.componentInstance as unknown as {
      previewCaption: () => string;
    };
    expect(comp.previewCaption()).toBe('');
  });

  it('previewCoverAsset reads coverAssetUrl from IG slot (data URL pass-through)', () => {
    const item = makeItem({
      platform: 'instagram',
      production: {
        packaging: {
          instagram: { coverAssetUrl: 'data:image/png;base64,xx' },
        },
      },
    });
    const { fixture } = setup(item);
    const comp = fixture.componentInstance as unknown as {
      previewCoverAsset: () => string | undefined;
    };
    expect(comp.previewCoverAsset()).toBe('data:image/png;base64,xx');
  });

  it('previewCoverAsset returns undefined for non-IG platforms', () => {
    const item = makeItem({ platform: 'tiktok', contentType: 'short-video' });
    const { fixture } = setup(item);
    const comp = fixture.componentInstance as unknown as {
      previewCoverAsset: () => string | undefined;
    };
    expect(comp.previewCoverAsset()).toBeUndefined();
  });

  it('previewAudioTrackName reads from IG audio slot', () => {
    const item = makeItem({
      platform: 'instagram',
      production: {
        packaging: {
          instagram: {
            audio: {
              trackId: 't1',
              trackName: 'IG track',
              artistName: 'a',
              source: 'trending',
            },
          },
        },
      },
    });
    const { fixture } = setup(item);
    const comp = fixture.componentInstance as unknown as {
      previewAudioTrackName: () => string | undefined;
    };
    expect(comp.previewAudioTrackName()).toBe('IG track');
  });

  it('previewAudioTrackName reads from TT audio slot', () => {
    const item = makeItem({
      platform: 'tiktok',
      contentType: 'short-video',
      production: {
        packaging: {
          tiktok: {
            audio: {
              trackId: 't2',
              trackName: 'TT track',
              artistName: 'b',
              source: 'trending',
            },
          },
        },
      },
    });
    const { fixture } = setup(item);
    const comp = fixture.componentInstance as unknown as {
      previewAudioTrackName: () => string | undefined;
    };
    expect(comp.previewAudioTrackName()).toBe('TT track');
  });

  it('previewAudioTrackName returns undefined for non-IG/TT platforms', () => {
    const item = makeItem({ platform: 'youtube', contentType: 'long-form' });
    const { fixture } = setup(item);
    const comp = fixture.componentInstance as unknown as {
      previewAudioTrackName: () => string | undefined;
    };
    expect(comp.previewAudioTrackName()).toBeUndefined();
  });
});
