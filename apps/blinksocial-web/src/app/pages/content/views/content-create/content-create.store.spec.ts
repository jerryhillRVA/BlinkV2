import { TestBed } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';
import type {
  AiAssistRequestContract,
  AiAssistResponseContract,
  ConceptDraftContract,
  ConceptDraftSnapshotContract,
  GenerateIdeasRequestContract,
  GenerateIdeasResponseContract,
} from '@blinksocial/contracts';
import { ContentCreateStore } from './content-create.store';
import { AiAssistApiService } from '../../../../core/ai-assist/ai-assist.service';
import { ConceptDraftApiService } from '../../../../core/concept-draft/concept-draft-api.service';
import { GeneratedIdeasApiService } from '../../../../core/generated-ideas/generated-ideas.service';
import { ToastService } from '../../../../core/toast/toast.service';
import type {
  AudienceSegment,
  ContentPillar,
  IdeaPayload,
  ConceptPayload,
  ProductionConceptPayload,
  BriefPayload,
} from '../../content.types';

const PILLARS: ContentPillar[] = [
  { id: 'p1', name: 'Pillar One', description: '', color: '#fff' },
  { id: 'p2', name: 'Pillar Two', description: '', color: '#fff' },
  { id: 'p3', name: 'Pillar Three', description: '', color: '#fff' },
  { id: 'p4', name: 'Pillar Four', description: '', color: '#fff' },
];
const SEGMENTS: AudienceSegment[] = [
  { id: 's1', name: 'Seg 1', description: '' },
  { id: 's2', name: 'Seg 2', description: '' },
  { id: 's3', name: 'Seg 3', description: '' },
];

interface SetupHandles {
  store: ContentCreateStore;
  api: { generate: ReturnType<typeof vi.fn> };
  aiAssist: { assist: ReturnType<typeof vi.fn> };
  conceptDraft: { generate: ReturnType<typeof vi.fn> };
  toast: { showError: ReturnType<typeof vi.fn>; showSuccess: ReturnType<typeof vi.fn> };
}

const STUB_DRAFT: ConceptDraftContract = {
  description: 'Generated description text.',
  hook: 'Generated hook line.',
  cta: { type: 'comment', text: 'Drop your thoughts in the comments below' },
  pillarIdFallback: 'p1',
  segmentIdsFallback: ['s1', 's2'],
};

function setup(workspaceId: string | null = 'w1'): ContentCreateStore {
  return setupWithHandles(workspaceId).store;
}

function setupWithHandles(workspaceId: string | null = 'w1'): SetupHandles {
  const api = {
    generate: vi.fn().mockReturnValue(
      of<GenerateIdeasResponseContract>({
        ideas: new Array(6).fill(0).map((_, i) => ({
          id: `gi-${i}`,
          title: `title ${i}`,
          rationale: `rationale ${i}`,
          pillarId: i % 2 === 0 ? 'p1' : 'p2',
        })),
      }),
    ),
  };
  const aiAssist = {
    assist: vi.fn().mockReturnValue(of<AiAssistResponseContract>({ values: ['stub'] })),
  };
  const conceptDraft = {
    generate: vi.fn().mockReturnValue(of<ConceptDraftContract>(STUB_DRAFT)),
  };
  const toast = { showError: vi.fn(), showSuccess: vi.fn() };
  TestBed.configureTestingModule({
    providers: [
      ContentCreateStore,
      { provide: GeneratedIdeasApiService, useValue: api },
      { provide: AiAssistApiService, useValue: aiAssist },
      { provide: ConceptDraftApiService, useValue: conceptDraft },
      { provide: ToastService, useValue: toast },
    ],
  });
  const store = TestBed.inject(ContentCreateStore);
  store.setContext(PILLARS, SEGMENTS);
  store.setWorkspaceId(workspaceId);
  return { store, api, aiAssist, conceptDraft, toast };
}

