import {
  assistDescriptionFor,
  assistHookFor,
  generateConceptFromObjective,
  seedGeneratedIdeas,
} from './content-create.ai';
import type { AudienceSegment, ContentObjective } from '../../content.types';

const PILLARS = [{ id: 'p1' }, { id: 'p2' }];
const SEGMENTS: AudienceSegment[] = [
  { id: 's1', name: 'A', description: '' },
  { id: 's2', name: 'B', description: '' },
  { id: 's3', name: 'C', description: '' },
];

describe('generateConceptFromObjective', () => {
  const primaryKeys: ContentObjective[] = ['awareness', 'engagement', 'trust', 'leads', 'conversion'];

  primaryKeys.forEach((objective) => {
    it(`produces description + hook + cta for ${objective}`, () => {
      const result = generateConceptFromObjective(objective, [], PILLARS, SEGMENTS, []);
      expect(result.description.length).toBeGreaterThan(0);
      expect(result.hook.length).toBeGreaterThan(0);
      expect(result.cta).toBeDefined();
    });
  });

  it('falls back to first pillar when none selected', () => {
    const result = generateConceptFromObjective('awareness', [], PILLARS, SEGMENTS, []);
    expect(result.pillarIdFallback).toBe('p1');
  });

  it('does not fall back when pillars already selected', () => {
    const result = generateConceptFromObjective('awareness', ['p2'], PILLARS, SEGMENTS, []);
    expect(result.pillarIdFallback).toBeNull();
  });

  it('falls back to first 2 segments when none selected', () => {
    const result = generateConceptFromObjective('awareness', [], PILLARS, SEGMENTS, []);
    expect(result.segmentIdsFallback).toEqual(['s1', 's2']);
  });

  it('does not fall back to segments when some selected', () => {
    const result = generateConceptFromObjective('awareness', [], PILLARS, SEGMENTS, ['s3']);
    expect(result.segmentIdsFallback).toEqual([]);
  });

  it('handles objective without CTA mapping (leaves cta undefined)', () => {
    const result = generateConceptFromObjective('community', [], PILLARS, SEGMENTS, []);
    expect(result.cta).toBeUndefined();
    expect(result.description.length).toBeGreaterThan(0);
  });
});

describe('assistDescriptionFor', () => {
  it('includes the title reference when title provided', () => {
    expect(assistDescriptionFor('My Post', 'awareness')).toContain('My Post');
  });

  it('truncates long titles at 30 chars + ellipsis', () => {
    const long = 'x'.repeat(50);
    expect(assistDescriptionFor(long, 'engagement')).toContain(`${'x'.repeat(30)}…`);
  });

  it('falls back to "this topic" for empty title', () => {
    expect(assistDescriptionFor('   ', 'trust')).toContain('this topic');
  });

  it('falls back to awareness copy for empty objective', () => {
    const empty = assistDescriptionFor('Hello', '');
    const aware = assistDescriptionFor('Hello', 'awareness');
    expect(empty).toEqual(aware);
  });
});

describe('assistHookFor', () => {
  it('includes title reference', () => {
    expect(assistHookFor('Title', 'leads')).toContain('Title');
  });

  it('varies copy per objective', () => {
    const a = assistHookFor('x', 'awareness');
    const b = assistHookFor('x', 'conversion');
    expect(a).not.toEqual(b);
  });
});

describe('seedGeneratedIdeas', () => {
  it('returns empty when no pillars provided', () => {
    expect(seedGeneratedIdeas([])).toEqual([]);
  });

  it('returns 6 ideas round-robined across pillars', () => {
    const ideas = seedGeneratedIdeas(['p1', 'p2']);
    expect(ideas).toHaveLength(6);
    expect(ideas[0].pillarId).toBe('p1');
    expect(ideas[1].pillarId).toBe('p2');
    expect(ideas[2].pillarId).toBe('p1');
  });

  it('generates unique ids for each idea', () => {
    const ideas = seedGeneratedIdeas(['p1']);
    const ids = new Set(ideas.map((i) => i.id));
    expect(ids.size).toBe(ideas.length);
  });
});
