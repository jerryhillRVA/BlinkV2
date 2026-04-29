import { BlueprintValidationService } from './blueprint-validation.service';
import { buildSampleBlueprint } from '@blinksocial/core';
import type { BlueprintDocumentContract } from '@blinksocial/contracts';

/**
 * Schema-valid Blueprint sourced from the shared `@blinksocial/core`
 * fixture — this spec stays aligned automatically as new schema fields
 * land (#71).
 */
function buildValidBlueprint(): BlueprintDocumentContract {
  return buildSampleBlueprint();
}

describe('BlueprintValidationService', () => {
  let service: BlueprintValidationService;

  beforeEach(() => {
    service = new BlueprintValidationService();
  });

  it('accepts a complete blueprint', () => {
    const result = service.validate(buildValidBlueprint());
    expect(result).toEqual({ valid: true });
  });

  it('rejects a blueprint missing targetAudience', () => {
    const bp = buildValidBlueprint() as Partial<BlueprintDocumentContract>;
    delete bp.targetAudience;

    const result = service.validate(bp);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      const targetErr = result.errors.find((e) => e.field === '/targetAudience');
      expect(targetErr).toBeDefined();
      expect(targetErr?.message).toMatch(/required property/i);
    }
  });

  it('rejects a blueprint with too-short targetAudience', () => {
    const bp = buildValidBlueprint();
    bp.targetAudience = 'short';

    const result = service.validate(bp);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      const targetErr = result.errors.find((e) => e.field === '/targetAudience');
      expect(targetErr).toBeDefined();
      expect(targetErr?.message).toMatch(/NOT have fewer than|fewer than 50/i);
    }
  });

  it.each([
    ['/strategyInPlainEnglish', 'strategyInPlainEnglish'] as const,
    ['/strategicDecisions', 'strategicDecisions'] as const,
    ['/objectivesShapeContent', 'objectivesShapeContent'] as const,
    ['/differentiationMatrix', 'differentiationMatrix'] as const,
    ['/differentiationSummary', 'differentiationSummary'] as const,
    ['/contentChannelMatrix', 'contentChannelMatrix'] as const,
    ['/reviewCadence', 'reviewCadence'] as const,
  ])(
    'rejects a blueprint missing required #71 subsection field "%s"',
    (field, key) => {
      const bp = buildValidBlueprint() as Record<string, unknown>;
      delete bp[key];
      const result = service.validate(bp);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        const err = result.errors.find((e) => e.field === field);
        expect(err, `expected error for ${field}`).toBeDefined();
      }
    },
  );

  it('rejects a blueprint where an audience profile is missing journeyMap', () => {
    const bp = buildValidBlueprint();
    bp.audienceProfiles = bp.audienceProfiles.map((a) => {
      const stripped = { ...a } as Partial<typeof a>;
      delete stripped.journeyMap;
      return stripped as typeof a;
    });
    const result = service.validate(bp);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      // AJV reports nested missing-property errors with the parent path in
      // `instancePath` and the missing key in the message, so match on both.
      expect(
        result.errors.some(
          (e) =>
            e.field.startsWith('/audienceProfiles/') &&
            /journeyMap/.test(e.message),
        ),
      ).toBe(true);
    }
  });

  it('rejects a blueprint where a content pillar is missing contentIdeas', () => {
    const bp = buildValidBlueprint();
    bp.contentPillars = bp.contentPillars.map((p) => {
      const stripped = { ...p } as Partial<typeof p>;
      delete stripped.contentIdeas;
      return stripped as typeof p;
    });
    const result = service.validate(bp);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(
        result.errors.some(
          (e) =>
            e.field.startsWith('/contentPillars/') &&
            /contentIdeas/.test(e.message),
        ),
      ).toBe(true);
    }
  });

  it('rejects a blueprint where a metric is missing definition', () => {
    const bp = buildValidBlueprint();
    bp.performanceScorecard = bp.performanceScorecard.map((m) => {
      const stripped = { ...m } as Partial<typeof m>;
      delete stripped.definition;
      return stripped as typeof m;
    });
    const result = service.validate(bp);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(
        result.errors.some(
          (e) =>
            e.field.startsWith('/performanceScorecard/') &&
            /definition/.test(e.message),
        ),
      ).toBe(true);
    }
  });
});
