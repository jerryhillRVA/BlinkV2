import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, Router } from '@angular/router';
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
  it('renders header + variation chips + steps bar + brief step + sidebar (concept / journey / timestamps) when Brief is active', () => {
    const { fixture } = setup();
    expect(fixture.nativeElement.querySelector('app-post-detail-header')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-variation-chips')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-production-steps-bar')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-brief-step')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-brief-content-concept')).not.toBeNull();
    // Sidebar additions: Content Journey + Timestamps
    expect(fixture.nativeElement.querySelector('.brief-side app-content-journey')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.brief-side .timestamps-panel')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.brief-side .panel-journey')).not.toBeNull();
    // brief-status-sidebar is gone — its content moved into Brief Status card.
    expect(fixture.nativeElement.querySelector('app-brief-status-sidebar')).toBeNull();
    // status-stepper is gone — production-steps-bar is the only stepper here.
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

  it('renders Builder placeholder when stepper sets activeStep=builder', () => {
    const { fixture } = setup();
    const store = (fixture.componentInstance as unknown as { store: PostDetailStore }).store;
    store.setActiveStep('builder');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-brief-step')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-step-placeholder')).not.toBeNull();
  });

  it('renders Packaging placeholder when active', () => {
    const { fixture } = setup();
    const store = (fixture.componentInstance as unknown as { store: PostDetailStore }).store;
    store.setActiveStep('packaging');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-step-placeholder')).not.toBeNull();
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

  it('onBackToConcept navigates to the concept URL when conceptId present', () => {
    const { fixture } = setup();
    const router = TestBed.inject(Router);
    const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    (fixture.componentInstance as unknown as { onBackToConcept: () => void }).onBackToConcept();
    expect(spy).toHaveBeenCalledWith(['/workspace', 'ws-1', 'content', 'concept-1']);
  });

  it('onBackToConcept is a no-op when the item has no conceptId', () => {
    const { fixture } = setup(makeItem({ conceptId: undefined }));
    const router = TestBed.inject(Router);
    const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    (fixture.componentInstance as unknown as { onBackToConcept: () => void }).onBackToConcept();
    expect(spy).not.toHaveBeenCalled();
  });

  it('onArchive marks the item archived and emits back', () => {
    const { fixture, state } = setup();
    let back = 0;
    fixture.componentInstance.back.subscribe(() => back++);
    (fixture.componentInstance as unknown as { onArchive: () => void }).onArchive();
    expect(state.items().find((i) => i.id === 'post-1')?.archived).toBe(true);
    expect(back).toBe(1);
  });

  it('onDuplicate saves a copy and navigates to it', () => {
    const { fixture, state } = setup();
    const router = TestBed.inject(Router);
    const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    (fixture.componentInstance as unknown as { onDuplicate: () => void }).onDuplicate();
    expect(state.items().length).toBe(2);
    const nav = spy.mock.calls.at(-1)?.[0] as string[];
    expect(nav[0]).toBe('/workspace');
    expect(nav[1]).toBe('ws-1');
    expect(nav[2]).toBe('content');
    expect(nav[3]).not.toBe('post-1');
  });

  it('onDuplicate is a no-op when the item is missing', () => {
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
    const router = TestBed.inject(Router);
    const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    (fixture.componentInstance as unknown as { onDuplicate: () => void }).onDuplicate();
    expect(spy).not.toHaveBeenCalled();
  });

  it('onDelete removes the item and emits deleted', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { fixture, state } = setup();
    let deleted = 0;
    fixture.componentInstance.deleted.subscribe(() => deleted++);
    (fixture.componentInstance as unknown as { onDelete: () => void }).onDelete();
    expect(state.items().some((i) => i.id === 'post-1')).toBe(false);
    expect(deleted).toBe(1);
    confirmSpy.mockRestore();
  });

  it('onOpenSibling navigates to /workspace/<id>/content/<siblingId>', () => {
    const { fixture } = setup();
    const router = TestBed.inject(Router);
    const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    (fixture.componentInstance as unknown as { onOpenSibling: (id: string) => void }).onOpenSibling('sib-9');
    expect(spy).toHaveBeenCalledWith(['/workspace', 'ws-1', 'content', 'sib-9']);
  });

  it('siblings() returns posts that share conceptId; parentConcept() resolves the linked concept', () => {
    const { fixture, state } = setup();
    const now = new Date().toISOString();
    state.setItems([
      makeItem({ id: 'post-1' }),
      makeItem({ id: 'post-2', platform: 'youtube', contentType: 'long-form' }),
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
      siblings: () => ContentItem[];
      parentConcept: () => ContentItem | null;
    };
    expect(comp.siblings().map((i) => i.id).sort()).toEqual(['post-1', 'post-2']);
    expect(comp.parentConcept()?.id).toBe('concept-1');
  });

  it('onDelete is a no-op when user cancels the confirm', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { fixture, state } = setup();
    let deleted = 0;
    fixture.componentInstance.deleted.subscribe(() => deleted++);
    (fixture.componentInstance as unknown as { onDelete: () => void }).onDelete();
    expect(state.items().some((i) => i.id === 'post-1')).toBe(true);
    expect(deleted).toBe(0);
    confirmSpy.mockRestore();
  });
});
