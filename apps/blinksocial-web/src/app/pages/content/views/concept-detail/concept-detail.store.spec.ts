import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { ConceptDetailStore } from './concept-detail.store';
import { ContentStateService } from '../../content-state.service';
import { provideContentItemsApiStubs } from '../../content-items-api.test-util';
import { AiAssistApiService } from '../../../../core/ai-assist/ai-assist.service';
import { ToastService } from '../../../../core/toast/toast.service';
import type {
  AudienceSegment,
  ContentItem,
  ContentPillar,
} from '../../content.types';
import type { AiAssistRequestContract } from '@blinksocial/contracts';

interface AiAssistStub {
  assist: ReturnType<typeof vi.fn>;
  next: (values: string[]) => void;
  error: () => void;
  calls: AiAssistRequestContract[];
}

function buildAiAssistStub(): AiAssistStub {
  const stub: AiAssistStub = {
    assist: vi.fn(),
    next: () => undefined,
    error: () => undefined,
    calls: [],
  };
  stub.assist.mockImplementation((req: AiAssistRequestContract) => {
    stub.calls.push(req);
    return of({ values: ['Generated value for ' + req.field] });
  });
  stub.next = (values: string[]) =>
    stub.assist.mockImplementation((req: AiAssistRequestContract) => {
      stub.calls.push(req);
      return of({ values });
    });
  stub.error = () =>
    stub.assist.mockImplementation((req: AiAssistRequestContract) => {
      stub.calls.push(req);
      return throwError(() => new Error('boom'));
    });
  return stub;
}

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
    status: 'new',
    title: 'Concept title',
    description: 'x'.repeat(80),
    pillarIds: ['p1', 'p2'],
    segmentIds: ['s1'],
    hook: 'A compelling hook',
    objective: 'engagement',
    targetPlatforms: [{ platform: 'instagram', contentType: 'reel' }],
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

