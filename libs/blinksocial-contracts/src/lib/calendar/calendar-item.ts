import type { PlatformContract } from '../workspace/content-item.js';

export type CalendarCanonicalTypeContract =
  | 'VIDEO_SHORT_VERTICAL'
  | 'VIDEO_LONG_HORIZONTAL'
  | 'VIDEO_SHORT_HORIZONTAL'
  | 'IMAGE_SINGLE'
  | 'IMAGE_CAROUSEL'
  | 'TEXT_POST'
  | 'LINK_POST'
  | 'DOCUMENT_CAROUSEL_PDF'
  | 'STORY_FRAME_SET'
  | 'LIVE_BROADCAST';

export type CalendarItemStatusContract =
  | 'intake'
  | 'in-progress'
  | 'in-review'
  | 'revisions'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'archived';

export type CalendarPublishingModeContract = 'ORGANIC' | 'PAID_BOOSTED';

export interface CalendarItemFlagsContract {
  hasClaims?: boolean;
  hasTalent?: boolean;
  publishingMode?: CalendarPublishingModeContract;
}

export interface CalendarContentItemContract {
  id: string;
  title: string;
  platform: PlatformContract;
  canonicalType: CalendarCanonicalTypeContract;
  status: CalendarItemStatusContract;
  owner: string;
  scheduleAt: string | null;
  flags?: CalendarItemFlagsContract;
  blockers?: string[];
}
