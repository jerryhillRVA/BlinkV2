import {
  Platform,
  PLATFORM_OPTIONS,
  PLATFORM_DISPLAY_NAMES,
  PLATFORM_DISPLAY_OPTIONS,
  displayNameToPlatform,
} from './enums.js';

describe('Platform enum', () => {
  it('should have Tbd as a value', () => {
    expect(Platform.Tbd).toBe('tbd');
  });
});

describe('PLATFORM_OPTIONS', () => {
  it('should be an array of Platform values', () => {
    expect(Array.isArray(PLATFORM_OPTIONS)).toBe(true);
    expect(PLATFORM_OPTIONS.length).toBeGreaterThan(0);
  });

  it('should not include Tbd', () => {
    expect(PLATFORM_OPTIONS).not.toContain(Platform.Tbd);
  });

  it('should include all non-Tbd platforms', () => {
    expect(PLATFORM_OPTIONS).toContain(Platform.Instagram);
    expect(PLATFORM_OPTIONS).toContain(Platform.TikTok);
    expect(PLATFORM_OPTIONS).toContain(Platform.YouTube);
    expect(PLATFORM_OPTIONS).toContain(Platform.Facebook);
    expect(PLATFORM_OPTIONS).toContain(Platform.LinkedIn);
    expect(PLATFORM_OPTIONS).toContain(Platform.Twitter);
    expect(PLATFORM_OPTIONS).toContain(Platform.Slack);
    expect(PLATFORM_OPTIONS).toContain(Platform.Discord);
  });

  it('should have exactly 8 entries', () => {
    expect(PLATFORM_OPTIONS.length).toBe(8);
  });
});

describe('PLATFORM_DISPLAY_OPTIONS', () => {
  it('should be an array of display name strings', () => {
    expect(Array.isArray(PLATFORM_DISPLAY_OPTIONS)).toBe(true);
    expect(PLATFORM_DISPLAY_OPTIONS.length).toBeGreaterThan(0);
  });

  it('should not include TBD', () => {
    expect(PLATFORM_DISPLAY_OPTIONS).not.toContain('TBD');
  });

  it('should include all non-TBD display names', () => {
    expect(PLATFORM_DISPLAY_OPTIONS).toContain('Instagram');
    expect(PLATFORM_DISPLAY_OPTIONS).toContain('TikTok');
    expect(PLATFORM_DISPLAY_OPTIONS).toContain('YouTube');
    expect(PLATFORM_DISPLAY_OPTIONS).toContain('Facebook');
    expect(PLATFORM_DISPLAY_OPTIONS).toContain('LinkedIn');
    expect(PLATFORM_DISPLAY_OPTIONS).toContain('Twitter/X');
    expect(PLATFORM_DISPLAY_OPTIONS).toContain('Slack');
    expect(PLATFORM_DISPLAY_OPTIONS).toContain('Discord');
  });

  it('should have exactly 8 entries', () => {
    expect(PLATFORM_DISPLAY_OPTIONS.length).toBe(8);
  });

  it('should correspond to PLATFORM_OPTIONS display names', () => {
    const derived = PLATFORM_OPTIONS.map((p) => PLATFORM_DISPLAY_NAMES[p]);
    expect(PLATFORM_DISPLAY_OPTIONS).toEqual(derived);
  });
});

describe('displayNameToPlatform', () => {
  it('should map display name back to Platform enum', () => {
    expect(displayNameToPlatform('YouTube')).toBe(Platform.YouTube);
    expect(displayNameToPlatform('Twitter/X')).toBe(Platform.Twitter);
  });

  it('should return undefined for unknown display name', () => {
    expect(displayNameToPlatform('Unknown')).toBeUndefined();
  });
});