describe('ContentCreateStore — basic mutations', () => {
  it('patch merges partial state', () => {
    const store = setup();
    store.patch({ title: 'hi' });
    expect(store.state().title).toBe('hi');
    expect(store.state().type).toBe('idea'); // untouched
  });

  it('reset returns to initial state', () => {
    const store = setup();
    store.patch({ title: 'x', description: 'y', pillarIds: ['p1'] });
    store.reset();
    expect(store.state().title).toBe('');
    expect(store.state().description).toBe('');
    expect(store.state().pillarIds).toEqual([]);
  });

  it('setType preserves title/description/pillars', () => {
    const store = setup();
    store.patch({ title: 'hi', description: 'd', pillarIds: ['p1'] });
    store.setType('concept');
    expect(store.state().type).toBe('concept');
    expect(store.state().title).toBe('hi');
    expect(store.state().description).toBe('d');
    expect(store.state().pillarIds).toEqual(['p1']);
  });

  it('setIdeaMode clears generated ideas state', () => {
    const store = setup();
    store.patch({
      generatedIdeas: [
        { id: 'i1', title: 't', rationale: 'r', pillarId: 'p1' },
      ],
      selectedGeneratedIds: ['i1'],
    });
    store.setIdeaMode('manual');
    expect(store.state().generatedIdeas).toEqual([]);
    expect(store.state().selectedGeneratedIds).toEqual([]);
  });

  it('togglePillar adds then removes, enforcing max 3', () => {
    const store = setup();
    store.togglePillar('p1');
    store.togglePillar('p2');
    store.togglePillar('p3');
    store.togglePillar('p4');
    expect(store.state().pillarIds).toEqual(['p1', 'p2', 'p3']); // max 3
    store.togglePillar('p2');
    expect(store.state().pillarIds).toEqual(['p1', 'p3']);
  });

  it('setPlatform clears contentType', () => {
    const store = setup();
    store.patch({ platform: 'instagram', contentType: 'reel' });
    store.setPlatform('youtube');
    expect(store.state().platform).toBe('youtube');
    expect(store.state().contentType).toBe('');
  });
});

describe('ContentCreateStore — idea validation', () => {
  it('ideaValid false when title empty', () => {
    const store = setup();
    expect(store.ideaValid()).toBe(false);
  });

  it('ideaValid true when title non-empty', () => {
    const store = setup();
    store.patch({ title: 'x' });
    expect(store.ideaValid()).toBe(true);
  });

  it('canSave reflects idea validity in manual mode', () => {
    const store = setup();
    store.patch({ title: 'x' });
    expect(store.canSave()).toBe(true);
  });

  it('canSave in generate mode requires at least 1 selected idea', () => {
    const store = setup();
    store.setIdeaMode('generate');
    expect(store.canSave()).toBe(false);
    store.patch({ selectedGeneratedIds: ['g1'] });
    expect(store.canSave()).toBe(true);
  });

  it('canSave for concept delegates to conceptValid when not in production mode', () => {
    const store = setup();
    store.setType('concept');
    expect(store.canSave()).toBe(false); // nothing filled in yet
    store.patch({
      title: 'T',
      description: 'x'.repeat(60),
      pillarIds: ['p1'],
      hook: 'h',
      objective: 'engagement',
    });
    expect(store.canSave()).toBe(true);
  });

  it('canSave for concept delegates to productionValid when in production mode', () => {
    const store = setup();
    store.setType('concept');
    store.patch({
      title: 'T',
      description: 'x'.repeat(60),
      pillarIds: ['p1'],
      hook: 'h',
      objective: 'engagement',
      isProductionMode: true,
    });
    // Not yet production-valid: platform/contentType/segments missing
    expect(store.canSave()).toBe(false);
    store.patch({ platform: 'instagram', contentType: 'reel', segmentIds: ['s1'] });
    expect(store.canSave()).toBe(true);
  });

  it('canMoveToProduction mirrors productionValid', () => {
    const store = setup();
    store.setType('concept');
    expect(store.canMoveToProduction()).toBe(false);
    store.patch({
      title: 'T',
      description: 'x'.repeat(60),
      pillarIds: ['p1'],
      hook: 'h',
      objective: 'engagement',
      platform: 'instagram',
      contentType: 'reel',
      segmentIds: ['s1'],
    });
    expect(store.canMoveToProduction()).toBe(true);
  });

  it('canDraftAssets mirrors briefValid', () => {
    const store = setup();
    store.setType('production-brief');
    expect(store.canDraftAssets()).toBe(false);
    store.patch({
      title: 'T',
      platform: 'instagram',
      contentType: 'reel',
      objective: 'engagement',
      keyMessage: 'msg',
      segmentIds: ['s1'],
    });
    expect(store.canDraftAssets()).toBe(true);
  });
});

