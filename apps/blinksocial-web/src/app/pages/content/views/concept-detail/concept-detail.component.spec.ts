import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConceptDetailComponent } from './concept-detail.component';
import { ConceptDetailStore } from './concept-detail.store';
import { ContentStateService } from '../../content-state.service';
import { provideContentItemsApiStubs } from '../../content-items-api.test-util';
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
    targetPlatforms: [{ platform: 'instagram', contentType: 'reel' }],
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
    providers: [...provideContentItemsApiStubs(), ContentStateService],
  });
  const state = TestBed.inject(ContentStateService);
  state.setItems([item]);
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
      providers: [...provideContentItemsApiStubs(), ContentStateService],
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
        targetPlatforms: [
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
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { fixture, state } = setup();
    let deleted = 0;
    fixture.componentInstance.deleted.subscribe(() => deleted++);
    const comp = fixture.componentInstance as unknown as { onDelete: () => void };
    comp.onDelete();
    expect(deleted).toBe(1);
    expect(state.items().some((i) => i.id === 'c-1')).toBe(false);
    confirmSpy.mockRestore();
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
  it('descriptionInvalid true only when over max (under-min is now a soft warning)', () => {
    const { fixture, state } = setup(makeItem({ description: 'too short' }));
    const comp = fixture.componentInstance as unknown as {
      descriptionInvalid: () => boolean;
      descriptionUnderMin: () => boolean;
      descriptionCount: () => number;
    };
    expect(comp.descriptionCount()).toBe('too short'.length);
    expect(comp.descriptionInvalid()).toBe(false);
    expect(comp.descriptionUnderMin()).toBe(true);

    // Flip to an over-max description on the same item and re-check.
    state.setItems([makeItem({ description: 'x'.repeat(500) })]);
    fixture.detectChanges();
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
      store.item()?.targetPlatforms?.some(
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
      providers: [...provideContentItemsApiStubs(), ContentStateService],
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
      providers: [...provideContentItemsApiStubs(), ContentStateService],
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
    const prev = state.items();
    state.setItems([
      ...prev,
      {
        ...prev[0],
        id: 'p-1',
        stage: 'post',
        status: 'in-progress',
        conceptId: 'c-1',
        platform: 'instagram',
        contentType: 'reel',
        targetPlatforms: undefined,
      },
    ]);
    const comp = fixture.componentInstance as unknown as {
      isInProductionFn: (t: { platform: string; contentType: string }) => boolean;
    };
    expect(comp.isInProductionFn({ platform: 'instagram', contentType: 'reel' })).toBe(true);
    expect(comp.isInProductionFn({ platform: 'youtube', contentType: 'long-form' })).toBe(false);
  });
});

