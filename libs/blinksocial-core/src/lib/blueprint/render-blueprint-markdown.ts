import type { BlueprintDocumentContract } from '@blinksocial/contracts';

/**
 * Single source of truth for converting a `BlueprintDocumentContract` into
 * the rendered `blueprint.md` markdown. Consumed by both the API
 * (`onboarding.service.ts`, fresh generation path) and the web state
 * service (`onboard-state.service.ts`, resume-from-AFS fallback path) so
 * the two paths cannot drift in what they emit.
 *
 * Section order mirrors `blueprint-template.md` exactly. Tests in this
 * package diff every `### / ####` heading from the template against the
 * function's output to catch silent template/serializer drift (ticket #71
 * AC #4).
 *
 * Defensive against missing fields: legacy blueprints persisted to AFS
 * before the #71 schema additions still render through this function
 * without throwing — subsections that depend on new fields are skipped
 * when absent. Validation of structural completeness is the
 * responsibility of `BlueprintValidationService` at generation time.
 */
export function renderBlueprintMarkdown(
  bp: BlueprintDocumentContract,
): string {
  const lines: string[] = [];

  lines.push('# THE BLINK BLUEPRINT');
  lines.push('');
  lines.push(`**Prepared for:** ${bp.clientName}`);
  lines.push(`**Delivered:** ${bp.deliveredDate}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // -- Strategic Summary -----------------------------------------------------
  lines.push('## Strategic Summary');
  lines.push('');
  lines.push(bp.strategicSummary);
  lines.push('');
  if (bp.strategyInPlainEnglish) {
    lines.push('### The Strategy in Plain English');
    lines.push('');
    lines.push(bp.strategyInPlainEnglish);
    lines.push('');
  }
  if (bp.strategicDecisions) {
    lines.push('### Strategic Decisions Made in the Discovery Session');
    lines.push('');
    lines.push(bp.strategicDecisions);
    lines.push('');
  }

  // -- Business Objectives ---------------------------------------------------
  if (bp.businessObjectives?.length) {
    lines.push('## Business Objectives');
    lines.push('');
    for (const obj of bp.businessObjectives) {
      lines.push(
        `- **${obj.objective}** (${obj.category}) — ${obj.timeHorizon} — *${obj.metric}*`,
      );
    }
    lines.push('');
    if (bp.objectivesShapeContent) {
      lines.push('### How These Objectives Shape Content');
      lines.push('');
      lines.push(bp.objectivesShapeContent);
      lines.push('');
    }
  }

  // -- Brand & Voice ---------------------------------------------------------
  if (bp.brandVoice) {
    lines.push('## Brand & Voice');
    lines.push('');
    lines.push(`> ${bp.brandVoice.positioningStatement}`);
    lines.push('');
    lines.push(`**Content Mission:** ${bp.brandVoice.contentMission}`);
    lines.push('');
    if (bp.brandVoice.voiceAttributes?.length) {
      lines.push('### Voice Attributes');
      lines.push('');
      for (const attr of bp.brandVoice.voiceAttributes) {
        lines.push(`- **${attr.attribute}:** ${attr.description}`);
      }
      lines.push('');
    }
    if (bp.brandVoice.voiceInAction?.length) {
      lines.push('### Voice in Action — Real Copy Examples');
      lines.push('');
      for (const ex of bp.brandVoice.voiceInAction) {
        lines.push(`- **${ex.context}:** ${ex.sample}`);
      }
      lines.push('');
    }
    if (bp.brandVoice.doList?.length) {
      lines.push('### Do');
      for (const item of bp.brandVoice.doList) {
        lines.push(`- ${item}`);
      }
      lines.push('');
    }
    if (bp.brandVoice.dontList?.length) {
      lines.push("### Don't");
      for (const item of bp.brandVoice.dontList) {
        lines.push(`- ${item}`);
      }
      lines.push('');
    }
  }

  // -- Target Audience -------------------------------------------------------
  if (bp.targetAudience) {
    lines.push('## Target Audience');
    lines.push('');
    lines.push(bp.targetAudience);
    lines.push('');
  }

  // -- Audience Profiles -----------------------------------------------------
  if (bp.audienceProfiles?.length) {
    lines.push('## Audience Profiles');
    lines.push('');
    for (const aud of bp.audienceProfiles) {
      lines.push(`### ${aud.name}`);
      lines.push(`**Demographics:** ${aud.demographics}`);
      if (aud.painPoints?.length) {
        lines.push(`**Pain Points:** ${aud.painPoints.join(', ')}`);
      }
      if (aud.channels?.length) {
        lines.push(`**Channels:** ${aud.channels.join(', ')}`);
      }
      if (aud.contentHook) {
        lines.push(`**Content Hook:** ${aud.contentHook}`);
      }
      lines.push('');
      if (aud.journeyMap?.length) {
        lines.push('#### Journey Map');
        lines.push('');
        lines.push('| Phase | Goal | Content Moment |');
        lines.push('|-------|------|----------------|');
        for (const stage of aud.journeyMap) {
          lines.push(
            `| ${stage.phase} | ${stage.goal} | ${stage.contentMoment} |`,
          );
        }
        lines.push('');
      }
    }
  }

  // -- Competitor Landscape --------------------------------------------------
  if (bp.competitorLandscape?.length) {
    lines.push('## Competitor Landscape');
    lines.push('');
    for (const comp of bp.competitorLandscape) {
      lines.push(`### ${comp.name}`);
      lines.push(`**Platforms:** ${comp.platforms.join(', ')}`);
      lines.push(`**Strengths:** ${comp.strengths.join('; ')}`);
      lines.push(`**Gaps:** ${comp.gaps.join('; ')}`);
      lines.push(`**Relevancy:** ${comp.relevancy}`);
      lines.push('');
    }
  }
  if (bp.differentiationMatrix?.length) {
    lines.push('### Differentiation Matrix');
    lines.push('');
    // Build header from union of competitor names across rows so a row
    // missing a competitor doesn't collapse the column.
    const competitorNames: string[] = [];
    const seen = new Set<string>();
    for (const row of bp.differentiationMatrix) {
      for (const cell of row.competitors ?? []) {
        if (!seen.has(cell.name)) {
          seen.add(cell.name);
          competitorNames.push(cell.name);
        }
      }
    }
    const header = ['Dimension', 'Hive', ...competitorNames];
    lines.push(`| ${header.join(' | ')} |`);
    lines.push(`| ${header.map(() => '---').join(' | ')} |`);
    for (const row of bp.differentiationMatrix) {
      const lookup = new Map(
        (row.competitors ?? []).map((c) => [c.name, c.value]),
      );
      const cells = [
        row.dimension,
        row.hive,
        ...competitorNames.map((n) => lookup.get(n) ?? '—'),
      ];
      lines.push(`| ${cells.join(' | ')} |`);
    }
    lines.push('');
  }
  if (bp.differentiationSummary) {
    lines.push('### Differentiation Summary');
    lines.push('');
    lines.push(bp.differentiationSummary);
    lines.push('');
  }

  // -- Content Pillars -------------------------------------------------------
  if (bp.contentPillars?.length) {
    lines.push('## Content Pillars');
    lines.push('');
    for (const pillar of bp.contentPillars) {
      lines.push(`### ${pillar.name} (${pillar.sharePercent}%)`);
      lines.push(pillar.description);
      if (pillar.formats?.length) {
        lines.push(`**Formats:** ${pillar.formats.join(', ')}`);
      }
      lines.push('');
      if (pillar.contentIdeas?.length) {
        lines.push('#### Content Ideas Bank');
        lines.push('');
        pillar.contentIdeas.forEach((idea, i) => {
          lines.push(`${i + 1}. **${idea.title}** — ${idea.angle}`);
        });
        lines.push('');
      }
    }
  }

  // -- Channels & Cadence ----------------------------------------------------
  if (bp.channelsAndCadence?.length) {
    lines.push('## Channels & Cadence');
    lines.push('');
    for (const ch of bp.channelsAndCadence) {
      lines.push(`### ${ch.channel} — ${ch.role}`);
      lines.push(`**Frequency:** ${ch.frequency}`);
      lines.push(`**Best Times:** ${ch.bestTimes}`);
      if (ch.contentTypes?.length) {
        lines.push(`**Content Types:** ${ch.contentTypes.join(', ')}`);
      }
      lines.push('');
    }
  }
  if (bp.contentChannelMatrix?.length) {
    lines.push('### Content-Channel Matrix');
    lines.push('');
    // Column set = union of channels referenced anywhere in the matrix,
    // preserving first-seen order so the header is stable per blueprint.
    const channels: string[] = [];
    const seenCh = new Set<string>();
    for (const row of bp.contentChannelMatrix) {
      for (const p of row.placements ?? []) {
        if (!seenCh.has(p.channel)) {
          seenCh.add(p.channel);
          channels.push(p.channel);
        }
      }
    }
    const header = ['Pillar', ...channels];
    lines.push(`| ${header.join(' | ')} |`);
    lines.push(`| ${header.map(() => '---').join(' | ')} |`);
    for (const row of bp.contentChannelMatrix) {
      const lookup = new Map(
        (row.placements ?? []).map((p) => [p.channel, p.role]),
      );
      const cells = [
        row.pillar,
        ...channels.map((c) => {
          const role = lookup.get(c);
          if (role === 'primary') return '★ primary';
          if (role === 'occasional') return '· occasional';
          return '—';
        }),
      ];
      lines.push(`| ${cells.join(' | ')} |`);
    }
    lines.push('');
  }

  // -- Performance Scorecard -------------------------------------------------
  if (bp.performanceScorecard?.length) {
    lines.push('## Performance Scorecard');
    lines.push('');
    const hasDefinition = bp.performanceScorecard.some((m) => m.definition);
    if (hasDefinition) {
      lines.push(
        '| Metric | Definition | Baseline | 30-Day Target | 90-Day Target |',
      );
      lines.push(
        '|--------|------------|----------|---------------|---------------|',
      );
      for (const m of bp.performanceScorecard) {
        lines.push(
          `| ${m.metric} | ${m.definition ?? ''} | ${m.baseline} | ${m.thirtyDayTarget} | ${m.ninetyDayTarget} |`,
        );
      }
    } else {
      lines.push('| Metric | Baseline | 30-Day Target | 90-Day Target |');
      lines.push('|--------|----------|---------------|---------------|');
      for (const m of bp.performanceScorecard) {
        lines.push(
          `| ${m.metric} | ${m.baseline} | ${m.thirtyDayTarget} | ${m.ninetyDayTarget} |`,
        );
      }
    }
    lines.push('');
    if (bp.reviewCadence) {
      lines.push('### Review Cadence');
      lines.push('');
      lines.push(bp.reviewCadence);
      lines.push('');
    }
  }

  // -- Quick Wins ------------------------------------------------------------
  if (bp.quickWins?.length) {
    lines.push('## First 30 Days — Quick Wins');
    lines.push('');
    bp.quickWins.forEach((win, i) => {
      lines.push(`${i + 1}. ${win}`);
    });
    lines.push('');
  }

  return lines.join('\n');
}
