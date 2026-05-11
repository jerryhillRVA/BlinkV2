import type {
  DraftModeContract,
  PlatformContract,
  ContentTypeContract,
} from '@blinksocial/contracts';

export type CanonicalContentType =
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

const CANONICAL_TO_CONTENT_TYPE: Record<
  PlatformContract,
  Partial<Record<CanonicalContentType, ContentTypeContract>>
> = {
  instagram: {
    VIDEO_SHORT_VERTICAL: 'reel',
    IMAGE_SINGLE: 'feed-post',
    IMAGE_CAROUSEL: 'carousel',
    STORY_FRAME_SET: 'story',
    LIVE_BROADCAST: 'live',
  },
  tiktok: {
    VIDEO_SHORT_VERTICAL: 'short-video',
    IMAGE_CAROUSEL: 'photo-carousel',
    LIVE_BROADCAST: 'short-video',
  },
  youtube: {
    VIDEO_LONG_HORIZONTAL: 'long-form',
    VIDEO_SHORT_VERTICAL: 'shorts',
    LIVE_BROADCAST: 'live-stream',
    TEXT_POST: 'community-post',
  },
  facebook: {
    VIDEO_SHORT_VERTICAL: 'fb-reel',
    VIDEO_LONG_HORIZONTAL: 'fb-feed-post',
    IMAGE_SINGLE: 'fb-feed-post',
    IMAGE_CAROUSEL: 'fb-feed-post',
    STORY_FRAME_SET: 'fb-story',
    LINK_POST: 'fb-link-post',
    LIVE_BROADCAST: 'fb-live',
  },
  linkedin: {
    VIDEO_SHORT_VERTICAL: 'ln-video',
    VIDEO_LONG_HORIZONTAL: 'ln-video',
    VIDEO_SHORT_HORIZONTAL: 'ln-video',
    IMAGE_SINGLE: 'ln-text-post',
    IMAGE_CAROUSEL: 'ln-document',
    TEXT_POST: 'ln-text-post',
    LINK_POST: 'ln-text-post',
    DOCUMENT_CAROUSEL_PDF: 'ln-document',
  },
  tbd: {
    VIDEO_SHORT_VERTICAL: 'reel',
    IMAGE_SINGLE: 'feed-post',
    IMAGE_CAROUSEL: 'carousel',
  },
};

/**
 * Resolve the canonical content type for a (platform, contentType) pair.
 * Returns undefined when no entry maps to the given contentType (e.g. an
 * unsupported platform/type combo).
 */
export function getCanonicalType(
  platform: PlatformContract | null | undefined,
  contentType: ContentTypeContract | null | undefined,
): CanonicalContentType | undefined {
  if (!platform || !contentType) return undefined;
  const platformMap = CANONICAL_TO_CONTENT_TYPE[platform];
  const entries = Object.entries(platformMap) as [
    CanonicalContentType,
    ContentTypeContract,
  ][];
  return entries.find(([, ct]) => ct === contentType)?.[0];
}

const CANONICAL_TO_DRAFT_MODE: Record<CanonicalContentType, DraftModeContract> = {
  VIDEO_SHORT_VERTICAL: 'VIDEO',
  VIDEO_SHORT_HORIZONTAL: 'VIDEO',
  VIDEO_LONG_HORIZONTAL: 'VIDEO_LONG',
  IMAGE_SINGLE: 'IMAGE_SINGLE',
  IMAGE_CAROUSEL: 'CAROUSEL',
  TEXT_POST: 'TEXT',
  LINK_POST: 'LINK',
  DOCUMENT_CAROUSEL_PDF: 'DOCUMENT',
  STORY_FRAME_SET: 'STORY',
  LIVE_BROADCAST: 'LIVE',
};

// contentType-based overrides take priority — the reverse map can be ambiguous
// (e.g. ln-text-post maps to IMAGE_SINGLE before TEXT_POST,
// fb-feed-post maps to VIDEO_LONG_HORIZONTAL before IMAGE_SINGLE).
const TEXT_CONTENT_TYPES: ContentTypeContract[] = [
  'ln-text-post',
  'ln-article',
  'community-post',
  'fb-link-post',
  'guide',
];
const IMAGE_CONTENT_TYPES: ContentTypeContract[] = ['feed-post', 'fb-feed-post'];

/**
 * Resolve the DraftMode for a (platform, contentType) pair. Mirrors the
 * prototype's ContentBuilderStudio.tsx:528-542 dispatch.
 *
 *   1. Text content types → TEXT
 *   2. Image content types → IMAGE_SINGLE
 *   3. Reverse-mapped canonical type → mode
 *   4. Fallback → VIDEO
 */
export function getDraftMode(
  platform: PlatformContract | null | undefined,
  contentType: ContentTypeContract | null | undefined,
): DraftModeContract {
  if (contentType && TEXT_CONTENT_TYPES.includes(contentType)) return 'TEXT';
  if (contentType && IMAGE_CONTENT_TYPES.includes(contentType))
    return 'IMAGE_SINGLE';
  const canonical = getCanonicalType(platform, contentType);
  if (canonical) return CANONICAL_TO_DRAFT_MODE[canonical];
  return 'VIDEO';
}

export const SUPPORTED_DRAFT_MODES: DraftModeContract[] = [
  'VIDEO',
  'VIDEO_LONG',
  'IMAGE_SINGLE',
  'CAROUSEL',
  'TEXT',
];

export function isDraftModeSupported(mode: DraftModeContract): boolean {
  return SUPPORTED_DRAFT_MODES.includes(mode);
}

export function draftModeLabel(mode: DraftModeContract): string {
  switch (mode) {
    case 'VIDEO':
      return 'Short video';
    case 'VIDEO_LONG':
      return 'Long-form video';
    case 'IMAGE_SINGLE':
      return 'Image post';
    case 'CAROUSEL':
      return 'Carousel';
    case 'TEXT':
      return 'Text post';
    case 'DOCUMENT':
      return 'Document carousel';
    case 'STORY':
      return 'Story';
    case 'LIVE':
      return 'Live broadcast';
    case 'LINK':
      return 'Link post';
  }
}
