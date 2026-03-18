import { BadRequestException } from '@nestjs/common';
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

describe('WorkspacesController', () => {
  let controller: WorkspacesController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [WorkspacesController],
      providers: [WorkspacesService],
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
});
