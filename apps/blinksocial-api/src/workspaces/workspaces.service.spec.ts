import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
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

describe('WorkspacesService', () => {
  let service: WorkspacesService;
  let fsMock: {
    isConfigured: jest.Mock;
    uploadJsonFile: jest.Mock;
    replaceJsonFile: jest.Mock;
    batchRetrieve: jest.Mock;
    listDirectory: jest.Mock;
    listTenants: jest.Mock;
  };

  beforeEach(async () => {
    fsMock = {
      isConfigured: jest.fn().mockReturnValue(false),
      uploadJsonFile: jest.fn().mockResolvedValue({ file_id: 'f1', filename: 'test.json' }),
      replaceJsonFile: jest.fn().mockResolvedValue({ file_id: 'f1', filename: 'test.json' }),
      batchRetrieve: jest.fn().mockResolvedValue([]),
      listDirectory: jest.fn().mockResolvedValue([]),
      listTenants: jest.fn().mockResolvedValue([]),
    };

    const module = await Test.createTestingModule({
      providers: [
        WorkspacesService,
        { provide: AgenticFilesystemService, useValue: fsMock },
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

  describe('create (mock mode)', () => {
    it('should return response with id, tenantId, workspaceName, status, createdAt', async () => {
      fsMock.isConfigured.mockReturnValue(false);
      const payload = buildValidPayload();
      const result = await service.create(payload as never);
      expect(result.id).toBeDefined();
      expect(result.tenantId).toBe('test-workspace');
      expect(result.workspaceName).toBe('Test Workspace');
      expect(result.status).toBe('active');
      expect(result.createdAt).toBeDefined();
    });
  });

  describe('create (real mode)', () => {
    beforeEach(() => {
      fsMock.isConfigured.mockReturnValue(true);
    });

    it('should upload settings, segments, pillars and update registry', async () => {
      const payload = buildValidPayload();
      const result = await service.create(payload as never);

      expect(result.tenantId).toBe('test-workspace');
      expect(result.workspaceName).toBe('Test Workspace');
      expect(result.status).toBe('active');

      // 8 settings + 1 segment + 1 pillar = 10 uploads in parallel
      // + 1 registry upload = 11 total
      expect(fsMock.uploadJsonFile).toHaveBeenCalledTimes(11);

      // Verify settings files
      expect(fsMock.uploadJsonFile).toHaveBeenCalledWith(
        'test-workspace', 'settings', 'general.json', payload.general
      );
      expect(fsMock.uploadJsonFile).toHaveBeenCalledWith(
        'test-workspace', 'settings', 'brand-voice.json', payload.brandVoice
      );

      // Verify audience segment
      expect(fsMock.uploadJsonFile).toHaveBeenCalledWith(
        'test-workspace', 'audience-segments', 's1.json', payload.audienceSegments[0]
      );

      // Verify content pillar
      expect(fsMock.uploadJsonFile).toHaveBeenCalledWith(
        'test-workspace', 'content-pillars', 'p1.json', payload.contentPillars[0]
      );
    });

    it('should create registry when none exists', async () => {
      fsMock.listDirectory.mockResolvedValue([]);
      const payload = buildValidPayload();
      await service.create(payload as never);

      expect(fsMock.uploadJsonFile).toHaveBeenCalledWith(
        'blinksocial_system',
        'registry',
        'workspaces.json',
        expect.objectContaining({
          workspaces: [expect.objectContaining({ tenantId: 'test-workspace', name: 'Test Workspace' })],
          totalWorkspaces: 1,
        })
      );
    });

    it('should update existing registry', async () => {
      // First call to listDirectory (resolveUniqueTenantId) returns empty
      // Second call (updateRegistry) returns the registry file
      fsMock.listDirectory
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { name: 'workspaces.json', type: 'file', file_id: 'reg-1' },
        ]);
      fsMock.batchRetrieve.mockResolvedValue([{
        file_id: 'reg-1',
        content_type: 'json',
        content: {
          workspaces: [{ tenantId: 'existing', name: 'Existing', status: 'active', createdAt: '2026-01-01T00:00:00Z' }],
          totalWorkspaces: 1,
        },
      }]);

      const payload = buildValidPayload();
      await service.create(payload as never);

      expect(fsMock.replaceJsonFile).toHaveBeenCalledWith(
        'blinksocial_system',
        'reg-1',
        'workspaces.json',
        expect.objectContaining({ totalWorkspaces: 2 })
      );
    });
  });

  describe('list', () => {
    it('should return mock workspaces when not configured', async () => {
      fsMock.isConfigured.mockReturnValue(false);
      const result = await service.list();
      expect(result.workspaces).toHaveLength(2);
      expect(result.workspaces[0].name).toBe('Hive Collective');
      expect(result.workspaces[1].name).toBe('Booze Kills');
    });

    it('should return empty array when configured but no registry exists', async () => {
      fsMock.isConfigured.mockReturnValue(true);
      fsMock.listDirectory.mockResolvedValue([]);
      const result = await service.list();
      expect(result.workspaces).toHaveLength(0);
    });

    it('should return workspaces from registry when configured', async () => {
      fsMock.isConfigured.mockReturnValue(true);
      fsMock.listDirectory.mockResolvedValue([
        { name: 'workspaces.json', type: 'file', file_id: 'reg-1' },
      ]);
      fsMock.batchRetrieve.mockResolvedValue([{
        file_id: 'reg-1',
        content_type: 'json',
        content: {
          workspaces: [
            { tenantId: 'ws-1', name: 'Workspace 1', status: 'active', brandColor: '#ff0000', createdAt: '2026-01-01T00:00:00Z' },
          ],
          totalWorkspaces: 1,
        },
      }]);

      const result = await service.list();
      expect(result.workspaces).toHaveLength(1);
      expect(result.workspaces[0]).toEqual({
        id: 'ws-1',
        name: 'Workspace 1',
        color: '#ff0000',
        status: 'active',
        createdAt: '2026-01-01T00:00:00Z',
      });
    });
  });
});
