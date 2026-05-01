import { Injectable, Logger } from '@nestjs/common';
import { SkillLoaderService } from '../../skills/skill-loader.service';

const SKILL_ID = 'onboarding-consultant';
const GENERATION_TEMPLATE = 'blueprint-generation-prompt';
const REVISION_TEMPLATE = 'blueprint-revision-prompt';

/**
 * Typed prompt context — every byte the model sees flows through this
 * shape. Two consecutive runs with identical context produce byte-identical
 * prompts (#94, AC-D). Test guard: `blueprint-prompt.service.spec.ts`.
 */
export interface BlueprintPromptContext {
  mode: 'generation' | 'revision';
  /** User-supplied business name; null when discovery did not capture it. */
  businessName: string | null;
  /** Pretty-printed JSON of the discovery responses. */
  discoveryDataJson: string;
  /** Pretty-printed prior Blueprint JSON; null in generation mode. */
  priorBlueprintJson: string | null;
  /**
   * Plain-text transcript of the post-completion chat slice that produced
   * this revision request. Null in generation mode. Preserved verbatim so
   * the model can quote the user's exact wording when applying changes.
   *
   * Attachments (images, PDFs, extracted text) are NOT included here —
   * they travel as separate LLM content blocks alongside the rendered
   * prompt text, so the prompt template only owns the textual instructions.
   */
  revisionTranscript: string | null;
}

@Injectable()
export class BlueprintPromptService {
  private readonly logger = new Logger(BlueprintPromptService.name);

  constructor(private readonly skillLoader: SkillLoaderService) {}

