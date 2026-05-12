/**
 * Pull every `#tag` token out of a string, preserving order of first
 * appearance and skipping duplicates. Token shape: `#` followed by one
 * or more alphanumeric / underscore characters (matches the rest of the
 * file's whole-word convention).
 *
 * Used when AI Generate Caption produces text that already contains
 * hashtags inline — we surface them as removable chips without
 * stripping them from the caption.
 */
export function extractHashtagsFromCaption(caption: string): string[] {
  const matches = caption.match(/#[a-zA-Z0-9_]+/g) ?? [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of matches) {
    if (seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
  }
  return out;
}

/**
 * Sync a caption with a diff between old and new hashtag sets. Newly-added
 * tags are appended to the caption (skipping any that are already present);
 * removed tags are stripped from the caption (matching whole-word, so
 * removing `#well` doesn't eat `#wellness`).
 *
 * Returns the updated caption — pure; no side effects.
 *
 * Prototype source: `appendPkgHashtag` at PackagingStudio.tsx:615-620
 * appends on add but does not strip on remove. We extend with strip-on-remove
 * per the team decision (#116) so caption + chip array stay in sync both ways.
 */
export function syncCaptionWithHashtags(
  caption: string,
  oldTags: readonly string[],
  newTags: readonly string[],
): string {
  const oldSet = new Set(oldTags);
  const newSet = new Set(newTags);
  const added = newTags.filter((t) => !oldSet.has(t));
  const removed = oldTags.filter((t) => !newSet.has(t));

  let next = caption;

  for (const tag of removed) {
    // Match the tag with any preceding whitespace; ensure word-boundary
    // after so removing #well doesn't strike #wellness. Tags may include
    // `.`, `_`, etc — escape regex metachars.
    const escaped = escapeRegExp(tag);
    const regex = new RegExp(`\\s*${escaped}(?![a-zA-Z0-9_])`, 'g');
    next = next.replace(regex, '');
  }
  // Collapse any double spaces left behind, then trim trailing AND leading
  // whitespace introduced by the removal. (Tag-at-position-0 leaves a stray
  // leading space when its trailing whitespace stays attached to the next
  // word's prefix.)
  next = next
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+$/g, '')
    .replace(/^[ \t]+/g, '');

  for (const tag of added) {
    if (containsTag(next, tag)) continue;
    next = next.trimEnd() === '' ? tag : `${next.trimEnd()} ${tag}`;
  }

  return next;
}

/**
 * Whole-word check: returns true iff `tag` appears in `text` as a complete
 * token (not as a substring of a longer hashtag).
 */
function containsTag(text: string, tag: string): boolean {
  const escaped = escapeRegExp(tag);
  const regex = new RegExp(`(^|\\s)${escaped}(?![a-zA-Z0-9_])`);
  return regex.test(text);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
