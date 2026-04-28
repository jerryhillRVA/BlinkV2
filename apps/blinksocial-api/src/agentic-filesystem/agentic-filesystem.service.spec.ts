import { Test } from '@nestjs/testing';
import axios from 'axios';
import { AgenticFilesystemService } from './agentic-filesystem.service';

vi.mock('axios');

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

  describe('downloadBinaryFile', () => {
    // Regression for D1 (#68): AFS exposes raw download at
    // `GET /v1/{tenant}/files/{file_id}` — the previous implementation
    // appended `/content`, which 404s and silently dropped the binary.
    it('hits /v1/<tenant>/files/<id> (no /content suffix)', async () => {
      process.env['AGENTIC_FS_URL'] = 'http://afs.test';
      const svc = new AgenticFilesystemService();
      const expected = Buffer.from([1, 2, 3]);
      const get = axios.get as unknown as ReturnType<typeof vi.fn>;
      get.mockResolvedValue({ data: expected });

      const out = await svc.downloadBinaryFile('tenant-x', 'file-id-y');

      expect(out.equals(expected)).toBe(true);
      expect(get).toHaveBeenCalledWith(
        'http://afs.test/v1/tenant-x/files/file-id-y',
        expect.objectContaining({ responseType: 'arraybuffer' }),
      );
      const url = get.mock.calls.at(-1)?.[0] as string;
      expect(url).not.toContain('/content');
      delete process.env['AGENTIC_FS_URL'];
    });
  });
});
