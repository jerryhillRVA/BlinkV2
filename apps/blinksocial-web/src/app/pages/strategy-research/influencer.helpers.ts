import type {
  InfluencerCampaignMetrics,
  InfluencerProfile,
  InfluencerTier,
  ObjectiveCategory,
  Platform,
} from './strategy-research.types';
import {
  INFLUENCER_ENGAGEMENT_RANGES,
  INFLUENCER_FOLLOWER_RANGES,
} from './strategy-research.constants';

export function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

const FIRST_NAMES = [
  'Alex', 'Maya', 'Jordan', 'Sofia', 'Marcus', 'Priya', 'Dana', 'Cam',
  'Riley', 'Sage', 'Quinn', 'Avery', 'Blake', 'Casey', 'Drew', 'Emery',
  'Finley', 'Harper', 'Jesse', 'Kennedy', 'Logan', 'Morgan', 'Nadia',
  'Owen', 'Peyton', 'Rowan', 'Skylar', 'Taylor', 'Val', 'Winter',
];

const LAST_NAMES = [
  'Chen', 'Blake', 'Torres', 'Webb', 'Kim', 'Reyes', 'Rivera', 'Nair',
  'Morgan', 'Lee', 'Park', 'Singh', 'Patel', 'Garcia', 'Martinez',
  'Johnson', 'Williams', 'Brown', 'Davis', 'Wilson', 'Nguyen', 'Anderson',
  'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Moore', 'Young',
];

const NICHES = [
  'fitness', 'wellness', 'lifestyle', 'food', 'travel', 'tech', 'business',
  'finance', 'fashion', 'sustainability', 'parenting', 'education', 'gaming',
  'music', 'art', 'comedy', 'beauty', 'sports', 'mindfulness', 'entrepreneurship',
  'cooking', 'photography', 'design', 'health',
];

const AVATAR_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6',
  '#14b8a6', '#f97316', '#ef4444', '#06b6d4', '#84cc16', '#a855f7',
];

const TIER_WEIGHTS: InfluencerTier[] = [
  'nano', 'nano', 'micro', 'micro', 'micro', 'micro', 'mid', 'mid', 'macro',
];

const PLATFORM_COMBOS: Platform[][] = [
  ['instagram', 'tiktok'],
  ['youtube', 'instagram'],
  ['tiktok', 'youtube'],
  ['instagram'],
  ['tiktok'],
  ['youtube', 'tiktok'],
  ['instagram', 'youtube', 'tiktok'],
  ['youtube'],
];

const OBJECTIVE_CATEGORIES: ObjectiveCategory[] = [
  'growth', 'revenue', 'awareness', 'trust', 'community', 'engagement',
];

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateInfluencerPool(size = 60): InfluencerProfile[] {
  const pool: InfluencerProfile[] = [];
  const usedNames = new Set<string>();
  let safety = 0;
  const timestamp = Date.now();

  while (pool.length < size && safety < size * 5) {
    safety++;
    const first = pickRandom(FIRST_NAMES);
    const last = pickRandom(LAST_NAMES);
    const fullName = `${first} ${last}`;
    if (usedNames.has(fullName)) continue;
    usedNames.add(fullName);

    const tier = pickRandom(TIER_WEIGHTS);
    const [minF, maxF] = INFLUENCER_FOLLOWER_RANGES[tier];
    const followers = randomInt(minF, maxF);
    const [minE, maxE] = INFLUENCER_ENGAGEMENT_RANGES[tier];
    const engagementRate = parseFloat((Math.random() * (maxE - minE) + minE).toFixed(1));
    const platforms = pickRandom(PLATFORM_COMBOS);
    const niche = [...NICHES].sort(() => Math.random() - 0.5).slice(0, randomInt(2, 3));
    const objectiveFit = [...OBJECTIVE_CATEGORIES]
      .sort(() => Math.random() - 0.5)
      .slice(0, randomInt(1, 2));
    const audienceAlignment = randomInt(60, 90);
    const suffix = Math.random() > 0.5 ? String(randomInt(1, 99)) : '';
    const handle = `@${first.toLowerCase()}${last.toLowerCase()}${suffix}`;
    const avatarColor = pickRandom(AVATAR_COLORS);

    pool.push({
      id: `inf-gen-${pool.length + 1}-${timestamp}`,
      name: fullName,
      handle,
      platforms,
      tier,
      followers,
      engagementRate,
      niche,
      audienceAlignment,
      objectiveFit,
      bio: `${niche[0]} creator helping audiences build better ${niche[1] ?? 'habits'}.`,
      avatarColor,
    });
  }

  return pool;
}

export function generateCampaignMetrics(
  platforms: Platform[],
  tier: InfluencerTier,
): InfluencerCampaignMetrics {
  const platformMultiplier = Math.max(1, platforms.length);
  const ranges: Record<InfluencerTier, { reach: [number, number]; impr: number; eng: number; click: number; conv: number }> = {
    nano: { reach: [500, 5_000], impr: 1.6, eng: 0.10, click: 0.020, conv: 0.004 },
    micro: { reach: [2_000, 20_000], impr: 1.5, eng: 0.07, click: 0.015, conv: 0.003 },
    mid: { reach: [10_000, 100_000], impr: 1.4, eng: 0.05, click: 0.012, conv: 0.002 },
    macro: { reach: [50_000, 500_000], impr: 1.35, eng: 0.04, click: 0.010, conv: 0.0015 },
    mega: { reach: [200_000, 2_000_000], impr: 1.3, eng: 0.03, click: 0.008, conv: 0.001 },
  };
  const r = ranges[tier];
  const baseReach = randomInt(r.reach[0], r.reach[1]) * platformMultiplier;
  const impressions = Math.round(baseReach * (r.impr + Math.random() * 0.2));
  const engagements = Math.round(baseReach * (r.eng * (0.8 + Math.random() * 0.4)));
  const clicks = Math.round(baseReach * (r.click * (0.8 + Math.random() * 0.4)));
  const conversions = Math.round(clicks * (r.conv * 10 * (0.8 + Math.random() * 0.4)));
  return { reach: baseReach, impressions, engagements, clicks, conversions };
}

export function computeEngagementRate(metrics: InfluencerCampaignMetrics | undefined): number | null {
  if (!metrics) return null;
  const { engagements, reach } = metrics;
  if (!engagements || !reach) return null;
  return parseFloat(((engagements / reach) * 100).toFixed(1));
}

export function readInfluencerStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeInfluencerStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage errors (quota exceeded, private mode, etc.)
  }
}