describe('ContentCreateStore — concept validation boundaries', () => {
  function validConcept(store: ContentCreateStore) {
    store.setType('concept');
    store.patch({
      title: 'T',
      description: 'x'.repeat(60),
      pillarIds: ['p1'],
      hook: 'a hook',
      objective: 'engagement',
    });
  }

  it('description below 50 chars fails', () => {
    const store = setup();
    validConcept(store);
    store.patch({ description: 'x'.repeat(49) });
    expect(store.conceptValid()).toBe(false);
  });

  it('description at 50 chars passes', () => {
    const store = setup();
    validConcept(store);
    store.patch({ description: 'x'.repeat(50) });
    expect(store.conceptValid()).toBe(true);
  });

  it('description at 400 chars passes', () => {
    const store = setup();
    validConcept(store);
    store.patch({ description: 'x'.repeat(400) });
    expect(store.conceptValid()).toBe(true);
  });

  it('description above 400 chars fails', () => {
    const store = setup();
    validConcept(store);
    store.patch({ description: 'x'.repeat(401) });
    expect(store.conceptValid()).toBe(false);
  });

  it('zero pillars fails', () => {
    const store = setup();
    validConcept(store);
    store.patch({ pillarIds: [] });
    expect(store.conceptValid()).toBe(false);
  });

  it('one pillar passes', () => {
    const store = setup();
    validConcept(store);
    expect(store.conceptValid()).toBe(true);
  });

  it('empty hook fails', () => {
    const store = setup();
    validConcept(store);
    store.patch({ hook: '' });
    expect(store.conceptValid()).toBe(false);
  });

  it('hook over 120 chars fails', () => {
    const store = setup();
    validConcept(store);
    store.patch({ hook: 'x'.repeat(121) });
    expect(store.conceptValid()).toBe(false);
  });

  it('missing objective fails', () => {
    const store = setup();
    validConcept(store);
    store.patch({ objective: '' });
    expect(store.conceptValid()).toBe(false);
  });

  it('cta type selected without text fails', () => {
    const store = setup();
    validConcept(store);
    store.patch({ ctaType: 'buy', ctaText: '   ' });
    expect(store.conceptValid()).toBe(false);
  });

  it('cta text exceeding max fails', () => {
    const store = setup();
    validConcept(store);
    store.patch({ ctaType: 'buy', ctaText: 'x'.repeat(121) });
    expect(store.conceptValid()).toBe(false);
  });

  it('productionValid requires platform + contentType + ≥1 segment', () => {
    const store = setup();
    validConcept(store);
    expect(store.productionValid()).toBe(false);
    store.patch({ platform: 'instagram', contentType: 'reel', segmentIds: ['s1'] });
    expect(store.productionValid()).toBe(true);
  });

  it('productionValid false when platform = tbd', () => {
    const store = setup();
    validConcept(store);
    store.patch({ platform: 'tbd', contentType: 'reel', segmentIds: ['s1'] });
    expect(store.productionValid()).toBe(false);
  });
});

