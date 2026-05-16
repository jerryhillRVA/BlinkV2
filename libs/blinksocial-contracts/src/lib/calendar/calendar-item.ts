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
  scheduledAt: string | null;
  /** #140: set when status='published'. Calendar derives its event date
   *  from this field for published items (not `scheduledAt`). */
  publishedAt?: string;
  /** #140: true when the post was finished via Export Packet. Calendar
   *  renders an additional gray Exported badge alongside the event. */
  isExported?: boolean;
  flags?: CalendarItemFlagsContract;
  blockers?: string[];
}
