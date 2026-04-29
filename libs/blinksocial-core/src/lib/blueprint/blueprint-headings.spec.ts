import * as fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';
import { renderBlueprintMarkdown } from './render-blueprint-markdown.js';
import { buildSampleBlueprint } from './sample-blueprint.js';

/**
 * Regression test for ticket #71 AC #4:
 *
 *   "A regression test compares the rendered Blueprint markdown's
 *    subsection headings against a canonical fixture derived from
 *    blueprint-template.md and fails if any are missing."
 *
 * We extract every `###` (and `####`) heading from the canonical
 * `blueprint-template.md` and assert each one appears in the rendered
 * output of `buildSampleBlueprint()` via the shared serializer. If anyone
 * adds a new heading to the template without wiring it through the schema
 * + contract + serializer, this test catches it.
 *
 * The top-level `## …` headings in the template are descriptive names
 * (e.g. "## Section Guidance", "## Output Requirements") used to organise
 * the *guidance* itself, so they're filtered out — only `###`/`####` (the
 * actual subsection headings the rendered Blueprint must surface) are
 * matched against the rendered output.
 */
describe('blueprint-template.md heading coverage', () => {
  const here = path.dirname(url.fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(
      here,
      '../../../../../apps/blinksocial-api/src/skills/definitions/onboarding-consultant/templates/blueprint-template.md',
    ),
    path.resolve(
      process.cwd(),
      'apps/blinksocial-api/src/skills/definitions/onboarding-consultant/templates/blueprint-template.md',
    ),
  ];
  const templatePath = candidates.find((p) => fs.existsSync(p));

  it('finds the canonical template on disk', () => {
    expect(templatePath, `searched: ${candidates.join(', ')}`).toBeDefined();
  });

  it('every ### / #### heading in the template appears in the rendered output', () => {
    if (!templatePath) return; // earlier test will have failed already
    const template = fs.readFileSync(templatePath, 'utf-8');
    const md = renderBlueprintMarkdown(buildSampleBlueprint());

    // Match `### …` or `#### …` lines (3 or 4 hashes), normalize trailing
    // whitespace. Skip H2 (template-level guidance) and H1.
    const headings = [...template.matchAll(/^(#{3,4})\s+(.+?)\s*$/gm)].map(
      (m) => m[2].trim(),
    );

    expect(headings.length, 'expected at least one ### heading in the template').toBeGreaterThan(
      0,
    );

    const missing: string[] = [];
    for (const h of headings) {
      // The template currently uses both styles; rendered output strips
      // any backtick formatting from headings, so compare on plain text.
      const renderedHeading = h.replace(/`/g, '');
      if (!md.includes(renderedHeading)) {
        missing.push(h);
      }
    }
    expect(missing, `template headings absent from rendered output:\n  ${missing.join('\n  ')}`).toEqual(
      [],
    );
  });
});
