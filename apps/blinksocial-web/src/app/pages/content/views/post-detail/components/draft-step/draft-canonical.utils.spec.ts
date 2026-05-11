import {
  draftModeLabel,
  getCanonicalType,
  getDraftMode,
  isDraftModeSupported,
} from './draft-canonical.utils';

describe('getCanonicalType', () => {
  it('maps instagram/reel → VIDEO_SHORT_VERTICAL', () => {
    expect(getCanonicalType('instagram', 'reel')).toBe('VIDEO_SHORT_VERTICAL');
  });

  it('maps instagram/feed-post → IMAGE_SINGLE', () => {
    expect(getCanonicalType('instagram', 'feed-post')).toBe('IMAGE_SINGLE');
  });

  it('maps youtube/long-form → VIDEO_LONG_HORIZONTAL', () => {
    expect(getCanonicalType('youtube', 'long-form')).toBe(
      'VIDEO_LONG_HORIZONTAL',
    );
  });

  it('returns undefined when platform missing', () => {
    expect(getCanonicalType(null, 'reel')).toBeUndefined();
  });

  it('returns undefined when contentType missing', () => {
    expect(getCanonicalType('instagram', null)).toBeUndefined();
  });

  it('returns undefined for an unmapped pair', () => {
    expect(getCanonicalType('youtube', 'reel')).toBeUndefined();
  });
});

describe('getDraftMode', () => {
  // Text-content-type override layer
  it('linkedin/ln-text-post → TEXT (text-override beats reverse-map IMAGE_SINGLE)', () => {
    expect(getDraftMode('linkedin', 'ln-text-post')).toBe('TEXT');
  });

  it('linkedin/ln-article → TEXT', () => {
    expect(getDraftMode('linkedin', 'ln-article')).toBe('TEXT');
  });

  it('youtube/community-post → TEXT', () => {
    expect(getDraftMode('youtube', 'community-post')).toBe('TEXT');
  });

  it('facebook/fb-link-post → TEXT', () => {
    expect(getDraftMode('facebook', 'fb-link-post')).toBe('TEXT');
  });

  // Image-content-type override layer
  it('instagram/feed-post → IMAGE_SINGLE', () => {
    expect(getDraftMode('instagram', 'feed-post')).toBe('IMAGE_SINGLE');
  });

  it('facebook/fb-feed-post → IMAGE_SINGLE (image-override beats VIDEO_LONG_HORIZONTAL)', () => {
    expect(getDraftMode('facebook', 'fb-feed-post')).toBe('IMAGE_SINGLE');
  });

  // Canonical-mapping layer
  it('instagram/reel → VIDEO', () => {
    expect(getDraftMode('instagram', 'reel')).toBe('VIDEO');
  });

  it('youtube/long-form → VIDEO_LONG', () => {
    expect(getDraftMode('youtube', 'long-form')).toBe('VIDEO_LONG');
  });

  it('instagram/carousel → CAROUSEL', () => {
    expect(getDraftMode('instagram', 'carousel')).toBe('CAROUSEL');
  });

  it('tiktok/photo-carousel → CAROUSEL', () => {
    expect(getDraftMode('tiktok', 'photo-carousel')).toBe('CAROUSEL');
  });

  it('linkedin/ln-document → CAROUSEL', () => {
    expect(getDraftMode('linkedin', 'ln-document')).toBe('CAROUSEL');
  });

  it('instagram/story → STORY', () => {
    expect(getDraftMode('instagram', 'story')).toBe('STORY');
  });

  it('facebook/fb-story → STORY', () => {
    expect(getDraftMode('facebook', 'fb-story')).toBe('STORY');
  });

  it('instagram/live → LIVE', () => {
    expect(getDraftMode('instagram', 'live')).toBe('LIVE');
  });

  it('falls back to VIDEO for missing platform/contentType', () => {
    expect(getDraftMode(null, null)).toBe('VIDEO');
    expect(getDraftMode('instagram', null)).toBe('VIDEO');
  });

  it('falls back to VIDEO when no canonical entry matches', () => {
    expect(getDraftMode('youtube', 'reel')).toBe('VIDEO');
  });
});

describe('isDraftModeSupported', () => {
  it.each(['VIDEO', 'VIDEO_LONG', 'IMAGE_SINGLE', 'CAROUSEL', 'TEXT'] as const)(
    '%s is supported',
    (mode) => {
      expect(isDraftModeSupported(mode)).toBe(true);
    },
  );

  it.each(['DOCUMENT', 'STORY', 'LIVE', 'LINK'] as const)(
    '%s is unsupported',
    (mode) => {
      expect(isDraftModeSupported(mode)).toBe(false);
    },
  );
});

describe('draftModeLabel', () => {
  it.each([
    ['VIDEO', 'Short video'],
    ['VIDEO_LONG', 'Long-form video'],
    ['IMAGE_SINGLE', 'Image post'],
    ['CAROUSEL', 'Carousel'],
    ['TEXT', 'Text post'],
    ['DOCUMENT', 'Document carousel'],
    ['STORY', 'Story'],
    ['LIVE', 'Live broadcast'],
    ['LINK', 'Link post'],
  ] as const)('%s → %s', (mode, label) => {
    expect(draftModeLabel(mode)).toBe(label);
  });
});