  /**
   * Hydrate the per-mode prompt template with the supplied context and
   * return the rendered string. Used as the user-turn text content block
   * in `OnboardingService.generateBlueprint`. Mustache-style `{{name}}`
   * placeholders are resolved against {@link BlueprintPromptContext}.
   *
   * Determinism guarantee: same context → same string. Snapshot-tested in
   * `blueprint-prompt.service.spec.ts`.
   */
  render(context: BlueprintPromptContext): string {
    const skill = this.skillLoader.loadSkill(SKILL_ID);
    const templateName =
      context.mode === 'revision' ? REVISION_TEMPLATE : GENERATION_TEMPLATE;
    const raw = skill.prompts[templateName];
    if (!raw) {
      throw new Error(
        `Blueprint prompt template "${templateName}" not loaded on skill "${SKILL_ID}". ` +
          'Confirm the skill.md frontmatter has a `prompts:` array referencing the template.',
      );
    }

    const businessNameDirective = this.buildBusinessNameDirective(
      context.businessName,
    );
    const requiredFieldsChecklist = this.buildRequiredFieldsChecklist();

    const filled = raw
      .replace(/{{discoveryDataJson}}/g, context.discoveryDataJson)
      .replace(
        /{{priorBlueprintJson}}/g,
        context.priorBlueprintJson ?? '{}',
      )
      .replace(
        /{{revisionTranscript}}/g,
        context.revisionTranscript ?? '(no revision transcript)',
      )
      .replace(/{{businessNameDirective}}/g, businessNameDirective)
      .replace(/{{requiredFieldsChecklist}}/g, requiredFieldsChecklist);

    // Defensive: any unhydrated placeholder is a bug — surface loudly
    // rather than ship a literal `{{...}}` to the model.
    const stray = filled.match(/{{[^}]+}}/);
    if (stray) {
      this.logger.warn(
        `Unhydrated placeholder "${stray[0]}" in rendered prompt for mode=${context.mode}. ` +
          'Add a context field or update the template.',
      );
    }
    return filled;
  }

  /**
   * Verbatim-business-name directive injected when discovery captured a
   * `businessName` value. Empty string for legacy/partial sessions where
   * the LLM-supplied `clientName` is the only signal. Mirrors the
   * historical `OnboardingService.buildBusinessNameDirective` text so the
   * prompt-side requirement stays a single source of truth.
   */
  private buildBusinessNameDirective(businessName: string | null): string {
    if (!businessName) return '';
    return [
      '',
      '# Business name pin (non-negotiable)',
      '',
      `The user-supplied business name is exactly "${businessName}". Use this`,
      'exact string — including casing, spacing, and punctuation — for',
      '`clientName` and EVERY prose mention of the company in the Blueprint',
      '(Strategic Summary, Brand & Voice positioning statement, audience',
      'profiles, and any other reference). Do NOT paraphrase, abbreviate,',
      'translate, summarize, or substitute any other name. The Strategic',
      'Summary and the Brand & Voice positioning statement MUST contain the',
      `literal string "${businessName}".`,
      '',
    ].join('\n');
  }

  /**
   * Field-by-field checklist of every Blueprint constraint the model must
   * satisfy. Mirrors `blueprint.schema.json` — derived by enumeration so
   * the checklist and the schema stay aligned (snapshot-tested). When the
   * schema gains a field, this list MUST gain it too. Recent additions:
   *  - `targetAudience` ≥ 50 chars (#52)
   *  - `audienceProfiles[].journeyMap` 4-row enum (#71)
   *  - `differentiationMatrix` ≥ 3 rows (#71)
   *  - `contentPillars[].contentIdeas` ≥ 5 per pillar (#71)
   *  - `brandVoice.voiceInAction` ≥ 3 examples (#71)
   *  - `performanceScorecard` ≥ 3 metrics + `definition` ≥ 10 chars (#71)
   *  - `quickWins` ≥ 3 items (#71)
   */
  private buildRequiredFieldsChecklist(): string {
    return [
      '- `clientName` (string) — must match the user-supplied business name verbatim.',
      '- `deliveredDate` (string YYYY-MM-DD) — date this Blueprint was delivered.',
      '- `strategicSummary` (string, ≥100 chars) — executive prose summary of the strategy.',
      '- `strategyInPlainEnglish` (string, ≥30 chars) — the same idea in everyday language.',
      '- `strategicDecisions` (string, ≥30 chars) — the decisions made during discovery.',
      '- `businessObjectives` (≥2 items) — each `{ objective, category, timeHorizon, metric }`.',
      '- `objectivesShapeContent` (string, ≥30 chars) — how the objectives shape content choices.',
      '- `brandVoice` — required nested fields: `positioningStatement`, `contentMission`,',
      '  `voiceAttributes` (≥1 each `{ attribute, description }`), `doList`, `dontList`,',
      '  and `voiceInAction` with **≥3** entries each `{ context, sample }` (#71).',
      '- `audienceProfiles` (≥1) — each profile MUST include `name`, `demographics`, `painPoints`,',
      '  `channels`, `contentHook`, AND a `journeyMap` of EXACTLY 4 entries (#71) with',
      '  `phase` ∈ {"Discovery","Consideration","Conversion","Advocate"} in that order, plus',
      '  `goal` and `contentMoment` per phase.',
      '- `targetAudience` (string, ≥50 chars) — overall audience summary above the profiles (#52).',
      '- `competitorLandscape` — each row `{ name, platforms, strengths, gaps, relevancy }`.',
      '- `differentiationMatrix` (≥3 rows) — each `{ dimension, hive, competitors[] }` (#71).',
      '- `differentiationSummary` (string, ≥30 chars).',
      '- `contentPillars` (≥2) — each `{ name, description, formats, sharePercent (5..60),',
      '  contentIdeas }` and **`contentIdeas` MUST have ≥5 entries** each `{ title, angle }` (#71).',
      '- `channelsAndCadence` (≥1) — each `{ channel, role, frequency, bestTimes, contentTypes }`.',
      '- `contentChannelMatrix` (≥1) — each `{ pillar, placements }`. EVERY `contentPillars[].name`',
      '  MUST appear here, and the row count MUST equal the pillar count (cross-field guard).',
      '  Each `placements[].role` ∈ {"primary","occasional"}.',
      '- `performanceScorecard` (≥3) — each `{ metric, baseline, thirtyDayTarget, ninetyDayTarget,',
      '  definition }` with `definition` ≥10 chars (#71).',
      '- `reviewCadence` (string, ≥30 chars).',
      '- `quickWins` (≥3 string items) (#71).',
    ].join('\n');
  }
}
