import type { ContentObjective } from '../../content.types';

function titleRef(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return 'this concept';
  return trimmed.length > 30 ? `${trimmed.slice(0, 30)}…` : trimmed;
}

export function assistDescriptionFor(
  title: string,
  objective: ContentObjective | '',
): string {
  const ref = titleRef(title);
  const key: ContentObjective = objective || 'awareness';
  const by: Record<ContentObjective, string> = {
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
  return by[key];
}

export function assistHookFor(
  title: string,
  objective: ContentObjective | '',
): string {
  const ref = titleRef(title);
  const key: ContentObjective = objective || 'awareness';
  const by: Record<ContentObjective, string> = {
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
  return by[key];
}
