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
      expect(result.totalCount).toBe(19);
      expect(result.items).toHaveLength(19);
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

  describe('getItemFile', () => {
    it('returns null for an unknown workspace', async () => {
      const result = await service.getItemFile('unknown', 'bk-idea1');
      expect(result).toBeNull();
    });

    it('returns null when the item file does not exist', async () => {
      const result = await service.getItemFile('booze-kills', 'does-not-exist');
      expect(result).toBeNull();
    });

    it('returns every booze-kills item from its index keyed by id', async () => {
      const index = await service.getNamespaceAggregate(
        'booze-kills',
        'content-items',
        '_content-items-index.json',
      ) as { items: { id: string }[] };
      expect(index.items).toHaveLength(19);
      for (const entry of index.items) {
        const item = await service.getItemFile('booze-kills', entry.id) as
          | { id: string; pillarIds: string[]; stage: string; title: string }
          | null;
        expect(item).not.toBeNull();
        expect(item?.id).toBe(entry.id);
      }
    });

    it('booze-kills item pillarIds match the brand-voice pillar IDs (no orphan refs)', async () => {
      const brandVoice = await service.getSettings('booze-kills', 'brand-voice') as {
        contentPillars: { id: string }[];
      };
      const pillarIds = new Set(brandVoice.contentPillars.map((p) => p.id));
      const index = await service.getNamespaceAggregate(
        'booze-kills',
        'content-items',
        '_content-items-index.json',
      ) as { items: { id: string }[] };
      for (const entry of index.items) {
        const item = await service.getItemFile('booze-kills', entry.id) as
          | { pillarIds: string[] }
          | null;
        expect(item).not.toBeNull();
        item?.pillarIds.forEach((pid) => {
          expect(pillarIds.has(pid)).toBe(true);
        });
      }
    });
  });

  describe('deleteItemOverride (ticket #126)', () => {
    it('masks the seed JSON so getItemFile returns null after delete', async () => {
      const seeded = await service.getItemFile('booze-kills', 'bk-idea1');
      expect(seeded).not.toBeNull();
      service.deleteItemOverride('booze-kills', 'bk-idea1');
      const result = await service.getItemFile('booze-kills', 'bk-idea1');
      expect(result).toBeNull();
    });

    it('removes a prior override AND masks the seed', async () => {
      service.setItemOverride('booze-kills', 'bk-idea1', {
        id: 'bk-idea1',
        title: 'patched',
      });
      const patched = await service.getItemFile('booze-kills', 'bk-idea1');
      expect((patched as { title: string }).title).toBe('patched');
      service.deleteItemOverride('booze-kills', 'bk-idea1');
      const result = await service.getItemFile('booze-kills', 'bk-idea1');
      expect(result).toBeNull();
    });

    it('a subsequent setItemOverride re-instates the item', async () => {
      service.deleteItemOverride('booze-kills', 'bk-idea1');
      expect(await service.getItemFile('booze-kills', 'bk-idea1')).toBeNull();
      service.setItemOverride('booze-kills', 'bk-idea1', {
        id: 'bk-idea1',
        title: 'restored',
      });
      const result = (await service.getItemFile('booze-kills', 'bk-idea1')) as {
        title: string;
      };
      expect(result.title).toBe('restored');
    });

    it('is a no-op for non-mock workspaces', async () => {
      // Just verify it doesn't throw and doesn't disturb anything.
      service.deleteItemOverride('unknown', 'something');
      // Reads still return null per isMockWorkspace gate.
      const result = await service.getItemFile('unknown', 'something');
      expect(result).toBeNull();
    });
  });

  describe('setAggregateOverride / getAggregateOverride / getNamespaceAggregate (ticket #126)', () => {
    it('a recorded aggregate override is returned by getNamespaceAggregate in preference to the seed', async () => {
      const seed = (await service.getNamespaceAggregate(
        'booze-kills',
        'content-items',
        '_content-items-index.json',
      )) as { items: unknown[] };
      expect(seed.items).toHaveLength(19);
      service.setAggregateOverride(
        'booze-kills',
        'content-items',
        '_content-items-index.json',
        { items: [], totalCount: 0, lastUpdated: 'overridden' },
      );
      const result = (await service.getNamespaceAggregate(
        'booze-kills',
        'content-items',
        '_content-items-index.json',
      )) as { items: unknown[]; lastUpdated: string };
      expect(result.items).toEqual([]);
      expect(result.lastUpdated).toBe('overridden');
    });

    it('aggregate overrides are scoped per (workspace, namespace, filename)', async () => {
      service.setAggregateOverride(
        'booze-kills',
        'content-items',
        '_content-items-index.json',
        { items: ['overridden'] },
      );
      const otherAgg = await service.getNamespaceAggregate(
        'booze-kills',
        'content-items',
        '_content-items-archive-index.json',
      );
      expect(otherAgg).not.toEqual({ items: ['overridden'] });
    });

    it('setAggregateOverride is a no-op for non-mock workspaces', () => {
      service.setAggregateOverride('unknown', 'ns', 'x.json', { x: 1 });
      expect(service.getAggregateOverride('unknown', 'ns', 'x.json')).toBeUndefined();
    });

    it('getAggregateOverride returns undefined when no override has been set', () => {
      expect(
        service.getAggregateOverride('booze-kills', 'content-items', 'nope.json'),
      ).toBeUndefined();
    });
  });

  describe('setItemOverride / getItemFile override layer', () => {
    it('a recorded override is returned by getItemFile in preference to the seed JSON', async () => {
      const seeded = (await service.getItemFile('booze-kills', 'bk-idea1')) as {
        id: string;
        title: string;
      };
      expect(seeded?.id).toBe('bk-idea1');
      const patched = { ...seeded, title: 'overridden title' };
      service.setItemOverride('booze-kills', 'bk-idea1', patched);
      const result = (await service.getItemFile('booze-kills', 'bk-idea1')) as {
        id: string;
        title: string;
      };
      expect(result.title).toBe('overridden title');
    });

    it('overrides are scoped per workspace + itemId — other items still come from disk', async () => {
      const otherSeedBefore = await service.getItemFile('booze-kills', 'bk-idea2');
      service.setItemOverride('booze-kills', 'bk-idea1', { id: 'bk-idea1', title: 'patched' });
      const otherSeedAfter = await service.getItemFile('booze-kills', 'bk-idea2');
      expect(otherSeedAfter).toEqual(otherSeedBefore);
    });

    it('setItemOverride is a no-op for non-mock workspaces (defensive)', async () => {
      service.setItemOverride('unknown', 'whatever', { id: 'whatever' });
      const result = await service.getItemFile('unknown', 'whatever');
      expect(result).toBeNull();
    });

    it('an override for an item that does not exist on disk is still served', async () => {
      service.setItemOverride('booze-kills', 'made-up-id', {
        id: 'made-up-id',
        title: 'invented',
      });
      const result = (await service.getItemFile('booze-kills', 'made-up-id')) as {
        id: string;
        title: string;
      };
      expect(result.title).toBe('invented');
    });
  });
});
