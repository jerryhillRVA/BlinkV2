import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { signal, type WritableSignal } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { ContentDetailPageComponent } from './content-detail-page.component';
import { ContentStateService } from '../../content-state.service';
import type {
  AudienceSegment,
  ContentItem,
  ContentPillar,
} from '../../content.types';

function makeItem(partial: Partial<ContentItem> = {}): ContentItem {
  const now = new Date().toISOString();
  return {
    id: 'c-1',
    stage: 'idea',
    status: 'draft',
    title: 'Thing',
    description: 'D',
    pillarIds: [],
    segmentIds: [],
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

function createMockState(initialItems: ContentItem[]): {
  state: {
    items: WritableSignal<ContentItem[]>;
    pillars: WritableSignal<ContentPillar[]>;
    segments: WritableSignal<AudienceSegment[]>;
    loading: WritableSignal<boolean>;
    workspaceId: WritableSignal<string>;
    saveItem: ReturnType<typeof vi.fn>;
    deleteItem: ReturnType<typeof vi.fn>;
    loadAll: ReturnType<typeof vi.fn>;
    loadFullItem: ReturnType<typeof vi.fn>;
    archive: ReturnType<typeof vi.fn>;
    unarchive: ReturnType<typeof vi.fn>;
  };
} {
  const items = signal<ContentItem[]>(initialItems);
  const state = {
    items,
    pillars: signal<ContentPillar[]>([]),
    segments: signal<AudienceSegment[]>([]),
    loading: signal(false),
    workspaceId: signal('ws-1'),
    saveItem: vi.fn((i: ContentItem) => {
      const savedId = i.id || `c-${Math.random().toString(36).slice(2, 8)}`;
      const saved = { ...i, id: savedId };
      items.update((prev) => {
        const idx = prev.findIndex((p) => p.id === saved.id);
        return idx >= 0
          ? prev.map((p, k) => (k === idx ? saved : p))
          : [...prev, saved];
      });
      return of(saved);
    }),
    deleteItem: vi.fn((id: string) => {
      items.update((prev) => prev.filter((p) => p.id !== id));
      return of({ deleted: true as const, id });
    }),
    loadAll: vi.fn(),
    loadFullItem: vi.fn(),
    archive: vi.fn((id: string) => {
      let updated: ContentItem | undefined;
      items.update((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;
          updated = { ...p, archived: true };
          return updated;
        }),
      );
      return of(updated as ContentItem);
    }),
    unarchive: vi.fn((id: string) => {
      let updated: ContentItem | undefined;
      items.update((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;
          updated = { ...p, archived: false };
          return updated;
        }),
      );
      return of(updated as ContentItem);
    }),
  };
  return { state };
}

function configureTest(
  params: { id?: string; itemId?: string },
  items: ContentItem[],
  overrides: Partial<Record<string, unknown>> = {},
) {
  const { state } = createMockState(items);
  Object.assign(state, overrides);
  const paramMap$ = new BehaviorSubject(convertToParamMap(params));
  TestBed.configureTestingModule({
    imports: [ContentDetailPageComponent],
    providers: [
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: {
          paramMap: paramMap$.asObservable(),
          snapshot: {
            paramMap: {
              get: (k: string) => params[k as 'id' | 'itemId'] ?? null,
            },
          },
        },
      },
    ],
  }).overrideComponent(ContentDetailPageComponent, {
    set: { providers: [{ provide: ContentStateService, useValue: state }] },
  });
  return { state, paramMap$ };
}

