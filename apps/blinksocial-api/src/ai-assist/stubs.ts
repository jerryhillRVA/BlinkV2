import type {
  AiAssistFieldContract,
  ContentItemContract,
  ContentObjectiveContract,
} from '@blinksocial/contracts';

const DEFAULT_OBJECTIVE: ContentObjectiveContract = 'awareness';

function titleRef(title: string | undefined): string {
  const trimmed = (title ?? '').trim();
  if (!trimmed) return 'this concept';
  return trimmed.length > 30 ? `${trimmed.slice(0, 30)}…` : trimmed;
}

function describeFor(title: string | undefined, objective: ContentObjectiveContract): string {
  const ref = titleRef(title);
  const by: Record<ContentObjectiveContract, string> = {
    awareness: `"${ref}" — a concept shaped to reach new audiences quickly. Lead with a recognizable hook, keep the narrative tight, and end with a memorable tag.`,
    engagement: `"${ref}" — built to start a conversation. Ask a pointed question, invite disagreement, and design the ending so a reply feels natural.`,
    trust: `"${ref}" — show the evidence, the data, and the people behind the work. Let the proof carry the persuasion rather than the claims.`,
    leads: `"${ref}" — a concept engineered to turn curiosity into qualified pipeline. Show value up front and make the next step obvious and low-friction.`,
    conversion: `"${ref}" — move a warm prospect across the line. Social proof, a clear objection handled, and a single unambiguous CTA.`,
    traffic: `"${ref}" — a clean preview of what's on the other side of the click. Promise, payoff, no bait.`,
    sales: `"${ref}" — a direct-response concept. Show the product working, answer the top objection, end with the price-to-value contrast.`,
    community: `"${ref}" — a nod to the people already in the room; an invitation for everyone else. Name the shared identity and celebrate it.`,
    recruiting: `"${ref}" — an honest window into the team, the work, and the tradeoffs. Speak to the people who'd thrive here.`,
    'lead-gen': `"${ref}" — a focused playbook in exchange for an email. Specific, useful, and unmistakably valuable.`,
    education: `"${ref}" — one concrete idea explained cleanly. Lead with the payoff, walk through the mechanism, land the takeaway.`,
  };
  return by[objective];
}

function hookFor(title: string | undefined, objective: ContentObjectiveContract): string {
  const ref = titleRef(title);
  const by: Record<ContentObjectiveContract, string> = {
    awareness: `Most people skim past "${ref}" — here's the detail that actually matters.`,
    engagement: `Real talk about "${ref}" — where do you actually land on it?`,
    trust: `Here's what really happened with "${ref}". No polish, just the receipts.`,
    leads: `"${ref}" in under 10 minutes — the shortcut most teams miss.`,
    conversion: `Still on the fence about "${ref}"? Here's what finally changes minds.`,
    traffic: `"${ref}" in one click — we did the hard part, you get the shortcut.`,
    sales: `"${ref}" — the reason teams are switching this quarter.`,
    community: `If "${ref}" ever made sense to you, this one's for you.`,
    recruiting: `What it's actually like to work on "${ref}" here — honestly.`,
    'lead-gen': `The "${ref}" playbook — free if you want it.`,
    education: `"${ref}" in 90 seconds. Save this one.`,
  };
  return by[objective];
}

const KEY_MESSAGE_STUB =
  'This campaign focuses on empowering users to take control of their workflows with seamless, intuitive tools.';

const HOOK_BANK_STUBS: readonly string[] = [
  "Most people get this completely wrong — here's what actually works.",
  "If you've ever felt stuck on this, you're not alone — and the fix is simpler than you think.",
  'Stop scrolling. This 30-second tip will change how you approach this forever.',
];

const BODY_STUB =
  "Step 1: Start with the core principle — it's simpler than you think.\n\nStep 2: Apply it consistently for at least 14 days before judging the results.\n\nStep 3: Track your progress and adjust as you learn what works.";

const CTA_STUB = 'Save this for later and share it with someone who needs it. 👇';

const CAPTION_STUB =
  'Stop scrolling — this 60-second mobility flow is what your body needs every morning. Save this for tomorrow. 💪 #MorningRoutine #Wellness';

const HASHTAG_STUBS: readonly string[] = [
  '#mobility',
  '#morningroutine',
  '#wellness',
  '#stretching',
  '#dailyhabits',
];

/**
 * Ported from the frontend mocks the new framework replaces. Used when
 * `LlmService.isConfigured() === false` so dev / e2e environments keep
 * working without an Anthropic key.
 */
export function buildStubValues(
  field: AiAssistFieldContract,
  count: number,
  item: ContentItemContract,
): string[] {
  switch (field) {
    case 'concept-description':
      return repeat(count, () => describeFor(item.title, item.objective ?? DEFAULT_OBJECTIVE));
    case 'concept-hook-angle':
      return repeat(count, () => hookFor(item.title, item.objective ?? DEFAULT_OBJECTIVE));
    case 'post-key-message':
      return repeat(count, () => KEY_MESSAGE_STUB);
    case 'post-script-hook':
      return takeOrPad(HOOK_BANK_STUBS, count);
    case 'post-script-body':
      return repeat(count, () => BODY_STUB);
    case 'post-script-cta':
      return repeat(count, () => CTA_STUB);
    case 'post-caption':
      return repeat(count, () => CAPTION_STUB);
    case 'post-hashtags':
      return takeOrPad(HASHTAG_STUBS, count);
  }
}

function repeat(n: number, fn: () => string): string[] {
  const out: string[] = [];
  for (let i = 0; i < n; i++) out.push(fn());
  return out;
}

function takeOrPad(source: readonly string[], count: number): string[] {
  if (count <= source.length) return source.slice(0, count);
  const out = [...source];
  let i = 0;
  while (out.length < count) {
    out.push(source[i % source.length]);
    i++;
  }
  return out;
}
