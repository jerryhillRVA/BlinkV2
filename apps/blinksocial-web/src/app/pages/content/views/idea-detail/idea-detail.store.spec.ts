import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { IdeaDetailStore } from './idea-detail.store';
import { ContentStateService } from '../../content-state.service';
import { provideContentItemsApiStubs } from '../../content-items-api.test-util';
import { IdeaConceptOptionsApiService } from '../../../../core/idea-concept-options/idea-concept-options.service';
import { ToastService } from '../../../../core/toast/toast.service';
import type {
  AudienceSegment,
  ContentItem,
  ContentPillar,
} from '../../content.types';
import type { ConceptOption } from './idea-detail.types';
import type { IdeaConceptOptionsResponseContract } from '@blinksocial/contracts';

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
    status: 'new',
    title: 'Original title',
    description: 'Original description',
    pillarIds: [],
    segmentIds: [],
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

function makeOption(i: number, overrides: Partial<ConceptOption> = {}): ConceptOption {
  return {
    id: `opt-${i}`,
    angle: `Angle ${i}`,
    description: `Description ${i}`,
    objectiveAlignment: `Alignment ${i}`,
    objective: 'awareness',
    pillarIds: i % 2 === 0 ? ['p1'] : ['p2'],
    segmentIds: ['s1'],
    targetPlatforms: [{ platform: 'instagram', contentType: 'reel', postId: null }],
    cta: { type: 'comment', text: `CTA ${i}` },
    suggestedFormatLabel: 'Reel',
    ...overrides,
  };
}

function sixOptions(): ConceptOption[] {
  return Array.from({ length: 6 }, (_, i) => makeOption(i));
}

interface SetupResult {
  store: IdeaDetailStore;
  state: ContentStateService;
  api: { generate: ReturnType<typeof vi.fn> };
  toast: { showError: ReturnType<typeof vi.fn>; show: ReturnType<typeof vi.fn> };
}

