import {
  computeEngagementRate,
  formatFollowers,
  generateCampaignMetrics,
  generateInfluencerPool,
  getInitials,
  readInfluencerStorage,
  writeInfluencerStorage,
} from './influencer.helpers';

describe('influencer.helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    try { window.localStorage.clear(); } catch { /* ignore */ }
  });

  describe('formatFollowers', () => {
    it('formats millions', () => {
      expect(formatFollowers(1_200_000)).toBe('1.2M');
    });
    it('formats thousands', () => {
      expect(formatFollowers(48_200)).toBe('48.2K');
    });
    it('returns raw number under 1K', () => {
      expect(formatFollowers(900)).toBe('900');
    });
  });

  describe('getInitials', () => {
    it('returns first+last initials for two-part names', () => {
      expect(getInitials('Maya Chen')).toBe('MC');
    });
    it('returns first two chars for single-part names', () => {
      expect(getInitials('Maya')).toBe('MA');
    });
    it('handles extra whitespace', () => {
      expect(getInitials('  Maya   Chen  ')).toBe('MC');
    });
  });

  describe('generateInfluencerPool', () => {
    it('produces the requested number of unique profiles', () => {
      const pool = generateInfluencerPool(20);
      expect(pool.length).toBeLessThanOrEqual(20);
      const names = new Set(pool.map((p) => p.name));
      expect(names.size).toBe(pool.length);
    });
    it('profiles reference known tiers and follower/engagement ranges', () => {
      const pool = generateInfluencerPool(10);
      for (const p of pool) {
        expect(['nano', 'micro', 'mid', 'macro', 'mega']).toContain(p.tier);
        expect(p.followers).toBeGreaterThan(0);
        expect(p.engagementRate).toBeGreaterThan(0);
        expect(p.audienceAlignment).toBeGreaterThanOrEqual(60);
        expect(p.audienceAlignment).toBeLessThanOrEqual(90);
      }
    });
  });

  describe('generateCampaignMetrics', () => {
    it('returns non-negative metrics for each tier', () => {
      for (const tier of ['nano', 'micro', 'mid', 'macro', 'mega'] as const) {
        const m = generateCampaignMetrics(['instagram'], tier);
        expect(m.reach).toBeGreaterThan(0);
        expect(m.impressions).toBeGreaterThan(0);
        expect(m.engagements).toBeGreaterThanOrEqual(0);
        expect(m.clicks).toBeGreaterThanOrEqual(0);
        expect(m.conversions).toBeGreaterThanOrEqual(0);
      }
    });
    it('scales with multiple platforms', () => {
      const single = generateCampaignMetrics(['instagram'], 'mid');
      const triple = generateCampaignMetrics(['instagram', 'tiktok', 'youtube'], 'mid');
      expect(triple.reach!).toBeGreaterThan(0);
      expect(single.reach!).toBeGreaterThan(0);
    });
  });

  describe('computeEngagementRate', () => {
    it('returns null for missing metrics', () => {
      expect(computeEngagementRate(undefined)).toBeNull();
    });
    it('returns null when reach is zero', () => {
      expect(computeEngagementRate({ reach: 0, engagements: 10 })).toBeNull();
    });
    it('returns null when engagements missing', () => {
      expect(computeEngagementRate({ reach: 1000 })).toBeNull();
    });
    it('computes percentage rounded to one decimal', () => {
      expect(computeEngagementRate({ reach: 1000, engagements: 57 })).toBe(5.7);
    });
  });

  describe('readInfluencerStorage', () => {
    it('returns fallback when storage is empty', () => {
      expect(readInfluencerStorage('nonexistent-key-xyz', [])).toEqual([]);
    });
    it('parses stored JSON', () => {
      window.localStorage.setItem('helper-key', JSON.stringify([1, 2, 3]));
      expect(readInfluencerStorage<number[]>('helper-key', [])).toEqual([1, 2, 3]);
    });
    it('returns fallback on JSON parse error', () => {
      window.localStorage.setItem('bad-json', '{not valid');
      expect(readInfluencerStorage<string[]>('bad-json', ['default'])).toEqual(['default']);
    });
    it('returns fallback when localStorage.getItem throws', () => {
      const spy = vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
        throw new Error('no');
      });
      expect(readInfluencerStorage('any', 'fb')).toBe('fb');
      spy.mockRestore();
    });
  });

  describe('writeInfluencerStorage', () => {
    it('persists a value to localStorage', () => {
      writeInfluencerStorage('write-key', { a: 1 });
      expect(JSON.parse(window.localStorage.getItem('write-key') ?? '{}')).toEqual({ a: 1 });
    });
    it('swallows errors when setItem throws', () => {
      const spy = vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
        throw new Error('quota');
      });
      expect(() => writeInfluencerStorage('x', 'y')).not.toThrow();
      spy.mockRestore();
    });
  });
});
