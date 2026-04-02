import { MockDataService } from './mock-data.service';

describe('MockDataService', () => {
  let service: MockDataService;

  beforeEach(() => {
    service = new MockDataService();
  });

  describe('isMockWorkspace', () => {
    it('should return true for hive-collective', () => {
      expect(service.isMockWorkspace('hive-collective')).toBe(true);
    });

    it('should return true for booze-kills', () => {
      expect(service.isMockWorkspace('booze-kills')).toBe(true);
    });

    it('should return false for unknown workspace', () => {
      expect(service.isMockWorkspace('unknown')).toBe(false);
    });
  });

  describe('getSettings', () => {
    it('should return null for unknown workspace', async () => {
      const result = await service.getSettings('unknown', 'general');
      expect(result).toBeNull();
    });

    it('should return null for unknown tab', async () => {
      const result = await service.getSettings('hive-collective', 'nonexistent');
      expect(result).toBeNull();
    });

    it('should return parsed JSON for valid workspace and tab', async () => {
      const result = await service.getSettings('hive-collective', 'general');
      expect(result).toBeDefined();
      expect((result as Record<string, unknown>)['workspaceName']).toBe('Hive Collective');
    });

    it('should include audienceSegments in general settings for hive-collective', async () => {
      const result = await service.getSettings('hive-collective', 'general') as Record<string, unknown>;
      expect(result['audienceSegments']).toBeDefined();
      expect(Array.isArray(result['audienceSegments'])).toBe(true);
      const segments = result['audienceSegments'] as { id: string; description: string; ageRange: string }[];
      expect(segments.length).toBeGreaterThan(0);
      expect(segments[0]).toHaveProperty('id');
      expect(segments[0]).toHaveProperty('description');
      expect(segments[0]).toHaveProperty('ageRange');
    });

    it('should include brandVoice in general settings for hive-collective', async () => {
      const result = await service.getSettings('hive-collective', 'general') as Record<string, unknown>;
      expect(result['brandVoice']).toBeDefined();
      expect(typeof result['brandVoice']).toBe('string');
      expect((result['brandVoice'] as string).length).toBeGreaterThan(0);
    });

    it('should include audienceSegments in general settings for booze-kills', async () => {
      const result = await service.getSettings('booze-kills', 'general') as Record<string, unknown>;
      expect(result['audienceSegments']).toBeDefined();
      expect(Array.isArray(result['audienceSegments'])).toBe(true);
    });

    it('should include brandVoice in general settings for booze-kills', async () => {
      const result = await service.getSettings('booze-kills', 'general') as Record<string, unknown>;
      expect(result['brandVoice']).toBeDefined();
      expect(typeof result['brandVoice']).toBe('string');
    });

    it('should return skills with required fields for hive-collective', async () => {
      const result = await service.getSettings('hive-collective', 'skills') as Record<string, unknown>;
      expect(result['skills']).toBeDefined();
      const skills = result['skills'] as { id: string; name: string; role: string; responsibilities?: string[] }[];
      expect(skills.length).toBeGreaterThan(0);
      expect(skills[0]).toHaveProperty('id');
      expect(skills[0]).toHaveProperty('name');
      expect(skills[0]).toHaveProperty('role');
      expect(skills[0]).toHaveProperty('responsibilities');
    });

    it('should return calendar settings with deadline templates for hive-collective', async () => {
      const result = await service.getSettings('hive-collective', 'calendar') as Record<string, unknown>;
      expect(result['deadlineTemplates']).toBeDefined();
      expect(result['reminderSettings']).toBeDefined();
    });

    it('should return team settings with members for hive-collective', async () => {
      const result = await service.getSettings('hive-collective', 'team') as Record<string, unknown>;
      expect(result['members']).toBeDefined();
      const members = result['members'] as { id: string; name: string; email: string; role: string }[];
      expect(members.length).toBeGreaterThan(0);
      expect(members[0]).toHaveProperty('name');
      expect(members[0]).toHaveProperty('email');
      expect(members[0]).toHaveProperty('role');
    });

    it('should return team settings with members for booze-kills', async () => {
      const result = await service.getSettings('booze-kills', 'team') as Record<string, unknown>;
      expect(result['members']).toBeDefined();
      const members = result['members'] as { id: string }[];
      expect(members.length).toBeGreaterThan(0);
    });

    it('should return brand-voice settings with contentPillars for hive-collective', async () => {
      const result = await service.getSettings('hive-collective', 'brand-voice') as Record<string, unknown>;
      expect(result['brandVoiceDescription']).toBeDefined();
      expect(result['contentPillars']).toBeDefined();
      const pillars = result['contentPillars'] as { id: string; name: string }[];
      expect(pillars.length).toBeGreaterThan(0);
    });
  });
});