describe('ContentCreateStore — brief validation', () => {
  function validBrief(store: ContentCreateStore) {
    store.setType('production-brief');
    store.patch({
      title: 'T',
      platform: 'instagram',
      contentType: 'reel',
      objective: 'engagement',
      keyMessage: 'Buy our thing',
      segmentIds: ['s1'],
    });
  }

  it('full valid brief passes', () => {
    const store = setup();
    validBrief(store);
    expect(store.briefValid()).toBe(true);
  });

  it('keyMessage over 140 chars fails', () => {
    const store = setup();
    validBrief(store);
    store.patch({ keyMessage: 'x'.repeat(141) });
    expect(store.briefValid()).toBe(false);
  });

  it('empty keyMessage fails', () => {
    const store = setup();
    validBrief(store);
    store.patch({ keyMessage: '' });
    expect(store.briefValid()).toBe(false);
  });

  it('no audience segments fails', () => {
    const store = setup();
    validBrief(store);
    store.patch({ segmentIds: [] });
    expect(store.briefValid()).toBe(false);
  });

  it('platform=tbd fails', () => {
    const store = setup();
    validBrief(store);
    store.patch({ platform: 'tbd' });
    expect(store.briefValid()).toBe(false);
  });
});

describe('ContentCreateStore — generateConcept', () => {
  it('no-ops without title', () => {
    const { store, conceptDraft } = setupWithHandles();
    store.patch({ objective: 'engagement' });
    store.generateConcept();
    expect(conceptDraft.generate).not.toHaveBeenCalled();
    expect(store.state().isGeneratingConcept).toBe(false);
  });

  it('no-ops without objective', () => {
    const { store, conceptDraft } = setupWithHandles();
    store.patch({ title: 'X' });
    store.generateConcept();
    expect(conceptDraft.generate).not.toHaveBeenCalled();
    expect(store.state().isGeneratingConcept).toBe(false);
  });

  it('no-ops when a request is already in-flight (concurrency guard)', () => {
    const { store, conceptDraft } = setupWithHandles();
    conceptDraft.generate.mockReturnValue(new Subject<ConceptDraftContract>());
    store.patch({ title: 'X', objective: 'engagement' });
    store.generateConcept();
    expect(store.state().isGeneratingConcept).toBe(true);
    store.generateConcept();
    expect(conceptDraft.generate).toHaveBeenCalledTimes(1);
  });

  it('no-ops when workspaceId is null', () => {
    const { store, conceptDraft } = setupWithHandles(null);
    store.patch({ title: 'X', objective: 'engagement' });
    store.generateConcept();
    expect(conceptDraft.generate).not.toHaveBeenCalled();
    expect(store.state().isGeneratingConcept).toBe(false);
  });

  it('POSTs the draft snapshot and applies all returned fields on success', () => {
    const { store, conceptDraft } = setupWithHandles();
    store.setType('concept');
    store.patch({
      title: 'Why teams need rituals',
      objective: 'engagement',
      pillarIds: [],
      segmentIds: [],
    });
    store.generateConcept();
    expect(conceptDraft.generate).toHaveBeenCalledWith('w1', {
      title: 'Why teams need rituals',
      objective: 'engagement',
      pillarIds: [],
      segmentIds: [],
    } satisfies ConceptDraftSnapshotContract);
    expect(store.state().description).toBe(STUB_DRAFT.description);
    expect(store.state().hook).toBe(STUB_DRAFT.hook);
    expect(store.state().ctaType).toBe('comment');
    expect(store.state().ctaText).toBe('Drop your thoughts in the comments below');
    expect(store.state().pillarIds).toEqual(['p1']);
    expect(store.state().segmentIds).toEqual(['s1', 's2']);
    expect(store.state().isGeneratingConcept).toBe(false);
    expect(store.state().conceptAiGenerated).toBe(true);
    expect(store.state().conceptFilledByAI).toBe(true);
  });

  it('does not patch cta fields when response cta is null', () => {
    const { store, conceptDraft } = setupWithHandles();
    conceptDraft.generate.mockReturnValue(
      of<ConceptDraftContract>({ ...STUB_DRAFT, cta: null }),
    );
    store.setType('concept');
    store.patch({
      title: 'T',
      objective: 'community',
      ctaType: 'follow',
      ctaText: 'follow me',
    });
    store.generateConcept();
    expect(store.state().ctaType).toBe('follow');
    expect(store.state().ctaText).toBe('follow me');
  });

  it('preserves user-selected pillar chips when response pillarIdFallback is null', () => {
    const { store, conceptDraft } = setupWithHandles();
    conceptDraft.generate.mockReturnValue(
      of<ConceptDraftContract>({
        ...STUB_DRAFT,
        pillarIdFallback: null,
        segmentIdsFallback: [],
      }),
    );
    store.setType('concept');
    store.patch({
      title: 'T',
      objective: 'engagement',
      pillarIds: ['p2'],
      segmentIds: ['s3'],
    });
    store.generateConcept();
    expect(store.state().pillarIds).toEqual(['p2']);
    expect(store.state().segmentIds).toEqual(['s3']);
  });

  it('shows toast and clears spinner on HTTP error, leaving form fields unchanged', () => {
    const { store, conceptDraft, toast } = setupWithHandles();
    conceptDraft.generate.mockReturnValue(throwError(() => new Error('502')));
    store.setType('concept');
    store.patch({
      title: 'T',
      objective: 'engagement',
      description: 'original-desc',
      hook: 'original-hook',
      pillarIds: ['p2'],
      segmentIds: ['s3'],
      ctaType: 'follow',
      ctaText: 'original-cta',
    });
    store.generateConcept();
    expect(toast.showError).toHaveBeenCalledWith('AI Assist failed. Please try again.');
    expect(store.state().isGeneratingConcept).toBe(false);
    expect(store.state().description).toBe('original-desc');
    expect(store.state().hook).toBe('original-hook');
    expect(store.state().pillarIds).toEqual(['p2']);
    expect(store.state().segmentIds).toEqual(['s3']);
    expect(store.state().ctaType).toBe('follow');
    expect(store.state().ctaText).toBe('original-cta');
  });
});

