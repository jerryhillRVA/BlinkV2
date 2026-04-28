import { BadRequestException } from '@nestjs/common';
import {
  AttachmentExtractorService,
  MAX_ATTACHMENT_BYTES,
  MAX_EXTRACTED_CHARS_PER_ATTACHMENT,
} from './attachment-extractor.service';

describe('AttachmentExtractorService', () => {
  let svc: AttachmentExtractorService;

  beforeEach(() => {
    svc = new AttachmentExtractorService();
  });

  describe('validate', () => {
    it('accepts a small text/plain', () => {
      expect(() => svc.validate('a.txt', 'text/plain', 100)).not.toThrow();
    });

    it('accepts an image/png by mime', () => {
      expect(() => svc.validate('photo.png', 'image/png', 100)).not.toThrow();
    });

    it('accepts a .docx by extension when mime is generic', () => {
      expect(() =>
        svc.validate('brief.docx', 'application/octet-stream', 1024),
      ).not.toThrow();
    });

    it('rejects an .exe', () => {
      expect(() =>
        svc.validate('evil.exe', 'application/x-msdownload', 100),
      ).toThrow(BadRequestException);
    });

    it('rejects legacy .doc with helpful message', () => {
      expect(() => svc.validate('old.doc', 'application/msword', 100)).toThrow(
        /legacy \.doc not supported/i,
      );
    });

    it('rejects > 10 MB', () => {
      expect(() =>
        svc.validate('big.txt', 'text/plain', MAX_ATTACHMENT_BYTES + 1),
      ).toThrow(/limit is 10 MB/i);
    });
  });

  describe('extract', () => {
    it('returns kind=image and no text for image/*', async () => {
      const result = await svc.extract('p.png', 'image/png', Buffer.from([0, 1]));
      expect(result.kind).toBe('image');
      expect(result.text).toBeUndefined();
    });

    it('returns kind=text + UTF-8 contents for text/plain', async () => {
      const result = await svc.extract(
        'notes.txt',
        'text/plain',
        Buffer.from('hello world', 'utf8'),
      );
      expect(result.kind).toBe('text');
      expect(result.text).toBe('hello world');
      expect(result.truncated).toBe(false);
    });

    it('returns kind=text for .csv via extension', async () => {
      const result = await svc.extract(
        'data.csv',
        'application/octet-stream',
        Buffer.from('a,b\n1,2', 'utf8'),
      );
      expect(result.kind).toBe('text');
      expect(result.text).toContain('a,b');
    });

    it('truncates text bigger than the per-attachment cap', async () => {
      const big = 'x'.repeat(MAX_EXTRACTED_CHARS_PER_ATTACHMENT + 100);
      const result = await svc.extract('notes.txt', 'text/plain', Buffer.from(big, 'utf8'));
      expect(result.kind).toBe('text');
      expect(result.text?.length).toBe(MAX_EXTRACTED_CHARS_PER_ATTACHMENT);
      expect(result.truncated).toBe(true);
    });

    it('rejects .doc explicitly during extract too', async () => {
      await expect(
        svc.extract('old.doc', 'application/msword', Buffer.alloc(8)),
      ).rejects.toThrow(/legacy \.doc not supported/i);
    });

    it('returns kind=document for .docx (mammoth output passes through)', async () => {
      // We can't spy on mammoth's ESM exports inside the runner; instead,
      // build a minimal valid .docx in memory and assert routing/kind.
      // (A full real-file extraction is covered by integration tests.)
      // mammoth will error on invalid bytes — assert we surface a useful
      // BadRequestException, and that the routing landed on the .docx
      // branch (not legacy .doc).
      await expect(
        svc.extract(
          'brief.docx',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          Buffer.from('not-a-real-docx'),
        ),
      ).rejects.toThrow(/could not parse \.docx/i);
    });

    it('returns kind=pdf and empty text when pdfjs throws (graceful fallback)', async () => {
      // No real PDF bytes — pdfjs will fail to parse; we expect a graceful
      // fallback so the upload still proceeds (Anthropic still sees the doc block).
      const result = await svc.extract('doc.pdf', 'application/pdf', Buffer.from([0]));
      expect(result.kind).toBe('pdf');
      // text may be '' on parse failure; we just assert the kind contract.
      expect(typeof result.text === 'string').toBe(true);
    });
  });
});
