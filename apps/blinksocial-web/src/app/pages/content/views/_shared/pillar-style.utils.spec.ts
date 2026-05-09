import type { ContentPillar } from '../../content.types';
import { hexToRgba, pillarBg, pillarBorder, pillarText } from './pillar-style.utils';

const PILLAR: ContentPillar = {
  id: 'p1',
  name: 'Test',
  description: '',
  color: '#d94e33',
};
const PILLAR_SHORT: ContentPillar = { ...PILLAR, color: '#abc' };
const PILLAR_BAD: ContentPillar = { ...PILLAR, color: 'not-a-hex' };

describe('hexToRgba', () => {
  it('converts 6-digit hex with alpha to rgba()', () => {
    expect(hexToRgba('#d94e33', 0.5)).toBe('rgba(217, 78, 51, 0.500)');
  });

  it('expands 3-digit hex to 6-digit before converting', () => {
    expect(hexToRgba('#abc', 1)).toBe('rgba(170, 187, 204, 1.000)');
  });

  it('returns the input string when it is not a recognizable hex', () => {
    expect(hexToRgba('not-a-hex', 0.5)).toBe('not-a-hex');
    expect(hexToRgba('rgb(0, 0, 0)', 0.5)).toBe('rgb(0, 0, 0)');
    expect(hexToRgba('#abcd', 0.5)).toBe('#abcd'); // 4-digit not supported
  });

  it('formats alpha with 3 decimal places', () => {
    expect(hexToRgba('#000000', 24 / 255)).toBe('rgba(0, 0, 0, 0.094)');
    expect(hexToRgba('#000000', 64 / 255)).toBe('rgba(0, 0, 0, 0.251)');
  });
});

describe('pillarBg / pillarBorder / pillarText', () => {
  it('returns null for all helpers when unselected', () => {
    expect(pillarBg(PILLAR, false)).toBeNull();
    expect(pillarBorder(PILLAR, false)).toBeNull();
    expect(pillarText(PILLAR, false)).toBeNull();
  });

  it('returns rgba() with low alpha for bg + medium alpha for border when selected', () => {
    expect(pillarBg(PILLAR, true)).toBe('rgba(217, 78, 51, 0.094)');
    expect(pillarBorder(PILLAR, true)).toBe('rgba(217, 78, 51, 0.251)');
  });

  it('returns the raw color string for text when selected', () => {
    expect(pillarText(PILLAR, true)).toBe('#d94e33');
  });

  it('handles 3-digit hex pillar colors', () => {
    expect(pillarBg(PILLAR_SHORT, true)).toBe('rgba(170, 187, 204, 0.094)');
    expect(pillarText(PILLAR_SHORT, true)).toBe('#abc');
  });

  it('falls back gracefully for malformed pillar colors (passes through)', () => {
    expect(pillarBg(PILLAR_BAD, true)).toBe('not-a-hex');
    expect(pillarText(PILLAR_BAD, true)).toBe('not-a-hex');
  });
});
