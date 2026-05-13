import {
  extractHashtagsFromCaption,
  syncCaptionWithHashtags,
} from './caption-hashtag.utils';

describe('extractHashtagsFromCaption', () => {
  it('returns an empty array when there are no hashtags', () => {
    expect(extractHashtagsFromCaption('Hello world')).toEqual([]);
  });

  it('extracts a single trailing hashtag', () => {
    expect(extractHashtagsFromCaption('Try this #wellness')).toEqual(['#wellness']);
  });

  it('extracts multiple hashtags in order of first appearance', () => {
    expect(
      extractHashtagsFromCaption('Try #a then #b and finally #c'),
    ).toEqual(['#a', '#b', '#c']);
  });

  it('dedupes hashtags that appear more than once', () => {
    expect(
      extractHashtagsFromCaption('#wellness now and #wellness later'),
    ).toEqual(['#wellness']);
  });

  it('handles tags at start, middle, and end of caption', () => {
    expect(
      extractHashtagsFromCaption('#open story #middle thing #end'),
    ).toEqual(['#open', '#middle', '#end']);
  });

  it('handles underscores and digits in tags', () => {
    expect(
      extractHashtagsFromCaption('Check out #yoga_flow_2026 today'),
    ).toEqual(['#yoga_flow_2026']);
  });

  it('does not match a lone "#" with no following word', () => {
    expect(extractHashtagsFromCaption('Number sign # alone')).toEqual([]);
  });
});

describe('syncCaptionWithHashtags', () => {
  it('appends a newly-added hashtag to an empty caption', () => {
    expect(syncCaptionWithHashtags('', [], ['#wellness'])).toBe('#wellness');
  });

  it('appends a newly-added hashtag to a non-empty caption with a space prefix', () => {
    expect(
      syncCaptionWithHashtags('Hello world', [], ['#wellness']),
    ).toBe('Hello world #wellness');
  });

  it('appends multiple new hashtags in order', () => {
    expect(
      syncCaptionWithHashtags('Hello', [], ['#a', '#b', '#c']),
    ).toBe('Hello #a #b #c');
  });

  it('does not append a hashtag already present in the caption', () => {
    expect(
      syncCaptionWithHashtags(
        'Try this mobility flow #wellness',
        [],
        ['#wellness'],
      ),
    ).toBe('Try this mobility flow #wellness');
  });

  it('strips a removed hashtag along with its leading whitespace', () => {
    expect(
      syncCaptionWithHashtags('Hello #wellness world', ['#wellness'], []),
    ).toBe('Hello world');
  });

  it('does not strip a longer hashtag when removing a shorter one (whole-word match)', () => {
    expect(
      syncCaptionWithHashtags(
        'Try #wellness today',
        ['#well'],
        [],
      ),
    ).toBe('Try #wellness today');
  });

  it('strips all occurrences when a tag appears multiple times in the caption', () => {
    expect(
      syncCaptionWithHashtags(
        '#wellness now and #wellness later',
        ['#wellness'],
        [],
      ),
    ).toBe('now and later');
  });

  it('collapses double-spaces left after a removal', () => {
    expect(
      syncCaptionWithHashtags('Hello  #x  world', ['#x'], []),
    ).toBe('Hello world');
  });

  it('trims trailing whitespace after a removal at end-of-caption', () => {
    expect(
      syncCaptionWithHashtags('Hello world #x', ['#x'], []),
    ).toBe('Hello world');
  });

  it('handles add + remove in a single diff (replace a hashtag)', () => {
    expect(
      syncCaptionWithHashtags(
        'Try this #old',
        ['#old'],
        ['#new'],
      ),
    ).toBe('Try this #new');
  });

  it('escapes regex metachars in hashtag content (defensive)', () => {
    // Tags should always start with #, but if a user pastes something
    // like #c++ the regex must not blow up.
    expect(
      syncCaptionWithHashtags('Try #c++ today', ['#c++'], []),
    ).toBe('Try today');
  });

  it('is a no-op when oldTags and newTags are identical', () => {
    expect(
      syncCaptionWithHashtags(
        'Hello #a #b',
        ['#a', '#b'],
        ['#a', '#b'],
      ),
    ).toBe('Hello #a #b');
  });

  it('preserves caption-only text when only removals happen and tag is not in caption', () => {
    // User removes a chip that was never appended to the caption (e.g.
    // they typed the caption manually and ignored the chip array).
    expect(
      syncCaptionWithHashtags('Hello world', ['#orphan'], []),
    ).toBe('Hello world');
  });

  it('handles consecutive adds without leaving double spaces', () => {
    let caption = '';
    caption = syncCaptionWithHashtags(caption, [], ['#a']);
    caption = syncCaptionWithHashtags(caption, ['#a'], ['#a', '#b']);
    expect(caption).toBe('#a #b');
  });
});
