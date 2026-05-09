import type { ContentPillar } from '../../content.types';

/**
 * Convert '#RGB' or '#RRGGBB' + alpha → 'rgba(R, G, B, A)'.
 *
 * Falls back to the original string when the input isn't a recognizable
 * 3- or 6-digit hex (so a malformed pillar.color degrades gracefully —
 * the chip's inline style is invalid but rendering doesn't crash).
 *
 * Used for the data-driven pillar chip tints. We emit rgba() instead of
 * 8-char hex (#RRGGBBAA) for jsdom compatibility — older CSS parsers
 * reject the 8-char form, real browsers accept either.
 */
export function hexToRgba(hex: string, alpha: number): string {
  const m6 = /^#([0-9a-fA-F]{6})$/.exec(hex);
  const m3 = /^#([0-9a-fA-F]{3})$/.exec(hex);
  let r: number;
  let g: number;
  let b: number;
  if (m6) {
    r = parseInt(m6[1].slice(0, 2), 16);
    g = parseInt(m6[1].slice(2, 4), 16);
    b = parseInt(m6[1].slice(4, 6), 16);
  } else if (m3) {
    r = parseInt(m3[1][0] + m3[1][0], 16);
    g = parseInt(m3[1][1] + m3[1][1], 16);
    b = parseInt(m3[1][2] + m3[1][2], 16);
  } else {
    return hex;
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
}

/**
 * Inline-style helpers for pillar chips. Mirror the prototype's
 * `pillar.color + '40'` / `+ '18'` 8-char-hex pattern. Return `null`
 * when unselected so Angular doesn't emit the inline style attribute.
 *
 * Pillar colors are user data, not theme tokens — that's the intentional
 * exception to the project's "always use --blink-* tokens" rule.
 */
export const pillarBg = (p: ContentPillar, selected: boolean): string | null =>
  selected ? hexToRgba(p.color, 24 / 255) : null; // ≈ 0.094 (matches prototype's 0x18)

export const pillarBorder = (p: ContentPillar, selected: boolean): string | null =>
  selected ? hexToRgba(p.color, 64 / 255) : null; // ≈ 0.251 (matches prototype's 0x40)

export const pillarText = (p: ContentPillar, selected: boolean): string | null =>
  selected ? p.color : null;
