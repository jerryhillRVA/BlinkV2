import { generateConceptFromObjective } from './content-create.ai';
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

