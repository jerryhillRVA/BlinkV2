import { generateConceptOptions } from './idea-detail.ai';
import type { AudienceSegment, ContentPillar } from '../../content.types';

const PILLARS: ContentPillar[] = [
  { id: 'p1', name: 'P1', description: '', color: '#111' },
  { id: 'p2', name: 'P2', description: '', color: '#222' },
  { id: 'p3', name: 'P3', description: '', color: '#333' },
];
const SEGMENTS: AudienceSegment[] = [
  { id: 's1', name: 'S1', description: '' },
  { id: 's2', name: 'S2', description: '' },
];

describe('generateConceptOptions', () => {
  it('returns exactly 6 options', () => {
    expect(generateConceptOptions(PILLARS, SEGMENTS)).toHaveLength(6);
  });

  it('assigns unique ids with the opt- prefix', () => {
    const opts = generateConceptOptions(PILLARS, SEGMENTS);
    const ids = new Set(opts.map((o) => o.id));
    expect(ids.size).toBe(opts.length);
    opts.forEach((o) => expect(o.id).toMatch(/^opt-/));
  });

  it('populates angle, description, objective, cta on every option', () => {
    const opts = generateConceptOptions(PILLARS, SEGMENTS);
    for (const o of opts) {
      expect(o.angle.length).toBeGreaterThan(0);
      expect(o.description.length).toBeGreaterThan(0);
      expect(o.objective.length).toBeGreaterThan(0);
      expect(o.cta.text.length).toBeGreaterThan(0);
    }
  });

  it('rotates through provided pillars (round-robin pairs)', () => {
    const opts = generateConceptOptions(PILLARS, SEGMENTS);
    expect(opts[0].pillarIds).toEqual(['p1', 'p2']);
    expect(opts[1].pillarIds).toEqual(['p2', 'p3']);
    expect(opts[2].pillarIds).toEqual(['p3', 'p1']);
  });

  it('picks one segment per option, round-robin', () => {
    const opts = generateConceptOptions(PILLARS, SEGMENTS);
    expect(opts[0].segmentIds).toEqual(['s1']);
    expect(opts[1].segmentIds).toEqual(['s2']);
    expect(opts[2].segmentIds).toEqual(['s1']);
  });

  it('returns empty pillar/segment arrays when none provided', () => {
    const opts = generateConceptOptions([], []);
    for (const o of opts) {
      expect(o.pillarIds).toEqual([]);
      expect(o.segmentIds).toEqual([]);
    }
  });

  it('single-pillar input still produces one-item pillar arrays', () => {
    const opts = generateConceptOptions([PILLARS[0]], SEGMENTS);
    for (const o of opts) {
      expect(o.pillarIds).toEqual(['p1']);
    }
  });

  it('every option carries at least one production target', () => {
    const opts = generateConceptOptions(PILLARS, SEGMENTS);
    for (const o of opts) {
      expect(o.targetPlatforms.length).toBeGreaterThan(0);
    }
  });
});
