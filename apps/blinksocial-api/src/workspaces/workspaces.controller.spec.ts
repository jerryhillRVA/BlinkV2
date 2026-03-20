import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { AgenticFilesystemService } from '../agentic-filesystem/agentic-filesystem.service';

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
    const fsMock = {
      isConfigured: jest.fn().mockReturnValue(false),
      uploadJsonFile: jest.fn().mockResolvedValue({ file_id: 'f1' }),
      replaceJsonFile: jest.fn().mockResolvedValue({ file_id: 'f1' }),
      batchRetrieve: jest.fn().mockResolvedValue([]),
      listDirectory: jest.fn().mockResolvedValue([]),
      listTenants: jest.fn().mockResolvedValue([]),
    };

    const module = await Test.createTestingModule({
      controllers: [WorkspacesController],
      providers: [
        WorkspacesService,
        { provide: AgenticFilesystemService, useValue: fsMock },
      ],
    }).compile();
    controller = module.get(WorkspacesController);
  });

  it('should return response with valid request', async () => {
    const result = await controller.create(buildValidPayload() as never);
    expect(result.id).toBeDefined();
    expect(result.workspaceName).toBe('Test Workspace');
    expect(result.status).toBe('active');
  });

  it('should throw BadRequestException with invalid request', async () => {
    const payload = buildValidPayload();
    delete (payload.general as Record<string, unknown>)['workspaceName'];
    await expect(controller.create(payload as never)).rejects.toThrow(BadRequestException);
  });

  it('should list workspaces', async () => {
    const result = await controller.list();
    expect(result.workspaces).toBeDefined();
    expect(Array.isArray(result.workspaces)).toBe(true);
  });
});