function setup(item: ContentItem): SetupResult {
  const api = { generate: vi.fn().mockReturnValue(of({ options: sixOptions() })) };
  const toast = { showError: vi.fn(), show: vi.fn() };
  TestBed.configureTestingModule({
    providers: [
      ...provideContentItemsApiStubs(),
      ContentStateService,
      IdeaDetailStore,
      { provide: IdeaConceptOptionsApiService, useValue: api },
      { provide: ToastService, useValue: toast },
    ],
  });
  const state = TestBed.inject(ContentStateService);
  state.workspaceId.set('hive-collective');
  state.setItems([item]);
  state.pillars.set(PILLARS);
  state.segments.set(SEGMENTS);
  const store = TestBed.inject(IdeaDetailStore);
  store.setItemId(item.id);
  return { store, state, api, toast };
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

  it('togglePillar adds and removes without an upper-bound cap', () => {
    const { store } = setup(makeItem());
    store.togglePillar('p1');
    store.togglePillar('p2');
    store.togglePillar('p3');
    store.togglePillar('p4'); // no cap — accepted
    store.togglePillar('p5'); // and a 5th
    expect(store.item()?.pillarIds).toEqual(['p1', 'p2', 'p3', 'p4', 'p5']);
    // Toggling an existing one removes it (unchanged behavior).
    store.togglePillar('p2');
    expect(store.item()?.pillarIds).toEqual(['p1', 'p3', 'p4', 'p5']);
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
  it('generateOptions calls the API and persists 6 returned options', () => {
    const { store, api } = setup(makeItem());
    store.generateOptions();
    expect(api.generate).toHaveBeenCalledWith({
      workspaceId: 'hive-collective',
      refId: 'c-1',
    });
    expect(store.isGeneratingOptions()).toBe(false);
    expect(store.conceptOptions()?.length).toBe(6);
  });

  it('flips isGeneratingOptions true → false around the call', () => {
    const { store, api } = setup(makeItem());
    const subject = new Subject<IdeaConceptOptionsResponseContract>();
    api.generate.mockReturnValue(subject.asObservable());
    store.generateOptions();
    expect(store.isGeneratingOptions()).toBe(true);
    subject.next({ options: sixOptions() });
    subject.complete();
    expect(store.isGeneratingOptions()).toBe(false);
    expect(store.conceptOptions()?.length).toBe(6);
  });

  it('is idempotent while a generation is in flight', () => {
    const { store, api } = setup(makeItem());
    const subject = new Subject<IdeaConceptOptionsResponseContract>();
    api.generate.mockReturnValue(subject.asObservable());
    store.generateOptions();
    store.generateOptions(); // second click ignored
    expect(api.generate).toHaveBeenCalledTimes(1);
    subject.next({ options: sixOptions() });
    subject.complete();
  });

  it('does nothing when the item is unresolvable', () => {
    const { store, api } = setup(makeItem());
    store.setItemId('missing');
    store.generateOptions();
    expect(api.generate).not.toHaveBeenCalled();
    expect(store.isGeneratingOptions()).toBe(false);
  });

  it('does nothing when workspaceId is empty', () => {
    const { store, state, api } = setup(makeItem());
    state.workspaceId.set('');
    store.generateOptions();
    expect(api.generate).not.toHaveBeenCalled();
  });

  it('on error shows a toast, leaves panel empty, and clears the loading flag', () => {
    const { store, api, toast } = setup(makeItem());
    api.generate.mockReturnValue(throwError(() => new Error('502 boom')));
    store.generateOptions();
    expect(store.conceptOptions()).toBeNull();
    expect(store.isGeneratingOptions()).toBe(false);
    expect(toast.showError).toHaveBeenCalledTimes(1);
  });

  it('regenerate clears state and triggers a second API call', () => {
    const { store, api } = setup(makeItem());
    store.generateOptions();
    expect(store.conceptOptions()?.length).toBe(6);
    store.regenerate();
    expect(api.generate).toHaveBeenCalledTimes(2);
    expect(store.conceptOptions()?.length).toBe(6);
  });

  it('regenerate is a no-op when a call is already in flight', () => {
    const { store, api } = setup(makeItem());
    const subject = new Subject<IdeaConceptOptionsResponseContract>();
    api.generate.mockReturnValue(subject.asObservable());
    store.generateOptions();
    store.regenerate();
    expect(api.generate).toHaveBeenCalledTimes(1);
    subject.next({ options: sixOptions() });
    subject.complete();
  });

  it('selectOption toggles and selectedOption computes the matching card', () => {
    const { store } = setup(makeItem());
    store.generateOptions();
    const firstId = store.conceptOptions()![0].id;
    store.selectOption(firstId);
    expect(store.selectedOptionId()).toBe(firstId);
    expect(store.selectedOption()?.id).toBe(firstId);
    store.selectOption(firstId); // second click clears
    expect(store.selectedOptionId()).toBeNull();
  });
});

describe('IdeaDetailStore — advanceToConcept', () => {
  it('without a selected option, creates a new concept linked to the idea via parentIdeaId; idea itself stays as idea and flips to `used` while the new concept is `new`', () => {
    const { store } = setup(makeItem());
    const save$ = store.advanceToConcept();
    expect(save$).not.toBeNull();
    let concept: ContentItem | undefined;
    save$!.subscribe((saved) => (concept = saved));
    expect(concept).toBeDefined();
    expect(concept!.stage).toBe('concept');
    expect(concept!.status).toBe('new');
    expect(concept!.parentIdeaId).toBe('c-1');
    // Parent idea stays an idea but is locally flipped to `used` so the
    // pipeline reacts before the server's authoritative flip lands.
    expect(store.item()?.stage).toBe('idea');
    expect(store.item()?.status).toBe('used');
  });

  it('with a selected option, new concept merges hook/description/cta/objective + targetPlatforms from the option', () => {
    const { store } = setup(makeItem({ pillarIds: ['p1'] }));
    store.generateOptions();
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

  it('advancing to concept merges idea + option pillars without an upper-bound cap', () => {
    const { store } = setup(makeItem({ pillarIds: ['p1', 'p2', 'p3'] }));
    store.generateOptions();
    const opt = store.conceptOptions()![0];
    store.selectOption(opt.id);
    let concept!: ContentItem;
    store.advanceToConcept()!.subscribe((saved) => (concept = saved));
    // Union of idea pillars and option pillars (deduped, no slice).
    const union = Array.from(new Set([...['p1', 'p2', 'p3'], ...opt.pillarIds]));
    expect(concept.pillarIds).toEqual(union);
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

describe('IdeaDetailStore — tags', () => {
  it('setTags trims, filters blanks, and dedupes', () => {
    const { store } = setup(makeItem());
    store.setTags(['  one ', 'two', '', 'one']);
    expect(store.item()?.tags).toEqual(['one', 'two']);
  });
});

describe('IdeaDetailStore — archive + duplicate', () => {
  it('archive sets archived=true', () => {
    const { store } = setup(makeItem());
    store.archive();
    expect(store.item()?.archived).toBe(true);
  });

  it('duplicate creates a new `new` idea with "(copy)" title', () => {
    const { store, state } = setup(makeItem());
    const before = state.items().length;
    const copy = store.duplicate();
    expect(copy).not.toBeNull();
    expect(copy!.id).not.toBe('c-1');
    expect(copy!.title).toContain('(copy)');
    expect(copy!.stage).toBe('idea');
    expect(copy!.status).toBe('new');
    expect(copy!.archived).toBe(false);
    expect(state.items().length).toBe(before + 1);
  });

  it('duplicate on missing item returns null', () => {
    const { store } = setup(makeItem());
    store.setItemId('missing');
    expect(store.duplicate()).toBeNull();
  });
});