function setup(item: ContentItem = makeItem()): {
  store: ConceptDetailStore;
  state: ContentStateService;
  ai: AiAssistStub;
  toastErrors: string[];
} {
  const ai = buildAiAssistStub();
  const toastErrors: string[] = [];
  const toastStub = { showError: (m: string) => toastErrors.push(m), showSuccess: () => undefined };
  TestBed.configureTestingModule({
    providers: [
      ...provideContentItemsApiStubs(),
      ContentStateService,
      ConceptDetailStore,
      { provide: AiAssistApiService, useValue: ai },
      { provide: ToastService, useValue: toastStub },
    ],
  });
  const state = TestBed.inject(ContentStateService);
  state.workspaceId.set('test-ws');
  state.setItems([item]);
  state.pillars.set(PILLARS);
  state.segments.set(SEGMENTS);
  const store = TestBed.inject(ConceptDetailStore);
  store.setItemId(item.id);
  return { store, state, ai, toastErrors };
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

  it('togglePillar adds and removes without an upper-bound cap', () => {
    const { store } = setup(makeItem({ pillarIds: [] }));
    store.togglePillar('p1');
    store.togglePillar('p2');
    store.togglePillar('p3');
    store.togglePillar('p4'); // no cap — accepted
    store.togglePillar('p5');
    expect(store.item()?.pillarIds).toEqual(['p1', 'p2', 'p3', 'p4', 'p5']);
    store.togglePillar('p2'); // removes
    expect(store.item()?.pillarIds).toEqual(['p1', 'p3', 'p4', 'p5']);
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
    const { store } = setup(makeItem({ targetPlatforms: [] }));
    store.toggleProductionTarget('instagram', 'reel');
    expect(store.item()?.targetPlatforms).toEqual([
      { platform: 'instagram', contentType: 'reel', postId: null },
    ]);
    store.toggleProductionTarget('tiktok', 'short-video');
    expect(store.item()?.targetPlatforms?.length).toBe(2);
    store.toggleProductionTarget('instagram', 'reel');
    expect(store.item()?.targetPlatforms).toEqual([
      { platform: 'tiktok', contentType: 'short-video', postId: null },
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
  it('assistDescription calls API and persists values[0] on success', () => {
    const { store, ai } = setup();
    ai.next(['Brand-shaped description.']);
    store.assistDescription();
    expect(ai.calls[0]).toMatchObject({
      scope: 'content-item',
      workspaceId: 'test-ws',
      refId: 'c-1',
      field: 'concept-description',
    });
    expect(store.isAssistingDescription()).toBe(false);
    expect(store.item()?.description).toBe('Brand-shaped description.');
  });

  it('assistHook calls API with concept-hook-angle and persists', () => {
    const { store, ai } = setup();
    ai.next(['Catchy hook here.']);
    store.assistHook();
    expect(ai.calls[0]).toMatchObject({ field: 'concept-hook-angle' });
    expect(store.isAssistingHook()).toBe(false);
    expect(store.item()?.hook).toBe('Catchy hook here.');
  });

  it('shows toast and leaves field unchanged on HTTP error', () => {
    const item = makeItem({ description: 'original-desc', hook: 'original-hook' });
    const { store, ai, toastErrors } = setup(item);
    ai.error();
    store.assistDescription();
    expect(toastErrors).toHaveLength(1);
    expect(toastErrors[0]).toMatch(/AI Assist failed/i);
    expect(store.isAssistingDescription()).toBe(false);
    expect(store.item()?.description).toBe('original-desc');
  });

  it('is idempotent while in-flight', () => {
    const { store, ai } = setup();
    // First call leaves the observable un-emitted to simulate in-flight state.
    let resolve: ((v: { values: string[] }) => void) | null = null;
    ai.assist.mockImplementationOnce(
      () =>
        new Observable<{ values: string[] }>((sub) => {
          resolve = (v) => {
            sub.next(v);
            sub.complete();
          };
          return () => undefined;
        }),
    );
    store.assistDescription();
    expect(store.isAssistingDescription()).toBe(true);
    store.assistDescription();
    expect(ai.assist).toHaveBeenCalledTimes(1);
    resolve!({ values: ['done'] });
    expect(store.isAssistingDescription()).toBe(false);
  });

  it('is a no-op when item is null', () => {
    const { store, ai } = setup();
    store.setItemId('missing');
    store.assistDescription();
    store.assistHook();
    expect(ai.assist).not.toHaveBeenCalled();
    expect(store.isAssistingDescription()).toBe(false);
    expect(store.isAssistingHook()).toBe(false);
  });

  it('is a no-op when workspaceId is empty', () => {
    const { store, state, ai } = setup();
    state.workspaceId.set('');
    store.assistDescription();
    expect(ai.assist).not.toHaveBeenCalled();
    expect(store.isAssistingDescription()).toBe(false);
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
    const { store } = setup(makeItem({ targetPlatforms: [] }));
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

  it('post-stage status `review` blocks Move to Production with a clear missing-validation reason', () => {
    const { store } = setup(makeItem({ status: 'review' }));
    expect(store.canMoveToProduction()).toBe(false);
    expect(store.missingValidations()).toContain('Status must be New');
  });

  it('D-24: status scheduled blocks Move to Production', () => {
    const { store } = setup(makeItem({ status: 'scheduled' }));
    expect(store.canMoveToProduction()).toBe(false);
  });

  it('D-24: status published blocks Move to Production', () => {
    const { store } = setup(makeItem({ status: 'published' }));
    expect(store.canMoveToProduction()).toBe(false);
  });

  it('status `new` keeps Move to Production available', () => {
    const { store } = setup(makeItem({ status: 'new' }));
    expect(store.canMoveToProduction()).toBe(true);
  });

  it('status `used` blocks Move to Production (already spawned a post)', () => {
    const { store } = setup(makeItem({ status: 'used' }));
    expect(store.canMoveToProduction()).toBe(false);
  });

  it('post status `in-progress` blocks Move to Production', () => {
    const { store } = setup(makeItem({ status: 'in-progress' }));
    expect(store.canMoveToProduction()).toBe(false);
  });
});

describe('ConceptDetailStore — moveToProduction', () => {
  it('creates N post items with conceptId + platform/contentType from targets; keeps the concept in place to preserve lineage', () => {
    const { store, state } = setup(
      makeItem({
        targetPlatforms: [
          { platform: 'instagram', contentType: 'reel' },
          { platform: 'tiktok', contentType: 'short-video' },
        ],
      }),
    );
    const before = state.items().length;
    const created = store.moveToProduction();
    expect(created.length).toBe(2);
    expect(created[0].stage).toBe('post');
    expect(created[0].status).toBe('in-progress');
    expect(created[0].conceptId).toBe('c-1');
    expect(created[0].platform).toBe('instagram');
    expect(created[1].contentType).toBe('short-video');
    // Concept is preserved, 2 posts added → +2 net
    expect(state.items().length).toBe(before + 2);
    expect(state.items().some((i) => i.id === 'c-1')).toBe(true);
    // Dialog closes
    expect(store.moveDialogOpen()).toBe(false);
  });

  it('flips the concept to `used` when moving to production; parent idea stays `used`', () => {
    const parentIdea: ContentItem = {
      id: 'i-1',
      stage: 'idea',
      status: 'used',
      title: 'Parent idea',
      description: '',
      pillarIds: [],
      segmentIds: [],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    const { store, state } = setup(
      makeItem({
        parentIdeaId: 'i-1',
        status: 'new',
        targetPlatforms: [{ platform: 'instagram', contentType: 'reel' }],
      }),
    );
    state.setItems([parentIdea, state.items().find((i) => i.id === 'c-1')!]);
    store.moveToProduction();
    expect(state.items().find((i) => i.id === 'c-1')?.status).toBe('used');
    expect(state.items().find((i) => i.id === 'i-1')?.status).toBe('used');
  });

  it('returns [] when canMoveToProduction is false', () => {
    const { store } = setup(makeItem({ title: '' }));
    expect(store.moveToProduction()).toEqual([]);
  });

  it('created post items drop the targetPlatforms array', () => {
    const { store } = setup();
    const [post] = store.moveToProduction();
    expect(post.targetPlatforms).toBeUndefined();
  });

  it('nests brief.strategy with keyMessage, cta, tonePreset when present', () => {
    const { store } = setup(
      makeItem({
        keyMessage: 'Hook them fast',
        tonePreset: 'friendly',
        cta: { type: 'follow', text: 'Follow us' },
      }),
    );
    const [post] = store.moveToProduction();
    const strategy = post.production?.brief?.strategy;
    expect(strategy?.keyMessage).toBe('Hook them fast');
    expect(strategy?.tonePreset).toBe('friendly');
    expect(strategy?.ctaType).toBe('follow');
    expect(strategy?.ctaText).toBe('Follow us');
    expect(post.production?.brief?.creativePlan?.hook).toBe(makeItem().hook);
    // D-30: empty sub-blocks are omitted from the brief rather than persisted as `{}`.
    expect(post.production?.brief?.compliance).toBeUndefined();
    expect(post.production?.brief?.platformRules).toBeUndefined();
  });

  it('nests brief.strategy minimally when optional fields are absent', () => {
    const { store } = setup(
      makeItem({
        keyMessage: undefined,
        tonePreset: undefined,
        cta: undefined,
        hook: 'Hook', // still need a hook for validation
      }),
    );
    const [post] = store.moveToProduction();
    const strategy = post.production?.brief?.strategy;
    expect(strategy?.keyMessage).toBeUndefined();
    expect(strategy?.tonePreset).toBeUndefined();
    expect(strategy?.ctaType).toBeUndefined();
    expect(strategy?.ctaText).toBeUndefined();
    expect(strategy?.objective).toBe('engagement');
  });

  it('back-fills targetPlatforms[*].postId with created post ids', () => {
    const { store } = setup(
      makeItem({
        targetPlatforms: [
          { platform: 'instagram', contentType: 'reel' },
          { platform: 'tiktok', contentType: 'short-video' },
        ],
      }),
    );
    const created = store.moveToProduction();
    const tps = store.item()?.targetPlatforms ?? [];
    expect(tps[0].postId).toBe(created[0].id);
    expect(tps[1].postId).toBe(created[1].id);
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

  it('demoteToIdea sets stage=idea + status=new + clears targets', () => {
    const { store } = setup();
    store.demoteToIdea();
    expect(store.item()?.stage).toBe('idea');
    expect(store.item()?.status).toBe('new');
    expect(store.item()?.targetPlatforms).toBeUndefined();
  });

  it('demoteToIdea flips the parent idea back to `new` when no sibling concepts remain', () => {
    const { store, state } = setup(makeItem({ parentIdeaId: 'i-1' }));
    state.setItems([
      {
        id: 'i-1',
        stage: 'idea',
        status: 'used',
        title: 'Parent idea',
        description: '',
        pillarIds: [],
        segmentIds: [],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      state.items().find((i) => i.id === 'c-1')!,
    ]);
    store.demoteToIdea();
    const idea = state.items().find((i) => i.id === 'i-1');
    expect(idea?.status).toBe('new');
  });

  it('demoteToIdea leaves the parent idea `used` when other sibling concepts still point at it', () => {
    const { store, state } = setup(makeItem({ parentIdeaId: 'i-1' }));
    state.setItems([
      {
        id: 'i-1',
        stage: 'idea',
        status: 'used',
        title: 'Parent idea',
        description: '',
        pillarIds: [],
        segmentIds: [],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'c-sibling',
        stage: 'concept',
        status: 'new',
        parentIdeaId: 'i-1',
        title: 'Sibling concept',
        description: '',
        pillarIds: [],
        segmentIds: [],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      state.items().find((i) => i.id === 'c-1')!,
    ]);
    store.demoteToIdea();
    const idea = state.items().find((i) => i.id === 'i-1');
    expect(idea?.status).toBe('used');
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

  it('duplicate creates a new concept-stage `new` item with "(copy)" title', () => {
    const { store, state } = setup();
    const before = state.items().length;
    const copy = store.duplicate();
    expect(copy).not.toBeNull();
    expect(copy!.id).not.toBe('c-1');
    expect(copy!.title).toContain('(copy)');
    expect(copy!.stage).toBe('concept');
    expect(copy!.status).toBe('new');
    expect(state.items().length).toBe(before + 1);
  });

  it('duplicate returns null when item is missing', () => {
    const { store } = setup();
    store.setItemId('missing');
    expect(store.duplicate()).toBeNull();
  });

  it('isInProduction returns true when a matching post already exists', () => {
    const { store, state } = setup();
    const prev = state.items();
    state.setItems([
      ...prev,
      {
        ...prev[0],
        id: 'post-existing',
        stage: 'post',
        status: 'in-progress',
        conceptId: 'c-1',
        platform: 'instagram',
        contentType: 'reel',
        targetPlatforms: undefined,
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

describe('ConceptDetailStore — strategy field setters (D-07)', () => {
  it('setKeyMessage trims and clears when empty', () => {
    const { store } = setup();
    store.setKeyMessage('  hello  ');
    expect(store.item()?.keyMessage).toBe('hello');
    store.setKeyMessage('   ');
    expect(store.item()?.keyMessage).toBeUndefined();
  });

  it('setAngle trims and clears when empty', () => {
    const { store } = setup();
    store.setAngle('  angle  ');
    expect(store.item()?.angle).toBe('angle');
    store.setAngle('');
    expect(store.item()?.angle).toBeUndefined();
  });

  it('setFormatNotes filters empty entries', () => {
    const { store } = setup();
    store.setFormatNotes(['b-roll', '  ', 'music']);
    expect(store.item()?.formatNotes).toEqual(['b-roll', 'music']);
  });

  it('setClaimsFlag toggles the boolean', () => {
    const { store } = setup();
    store.setClaimsFlag(true);
    expect(store.item()?.claimsFlag).toBe(true);
    store.setClaimsFlag(false);
    expect(store.item()?.claimsFlag).toBe(false);
  });

  it('setSourceLinks filters blanks', () => {
    const { store } = setup();
    store.setSourceLinks(['https://a', '', 'https://b']);
    expect(store.item()?.sourceLinks).toEqual(['https://a', 'https://b']);
  });

  it('setRiskLevel accepts level and undefined', () => {
    const { store } = setup();
    store.setRiskLevel('medium');
    expect(store.item()?.riskLevel).toBe('medium');
    store.setRiskLevel(undefined);
    expect(store.item()?.riskLevel).toBeUndefined();
  });

  it('setTargetPublishWindow stores both bounds and clears when both empty', () => {
    const { store } = setup();
    store.setTargetPublishWindow({ start: '2026-01-01', end: '2026-02-01' });
    expect(store.item()?.targetPublishWindow).toEqual({
      start: '2026-01-01',
      end: '2026-02-01',
    });
    store.setTargetPublishWindow({ start: undefined, end: undefined });
    expect(store.item()?.targetPublishWindow).toBeUndefined();
    store.setTargetPublishWindow(undefined);
    expect(store.item()?.targetPublishWindow).toBeUndefined();
  });

  it('missingValidations surfaces each failing gate', () => {
    const { store } = setup(makeItem({
      title: '',
      description: 'short',
      hook: '',
      pillarIds: [],
      objective: undefined,
      targetPlatforms: [],
      cta: { type: 'other', text: '' },
    }));
    const missing = store.missingValidations();
    expect(missing).toContain('Title');
    expect(missing).toContain('Description (50\u2013400 chars)');
    expect(missing).toContain('Hook');
    expect(missing).toContain('At least one pillar');
    expect(missing).toContain('Content goal');
    expect(missing).toContain('Production target');
    expect(missing).toContain('CTA text');
  });
});

describe('ConceptDetailStore \u2014 nullish-fallback branches', () => {
  it('descriptionInRange: handles missing description (?? 0 fallback)', () => {
    const { store } = setup(makeItem({ description: undefined as unknown as string }));
    expect(store.descriptionInRange()).toBe(false);
  });

  it('hookInRange: handles missing hook (?? "" fallback)', () => {
    const { store } = setup(makeItem({ hook: undefined }));
    expect(store.hookInRange()).toBe(false);
  });

  it('pillarsInRange: handles missing pillarIds (?? 0 fallback)', () => {
    const { store } = setup(makeItem({ pillarIds: undefined as unknown as string[] }));
    expect(store.pillarsInRange()).toBe(false);
  });

  it('hasTargets: handles missing targetPlatforms (?? 0 fallback)', () => {
    const { store } = setup(makeItem({ targetPlatforms: undefined }));
    expect(store.hasTargets()).toBe(false);
  });

  it('assistDescription: works when item has no objective', () => {
    const { store } = setup(
      makeItem({ objective: undefined, title: 'Test', description: 'd'.repeat(60) }),
    );
    store.assistDescription();
    expect(store.isAssistingDescription()).toBe(false);
  });

  it('assistHook: works when item has no objective', () => {
    const { store } = setup(makeItem({ objective: undefined, title: 'Test' }));
    store.assistHook();
    expect(store.isAssistingHook()).toBe(false);
  });
});
