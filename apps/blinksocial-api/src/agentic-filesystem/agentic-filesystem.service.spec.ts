import { Test } from '@nestjs/testing';
import { AgenticFilesystemService } from './agentic-filesystem.service';

describe('AgenticFilesystemService', () => {
  let service: AgenticFilesystemService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AgenticFilesystemService],
    }).compile();
    service = module.get(AgenticFilesystemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isConfigured', () => {
    it('should return false when AGENTIC_FS_URL is not set', () => {
      delete process.env['AGENTIC_FS_URL'];
      const svc = new AgenticFilesystemService();
      expect(svc.isConfigured()).toBe(false);
    });

    it('should return true when AGENTIC_FS_URL is set', () => {
      process.env['AGENTIC_FS_URL'] = 'http://localhost:8000';
      const svc = new AgenticFilesystemService();
      expect(svc.isConfigured()).toBe(true);
      delete process.env['AGENTIC_FS_URL'];
    });
  });
});
