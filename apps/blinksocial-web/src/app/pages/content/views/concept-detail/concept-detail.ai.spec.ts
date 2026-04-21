import { assistDescriptionFor, assistHookFor } from './concept-detail.ai';
import type { ContentObjective } from '../../content.types';

const PRIMARY: ContentObjective[] = [
  'awareness',
  'engagement',
  'trust',
  'leads',
  'conversion',
];

describe('assistDescriptionFor', () => {
  it('includes the title reference when provided', () => {
    expect(assistDescriptionFor('Breathwork series', 'awareness')).toContain(
      'Breathwork series',
    );
  });

  it('truncates long titles at 30 chars + ellipsis', () => {
    const long = 'x'.repeat(50);
    expect(assistDescriptionFor(long, 'engagement')).toContain(`${'x'.repeat(30)}…`);
  });

  it('falls back to "this concept" for empty title', () => {
    expect(assistDescriptionFor('   ', 'trust')).toContain('this concept');
  });

  it('falls back to awareness copy for empty objective', () => {
    const empty = assistDescriptionFor('Hello', '');
    const aware = assistDescriptionFor('Hello', 'awareness');
    expect(empty).toEqual(aware);
  });

  PRIMARY.forEach((objective) => {
    it(`produces non-empty copy for ${objective}`, () => {
      expect(assistDescriptionFor('Topic', objective).length).toBeGreaterThan(0);
    });
  });

  it('covers non-primary objectives (community, education, lead-gen, traffic, sales, recruiting)', () => {
    (
      ['community', 'education', 'lead-gen', 'traffic', 'sales', 'recruiting'] as ContentObjective[]
    ).forEach((o) => {
      expect(assistDescriptionFor('Topic', o).length).toBeGreaterThan(0);
    });
  });
});

describe('assistHookFor', () => {
  it('includes title reference', () => {
    expect(assistHookFor('Title', 'leads')).toContain('Title');
  });

  it('produces distinct copy per objective', () => {
    const a = assistHookFor('x', 'awareness');
    const b = assistHookFor('x', 'conversion');
    expect(a).not.toEqual(b);
  });

  it('falls back to awareness for empty objective', () => {
    const empty = assistHookFor('x', '');
    const aware = assistHookFor('x', 'awareness');
    expect(empty).toEqual(aware);
  });

  PRIMARY.forEach((objective) => {
    it(`produces non-empty hook for ${objective}`, () => {
      expect(assistHookFor('Topic', objective).length).toBeGreaterThan(0);
    });
  });
});
