import { buildStubIdeas } from './stubs';

describe('buildStubIdeas', () => {
  let counter: number;
  const idFactory = (): string => {
    counter += 1;
    return `gi-stub-${counter}`;
  };

  beforeEach(() => {
    counter = 0;
  });

  it('returns 6 ideas all pinned to the single pillar', () => {
    const ideas = buildStubIdeas(['p-1'], idFactory);
    expect(ideas).toHaveLength(6);
    for (const idea of ideas) {
      expect(idea.pillarId).toBe('p-1');
      expect(idea.title.length).toBeGreaterThan(0);
      expect(idea.rationale.length).toBeGreaterThan(0);
      expect(idea.id).toMatch(/^gi-stub-/);
    }
  });

  it('distributes 6 ideas round-robin across 2 pillars', () => {
    const ideas = buildStubIdeas(['p-1', 'p-2'], idFactory);
    expect(ideas.map((i) => i.pillarId)).toEqual([
      'p-1',
      'p-2',
      'p-1',
      'p-2',
      'p-1',
      'p-2',
    ]);
  });

  it('distributes 6 ideas evenly across 3 pillars', () => {
    const ideas = buildStubIdeas(['a', 'b', 'c'], idFactory);
    expect(ideas.map((i) => i.pillarId)).toEqual(['a', 'b', 'c', 'a', 'b', 'c']);
  });

  it('returns empty array when no pillarIds are provided', () => {
    expect(buildStubIdeas([], idFactory)).toEqual([]);
  });

  it('assigns unique ids via the factory', () => {
    const ideas = buildStubIdeas(['p-1'], idFactory);
    const ids = new Set(ideas.map((i) => i.id));
    expect(ids.size).toBe(6);
  });
});
