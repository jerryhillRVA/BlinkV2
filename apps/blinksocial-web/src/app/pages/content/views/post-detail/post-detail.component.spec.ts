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
  it('renders header + stepper + brief step + sidebar when Brief is active', () => {
    const { fixture } = setup();
    expect(fixture.nativeElement.querySelector('app-post-detail-header')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-production-steps-bar')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-brief-step')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-brief-status-sidebar')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-step-placeholder')).toBeNull();
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

  it('onApprove flips briefApproved on the item', () => {
    const { fixture } = setup();
    const store = (fixture.componentInstance as unknown as { store: PostDetailStore }).store;
    (fixture.componentInstance as unknown as { onApprove: () => void }).onApprove();
    expect(store.item()?.briefApproved).toBe(true);
  });

  it('onUnlock clears briefApproved on the item', () => {
    const { fixture } = setup();
    const store = (fixture.componentInstance as unknown as { store: PostDetailStore }).store;
    store.approveBrief();
    (fixture.componentInstance as unknown as { onUnlock: () => void }).onUnlock();
    expect(store.item()?.briefApproved).toBe(false);
  });

  it('onContinueToBuilder advances the active step', () => {
    const { fixture } = setup();
    const store = (fixture.componentInstance as unknown as { store: PostDetailStore }).store;
    (fixture.componentInstance as unknown as { onContinueToBuilder: () => void }).onContinueToBuilder();
    expect(store.activeStep()).toBe('builder');
  });

  it('onStatusChange persists new status through the store', () => {
    const { fixture } = setup();
    const store = (fixture.componentInstance as unknown as { store: PostDetailStore }).store;
    (fixture.componentInstance as unknown as {
      onStatusChange: (s: 'review') => void;
    }).onStatusChange('review');
    expect(store.item()?.status).toBe('review');
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
