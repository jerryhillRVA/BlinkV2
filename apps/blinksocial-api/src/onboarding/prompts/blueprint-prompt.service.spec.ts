import { Test } from '@nestjs/testing';
import {
  BlueprintPromptService,
  type BlueprintPromptContext,
} from './blueprint-prompt.service';
import { SkillLoaderService } from '../../skills/skill-loader.service';

/**
 * Real skill files live next to the service. We use the actual SkillLoader
 * here (not a stub) so changes to the on-disk template files are exercised
 * by every test. The loader resolves paths from `process.cwd()` already, so
 * the tests work in both Vitest's working dir (repo root) and direct runs.
 */
async function buildService() {
  const moduleRef = await Test.createTestingModule({
    providers: [BlueprintPromptService, SkillLoaderService],
  }).compile();
  return moduleRef.get(BlueprintPromptService);
}

function buildContext(
  overrides: Partial<BlueprintPromptContext> = {},
): BlueprintPromptContext {
  return {
    mode: 'generation',
    businessName: 'Hive Collective',
    discoveryDataJson: JSON.stringify(
      {
        business: { businessName: 'Hive Collective', goal: 'Grow audience' },
        audience: { primary: 'women 40+ reclaiming movement' },
      },
      null,
      2,
    ),
    priorBlueprintJson: null,
    revisionTranscript: null,
    ...overrides,
  };
}

