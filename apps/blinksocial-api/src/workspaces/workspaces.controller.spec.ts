import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { WorkspacesController } from './workspaces.controller';
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

describe('WorkspacesController', () => {
  let controller: WorkspacesController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [WorkspacesController],
      providers: [
        WorkspacesService,
        { provide: 'MOCK_DATA_SERVICE', useFactory: buildMockDataService },
      ],
    }).compile();
    controller = module.get(WorkspacesController);
  });

  it('should return 201 with valid request', () => {
    const result = controller.create(buildValidPayload() as never);
    expect(result.id).toBeDefined();
    expect(result.workspaceName).toBe('Test Workspace');
    expect(result.status).toBe('active');
  });

  it('should throw BadRequestException with invalid request', () => {
    const payload = buildValidPayload();
    delete (payload.general as Record<string, unknown>)['workspaceName'];
    expect(() => controller.create(payload as never)).toThrow(BadRequestException);
  });

  describe('getSettings', () => {
    it('should return settings for known workspace and tab', async () => {
      const result = await controller.getSettings('hive-collective', 'general');
      expect(result).toEqual({ workspaceName: 'Hive Collective' });
    });

    it('should throw NotFoundException for unknown workspace', async () => {
      await expect(controller.getSettings('unknown', 'general')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateSettings', () => {
    it('should return data for mock workspace', async () => {
      const data = { workspaceName: 'Updated' };
      const result = await controller.updateSettings('hive-collective', 'general', data);
      expect(result).toEqual(data);
    });
  });
});
