import type { ContentMetricsContract, PlatformContract } from '@blinksocial/contracts';

/**
 * #146 spec §6 — platform-to-metric-rows mapping. Each entry is the
 * ordered list of metric keys the Performance card renders for that
 * platform. Metrics not in the list are hidden, even if present on
 * `item.metrics`.
 */
export const PERFORMANCE_ROWS: Record<
  PlatformContract,
  ReadonlyArray<keyof ContentMetricsContract>
> = {
  instagram: ['views', 'likes', 'comments', 'shares', 'saves', 'engagementRate', 'reach'],
  tiktok:    ['views', 'likes', 'comments', 'shares', 'saves', 'engagementRate'],
  youtube:   ['views', 'likes', 'comments', 'engagementRate', 'watchTime'],
  linkedin:  ['views', 'likes', 'comments', 'shares', 'engagementRate', 'reach', 'impressions'],
  facebook:  ['views', 'likes', 'comments', 'shares', 'engagementRate', 'reach', 'impressions'],
  x:         ['views', 'likes', 'comments', 'shares', 'engagementRate'],
  tbd:       [],
};

export const METRIC_LABELS: Record<keyof ContentMetricsContract, string> = {
  views: 'Views',
  likes: 'Likes',
  comments: 'Comments',
  shares: 'Shares',
  saves: 'Saves',
  engagementRate: 'Engagement rate',
  reach: 'Reach',
  impressions: 'Impressions',
  watchTime: 'Watch time',
};