describe('ConceptDetailComponent — new strategy + status handlers', () => {
  function setupAs<T>(): { fixture: ComponentFixture<ConceptDetailComponent>; comp: T; store: ConceptDetailStore } {
    const { fixture } = setup();
    const comp = fixture.componentInstance as unknown as T;
    const store = (fixture.componentInstance as unknown as { store: ConceptDetailStore }).store;
    return { fixture, comp, store };
  }

  it('onKeyMessageChange / onAngleChange route to store setters', () => {
    const { comp, store } = setupAs<{
      onKeyMessageChange: (v: string) => void;
      onAngleChange: (v: string) => void;
    }>();
    comp.onKeyMessageChange('important');
    comp.onAngleChange('unique');
    expect(store.item()?.keyMessage).toBe('important');
    expect(store.item()?.angle).toBe('unique');
  });

  it('onFormatNotesChange splits csv', () => {
    const { comp, store } = setupAs<{
      onFormatNotesChange: (e: Event) => void;
      formatNotesDisplay: () => string;
    }>();
    const evt = { target: { value: 'b-roll, talking-head' } } as unknown as Event;
    comp.onFormatNotesChange(evt);
    expect(store.item()?.formatNotes).toEqual(['b-roll', 'talking-head']);
    expect(comp.formatNotesDisplay()).toBe('b-roll, talking-head');
  });

  it('onClaimsFlagChange reads checkbox state', () => {
    const { comp, store } = setupAs<{ onClaimsFlagChange: (e: Event) => void }>();
    comp.onClaimsFlagChange({ target: { checked: true } } as unknown as Event);
    expect(store.item()?.claimsFlag).toBe(true);
  });

  it('onSourceLinksChange splits by newline', () => {
    const { comp, store } = setupAs<{
      onSourceLinksChange: (e: Event) => void;
      sourceLinksDisplay: () => string;
    }>();
    comp.onSourceLinksChange({ target: { value: 'https://a\nhttps://b' } } as unknown as Event);
    expect(store.item()?.sourceLinks).toEqual(['https://a', 'https://b']);
    expect(comp.sourceLinksDisplay()).toBe('https://a\nhttps://b');
  });

  it('onRiskLevelChange toggles off when already selected', () => {
    const { comp, store } = setupAs<{
      onRiskLevelChange: (l: 'low' | 'medium' | 'high') => void;
    }>();
    comp.onRiskLevelChange('medium');
    expect(store.item()?.riskLevel).toBe('medium');
    comp.onRiskLevelChange('medium');
    expect(store.item()?.riskLevel).toBeUndefined();
  });

  it('onPublishStartChange / onPublishEndChange set bounds individually', () => {
    const { comp, store } = setupAs<{
      onPublishStartChange: (e: Event) => void;
      onPublishEndChange: (e: Event) => void;
    }>();
    comp.onPublishStartChange({ target: { value: '2026-06-01' } } as unknown as Event);
    comp.onPublishEndChange({ target: { value: '2026-06-30' } } as unknown as Event);
    expect(store.item()?.targetPublishWindow).toEqual({
      start: '2026-06-01',
      end: '2026-06-30',
    });
  });

  it('onObjectiveClick toggles objectiveId', () => {
    const { comp, store } = setupAs<{ onObjectiveClick: (id: string) => void }>();
    comp.onObjectiveClick('obj-1');
    expect(store.item()?.objectiveId).toBe('obj-1');
    comp.onObjectiveClick('obj-1');
    expect(store.item()?.objectiveId).toBeUndefined();
  });

  it('onStatusChange persists status through the store', () => {
    const { comp, store } = setupAs<{ onStatusChange: (s: 'review') => void }>();
    comp.onStatusChange('review');
    expect(store.item()?.status).toBe('review');
  });

  it('onArchive / onUnarchive emit the correct outputs', () => {
    const { fixture } = setup();
    const archived: boolean[] = [];
    const unarchived: boolean[] = [];
    fixture.componentInstance.archive.subscribe(() => archived.push(true));
    fixture.componentInstance.unarchive.subscribe(() => unarchived.push(true));
    const comp = fixture.componentInstance as unknown as {
      onArchive: () => void;
      onUnarchive: () => void;
    };
    comp.onArchive();
    comp.onUnarchive();
    expect(archived.length).toBe(1);
    expect(unarchived.length).toBe(1);
  });

  it('renders objective chips when business-objectives are present', () => {
    TestBed.configureTestingModule({
      imports: [ConceptDetailComponent],
      providers: [...provideContentItemsApiStubs(), ContentStateService],
    });
    const state = TestBed.inject(ContentStateService);
    state.setItems([makeItem()]);
    state.pillars.set(PILLARS);
    state.segments.set(SEGMENTS);
    state.businessObjectives.set([
      { id: 'obj-1', category: 'growth', statement: 'Grow fast', target: 1, unit: '', timeframe: '' },
      { id: 'obj-2', category: 'awareness', statement: 'Own mornings', target: 1, unit: '', timeframe: '' },
    ]);
    const fixture = TestBed.createComponent(ConceptDetailComponent);
    fixture.componentRef.setInput('itemId', 'c-1');
    fixture.detectChanges();
    const chips = fixture.nativeElement.querySelectorAll('.objective-chips .chip');
    expect(chips.length).toBe(2);
    expect(fixture.nativeElement.querySelector('.panel-warning')).toBeNull();
  });

  it('onDelete cancelled by confirm leaves the item intact and does not emit deleted', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { fixture, state } = setup();
    let deleted = 0;
    fixture.componentInstance.deleted.subscribe(() => deleted++);
    (fixture.componentInstance as unknown as { onDelete: () => void }).onDelete();
    expect(state.items().some((i) => i.id === 'c-1')).toBe(true);
    expect(deleted).toBe(0);
    confirmSpy.mockRestore();
  });

  it('risk buttons highlight the selected level', () => {
    const { fixture } = setup(makeItem({ riskLevel: 'medium' }));
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('.risk-btn') as NodeListOf<HTMLButtonElement>,
    );
    expect(buttons.length).toBe(3);
    expect(buttons[0].classList.contains('is-active')).toBe(false);
    expect(buttons[1].classList.contains('is-active')).toBe(true);
    expect(buttons[2].classList.contains('is-active')).toBe(false);
  });

  it('format-notes and source-links inputs display current values', () => {
    const { fixture } = setup(makeItem({
      formatNotes: ['b-roll', 'music'],
      sourceLinks: ['https://a.com', 'https://b.com'],
    }));
    const comp = fixture.componentInstance as unknown as {
      formatNotesDisplay: () => string;
      sourceLinksDisplay: () => string;
    };
    expect(comp.formatNotesDisplay()).toBe('b-roll, music');
    expect(comp.sourceLinksDisplay()).toBe('https://a.com\nhttps://b.com');
  });

  it('publish window inputs bind to item.targetPublishWindow', () => {
    const { fixture } = setup(makeItem({
      targetPublishWindow: { start: '2026-06-01', end: '2026-06-30' },
    }));
    const dateInputs = fixture.nativeElement.querySelectorAll('.publish-window input[type="date"]');
    expect(dateInputs.length).toBe(2);
    expect((dateInputs[0] as HTMLInputElement).value).toBe('2026-06-01');
    expect((dateInputs[1] as HTMLInputElement).value).toBe('2026-06-30');
  });

  it('handlers tolerate events with null target', () => {
    const { fixture } = setup();
    const comp = fixture.componentInstance as unknown as {
      onFormatNotesChange: (e: Event) => void;
      onSourceLinksChange: (e: Event) => void;
      onClaimsFlagChange: (e: Event) => void;
      onPublishStartChange: (e: Event) => void;
      onPublishEndChange: (e: Event) => void;
    };
    const nullEvt = { target: null } as unknown as Event;
    expect(() => comp.onFormatNotesChange(nullEvt)).not.toThrow();
    expect(() => comp.onSourceLinksChange(nullEvt)).not.toThrow();
    expect(() => comp.onClaimsFlagChange(nullEvt)).not.toThrow();
    expect(() => comp.onPublishStartChange(nullEvt)).not.toThrow();
    expect(() => comp.onPublishEndChange(nullEvt)).not.toThrow();
  });
});
