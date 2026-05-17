import type {
  ContentCtaContract,
  ContentObjectiveContract,
  CtaTypeContract,
} from '@blinksocial/contracts';
import type { ConceptDraftContract } from '@blinksocial/contracts';

/**
 * Verbatim port of the four objective-keyed lookup tables that used to
 * live in `apps/blinksocial-web/src/app/pages/content/views/content-create/content-create.ai.ts`.
 * Used only when `LlmService.isConfigured()` is false (dev/CI/local
 * without `ANTHROPIC_API_KEY`) so existing fixtures and E2E behaviour
 * remain bit-for-bit identical to before ticket #156.
 */

const DESCRIPTION_BY_OBJECTIVE: Record<ContentObjectiveContract, string> = {
  awareness:
    'Reach new audiences discovering your category for the first time. Focus on name recognition and memorability.',
  engagement:
    'Spark conversation and reactions from your existing audience. Invite them to share thoughts and stories below.',
  trust:
    'Build credibility through transparency and expertise. Share the process, the data, and the team behind the work.',
  leads:
    'Attract prospects ready to learn more about your solution. Offer genuine value in exchange for their attention.',
  conversion:
    'Drive action from warm prospects. Highlight social proof, reduce friction, and guide them toward signup.',
  traffic:
    'Drive qualified traffic to owned destinations. Lead with a clear, benefit-led preview of what they get next.',
  sales:
    'Move warm prospects to purchase. Highlight proof, reduce friction, and make the next step obvious.',
  community:
    'Deepen belonging and shared identity. Invite members to show up, share, and contribute to the story.',
  recruiting:
    'Attract aligned talent. Show the team, the work, and what it actually feels like to ship here.',
  'lead-gen':
    'Turn attention into qualified pipeline. Offer value upfront in exchange for a small commitment.',
  education:
    'Teach one concrete thing well. Lead with the payoff, then deliver a clear, stepwise walk-through.',
};

const HOOK_BY_OBJECTIVE: Record<ContentObjectiveContract, string> = {
  awareness:
    'The thing nobody tells you about getting started — and why that quiet gap matters more than you think.',
  engagement:
    "Quick question: which camp are you actually in? Drop your answer in the comments — we're reading every one.",
  trust:
    "Here's what actually happens behind the scenes. No polish, no edits — just the real process, start to finish.",
  leads:
    "Most teams miss this one step and pay for it later. Here's how to fix it in under 10 minutes, free.",
  conversion:
    "Ready to stop guessing? See why teams are switching this quarter — and what they're getting back.",
  traffic:
    "There's a faster path than the one you're on. Here's the single link that saves you the detour.",
  sales:
    "Still on the fence? Here's what changed their minds last quarter — in under a minute.",
  community:
    "This one's for the people who get it. Tag someone who'd nod along.",
  recruiting:
    "What a normal week on the team actually looks like — the good parts and the hard parts, honestly.",
  'lead-gen':
    "The playbook we use internally — yours for an email. Fair trade?",
  education:
    "The 90-second version of something people usually overcomplicate. Save this one.",
};

const CTA_TYPE_BY_OBJECTIVE: Partial<Record<ContentObjectiveContract, CtaTypeContract>> = {
  awareness: 'learn-more',
  engagement: 'comment',
  trust: 'learn-more',
  leads: 'book-call',
  conversion: 'buy',
};

const CTA_TEXT_BY_OBJECTIVE: Partial<Record<ContentObjectiveContract, string>> = {
  awareness: 'Learn more about this in our bio link',
  engagement: 'Drop your thoughts in the comments below',
  trust: 'See the full breakdown at the link in bio',
  leads: 'Book a free call — link in bio',
  conversion: 'Shop now — link in bio',
};

export interface StubDraftInput {
  objective: ContentObjectiveContract;
  pillarIdFallback: string | null;
  segmentIdsFallback: string[];
}

export function buildStubDraft(input: StubDraftInput): ConceptDraftContract {
  const ctaType = CTA_TYPE_BY_OBJECTIVE[input.objective];
  const ctaText = CTA_TEXT_BY_OBJECTIVE[input.objective];
  const cta: ContentCtaContract | null =
    ctaType && ctaText ? { type: ctaType, text: ctaText } : null;
  return {
    description: DESCRIPTION_BY_OBJECTIVE[input.objective],
    hook: HOOK_BY_OBJECTIVE[input.objective],
    cta,
    pillarIdFallback: input.pillarIdFallback,
    segmentIdsFallback: input.segmentIdsFallback,
  };
}