describe('BlueprintPromptService — determinism + guardrails (#94)', () => {
  it('generation-mode rendered prompt is byte-identical across two calls with the same context', async () => {
    const svc = await buildService();
    const ctx = buildContext();
    expect(svc.render(ctx)).toBe(svc.render(ctx));
  });

  it('revision-mode rendered prompt is byte-identical across two calls with the same context', async () => {
    const svc = await buildService();
    const priorBlueprint = JSON.stringify({ clientName: 'Hive Collective' });
    const ctx = buildContext({
      mode: 'revision',
      priorBlueprintJson: priorBlueprint,
      revisionTranscript: 'USER: tighten the summary\n\nASSISTANT: yes',
    });
    expect(svc.render(ctx)).toBe(svc.render(ctx));
  });

  it('hydrates {{discoveryDataJson}} and {{businessName}} pin into the generation prompt', async () => {
    const svc = await buildService();
    const out = svc.render(buildContext());
    expect(out).toContain('Hive Collective');
    expect(out).toContain('"businessName": "Hive Collective"');
    // Mode marker present.
    expect(out).toContain('MODE: BLUEPRINT_GENERATION');
    // Required-fields checklist marker that callers verify against.
    expect(out).toContain('Required-field checklist');
  });

  it('omits the business-name pin when the context has no businessName', async () => {
    const svc = await buildService();
    const out = svc.render(buildContext({ businessName: null }));
    expect(out).not.toContain('Business name pin');
    expect(out).not.toContain('non-negotiable');
  });

  it('hydrates revision-mode placeholders (priorBlueprintJson, revisionTranscript)', async () => {
    const svc = await buildService();
    const priorBlueprint = JSON.stringify(
      { clientName: 'Hive Collective', strategicSummary: 'old summary' },
      null,
      2,
    );
    const transcript = 'USER: tighten the summary\n\nASSISTANT: yes';
    const out = svc.render(
      buildContext({
        mode: 'revision',
        priorBlueprintJson: priorBlueprint,
        revisionTranscript: transcript,
      }),
    );
    expect(out).toContain('MODE: BLUEPRINT_REVISION');
    expect(out).toContain('"strategicSummary": "old summary"');
    expect(out).toContain('USER: tighten the summary');
    expect(out).toContain('preserve every unrelated section of the prior Blueprint VERBATIM');
  });

  it('falls back to the generation template for any non-revision mode value (defensive)', async () => {
    const svc = await buildService();
    const out = svc.render(
      buildContext({
        mode: 'wat' as unknown as BlueprintPromptContext['mode'],
      }),
    );
    expect(out).toContain('MODE: BLUEPRINT_GENERATION');
  });

  // ---------------------------------------------------------------------------
  // Recent-ticket guardrail enumeration in the required-fields checklist
  // (#52 targetAudience, #71 journeyMap / differentiationMatrix /
  // contentIdeas / voiceInAction / performanceScorecard / quickWins)
  // ---------------------------------------------------------------------------

  describe('requiredFieldsChecklist enumerates every recent-ticket constraint', () => {
    let rendered: string;
    beforeAll(async () => {
      const svc = await buildService();
      rendered = svc.render(buildContext());
    });

    // #52
    it('lists targetAudience with the ≥50-char floor', () => {
      expect(rendered).toMatch(/targetAudience.*≥\s*50/);
    });

    // #71 — journeyMap 4-row enum
    it('lists journeyMap with EXACTLY 4 entries and the four-phase enum', () => {
      expect(rendered).toContain('journeyMap');
      expect(rendered).toContain('EXACTLY 4');
      expect(rendered).toContain('Discovery');
      expect(rendered).toContain('Consideration');
      expect(rendered).toContain('Conversion');
      expect(rendered).toContain('Advocate');
    });

    // #71 — differentiationMatrix ≥3 rows
    it('lists differentiationMatrix with the ≥3-row floor', () => {
      expect(rendered).toMatch(/differentiationMatrix.*≥\s*3/);
    });

    // #71 — contentIdeas ≥5 per pillar
    it('lists contentIdeas with the ≥5-per-pillar floor', () => {
      expect(rendered).toMatch(/contentIdeas.*≥\s*5/);
    });

    // #71 — voiceInAction ≥3 examples
    it('lists voiceInAction with the ≥3-entries floor', () => {
      expect(rendered).toMatch(/voiceInAction.*≥\s*3/);
    });

    // #71 — performanceScorecard ≥3 with definition ≥10
    it('lists performanceScorecard with the ≥3-rows + definition ≥10 floors', () => {
      expect(rendered).toMatch(/performanceScorecard.*≥\s*3/);
      expect(rendered).toMatch(/definition.*≥\s*10/);
    });

    // #71 — quickWins ≥3
    it('lists quickWins with the ≥3-items floor', () => {
      expect(rendered).toMatch(/quickWins.*≥\s*3/);
    });

    it('lists the contentChannelMatrix cross-field guard (every pillar must appear, row count must equal pillar count)', () => {
      expect(rendered).toContain('contentChannelMatrix');
      expect(rendered.toLowerCase()).toContain('every');
      expect(rendered.toLowerCase()).toContain('row count must equal the pillar count');
    });
  });

  // ---------------------------------------------------------------------------
  // Run-2 D1 regression: model double-wraps tool input under {"input": {...}}
  // when the prompt language uses the literal phrase "the tool's input field".
  // The fix removes that phrasing and replaces it with explicit "top level,
  // no wrapper" directives. These tests fail if a future prompt edit reverts
  // the wording or drops the no-wrapper guard.
  // ---------------------------------------------------------------------------

  describe('no-wrapper directive (#94 D1)', () => {
    it('generation-mode prompt does NOT contain the literal "tool\'s `input` field" phrasing', async () => {
      const svc = await buildService();
      const out = svc.render(buildContext());
      expect(out).not.toMatch(/tool's\s*`input`\s*field/i);
      expect(out).not.toMatch(/as\s*`input`/i);
    });

    it('revision-mode prompt does NOT contain the literal "tool\'s `input` field" phrasing', async () => {
      const svc = await buildService();
      const priorBlueprint = JSON.stringify({ clientName: 'Hive Collective' });
      const out = svc.render(
        buildContext({
          mode: 'revision',
          priorBlueprintJson: priorBlueprint,
          revisionTranscript: 'USER: tighten the summary\n\nASSISTANT: yes',
        }),
      );
      expect(out).not.toMatch(/tool's\s*`input`\s*field/i);
      expect(out).not.toMatch(/as\s*`input`/i);
    });

    it('generation-mode prompt explicitly forbids wrapping the Blueprint under any outer field', async () => {
      const svc = await buildService();
      const out = svc.render(buildContext());
      expect(out).toContain('TOP LEVEL');
      expect(out).toMatch(/Do NOT (wrap|nest)/);
      // Specific wrapper names called out in the directive.
      expect(out).toContain('input');
      expect(out).toContain('blueprint');
    });

    it('revision-mode prompt explicitly forbids wrapping the Blueprint under any outer field', async () => {
      const svc = await buildService();
      const out = svc.render(
        buildContext({
          mode: 'revision',
          priorBlueprintJson: '{}',
          revisionTranscript: 'USER: x\n\nASSISTANT: ok',
        }),
      );
      expect(out).toContain('TOP LEVEL');
      expect(out).toMatch(/Do NOT (wrap|nest)/);
    });
  });
});