describe('ContentCreateStore — generateIdeas', () => {
  it('generateIdeas no-op without focus pillars', () => {
    const { store, api } = setupWithHandles();
    store.generateIdeas();
    expect(store.state().isGeneratingIdeas).toBe(false);
    expect(api.generate).not.toHaveBeenCalled();
  });

  it('generateIdeas no-op when workspaceId is null', () => {
    const { store, api } = setupWithHandles(null);
    store.patch({ generatePillarIds: ['p1', 'p2'] });
    store.generateIdeas();
    expect(store.state().isGeneratingIdeas).toBe(false);
    expect(api.generate).not.toHaveBeenCalled();
  });

  it('generateIdeas posts to the API and populates 6 cards on success', () => {
    const { store, api } = setupWithHandles();
    store.patch({ generatePillarIds: ['p1', 'p2'] });
    store.generateIdeas();
    expect(api.generate).toHaveBeenCalledWith({
      workspaceId: 'w1',
      pillarIds: ['p1', 'p2'],
    } satisfies GenerateIdeasRequestContract);
    expect(store.state().generatedIdeas).toHaveLength(6);
    expect(store.state().isGeneratingIdeas).toBe(false);
  });

  it('generateIdeas clears generatedIdeas and selectedGeneratedIds before the call', () => {
    const { store } = setupWithHandles();
    store.patch({
      generatedIdeas: [{ id: 'old', title: 'x', rationale: 'y', pillarId: 'p1' }],
      selectedGeneratedIds: ['old'],
      generatePillarIds: ['p1'],
    });
    store.generateIdeas();
    expect(store.state().selectedGeneratedIds).toEqual([]);
    // generatedIdeas is repopulated by the mock response, but the old
    // entry is gone.
    expect(store.state().generatedIdeas.some((i) => i.id === 'old')).toBe(false);
  });

  it('generateIdeas shows toast and clears flag on HTTP error', () => {
    const { store, api, toast } = setupWithHandles();
    api.generate.mockReturnValue(throwError(() => new Error('502')));
    store.patch({ generatePillarIds: ['p1'] });
    store.generateIdeas();
    expect(store.state().isGeneratingIdeas).toBe(false);
    expect(store.state().generatedIdeas).toEqual([]);
    expect(toast.showError).toHaveBeenCalledWith(
      'AI generation failed. Please try again in a moment.',
    );
  });

  it('generateIdeas double-click guard: second call while in-flight is a no-op', () => {
    const { store, api } = setupWithHandles();
    // Non-emitting observable keeps the store in the "in-flight" state.
    let calls = 0;
    api.generate.mockImplementation(() => {
      calls++;
      return new Observable<GenerateIdeasResponseContract>(() => undefined);
    });
    store.patch({ generatePillarIds: ['p1'] });
    store.generateIdeas();
    expect(store.state().isGeneratingIdeas).toBe(true);
    store.generateIdeas();
    expect(calls).toBe(1);
  });
});

