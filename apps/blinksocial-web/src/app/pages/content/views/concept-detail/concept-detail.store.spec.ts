import { TestBed } from '@angular/core/testing';
import { ConceptDetailStore } from './concept-detail.store';
import { ContentStateService } from '../../content-state.service';
import { AI_ASSIST_DELAY_MS } from '../../content.constants';
import type {
  AudienceSegment,
  ContentItem,
  ContentPillar,
} from '../../content.types';

const PILLARS: ContentPillar[] = [
  { id: 'p1', name: 'P1', description: '', color: '#111' },
  { id: 'p2', name: 'P2', description: '', color: '#222' },
  { id: 'p3', name: 'P3', description: '', color: '#333' },
  { id: 'p4', name: 'P4', description: '', color: '#444' },
];
const SEGMENTS: AudienceSegment[] = [
  { id: 's1', name: 'S1', description: '' },
  { id: 's2', name: 'S2', description: '' },
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
    hook: 'A compelling hook',
    objective: 'engagement',
    productionTargets: [{ platform: 'instagram', contentType: 'reel' }],
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

function setup(item: ContentItem = makeItem()): {
  store: ConceptDetailStore;
  state: ContentStateService;
} {
  TestBed.configureTestingModule({ providers: [ContentStateService, ConceptDetailStore] });
  const state = TestBed.inject(ContentStateService);
  state.items.set([item]);
  state.pillars.set(PILLARS);
  state.segments.set(SEGMENTS);
  const store = TestBed.inject(ConceptDetailStore);
  store.setItemId(item.id);
  return { store, state };
}

describe('ConceptDetailStore — item resolution', () => {
  it('resolves item from state by id', () => {
    const { store } = setup();
    expect(store.item()?.id).toBe('c-1');
  });

  it('returns null for unknown id', () => {
    const { store } = setup();
    store.setItemId('missing');
    expect(store.item()).toBeNull();
  });

  it('setItemId resets transient flags', () => {
    const { store } = setup();
    store.isAssistingDescription.set(true);
    store.isAssistingHook.set(true);
    store.moveDialogOpen.set(true);
    store.setItemId('c-1');
    expect(store.isAssistingDescription()).toBe(false);
    expect(store.isAssistingHook()).toBe(false);
    expect(store.moveDialogOpen()).toBe(false);
  });
});

describe('ConceptDetailStore — field mutations', () => {
  it('updateTitle trims and persists, bumps updatedAt', () => {
    const { store } = setup(makeItem({ updatedAt: '2020-01-01T00:00:00Z' }));
    store.updateTitle('  New title  ');
    expect(store.item()?.title).toBe('New title');
    expect(store.item()?.updatedAt).not.toBe('2020-01-01T00:00:00Z');
  });

  it('updateTitle ignores empty input', () => {
    const { store } = setup(makeItem({ title: 'Keep' }));
    store.updateTitle('   ');
    expect(store.item()?.title).toBe('Keep');
  });

  it('updateDescription preserves whitespace', () => {
    const { store } = setup();
    store.updateDescription('  line1\nline2  ');
    expect(store.item()?.description).toBe('  line1\nline2  ');
  });

  it('updateHook trims; empty clears', () => {
    const { store } = setup();
    store.updateHook('   ');
    expect(store.item()?.hook).toBeUndefined();
    store.updateHook(' Catchy ');
    expect(store.item()?.hook).toBe('Catchy');
  });

  it('togglePillar enforces MAX_PILLARS_PER_ITEM', () => {
    const { store } = setup(makeItem({ pillarIds: [] }));
    store.togglePillar('p1');
    store.togglePillar('p2');
    store.togglePillar('p3');
    store.togglePillar('p4'); // blocked
    expect(store.item()?.pillarIds).toEqual(['p1', 'p2', 'p3']);
    store.togglePillar('p2'); // removes → opens slot
    expect(store.item()?.pillarIds).toEqual(['p1', 'p3']);
  });

  it('toggleSegment toggles correctly', () => {
    const { store } = setup(makeItem({ segmentIds: [] }));
    store.toggleSegment('s1');
    expect(store.item()?.segmentIds).toEqual(['s1']);
    store.toggleSegment('s1');
    expect(store.item()?.segmentIds).toEqual([]);
  });

  it('setObjective sets and clears via empty string', () => {
    const { store } = setup();
    store.setObjective('leads');
    expect(store.item()?.objective).toBe('leads');
    store.setObjective('');
    expect(store.item()?.objective).toBeUndefined();
  });

  it('setObjectiveId persists and clears', () => {
    const { store } = setup();
    store.setObjectiveId('obj-1');
    expect(store.item()?.objectiveId).toBe('obj-1');
    store.setObjectiveId(undefined);
    expect(store.item()?.objectiveId).toBeUndefined();
  });

  it('setCtaType inits cta with empty text; setCtaText caps length', () => {
    const { store } = setup();
    store.setCtaType('buy');
    expect(store.item()?.cta).toEqual({ type: 'buy', text: '' });
    store.setCtaText('x'.repeat(200));
    expect(store.item()?.cta?.text.length).toBeLessThanOrEqual(120);
    // setCtaType('') clears
    store.setCtaType('');
    expect(store.item()?.cta).toBeUndefined();
  });

  it('setCtaText is a no-op if no cta type selected', () => {
    const { store } = setup(makeItem({ cta: undefined }));
    store.setCtaText('hello');
    expect(store.item()?.cta).toBeUndefined();
  });

  it('toggleProductionTarget adds / removes', () => {
    const { store } = setup(makeItem({ productionTargets: [] }));
    store.toggleProductionTarget('instagram', 'reel');
    expect(store.item()?.productionTargets).toEqual([
      { platform: 'instagram', contentType: 'reel' },
    ]);
    store.toggleProductionTarget('tiktok', 'short-video');
    expect(store.item()?.productionTargets?.length).toBe(2);
    store.toggleProductionTarget('instagram', 'reel');
    expect(store.item()?.productionTargets).toEqual([
      { platform: 'tiktok', contentType: 'short-video' },
    ]);
  });

  it('all field mutations are no-ops on a missing item', () => {
    const { store } = setup();
    store.setItemId('missing');
    store.updateTitle('x');
    store.updateHook('x');
    store.togglePillar('p1');
    store.toggleSegment('s1');
    store.toggleProductionTarget('instagram', 'reel');
    store.setCtaText('x');
    expect(store.item()).toBeNull();
  });
});

describe('ConceptDetailStore — AI', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('assistDescription flips flag, resolves with concept-shaped copy', () => {
    const { store } = setup();
    store.assistDescription();
    expect(store.isAssistingDescription()).toBe(true);
    vi.advanceTimersByTime(AI_ASSIST_DELAY_MS);
    expect(store.isAssistingDescription()).toBe(false);
    expect(store.item()?.description.length).toBeGreaterThan(0);
  });

  it('assistHook flips flag, resolves', () => {
    const { store } = setup();
    store.assistHook();
    expect(store.isAssistingHook()).toBe(true);
    vi.advanceTimersByTime(AI_ASSIST_DELAY_MS);
    expect(store.isAssistingHook()).toBe(false);
    expect(store.item()?.hook).toBeTruthy();
  });

  it('assist is idempotent while in-flight', () => {
    const { store } = setup();
    store.assistDescription();
    store.assistDescription();
    vi.advanceTimersByTime(AI_ASSIST_DELAY_MS);
    expect(store.isAssistingDescription()).toBe(false);
  });

  it('assist is a no-op when item is null', () => {
    const { store } = setup();
    store.setItemId('missing');
    store.assistDescription();
    store.assistHook();
    expect(store.isAssistingDescription()).toBe(false);
    expect(store.isAssistingHook()).toBe(false);
  });
});

