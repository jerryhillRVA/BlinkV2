import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConceptDetailComponent } from './concept-detail.component';
import { ConceptDetailStore } from './concept-detail.store';
import { ContentStateService } from '../../content-state.service';
import type {
  AudienceSegment,
  ContentItem,
  ContentPillar,
} from '../../content.types';

const PILLARS: ContentPillar[] = [
  { id: 'p1', name: 'Alpha', description: '', color: '#111' },
  { id: 'p2', name: 'Beta', description: '', color: '#222' },
  { id: 'p3', name: 'Gamma', description: '', color: '#333' },
  { id: 'p4', name: 'Delta', description: '', color: '#444' },
];
const SEGMENTS: AudienceSegment[] = [
  { id: 's1', name: 'Seg 1', description: '' },
];

function makeItem(partial: Partial<ContentItem> = {}): ContentItem {
  const now = new Date().toISOString();
  return {
    id: 'c-1',
    stage: 'concept',
    status: 'draft',
    title: 'Concept title',
    description: 'x'.repeat(80),
    pillarIds: ['p1', 'p2'],
    segmentIds: ['s1'],
    hook: 'A punchy hook',
    objective: 'engagement',
    productionTargets: [{ platform: 'instagram', contentType: 'reel' }],
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

function setup(item: ContentItem = makeItem()): {
  fixture: ComponentFixture<ConceptDetailComponent>;
  state: ContentStateService;
} {
  TestBed.configureTestingModule({
    imports: [ConceptDetailComponent],
    providers: [ContentStateService],
  });
  const state = TestBed.inject(ContentStateService);
  state.items.set([item]);
  state.pillars.set(PILLARS);
  state.segments.set(SEGMENTS);
  const fixture = TestBed.createComponent(ConceptDetailComponent);
  fixture.componentRef.setInput('itemId', item.id);
  fixture.detectChanges();
  return { fixture, state };
}

describe('ConceptDetailComponent — composition', () => {
  it('renders header, main panels, sidebar panels', () => {
    const { fixture } = setup();
    expect(fixture.nativeElement.querySelector('app-concept-detail-header')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-production-targets-picker')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-content-journey')).not.toBeNull();
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('.panel-label') as NodeListOf<HTMLElement>,
    ).map((el) => el.textContent ?? '');
    expect(labels.some((t) => t.includes('Description'))).toBe(true);
    expect(labels.some((t) => t.includes('Hook'))).toBe(true);
    expect(labels.some((t) => t.includes('Content Goal'))).toBe(true);
    expect(labels.some((t) => t.includes('Production Targets'))).toBe(true);
    expect(labels.some((t) => t.includes('Call-to-Action'))).toBe(true);
    expect(labels.some((t) => t.includes('Content Pillars'))).toBe(true);
    expect(labels.some((t) => t.includes('Audience Segments'))).toBe(true);
    expect(labels.some((t) => t.includes('Business Objective'))).toBe(true);
    expect(labels.some((t) => t.includes('Content Journey'))).toBe(true);
    expect(labels.some((t) => t.includes('Timestamps'))).toBe(true);
  });

  it('renders nothing when item is null', () => {
    TestBed.configureTestingModule({
      imports: [ConceptDetailComponent],
      providers: [ContentStateService],
    });
    const fixture = TestBed.createComponent(ConceptDetailComponent);
    fixture.componentRef.setInput('itemId', 'missing');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.concept-detail')).toBeNull();
  });
});

