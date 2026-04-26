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

    it('should include brandVoice in general settings for hive-collective', async () => {
      const result = await service.getSettings('hive-collective', 'general') as Record<string, unknown>;
      expect(result['brandVoice']).toBeDefined();
      expect(typeof result['brandVoice']).toBe('string');
      expect((result['brandVoice'] as string).length).toBeGreaterThan(0);
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
      expect(pillars).toHaveLength(5);
      expect(pillars.map((p) => p.id)).toEqual(['p1', 'p2', 'p3', 'p4', 'p5']);
    });

    it('should return brand-voice settings with audienceSegments for hive-collective', async () => {
      const result = await service.getSettings('hive-collective', 'brand-voice') as Record<string, unknown>;
      const segments = result['audienceSegments'] as { id: string }[];
      expect(segments).toHaveLength(5);
      expect(segments.map((s) => s.id)).toEqual(['s1', 's2', 's3', 's4', 's5']);
    });

    it('should return brand-voice settings with contentPillars for booze-kills', async () => {
      const result = await service.getSettings('booze-kills', 'brand-voice') as Record<string, unknown>;
      const pillars = result['contentPillars'] as { id: string; name: string }[];
      expect(pillars).toHaveLength(4);
      expect(pillars.map((p) => p.id)).toEqual(['bk-p1', 'bk-p2', 'bk-p3', 'bk-p4']);
    });

    it('should return brand-voice settings with audienceSegments for booze-kills', async () => {
      const result = await service.getSettings('booze-kills', 'brand-voice') as Record<string, unknown>;
      const segments = result['audienceSegments'] as { id: string }[];
      expect(segments).toHaveLength(3);
      expect(segments.map((s) => s.id)).toEqual(['bk-s1', 'bk-s2', 'bk-s3']);
    });
  });

  describe('getNamespaceAggregate', () => {
    it('should return populated content-items index for booze-kills', async () => {
      const result = await service.getNamespaceAggregate(
        'booze-kills',
        'content-items',
        '_content-items-index.json',
      ) as { items: { id: string; pillarIds: string[] }[]; totalCount: number };
      expect(result.totalCount).toBe(10);
      expect(result.items).toHaveLength(10);
      // Every item's pillarIds should resolve against the brand-voice pillar IDs
      const brandVoice = await service.getSettings('booze-kills', 'brand-voice') as {
        contentPillars: { id: string }[];
      };
      const pillarIds = new Set(brandVoice.contentPillars.map((p) => p.id));
      result.items.forEach((item) => {
        item.pillarIds.forEach((pid) => {
          expect(pillarIds.has(pid)).toBe(true);
        });
      });
    });

    it('should ensure hive-collective content-item pillarIds resolve against brand-voice pillars', async () => {
      const index = await service.getNamespaceAggregate(
        'hive-collective',
        'content-items',
        '_content-items-index.json',
      ) as { items: { id: string; pillarIds: string[] }[] };
      const brandVoice = await service.getSettings('hive-collective', 'brand-voice') as {
        contentPillars: { id: string }[];
      };
      const pillarIds = new Set(brandVoice.contentPillars.map((p) => p.id));
      index.items.forEach((item) => {
        item.pillarIds.forEach((pid) => {
          expect(pillarIds.has(pid)).toBe(true);
        });
      });
    });
  });
});