describe('ContentDetailPageComponent — route + workspace', () => {
  it('loads items when workspace is new', () => {
    const { state } = configureTest({ id: 'ws-2', itemId: 'c-1' }, [makeItem()]);
    state.workspaceId.set('ws-other');
    state.items.set([]);
    const fixture = TestBed.createComponent(ContentDetailPageComponent);
    fixture.detectChanges();
    expect(state.loadAll).toHaveBeenCalledWith('ws-2');
  });

  it('renders the loading panel while loading', () => {
    const { state } = configureTest({ id: 'ws-1', itemId: 'c-1' }, []);
    state.loading.set(true);
    const fixture = TestBed.createComponent(ContentDetailPageComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.loading-state')).not.toBeNull();
  });

  it('renders not-found when the id does not resolve', () => {
    configureTest({ id: 'ws-1', itemId: 'missing' }, [makeItem()]);
    const fixture = TestBed.createComponent(ContentDetailPageComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.not-found')).not.toBeNull();
  });

  it('missing route params fall back to empty strings', () => {
    configureTest({}, []);
    const fixture = TestBed.createComponent(ContentDetailPageComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.not-found')).not.toBeNull();
  });
});

describe('ContentDetailPageComponent — stage dispatch', () => {
  it('renders <app-idea-detail> for a stage=idea item', () => {
    configureTest({ id: 'ws-1', itemId: 'c-1' }, [makeItem({ stage: 'idea' })]);
    const fixture = TestBed.createComponent(ContentDetailPageComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-idea-detail')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-concept-detail')).toBeNull();
  });

  it('renders <app-concept-detail> for a stage=concept item', () => {
    configureTest({ id: 'ws-1', itemId: 'c-1' }, [
      makeItem({
        stage: 'concept',
        title: 'Concept T',
        description: 'x'.repeat(80),
        pillarIds: ['p1'],
        segmentIds: ['s1'],
        hook: 'A hook',
        objective: 'awareness',
        productionTargets: [{ platform: 'instagram', contentType: 'reel' }],
      }),
    ]);
    const fixture = TestBed.createComponent(ContentDetailPageComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-concept-detail')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-idea-detail')).toBeNull();
  });

  it('renders <app-post-detail> for a stage=post item', () => {
    configureTest({ id: 'ws-1', itemId: 'c-1' }, [
      makeItem({
        stage: 'post',
        title: 'Post T',
        description: 'x'.repeat(80),
        pillarIds: ['p1'],
        segmentIds: ['s1'],
        objective: 'engagement',
        platform: 'instagram',
        contentType: 'reel',
        keyMessage: 'Remember this',
      }),
    ]);
    const fixture = TestBed.createComponent(ContentDetailPageComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-post-detail')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-idea-detail')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-concept-detail')).toBeNull();
  });

  it('renders the "coming soon" placeholder for truly unknown stages', () => {
    configureTest({ id: 'ws-1', itemId: 'c-1' }, [
      makeItem({ stage: 'production-brief' }),
    ]);
    const fixture = TestBed.createComponent(ContentDetailPageComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.placeholder')).not.toBeNull();
  });
});

describe('ContentDetailPageComponent — actions', () => {
  it('goBack routes to the pipeline board', () => {
    configureTest({ id: 'ws-1', itemId: 'c-1' }, [makeItem()]);
    const fixture = TestBed.createComponent(ContentDetailPageComponent);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    (fixture.componentInstance as unknown as { goBack: () => void }).goBack();
    expect(spy).toHaveBeenCalledWith(['/workspace', 'ws-1', 'content']);
  });

  it('onArchive calls state.archive and routes back', () => {
    const { state } = configureTest({ id: 'ws-1', itemId: 'c-1' }, [makeItem()]);
    const fixture = TestBed.createComponent(ContentDetailPageComponent);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    (fixture.componentInstance as unknown as { onArchive: () => void }).onArchive();
    expect(state.archive).toHaveBeenCalledWith('c-1');
    expect(spy).toHaveBeenCalledWith(['/workspace', 'ws-1', 'content']);
  });

  it('onArchive is a no-op when item is missing', () => {
    const { state } = configureTest({ id: 'ws-1', itemId: 'missing' }, [
      makeItem(),
    ]);
    const fixture = TestBed.createComponent(ContentDetailPageComponent);
    fixture.detectChanges();
    (fixture.componentInstance as unknown as { onArchive: () => void }).onArchive();
    expect(state.archive).not.toHaveBeenCalled();
  });

  it('onUnarchive calls state.unarchive', () => {
    const { state } = configureTest({ id: 'ws-1', itemId: 'c-1' }, [
      makeItem({ archived: true }),
    ]);
    const fixture = TestBed.createComponent(ContentDetailPageComponent);
    fixture.detectChanges();
    (fixture.componentInstance as unknown as { onUnarchive: () => void }).onUnarchive();
    expect(state.unarchive).toHaveBeenCalledWith('c-1');
  });

  it('onUnarchive is a no-op when item is missing', () => {
    const { state } = configureTest({ id: 'ws-1', itemId: 'missing' }, [
      makeItem(),
    ]);
    const fixture = TestBed.createComponent(ContentDetailPageComponent);
    fixture.detectChanges();
    (fixture.componentInstance as unknown as { onUnarchive: () => void }).onUnarchive();
    expect(state.unarchive).not.toHaveBeenCalled();
  });

  it('onDuplicate saves a copy and routes to it', () => {
    const { state } = configureTest({ id: 'ws-1', itemId: 'c-1' }, [makeItem()]);
    const fixture = TestBed.createComponent(ContentDetailPageComponent);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    (fixture.componentInstance as unknown as { onDuplicate: () => void }).onDuplicate();
    expect(state.saveItem).toHaveBeenCalled();
    const nav = spy.mock.calls.at(-1)?.[0] as string[];
    expect(nav[0]).toBe('/workspace');
    expect(nav[1]).toBe('ws-1');
    expect(nav[2]).toBe('content');
    expect(nav[3]).not.toBe('c-1');
  });

  it('onDuplicate is a no-op when item is missing', () => {
    const { state } = configureTest({ id: 'ws-1', itemId: 'missing' }, [
      makeItem(),
    ]);
    const fixture = TestBed.createComponent(ContentDetailPageComponent);
    fixture.detectChanges();
    (fixture.componentInstance as unknown as { onDuplicate: () => void }).onDuplicate();
    expect(state.saveItem).not.toHaveBeenCalled();
  });

  it('onCopyLink writes the URL to the clipboard', () => {
    configureTest({ id: 'ws-1', itemId: 'c-1' }, [makeItem()]);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    const fixture = TestBed.createComponent(ContentDetailPageComponent);
    fixture.detectChanges();
    (fixture.componentInstance as unknown as { onCopyLink: () => void }).onCopyLink();
    expect(writeText).toHaveBeenCalled();
  });

  it('onMoved(workOnItemId) routes to the given post id', () => {
    configureTest({ id: 'ws-1', itemId: 'c-1' }, [makeItem()]);
    const fixture = TestBed.createComponent(ContentDetailPageComponent);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    (fixture.componentInstance as unknown as {
      onMoved: (e: { created: ContentItem[]; workOnItemId: string | null }) => void;
    }).onMoved({ created: [], workOnItemId: 'post-42' });
    expect(spy).toHaveBeenCalledWith(['/workspace', 'ws-1', 'content', 'post-42']);
  });

  it('onMoved(null) routes back to the board', () => {
    configureTest({ id: 'ws-1', itemId: 'c-1' }, [makeItem()]);
    const fixture = TestBed.createComponent(ContentDetailPageComponent);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    (fixture.componentInstance as unknown as {
      onMoved: (e: { created: ContentItem[]; workOnItemId: string | null }) => void;
    }).onMoved({ created: [], workOnItemId: null });
    expect(spy).toHaveBeenCalledWith(['/workspace', 'ws-1', 'content']);
  });

  it('onDeleted routes back to the board', () => {
    configureTest({ id: 'ws-1', itemId: 'c-1' }, [makeItem()]);
    const fixture = TestBed.createComponent(ContentDetailPageComponent);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    (fixture.componentInstance as unknown as { onDeleted: () => void }).onDeleted();
    expect(spy).toHaveBeenCalledWith(['/workspace', 'ws-1', 'content']);
  });
});