describe('ContentCreateStore — assistDescription / assistHook (real API)', () => {
  it('assistDescription posts draft snapshot with description length bounds and applies returned value', () => {
    const { store, aiAssist } = setupWithHandles();
    aiAssist.assist.mockReturnValue(of({ values: ['Generated description.'] }));
    store.patch({
      title: 'Morning mobility flow',
      objective: 'engagement',
      pillarIds: ['p1'],
      segmentIds: ['s1'],
    });
    store.assistDescription();
    expect(aiAssist.assist).toHaveBeenCalledWith({
      scope: 'draft',
      workspaceId: 'w1',
      field: 'concept-description',
      length: { min: 50, max: 400 },
      draft: {
        title: 'Morning mobility flow',
        description: undefined,
        hook: undefined,
        objective: 'engagement',
        pillarIds: ['p1'],
        segmentIds: ['s1'],
      },
    } satisfies AiAssistRequestContract);
    expect(store.state().description).toBe('Generated description.');
    expect(store.state().isAssistingDescription).toBe(false);
  });

  it('assistHook posts draft snapshot with hook max length and applies returned value', () => {
    const { store, aiAssist } = setupWithHandles();
    aiAssist.assist.mockReturnValue(of({ values: ['Catchy hook.'] }));
    store.patch({ title: 'X', objective: 'leads' });
    store.assistHook();
    const callArg = aiAssist.assist.mock.calls[0][0];
    expect(callArg.scope).toBe('draft');
    expect(callArg.field).toBe('concept-hook-angle');
    expect(callArg.length).toEqual({ max: 120 });
    expect(store.state().hook).toBe('Catchy hook.');
    expect(store.state().isAssistingHook).toBe(false);
  });

  it('is a no-op when workspaceId is unset', () => {
    const { store, aiAssist } = setupWithHandles(null);
    store.patch({ title: 'X' });
    store.assistDescription();
    expect(aiAssist.assist).not.toHaveBeenCalled();
    expect(store.state().isAssistingDescription).toBe(false);
  });

  it('is a no-op when title is empty / whitespace', () => {
    const { store, aiAssist } = setupWithHandles();
    store.patch({ title: '   ' });
    store.assistDescription();
    expect(aiAssist.assist).not.toHaveBeenCalled();
    expect(store.state().isAssistingDescription).toBe(false);
  });

  it('double-click guard: second call while in-flight is a no-op', () => {
    const { store, aiAssist } = setupWithHandles();
    aiAssist.assist.mockReturnValue(new Subject<AiAssistResponseContract>());
    store.patch({ title: 'X' });
    store.assistDescription();
    expect(store.state().isAssistingDescription).toBe(true);
    store.assistDescription();
    expect(aiAssist.assist).toHaveBeenCalledTimes(1);
  });

  it('error path shows toast and clears loading flag', () => {
    const { store, aiAssist, toast } = setupWithHandles();
    aiAssist.assist.mockReturnValue(throwError(() => new Error('boom')));
    store.patch({ title: 'X' });
    store.assistDescription();
    expect(toast.showError).toHaveBeenCalledWith('AI Assist failed. Please try again.');
    expect(store.state().isAssistingDescription).toBe(false);
  });

  it('empty / whitespace returned value does not overwrite the field; loading clears', () => {
    const { store, aiAssist } = setupWithHandles();
    aiAssist.assist.mockReturnValue(of({ values: ['   '] }));
    store.patch({ title: 'X', description: 'existing' });
    store.assistDescription();
    expect(store.state().description).toBe('existing');
    expect(store.state().isAssistingDescription).toBe(false);
  });
});

