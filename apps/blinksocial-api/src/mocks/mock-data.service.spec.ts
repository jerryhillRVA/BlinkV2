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
  });
});
