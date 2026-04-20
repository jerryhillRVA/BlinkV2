import { buildContentItem, generateId, toggleArrayItem } from './content.utils';
import type {
  BriefPayload,
  ConceptPayload,
  IdeaPayload,
  ProductionConceptPayload,
} from './content.types';

describe('generateId', () => {
  it('prefixes the id with the given string', () => {
    expect(generateId('c')).toMatch(/^c-/);
  });

  it('produces unique ids on successive calls', () => {
    const a = generateId('c');
    const b = generateId('c');
    expect(a).not.toEqual(b);
  });
});

describe('toggleArrayItem', () => {
  it('adds an item that is not present', () => {
    expect(toggleArrayItem(['a'], 'b')).toEqual(['a', 'b']);
  });

  it('removes an item that is present', () => {
    expect(toggleArrayItem(['a', 'b'], 'b')).toEqual(['a']);
  });

  it('does not mutate the input', () => {
    const input = ['a'];
    toggleArrayItem(input, 'b');
    expect(input).toEqual(['a']);
  });
});

describe('buildContentItem', () => {
  const basePayload = {
    title: '  Title  ',
    description: '  Description  ',
    pillarIds: ['p1'],
    segmentIds: ['s1'],
  };

  it('builds an Idea item with stage=idea and status=draft', () => {
    const payload: IdeaPayload = { kind: 'idea', ...basePayload };
    const item = buildContentItem(payload);
    expect(item.stage).toBe('idea');
    expect(item.status).toBe('draft');
    expect(item.title).toBe('Title');
    expect(item.description).toBe('Description');
    expect(item.pillarIds).toEqual(['p1']);
    expect(item.segmentIds).toEqual(['s1']);
    expect(item.id).toMatch(/^c-/);
    expect(item.createdAt).toEqual(item.updatedAt);
  });

  it('builds a Concept item with stage=concept, status=draft, hook + objective', () => {
    const payload: ConceptPayload = {
      kind: 'concept',
      ...basePayload,
      hook: 'a hook',
      objective: 'engagement',
      platform: 'instagram',
      contentType: 'reel',
      cta: { type: 'learn-more', text: '  click here  ' },
    };
    const item = buildContentItem(payload);
    expect(item.stage).toBe('concept');
    expect(item.status).toBe('draft');
    expect(item.hook).toBe('a hook');
    expect(item.objective).toBe('engagement');
    expect(item.platform).toBe('instagram');
    expect(item.contentType).toBe('reel');
    expect(item.cta).toEqual({ type: 'learn-more', text: 'click here' });
  });

  it('omits optional concept fields when not provided', () => {
    const payload: ConceptPayload = {
      kind: 'concept',
      ...basePayload,
      hook: 'h',
      objective: 'awareness',
    };
    const item = buildContentItem(payload);
    expect(item.platform).toBeUndefined();
    expect(item.contentType).toBeUndefined();
    expect(item.cta).toBeUndefined();
  });

  it('builds a Production concept item with stage=concept, status=in-progress, required platform + contentType', () => {
    const payload: ProductionConceptPayload = {
      kind: 'production',
      ...basePayload,
      hook: 'hook',
      objective: 'conversion',
      platform: 'youtube',
      contentType: 'short-video',
    };
    const item = buildContentItem(payload);
    expect(item.stage).toBe('concept');
    expect(item.status).toBe('in-progress');
    expect(item.platform).toBe('youtube');
    expect(item.contentType).toBe('short-video');
  });

  it('builds a Brief item with stage=production-brief and status=in-progress', () => {
    const payload: BriefPayload = {
      kind: 'brief',
      ...basePayload,
      platform: 'tiktok',
      contentType: 'short-video',
      objective: 'engagement',
      keyMessage: '  key msg  ',
      tonePreset: 'friendly',
      cta: { type: 'subscribe', text: 'Sub' },
    };
    const item = buildContentItem(payload);
    expect(item.stage).toBe('production-brief');
    expect(item.status).toBe('in-progress');
    expect(item.keyMessage).toBe('key msg');
    expect(item.tonePreset).toBe('friendly');
    expect(item.cta).toEqual({ type: 'subscribe', text: 'Sub' });
  });
});
