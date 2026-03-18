import { BadRequestException } from '@nestjs/common';
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

describe('WorkspacesService', () => {
  let service: WorkspacesService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [WorkspacesService],
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
});