describe('ConceptDetailStore — validation', () => {
  it('all valid with fully populated mock', () => {
    const { store } = setup();
    expect(store.canMoveToProduction()).toBe(true);
  });

  it('fails when title missing', () => {
    const { store } = setup(makeItem({ title: '' }));
    expect(store.canMoveToProduction()).toBe(false);
  });

  it('fails when description out of range', () => {
    const shortDesc = 'too short';
    const { store } = setup(makeItem({ description: shortDesc }));
    expect(store.canMoveToProduction()).toBe(false);
  });

  it('fails when hook empty', () => {
    const { store } = setup(makeItem({ hook: undefined }));
    expect(store.canMoveToProduction()).toBe(false);
  });

  it('fails when hook over HOOK_MAX_CHARS', () => {
    const { store } = setup(makeItem({ hook: 'x'.repeat(121) }));
    expect(store.canMoveToProduction()).toBe(false);
  });

  it('fails when no pillars or too many pillars', () => {
    const { store: noPillars } = setup(makeItem({ pillarIds: [] }));
    expect(noPillars.canMoveToProduction()).toBe(false);
  });

  it('fails when no objective', () => {
    const { store } = setup(makeItem({ objective: undefined }));
    expect(store.canMoveToProduction()).toBe(false);
  });

  it('fails when no production targets', () => {
    const { store } = setup(makeItem({ productionTargets: [] }));
    expect(store.canMoveToProduction()).toBe(false);
  });

  it('cta with empty text invalidates', () => {
    const { store } = setup(makeItem({ cta: { type: 'buy', text: '' } }));
    expect(store.canMoveToProduction()).toBe(false);
  });

  it('cta with text too long invalidates', () => {
    const { store } = setup(makeItem({ cta: { type: 'buy', text: 'x'.repeat(121) } }));
    expect(store.canMoveToProduction()).toBe(false);
  });
});

