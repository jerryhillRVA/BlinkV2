import type { GeneratedIdeaContract } from '@blinksocial/contracts';
import { GENERATE_IDEAS_COUNT } from '@blinksocial/contracts';

interface Seed {
  title: string;
  rationale: string;
}

const SEEDS: readonly Seed[] = [
  {
    title: '5 morning rituals that take under 2 minutes',
    rationale: 'Short-form quick wins outperform in scarce-attention feeds.',
  },
  {
    title: 'The one stretch everyone over 40 should be doing',
    rationale: 'Audience-specific targeting with an immediately actionable move.',
  },
  {
    title: 'What changes when you cut sugar for 7 days',
    rationale: 'Curiosity framing invites the audience to self-experiment and share.',
  },
  {
    title: 'Why sleep quality matters more than duration',
    rationale: 'Counters a common assumption — reliably earns saves and shares.',
  },
  {
    title: 'Three grocery swaps that upgrade your protein intake',
    rationale: 'Practical list format that converts for nutrition-focused pillars.',
  },
  {
    title: 'The mindset shift that makes workouts stick',
    rationale: 'Identity-level framing drives deeper engagement than tactics alone.',
  },
];

if (SEEDS.length !== GENERATE_IDEAS_COUNT) {
  throw new Error(
    `generated-ideas SEEDS length (${SEEDS.length}) must equal GENERATE_IDEAS_COUNT (${GENERATE_IDEAS_COUNT})`,
  );
}

export function buildStubIdeas(
  pillarIds: readonly string[],
  idFactory: () => string,
): GeneratedIdeaContract[] {
  if (pillarIds.length === 0) return [];
  return SEEDS.map((seed, i) => ({
    id: idFactory(),
    title: seed.title,
    rationale: seed.rationale,
    pillarId: pillarIds[i % pillarIds.length],
  }));
}