describe('ConceptDetailComponent — interactions', () => {
  it('Content Goal button sets store.objective', () => {
    const { fixture } = setup();
    const buttons = fixture.nativeElement.querySelectorAll(
      '.objective-btn',
    ) as NodeListOf<HTMLButtonElement>;
    const leadsBtn = Array.from(buttons).find((b) => b.textContent?.includes('Leads')) as HTMLButtonElement;
    leadsBtn.click();
    fixture.detectChanges();
    const store = (fixture.componentInstance as unknown as { store: ConceptDetailStore }).store;
    expect(store.item()?.objective).toBe('leads');
  });

  it('pillar chip toggles selection', () => {
    const { fixture } = setup(makeItem({ pillarIds: [] }));
    const store = (fixture.componentInstance as unknown as { store: ConceptDetailStore }).store;
    const chips = fixture.nativeElement.querySelectorAll('.chip') as NodeListOf<HTMLButtonElement>;
    chips[0].click();
    fixture.detectChanges();
    expect(store.item()?.pillarIds).toEqual(['p1']);
  });

  it('opens move dialog when CTA clicked; valid item', () => {
    const { fixture } = setup();
    const store = (fixture.componentInstance as unknown as { store: ConceptDetailStore }).store;
    const comp = fixture.componentInstance as unknown as { onMoveClick: () => void };
    comp.onMoveClick();
    fixture.detectChanges();
    expect(store.moveDialogOpen()).toBe(true);
    expect(fixture.nativeElement.querySelector('app-move-to-production-dialog')).not.toBeNull();
  });

  it('move dialog "Add all" emits moved with created posts and closes', () => {
    const { fixture } = setup();
    const emits: Array<{ created: ContentItem[]; workOnItemId: string | null }> = [];
    fixture.componentInstance.moved.subscribe((e) => emits.push(e));
    const comp = fixture.componentInstance as unknown as {
      onMoveClick: () => void;
      onDialogAddAll: () => void;
    };
    comp.onMoveClick();
    fixture.detectChanges();
    comp.onDialogAddAll();
    expect(emits.length).toBe(1);
    expect(emits[0].created.length).toBe(1);
    expect(emits[0].workOnItemId).toBeNull();
  });

  it('move dialog "Keep concept" emits moved but keeps the concept in state', () => {
    const { fixture, state } = setup();
    const emits: Array<{ created: ContentItem[] }> = [];
    fixture.componentInstance.moved.subscribe((e) => emits.push(e));
    const comp = fixture.componentInstance as unknown as {
      onMoveClick: () => void;
      onDialogAddAllKeep: () => void;
    };
    comp.onMoveClick();
    comp.onDialogAddAllKeep();
    expect(emits.length).toBe(1);
    expect(state.items().some((i) => i.id === 'c-1')).toBe(true);
  });

  it('move dialog "Work on N" emits moved with workOnItemId = created[N].id', () => {
    const { fixture } = setup(
      makeItem({
        productionTargets: [
          { platform: 'instagram', contentType: 'reel' },
          { platform: 'tiktok', contentType: 'short-video' },
        ],
      }),
    );
    const emits: Array<{ created: ContentItem[]; workOnItemId: string | null }> = [];
    fixture.componentInstance.moved.subscribe((e) => emits.push(e));
    const comp = fixture.componentInstance as unknown as {
      onMoveClick: () => void;
      onDialogWorkOn: (i: number) => void;
    };
    comp.onMoveClick();
    comp.onDialogWorkOn(1);
    expect(emits.length).toBe(1);
    expect(emits[0].workOnItemId).toBe(emits[0].created[1].id);
  });

  it('Delete removes item from state and emits deleted', () => {
    const { fixture, state } = setup();
    let deleted = 0;
    fixture.componentInstance.deleted.subscribe(() => deleted++);
    const comp = fixture.componentInstance as unknown as { onDelete: () => void };
    comp.onDelete();
    expect(deleted).toBe(1);
    expect(state.items().some((i) => i.id === 'c-1')).toBe(false);
  });

  it('Back button emits back', () => {
    const { fixture } = setup();
    let back = 0;
    fixture.componentInstance.back.subscribe(() => back++);
    (fixture.componentInstance as unknown as { onBack: () => void }).onBack();
    expect(back).toBe(1);
  });

  it('Demote to Idea changes stage to idea', () => {
    const { fixture } = setup();
    const store = (fixture.componentInstance as unknown as { store: ConceptDetailStore }).store;
    (fixture.componentInstance as unknown as { onDemote: () => void }).onDemote();
    expect(store.item()?.stage).toBe('idea');
  });
});

