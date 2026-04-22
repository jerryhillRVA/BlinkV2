import { TestBed } from '@angular/core/testing';
import { IdeaDetailStore } from './idea-detail.store';
import { ContentStateService } from '../../content-state.service';
import { provideContentItemsApiStubs } from '../../content-items-api.test-util';
import { AI_SIMULATION_DELAY_MS } from '../../content.constants';
import type {
  AudienceSegment,
  ContentItem,
  ContentPillar,
} from '../../content.types';
import type { ConceptOption } from './idea-detail.types';

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
    stage: 'idea',
    status: 'draft',
    title: 'Original title',
    description: 'Original description',
    pillarIds: [],
    segmentIds: [],
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

function setup(item: ContentItem): { store: IdeaDetailStore; state: ContentStateService } {
  TestBed.configureTestingModule({ providers: [...provideContentItemsApiStubs(), ContentStateService, IdeaDetailStore] });
  const state = TestBed.inject(ContentStateService);
  state.setItems([item]);
  state.pillars.set(PILLARS);
  state.segments.set(SEGMENTS);
  const store = TestBed.inject(IdeaDetailStore);
  store.setItemId(item.id);
  return { store, state };
}

describe('IdeaDetailStore — item resolution', () => {
  it('resolves item from ContentStateService by id', () => {
    const { store } = setup(makeItem());
    expect(store.item()?.id).toBe('c-1');
  });

  it('returns null when itemId does not match', () => {
    const { store } = setup(makeItem());
    store.setItemId('does-not-exist');
    expect(store.item()).toBeNull();
  });

  it('setItemId resets transient AI state', () => {
    const { store } = setup(makeItem());
    store.conceptOptions.set([{ id: 'o1' } as ConceptOption]);
    store.selectedOptionId.set('o1');
    store.isGeneratingOptions.set(true);
    store.setItemId('c-1');
    expect(store.conceptOptions()).toBeNull();
    expect(store.selectedOptionId()).toBeNull();
    expect(store.isGeneratingOptions()).toBe(false);
  });
});

describe('IdeaDetailStore — field mutations', () => {
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

  it('updateDescription writes verbatim (whitespace preserved)', () => {
    const { store } = setup(makeItem());
    store.updateDescription('  multi\nline  ');
    expect(store.item()?.description).toBe('  multi\nline  ');
  });

  it('updateHook trims; empty string clears the hook', () => {
    const { store } = setup(makeItem({ hook: 'Prior' }));
    store.updateHook('  ');
    expect(store.item()?.hook).toBeUndefined();
    store.updateHook('  Catchy  ');
    expect(store.item()?.hook).toBe('Catchy');
  });

  it('togglePillar adds, removes, and enforces MAX_PILLARS_PER_ITEM', () => {
    const { store } = setup(makeItem());
    store.togglePillar('p1');
    store.togglePillar('p2');
    store.togglePillar('p3');
    store.togglePillar('p4'); // at limit — blocked
    expect(store.item()?.pillarIds).toEqual(['p1', 'p2', 'p3']);
    store.togglePillar('p2'); // remove → opens slot
    expect(store.item()?.pillarIds).toEqual(['p1', 'p3']);
    store.togglePillar('p4');
    expect(store.item()?.pillarIds).toEqual(['p1', 'p3', 'p4']);
  });

  it('toggleSegment toggles', () => {
    const { store } = setup(makeItem());
    store.toggleSegment('s1');
    expect(store.item()?.segmentIds).toEqual(['s1']);
    store.toggleSegment('s1');
    expect(store.item()?.segmentIds).toEqual([]);
  });

  it('setObjectiveId persists value and clears via undefined', () => {
    const { store } = setup(makeItem());
    store.setObjectiveId('obj-1');
    expect(store.item()?.objectiveId).toBe('obj-1');
    store.setObjectiveId(undefined);
    expect(store.item()?.objectiveId).toBeUndefined();
  });

  it('setSourceUrl trims; empty string clears', () => {
    const { store } = setup(makeItem());
    store.setSourceUrl('https://example.com  ');
    expect(store.item()?.sourceUrl).toBe('https://example.com');
    store.setSourceUrl('');
    expect(store.item()?.sourceUrl).toBeUndefined();
  });

  it('setScheduledAt persists or clears via null', () => {
    const { store } = setup(makeItem());
    store.setScheduledAt('2026-05-01T10:00:00Z');
    expect(store.item()?.scheduledAt).toBe('2026-05-01T10:00:00Z');
    store.setScheduledAt(null);
    expect(store.item()?.scheduledAt).toBeUndefined();
  });

  it('mutations on a missing item are no-ops', () => {
    const { store } = setup(makeItem());
    store.setItemId('missing');
    store.updateTitle('ignored');
    store.togglePillar('p1');
    store.toggleSegment('s1');
    expect(store.item()).toBeNull();
  });
});

