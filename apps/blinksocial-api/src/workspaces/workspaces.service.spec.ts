import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { WorkspacesService } from './workspaces.service';

function buildValidPayload() {
  return {
    general: { workspaceName: 'Test Workspace' },
    platforms: {
      globalRules: { defaultPlatform: 'youtube', maxIdeasPerMonth: 30 },
      platforms: [{ platformId: 'youtube', enabled: true }],
    },
    brandVoice: {},
    contentPillars: [
      { id: 'p1', name: 'News', description: 'News pillar', color: '#d94e33' },
    ],
    audienceSegments: [
      { id: 's1', name: 'Engineers', description: 'Dev audience' },
    ],
    skills: {
      skills: [{ id: 'sk1', skillId: 'reporter', name: 'Reporter', role: 'News' }],
    },
  };
}

function buildMockDataService() {
  return {
    isMockWorkspace: (id: string) => id === 'hive-collective',
    getSettings: async (id: string, tab: string) => {
      if (id === 'hive-collective' && tab === 'general') {
        return { workspaceName: 'Hive Collective' };
      }
      return null;
    },
  };
}

describe('WorkspacesService', () => {
  let service: WorkspacesService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        WorkspacesService,
        { provide: 'MOCK_DATA_SERVICE', useFactory: buildMockDataService },
      ],
    }).compile();
    service = module.get(WorkspacesService);
  });

  describe('validate', () => {
    it('should pass for valid data', () => {
      expect(() => service.validate(buildValidPayload())).not.toThrow();
    });

    it('should throw BadRequestException for invalid data', () => {
      const payload = buildValidPayload();
      delete (payload.general as Record<string, unknown>)['workspaceName'];
      expect(() => service.validate(payload)).toThrow(BadRequestException);
    });
  });

  describe('create', () => {
    it('should return response with id, workspaceName, status, createdAt', () => {
      const payload = buildValidPayload();
      const result = service.create(payload as never);
      expect(result.id).toBeDefined();
      expect(result.workspaceName).toBe('Test Workspace');
      expect(result.status).toBe('active');
      expect(result.createdAt).toBeDefined();
    });
  });

  describe('getSettings', () => {
    it('should return mock data for known workspace and tab', async () => {
      const result = await service.getSettings('hive-collective', 'general');
      expect(result).toEqual({ workspaceName: 'Hive Collective' });
    });

    it('should throw NotFoundException for unknown tab', async () => {
      await expect(service.getSettings('hive-collective', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException for unknown workspace', async () => {
      await expect(service.getSettings('unknown-workspace', 'general')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when mock returns null', async () => {
      await expect(service.getSettings('hive-collective', 'team')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateSettings', () => {
    it('should return data unchanged for mock workspace', async () => {
      const data = { workspaceName: 'Updated Name' };
      const result = await service.updateSettings('hive-collective', 'general', data);
      expect(result).toEqual(data);
    });

    it('should throw NotFoundException for unknown tab', async () => {
      await expect(service.updateSettings('hive-collective', 'bad-tab', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException for unknown workspace', async () => {
      await expect(service.updateSettings('unknown', 'general', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
