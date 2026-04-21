import type {
  AudienceSegment,
  ContentObjective,
  ContentPillar,
} from '../../content.types';
import { generateId } from '../../content.utils';
import type { ConceptOption, ConceptProductionTarget } from './idea-detail.types';

interface Seed {
  angle: string;
  description: string;
  objectiveAlignment: string;
  objective: ContentObjective;
  targets: ConceptProductionTarget[];
  ctaType: ConceptOption['cta']['type'];
  ctaText: string;
  suggestedFormatLabel: string;
}

const SEEDS: Seed[] = [
  {
    angle:
      'Community Growth — Build belonging through shared practice',
    description:
      'A warm, inviting tutorial that positions the idea as a shared ritual. Lead with the communal hook — viewers doing this together is the draw.',
    objectiveAlignment: 'Grow engaged community following',
    objective: 'community',
    targets: [
      { platform: 'instagram', contentType: 'reel' },
      { platform: 'tiktok', contentType: 'short-video' },
    ],
    ctaType: 'comment',
    ctaText: 'Which part are you trying first? Drop it below 👇',
    suggestedFormatLabel: 'Reel',
  },
  {
    angle: 'Engagement Driver — Make it feel approachable for everyday use',
    description:
      'Relatable, low-barrier content showing the concept as something anyone can do in 2 minutes at their desk. Favor accessibility over polish.',
    objectiveAlignment: 'Achieve 5% average engagement rate',
    objective: 'engagement',
    targets: [{ platform: 'instagram', contentType: 'carousel' }],
    ctaType: 'comment',
    ctaText: 'Save this for your next stressful moment',
    suggestedFormatLabel: 'Carousel',
  },
  {
    angle: 'Authority Builder — Position as the go-to resource',
    description:
      'Educational deep-dive that explains the "why" behind the idea. Establish credibility and trust as the expert source.',
    objectiveAlignment: 'Build active community of 2,000 members',
    objective: 'trust',
    targets: [{ platform: 'youtube', contentType: 'long-form' }],
    ctaType: 'subscribe',
    ctaText: 'Subscribe for more evidence-based breakdowns',
    suggestedFormatLabel: 'Long-form video',
  },
  {
    angle: 'Beginner Hook — Three ways anyone can start in under 5 minutes',
    description:
      'Fast, punchy tutorial optimized for saves and shares. Lead with the promise of an immediate payoff and zero experience required.',
    objectiveAlignment: 'Reach 500,000 monthly impressions',
    objective: 'awareness',
    targets: [
      { platform: 'instagram', contentType: 'reel' },
      { platform: 'tiktok', contentType: 'short-video' },
    ],
    ctaType: 'subscribe',
    ctaText: 'Follow for more beginner-friendly tips',
    suggestedFormatLabel: 'Reel',
  },
  {
    angle: 'Trust Builder — Science-backed approach for measurable results',
    description:
      'Credibility-first content referencing research and outcomes. Speak directly to an audience that wants proof before trying something new.',
    objectiveAlignment: 'Grow trust with mid-funnel audience',
    objective: 'education',
    targets: [
      { platform: 'instagram', contentType: 'carousel' },
      { platform: 'linkedin', contentType: 'ln-document' },
    ],
    ctaType: 'learn-more',
    ctaText: 'Learn more about the science behind this',
    suggestedFormatLabel: 'Carousel',
  },
  {
    angle: 'Routine Anchor — The daily habit that changes everything',
    description:
      'Aspirational framing around habit formation. Show what consistent practice looks like and what it unlocks over weeks and months.',
    objectiveAlignment: 'Build active community of 2,000 members',
    objective: 'community',
    targets: [
      { platform: 'instagram', contentType: 'reel' },
      { platform: 'tiktok', contentType: 'short-video' },
    ],
    ctaType: 'subscribe',
    ctaText: 'Follow to build your daily routine',
    suggestedFormatLabel: 'Short-form video',
  },
];

/**
 * Returns 6 deterministic-in-shape concept options.
 * Pillars are assigned round-robin from the available workspace pillars,
 * segments from the available segments. If no pillars/segments exist the
 * corresponding arrays are empty.
 */
export function generateConceptOptions(
  pillars: readonly ContentPillar[],
  segments: readonly AudienceSegment[],
): ConceptOption[] {
  return SEEDS.map((seed, i) => {
    const pillarIds = pickPillarIds(pillars, i);
    const segmentIds = pickSegmentIds(segments, i);
    return {
      id: generateId('opt'),
      angle: seed.angle,
      description: seed.description,
      objectiveAlignment: seed.objectiveAlignment,
      objective: seed.objective,
      pillarIds,
      segmentIds,
      productionTargets: [...seed.targets],
      cta: { type: seed.ctaType, text: seed.ctaText },
      suggestedFormatLabel: seed.suggestedFormatLabel,
    };
  });
}

function pickPillarIds(pillars: readonly ContentPillar[], index: number): string[] {
  if (pillars.length === 0) return [];
  if (pillars.length === 1) return [pillars[0].id];
  const first = pillars[index % pillars.length];
  const second = pillars[(index + 1) % pillars.length];
  return [first.id, second.id];
}

function pickSegmentIds(
  segments: readonly AudienceSegment[],
  index: number,
): string[] {
  if (segments.length === 0) return [];
  return [segments[index % segments.length].id];
}