describe('IdeaDetailStore — AI flow', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('generateOptions flips loading flag, resolves with 6 options', () => {
    const { store } = setup(makeItem());
    store.generateOptions();
    expect(store.isGeneratingOptions()).toBe(true);
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(store.isGeneratingOptions()).toBe(false);
    expect(store.conceptOptions()?.length).toBe(6);
  });

  it('generateOptions is idempotent while in flight', () => {
    const { store } = setup(makeItem());
    store.generateOptions();
    store.generateOptions(); // ignored — still one in-flight
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(store.conceptOptions()?.length).toBe(6);
  });

  it('regenerate resets and re-triggers', () => {
    const { store } = setup(makeItem());
    store.generateOptions();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    const first = store.conceptOptions();
    store.regenerate();
    expect(store.conceptOptions()).toBeNull();
    expect(store.isGeneratingOptions()).toBe(true);
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(store.conceptOptions()?.length).toBe(6);
    expect(store.conceptOptions()).not.toBe(first); // new array
  });

  it('selectOption toggles and selectedOption computes the matching card', () => {
    const { store } = setup(makeItem());
    store.generateOptions();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    const firstId = store.conceptOptions()![0].id;
    store.selectOption(firstId);
    expect(store.selectedOptionId()).toBe(firstId);
    expect(store.selectedOption()?.id).toBe(firstId);
    store.selectOption(firstId); // second click clears
    expect(store.selectedOptionId()).toBeNull();
  });
});

describe('IdeaDetailStore — advanceToConcept', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('without a selected option, creates a new concept linked to the idea via parentIdeaId; idea itself stays as idea', () => {
    const { store } = setup(makeItem());
    const save$ = store.advanceToConcept();
    expect(save$).not.toBeNull();
    let concept: ContentItem | undefined;
    save$!.subscribe((saved) => (concept = saved));
    expect(concept).toBeDefined();
    expect(concept!.stage).toBe('concept');
    expect(concept!.status).toBe('draft');
    expect(concept!.parentIdeaId).toBe('c-1');
    // the original idea remains an idea
    expect(store.item()?.stage).toBe('idea');
  });

  it('with a selected option, new concept merges hook/description/cta/objective + targetPlatforms from the option', () => {
    const { store } = setup(makeItem({ pillarIds: ['p1'] }));
    store.generateOptions();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    const opt = store.conceptOptions()![0];
    store.selectOption(opt.id);
    let concept!: ContentItem;
    store.advanceToConcept()!.subscribe((saved) => (concept = saved));
    expect(concept.stage).toBe('concept');
    expect(concept.parentIdeaId).toBe('c-1');
    expect(concept.hook).toBe(opt.angle);
    expect(concept.description).toBe(opt.description);
    expect(concept.cta).toEqual(opt.cta);
    expect(concept.objective).toBe(opt.objective);
    expect(concept.targetPlatforms?.length).toBe(opt.targetPlatforms.length);
    if (opt.targetPlatforms[0]) {
      expect(concept.platform).toBe(opt.targetPlatforms[0].platform);
      expect(concept.contentType).toBe(opt.targetPlatforms[0].contentType);
    }
  });

  it('merging pillars respects MAX_PILLARS_PER_ITEM', () => {
    const { store } = setup(makeItem({ pillarIds: ['p1', 'p2', 'p3'] }));
    store.generateOptions();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    const opt = store.conceptOptions()![0];
    store.selectOption(opt.id);
    let concept!: ContentItem;
    store.advanceToConcept()!.subscribe((saved) => (concept = saved));
    expect(concept.pillarIds.length).toBeLessThanOrEqual(3);
  });

  it('returns the server-assigned id (not the optimistic client id) to callers', () => {
    const { store } = setup(makeItem());
    let saved: ContentItem | undefined;
    store.advanceToConcept()!.subscribe((v) => (saved = v));
    // The stubbed API assigns `c-test-<rand>` on create — proves we routed
    // through the server path and did NOT surface the client-generated id.
    expect(saved?.id).toMatch(/^c-test-/);
  });
});

describe('IdeaDetailStore — defensive fallbacks', () => {
  it('selectedOption returns null when selectedOptionId does not match any option', () => {
    const { store } = setup(makeItem());
    store.conceptOptions.set([{ id: 'real' } as ConceptOption]);
    store.selectedOptionId.set('missing');
    expect(store.selectedOption()).toBeNull();
  });
});

describe('IdeaDetailStore — tags + status', () => {
  it('setTags trims, filters blanks, and dedupes', () => {
    const { store } = setup(makeItem());
    store.setTags(['  one ', 'two', '', 'one']);
    expect(store.item()?.tags).toEqual(['one', 'two']);
  });

  it('setStatus persists the new status', () => {
    const { store } = setup(makeItem());
    store.setStatus('scheduled');
    expect(store.item()?.status).toBe('scheduled');
  });
});

describe('IdeaDetailStore — archive + duplicate', () => {
  it('archive sets archived=true', () => {
    const { store } = setup(makeItem());
    store.archive();
    expect(store.item()?.archived).toBe(true);
  });

  it('duplicate creates a new draft idea with "(copy)" title', () => {
    const { store, state } = setup(makeItem());
    const before = state.items().length;
    const copy = store.duplicate();
    expect(copy).not.toBeNull();
    expect(copy!.id).not.toBe('c-1');
    expect(copy!.title).toContain('(copy)');
    expect(copy!.stage).toBe('idea');
    expect(copy!.status).toBe('draft');
    expect(copy!.archived).toBe(false);
    expect(state.items().length).toBe(before + 1);
  });

  it('duplicate on missing item returns null', () => {
    const { store } = setup(makeItem());
    store.setItemId('missing');
    expect(store.duplicate()).toBeNull();
  });
});