describe('ConceptDetailComponent — formatters and helpers', () => {
  it('descriptionInvalid true when out-of-range', () => {
    const { fixture } = setup(makeItem({ description: 'too short' }));
    const comp = fixture.componentInstance as unknown as {
      descriptionInvalid: () => boolean;
      descriptionCount: () => number;
    };
    expect(comp.descriptionCount()).toBe('too short'.length);
    expect(comp.descriptionInvalid()).toBe(true);
  });

  it('descriptionInvalid false when empty (no pink tint)', () => {
    const { fixture } = setup(makeItem({ description: '' }));
    const comp = fixture.componentInstance as unknown as {
      descriptionInvalid: () => boolean;
    };
    expect(comp.descriptionInvalid()).toBe(false);
  });

  it('field-change handlers route to the store', () => {
    const { fixture } = setup();
    const store = (fixture.componentInstance as unknown as { store: ConceptDetailStore }).store;
    const comp = fixture.componentInstance as unknown as {
      onTitleChange: (v: string) => void;
      onDescriptionChange: (v: string) => void;
      onHookChange: (v: string) => void;
      onCtaTextChange: (v: string) => void;
      onSetCtaType: (v: string) => void;
      onToggleTarget: (t: { platform: string; contentType: string }) => void;
      onAssistDescription: () => void;
      onAssistHook: () => void;
      ctaTextCount: () => number;
      onDialogCancel: () => void;
    };
    comp.onTitleChange('Renamed');
    expect(store.item()?.title).toBe('Renamed');
    comp.onDescriptionChange('A new description');
    expect(store.item()?.description).toBe('A new description');
    comp.onHookChange('A new hook');
    expect(store.item()?.hook).toBe('A new hook');
    comp.onSetCtaType('learn-more');
    expect(store.item()?.cta?.type).toBe('learn-more');
    comp.onCtaTextChange('Read more');
    expect(store.item()?.cta?.text).toBe('Read more');
    expect(comp.ctaTextCount()).toBe('Read more'.length);
    comp.onSetCtaType('');
    expect(store.item()?.cta).toBeUndefined();
    comp.onToggleTarget({ platform: 'youtube', contentType: 'long-form' });
    expect(
      store.item()?.productionTargets?.some(
        (t) => t.platform === 'youtube' && t.contentType === 'long-form',
      ),
    ).toBe(true);
    comp.onAssistDescription();
    expect(store.isAssistingDescription()).toBe(true);
    comp.onAssistHook();
    expect(store.isAssistingHook()).toBe(true);
  });

  it('onDialogCancel closes the dialog via store', () => {
    const { fixture } = setup();
    const store = (fixture.componentInstance as unknown as { store: ConceptDetailStore }).store;
    store.openMoveDialog();
    expect(store.moveDialogOpen()).toBe(true);
    (fixture.componentInstance as unknown as { onDialogCancel: () => void }).onDialogCancel();
    expect(store.moveDialogOpen()).toBe(false);
  });

  it('onDelete is a noop when item is null', () => {
    TestBed.configureTestingModule({
      imports: [ConceptDetailComponent],
      providers: [ContentStateService],
    });
    const fixture = TestBed.createComponent(ConceptDetailComponent);
    fixture.componentRef.setInput('itemId', 'missing');
    fixture.detectChanges();
    let deleted = 0;
    fixture.componentInstance.deleted.subscribe(() => deleted++);
    (fixture.componentInstance as unknown as { onDelete: () => void }).onDelete();
    expect(deleted).toBe(0);
  });

  it('defensive helpers return false/0 when store item is null', () => {
    TestBed.configureTestingModule({
      imports: [ConceptDetailComponent],
      providers: [ContentStateService],
    });
    const fixture = TestBed.createComponent(ConceptDetailComponent);
    fixture.componentRef.setInput('itemId', 'missing');
    fixture.detectChanges();
    const comp = fixture.componentInstance as unknown as {
      isPillarSelected: (id: string) => boolean;
      isSegmentSelected: (id: string) => boolean;
      pillarsAtLimit: () => boolean;
      togglePillar: (id: string) => void;
      descriptionCount: () => number;
      hookCount: () => number;
      ctaTextCount: () => number;
    };
    expect(comp.isPillarSelected('p1')).toBe(false);
    expect(comp.isSegmentSelected('s1')).toBe(false);
    expect(comp.pillarsAtLimit()).toBe(false);
    comp.togglePillar('p1');
    expect(comp.descriptionCount()).toBe(0);
    expect(comp.hookCount()).toBe(0);
    expect(comp.ctaTextCount()).toBe(0);
  });

  it('togglePillar short-circuits when pillarsAtLimit and pillar not already selected', () => {
    const { fixture } = setup(makeItem({ pillarIds: ['p1', 'p2', 'p3'] }));
    const store = (fixture.componentInstance as unknown as { store: ConceptDetailStore }).store;
    const before = store.item()?.pillarIds?.slice();
    (fixture.componentInstance as unknown as { togglePillar: (id: string) => void }).togglePillar('p4');
    expect(store.item()?.pillarIds).toEqual(before);
  });

  it('dialog handlers are noops when moveToProduction returns []', () => {
    const { fixture } = setup(makeItem({ title: '' }));
    const emits: unknown[] = [];
    fixture.componentInstance.moved.subscribe((e) => emits.push(e));
    const comp = fixture.componentInstance as unknown as {
      onDialogAddAll: () => void;
      onDialogAddAllKeep: () => void;
      onDialogWorkOn: (i: number) => void;
    };
    comp.onDialogAddAll();
    comp.onDialogAddAllKeep();
    comp.onDialogWorkOn(0);
    expect(emits.length).toBe(0);
  });

  it('isInProductionFn delegates to store', () => {
    const { fixture, state } = setup();
    state.items.update((prev) => [
      ...prev,
      {
        ...prev[0],
        id: 'p-1',
        stage: 'post',
        status: 'in-progress',
        conceptId: 'c-1',
        platform: 'instagram',
        contentType: 'reel',
        productionTargets: undefined,
      },
    ]);
    const comp = fixture.componentInstance as unknown as {
      isInProductionFn: (t: { platform: string; contentType: string }) => boolean;
    };
    expect(comp.isInProductionFn({ platform: 'instagram', contentType: 'reel' })).toBe(true);
    expect(comp.isInProductionFn({ platform: 'youtube', contentType: 'long-form' })).toBe(false);
  });
});
