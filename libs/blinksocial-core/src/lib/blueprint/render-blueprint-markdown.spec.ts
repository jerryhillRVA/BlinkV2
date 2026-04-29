import { renderBlueprintMarkdown } from './render-blueprint-markdown.js';
import { buildSampleBlueprint } from './sample-blueprint.js';
import { BLUEPRINT_BLANK_PLACEHOLDER } from '@blinksocial/contracts';

describe('renderBlueprintMarkdown', () => {
  describe('top-level section ordering', () => {
    it('emits all eleven sections in canonical order', () => {
      const md = renderBlueprintMarkdown(buildSampleBlueprint());
      const order = [
        '# THE BLINK BLUEPRINT',
        '## Strategic Summary',
        '## Business Objectives',
        '## Brand & Voice',
        '## Target Audience',
        '## Audience Profiles',
        '## Competitor Landscape',
        '## Content Pillars',
        '## Channels & Cadence',
        '## Performance Scorecard',
        '## First 30 Days — Quick Wins',
      ];
      let cursor = 0;
      for (const heading of order) {
        const idx = md.indexOf(heading, cursor);
        expect(idx, `expected "${heading}" after position ${cursor}`).toBeGreaterThan(-1);
        cursor = idx + heading.length;
      }
    });
  });

  describe('Strategic Summary subsections', () => {
    it('emits "The Strategy in Plain English" and "Strategic Decisions Made in the Discovery Session"', () => {
      const md = renderBlueprintMarkdown(buildSampleBlueprint());
      expect(md).toMatch(/^### The Strategy in Plain English$/m);
      expect(md).toMatch(/^### Strategic Decisions Made in the Discovery Session$/m);
      expect(md).toContain('Show up where the buyer already is');
    });
  });

  describe('Business Objectives subsection', () => {
    it('emits "How These Objectives Shape Content" with the prose body', () => {
      const md = renderBlueprintMarkdown(buildSampleBlueprint());
      expect(md).toMatch(/^### How These Objectives Shape Content$/m);
      expect(md).toContain('Audience Growth funds Engagement Quality');
    });
  });

  describe('Brand & Voice — Voice in Action', () => {
    it('emits "Voice in Action — Real Copy Examples" with each sample', () => {
      const md = renderBlueprintMarkdown(buildSampleBlueprint());
      expect(md).toMatch(/^### Voice in Action — Real Copy Examples$/m);
      expect(md).toContain('Reel caption');
      expect(md).toContain('Email subject');
      expect(md).toContain('DM reply');
    });
  });

  describe('Audience Profiles — Journey Map', () => {
    it('renders a 4-row Journey Map table per profile', () => {
      const md = renderBlueprintMarkdown(buildSampleBlueprint());
      expect(md).toMatch(/^#### Journey Map$/m);
      expect(md).toContain('| Phase | Goal | Content Moment |');
      // All 4 canonical phases present, in order.
      const journeyIdx = md.indexOf('#### Journey Map');
      const slice = md.slice(journeyIdx);
      const phaseOrder = ['Discovery', 'Consideration', 'Conversion', 'Advocate'];
      let cursor = 0;
      for (const phase of phaseOrder) {
        const idx = slice.indexOf(`| ${phase} |`, cursor);
        expect(idx, `expected | ${phase} | after position ${cursor}`).toBeGreaterThan(-1);
        cursor = idx + 1;
      }
    });
  });

  describe('Competitor Landscape — Differentiation Matrix', () => {
    it('emits the matrix table and a Differentiation Summary', () => {
      const md = renderBlueprintMarkdown(buildSampleBlueprint());
      expect(md).toMatch(/^### Differentiation Matrix$/m);
      expect(md).toMatch(/^### Differentiation Summary$/m);
      // Header columns include Hive plus every competitor referenced.
      expect(md).toContain('| Dimension | Hive | Silver Highlights | Carolines Circuits |');
      expect(md).toContain('Hive owns the "starter for women 40+" lane');
    });
  });

  describe('Content Pillars — Content Ideas Bank', () => {
    it('emits a 5-item numbered idea list per pillar', () => {
      const md = renderBlueprintMarkdown(buildSampleBlueprint());
      const banks = [...md.matchAll(/^#### Content Ideas Bank$/gm)];
      expect(banks.length).toBe(2); // 2 pillars in the fixture
      expect(md).toMatch(/^1\. \*\*Three lifts that fix posture in 4 weeks\*\*/m);
      expect(md).toMatch(/^5\. \*\*Five-minute mobility before coffee\*\*/m);
    });
  });

  describe('Channels & Cadence — Content-Channel Matrix', () => {
    it('emits a pillar × channel grid with primary/occasional cells', () => {
      const md = renderBlueprintMarkdown(buildSampleBlueprint());
      expect(md).toMatch(/^### Content-Channel Matrix$/m);
      expect(md).toContain('| Pillar | Instagram | TikTok |');
      expect(md).toContain('★ primary');
      expect(md).toContain('· occasional');
    });
  });

  describe('Performance Scorecard — Definition column + Review Cadence', () => {
    it('renders a 5-column scorecard with Definition and a Review Cadence subsection', () => {
      const md = renderBlueprintMarkdown(buildSampleBlueprint());
      expect(md).toContain(
        '| Metric | Definition | Baseline | 30-Day Target | 90-Day Target |',
      );
      expect(md).toContain('Total followers across primary channels.');
      expect(md).toMatch(/^### Review Cadence$/m);
      expect(md).toContain('Weekly check-ins on Mondays');
    });

    it('falls back to the legacy 4-column scorecard when no metric carries a definition', () => {
      const bp = buildSampleBlueprint();
      bp.performanceScorecard = bp.performanceScorecard.map((m) => ({
        ...m,
        definition: '',
      }));
      const md = renderBlueprintMarkdown(bp);
      expect(md).toContain('| Metric | Baseline | 30-Day Target | 90-Day Target |');
      expect(md).not.toContain('| Metric | Definition |');
    });
  });

  describe('placeholder pass-through', () => {
    it('emits the canonical blank-placeholder string verbatim when the LLM uses it', () => {
      const bp = buildSampleBlueprint();
      bp.differentiationSummary = BLUEPRINT_BLANK_PLACEHOLDER;
      bp.reviewCadence = BLUEPRINT_BLANK_PLACEHOLDER;
      const md = renderBlueprintMarkdown(bp);
      // Placeholder appears under both subsection headings, not silently dropped.
      const summaryIdx = md.indexOf('### Differentiation Summary');
      const cadenceIdx = md.indexOf('### Review Cadence');
      expect(summaryIdx).toBeGreaterThan(-1);
      expect(cadenceIdx).toBeGreaterThan(-1);
      expect(md.slice(summaryIdx)).toContain(BLUEPRINT_BLANK_PLACEHOLDER);
      expect(md.slice(cadenceIdx)).toContain(BLUEPRINT_BLANK_PLACEHOLDER);
    });
  });

  describe('backward-compat with legacy blueprints', () => {
    it('does not throw on a blueprint missing every #71 subsection field', () => {
      const legacy = buildSampleBlueprint() as Partial<ReturnType<typeof buildSampleBlueprint>>;
      delete legacy.strategyInPlainEnglish;
      delete legacy.strategicDecisions;
      delete legacy.objectivesShapeContent;
      delete legacy.differentiationMatrix;
      delete legacy.differentiationSummary;
      delete legacy.contentChannelMatrix;
      delete legacy.reviewCadence;
      // Strip nested per-item additions too
      legacy.brandVoice = {
        ...legacy.brandVoice!,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        voiceInAction: undefined as any,
      };
      legacy.audienceProfiles = legacy.audienceProfiles!.map((a) => ({
        ...a,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        journeyMap: undefined as any,
      }));
      legacy.contentPillars = legacy.contentPillars!.map((p) => ({
        ...p,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        contentIdeas: undefined as any,
      }));
      legacy.performanceScorecard = legacy.performanceScorecard!.map((m) => ({
        ...m,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        definition: undefined as any,
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const md = renderBlueprintMarkdown(legacy as any);
      expect(md).toContain('# THE BLINK BLUEPRINT');
      expect(md).toContain('## Strategic Summary');
      // New subsection headings simply absent — never crash, never empty section.
      expect(md).not.toContain('### The Strategy in Plain English');
      expect(md).not.toContain('### Differentiation Matrix');
    });
  });
});