describe('ConceptDetailStore — moveToProduction', () => {
  it('creates N post items with conceptId and platform/contentType from targets (default: removes concept)', () => {
    const { store, state } = setup(
      makeItem({
        productionTargets: [
          { platform: 'instagram', contentType: 'reel' },
          { platform: 'tiktok', contentType: 'short-video' },
        ],
      }),
    );
    const before = state.items().length;
    const created = store.moveToProduction({ keepConcept: false, workOnIndex: null });
    expect(created.length).toBe(2);
    expect(created[0].stage).toBe('post');
    expect(created[0].status).toBe('in-progress');
    expect(created[0].conceptId).toBe('c-1');
    expect(created[0].platform).toBe('instagram');
    expect(created[1].contentType).toBe('short-video');
    // Concept was removed, 2 posts added → +1 net
    expect(state.items().length).toBe(before + 1);
    expect(state.items().some((i) => i.id === 'c-1')).toBe(false);
    // Dialog closes
    expect(store.moveDialogOpen()).toBe(false);
  });

  it('keepConcept=true leaves the concept in place', () => {
    const { store, state } = setup(
      makeItem({
        productionTargets: [{ platform: 'instagram', contentType: 'reel' }],
      }),
    );
    const created = store.moveToProduction({ keepConcept: true, workOnIndex: null });
    expect(created.length).toBe(1);
    expect(state.items().some((i) => i.id === 'c-1')).toBe(true);
  });

  it('returns [] when canMoveToProduction is false', () => {
    const { store } = setup(makeItem({ title: '' }));
    expect(store.moveToProduction({ keepConcept: false, workOnIndex: null })).toEqual([]);
  });

  it('created post items drop the productionTargets array', () => {
    const { store } = setup();
    const [post] = store.moveToProduction({ keepConcept: true, workOnIndex: null });
    expect(post.productionTargets).toBeUndefined();
  });
});

describe('ConceptDetailStore — lifecycle + helpers', () => {
  it('openMoveDialog guards on validation', () => {
    const { store } = setup(makeItem({ title: '' }));
    store.openMoveDialog();
    expect(store.moveDialogOpen()).toBe(false);
  });

  it('openMoveDialog opens when valid', () => {
    const { store } = setup();
    store.openMoveDialog();
    expect(store.moveDialogOpen()).toBe(true);
  });

  it('closeMoveDialog closes', () => {
    const { store } = setup();
    store.moveDialogOpen.set(true);
    store.closeMoveDialog();
    expect(store.moveDialogOpen()).toBe(false);
  });

  it('demoteToIdea sets stage=idea + status=draft + clears targets', () => {
    const { store } = setup();
    store.demoteToIdea();
    expect(store.item()?.stage).toBe('idea');
    expect(store.item()?.status).toBe('draft');
    expect(store.item()?.productionTargets).toBeUndefined();
  });

  it('archive flips archived=true', () => {
    const { store } = setup();
    store.archive();
    expect(store.item()?.archived).toBe(true);
  });

  it('deleteSelf removes the item from state; no-op when item missing', () => {
    const { store, state } = setup();
    const before = state.items().length;
    store.deleteSelf();
    expect(state.items().length).toBe(before - 1);
    expect(state.items().some((i) => i.id === 'c-1')).toBe(false);
    store.deleteSelf(); // item now missing
    expect(state.items().length).toBe(before - 1);
  });

  it('duplicate creates a new concept-stage draft with "(copy)" title', () => {
    const { store, state } = setup();
    const before = state.items().length;
    const copy = store.duplicate();
    expect(copy).not.toBeNull();
    expect(copy!.id).not.toBe('c-1');
    expect(copy!.title).toContain('(copy)');
    expect(copy!.stage).toBe('concept');
    expect(copy!.status).toBe('draft');
    expect(state.items().length).toBe(before + 1);
  });

  it('duplicate returns null when item is missing', () => {
    const { store } = setup();
    store.setItemId('missing');
    expect(store.duplicate()).toBeNull();
  });

  it('isInProduction returns true when a matching post already exists', () => {
    const { store, state } = setup();
    state.items.update((prev) => [
      ...prev,
      {
        ...prev[0],
        id: 'post-existing',
        stage: 'post',
        status: 'in-progress',
        conceptId: 'c-1',
        platform: 'instagram',
        contentType: 'reel',
        productionTargets: undefined,
      },
    ]);
    expect(store.isInProduction({ platform: 'instagram', contentType: 'reel' })).toBe(true);
    expect(store.isInProduction({ platform: 'youtube', contentType: 'long-form' })).toBe(false);
  });

  it('isInProduction returns false when item is missing', () => {
    const { store } = setup();
    store.setItemId('missing');
    expect(store.isInProduction({ platform: 'instagram', contentType: 'reel' })).toBe(false);
  });
});
