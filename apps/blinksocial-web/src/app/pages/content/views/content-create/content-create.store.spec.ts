import { TestBed } from '@angular/core/testing';
import { ContentCreateStore } from './content-create.store';
import type {
  AudienceSegment,
  ContentPillar,
  IdeaPayload,
  ConceptPayload,
  ProductionConceptPayload,
  BriefPayload,
} from '../../content.types';
import {
  AI_ASSIST_DELAY_MS,
  AI_SIMULATION_DELAY_MS,
} from '../../content.constants';

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

function setup(): ContentCreateStore {
  TestBed.configureTestingModule({ providers: [ContentCreateStore] });
  const store = TestBed.inject(ContentCreateStore);
  store.setContext(PILLARS, SEGMENTS);
  return store;
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

describe('ContentCreateStore — AI actions (fake timers)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('generateConcept no-op without title + objective', () => {
    const store = setup();
    store.generateConcept();
    expect(store.state().isGeneratingConcept).toBe(false);
  });

  it('generateConcept flips flag then resolves with description + hook', () => {
    const store = setup();
    store.setType('concept');
    store.patch({ title: 'T', objective: 'awareness' });
    store.generateConcept();
    expect(store.state().isGeneratingConcept).toBe(true);
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(store.state().isGeneratingConcept).toBe(false);
    expect(store.state().description.length).toBeGreaterThan(0);
    expect(store.state().hook.length).toBeGreaterThan(0);
    expect(store.state().conceptAiGenerated).toBe(true);
    expect(store.state().conceptFilledByAI).toBe(true);
  });

  it('generateConcept fallback-fills pillars and segments when empty', () => {
    const store = setup();
    store.setType('concept');
    store.patch({ title: 'T', objective: 'awareness' });
    store.generateConcept();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(store.state().pillarIds).toEqual(['p1']);
    expect(store.state().segmentIds).toEqual(['s1', 's2']);
  });

  it('assistDescription flips flag and resolves', () => {
    const store = setup();
    store.patch({ title: 'Hello', objective: 'trust' });
    store.assistDescription();
    expect(store.state().isAssistingDescription).toBe(true);
    vi.advanceTimersByTime(AI_ASSIST_DELAY_MS);
    expect(store.state().isAssistingDescription).toBe(false);
    expect(store.state().description).toContain('Hello');
  });

  it('assistHook flips flag and resolves', () => {
    const store = setup();
    store.patch({ title: 'Hi', objective: 'leads' });
    store.assistHook();
    expect(store.state().isAssistingHook).toBe(true);
    vi.advanceTimersByTime(AI_ASSIST_DELAY_MS);
    expect(store.state().isAssistingHook).toBe(false);
    expect(store.state().hook).toContain('Hi');
  });

  it('generateIdeas no-op without focus pillars', () => {
    const store = setup();
    store.generateIdeas();
    expect(store.state().isGeneratingIdeas).toBe(false);
  });

  it('generateIdeas populates 6 cards', () => {
    const store = setup();
    store.patch({ generatePillarIds: ['p1', 'p2'] });
    store.generateIdeas();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(store.state().generatedIdeas).toHaveLength(6);
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