describe('ContentCreateStore — payload builders', () => {
  it('builds an IdeaPayload with trimmed inputs ready for buildContentItem', () => {
    const store = setup();
    store.patch({ title: ' T ', description: ' D ', pillarIds: ['p1'] });
    const payload = store.buildIdeaPayload() satisfies IdeaPayload;
    expect(payload.kind).toBe('idea');
    expect(payload.pillarIds).toEqual(['p1']);
  });

  it('buildConceptPayload returns concept when not production mode', () => {
    const store = setup();
    store.setType('concept');
    store.patch({
      title: 'T',
      description: 'd',
      pillarIds: ['p1'],
      hook: 'h',
      objective: 'engagement',
      ctaType: 'buy',
      ctaText: 'x',
    });
    const payload = store.buildConceptPayload();
    expect(payload.kind).toBe('concept');
    expect(payload.cta).toEqual({ type: 'buy', text: 'x' });
  });

  it('buildConceptPayload returns production shape when in production mode', () => {
    const store = setup();
    store.setType('concept');
    store.patch({
      title: 'T',
      description: 'd',
      pillarIds: ['p1'],
      hook: 'h',
      objective: 'engagement',
      platform: 'instagram',
      contentType: 'reel',
      isProductionMode: true,
    });
    const payload = store.buildConceptPayload() as ProductionConceptPayload;
    expect(payload.kind).toBe('production');
    expect(payload.platform).toBe('instagram');
    expect(payload.contentType).toBe('reel');
  });

  it('buildBriefPayload assembles brief fields', () => {
    const store = setup();
    store.setType('production-brief');
    store.patch({
      title: 'T',
      platform: 'tiktok',
      contentType: 'short-video',
      objective: 'awareness',
      keyMessage: 'msg',
      tonePreset: 'friendly',
      segmentIds: ['s1'],
    });
    const payload = store.buildBriefPayload() satisfies BriefPayload;
    expect(payload.kind).toBe('brief');
    expect(payload.tonePreset).toBe('friendly');
  });

  it('buildGeneratedIdeaPayloads filters to selected only', () => {
    const store = setup();
    store.patch({
      generatedIdeas: [
        { id: 'a', title: 'A', rationale: 'ra', pillarId: 'p1' },
        { id: 'b', title: 'B', rationale: 'rb', pillarId: 'p2' },
      ],
      selectedGeneratedIds: ['b'],
    });
    const payloads = store.buildGeneratedIdeaPayloads();
    expect(payloads).toHaveLength(1);
    expect(payloads[0].title).toBe('B');
    expect(payloads[0].pillarIds).toEqual(['p2']);
  });

  it('buildPayloadForCurrentMode returns array for generate mode', () => {
    const store = setup();
    store.setIdeaMode('generate');
    store.patch({
      generatedIdeas: [{ id: 'a', title: 'A', rationale: 'r', pillarId: 'p1' }],
      selectedGeneratedIds: ['a'],
    });
    const result = store.buildPayloadForCurrentMode();
    expect(Array.isArray(result)).toBe(true);
  });

  it('buildPayloadForCurrentMode returns concept payload', () => {
    const store = setup();
    store.setType('concept');
    const result = store.buildPayloadForCurrentMode() as ConceptPayload;
    expect(result.kind).toBe('concept');
  });

  it('buildPayloadForCurrentMode returns brief payload for production-brief type', () => {
    const store = setup();
    store.setType('production-brief');
    const result = store.buildPayloadForCurrentMode() as BriefPayload;
    expect(result.kind).toBe('brief');
  });
});
