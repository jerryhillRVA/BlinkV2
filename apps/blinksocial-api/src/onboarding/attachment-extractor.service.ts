import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as mammoth from 'mammoth';
import type { OnboardingAttachmentKind } from '@blinksocial/contracts';

/**
 * Hard caps per attachment, enforced uniformly across MIME types. The 10 MB
 * per-file limit is also enforced upstream by `FilesInterceptor` in the
 * onboarding controller; we re-check here as defense-in-depth.
 */
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Maximum amount of extracted text we keep per attachment. Per-session
 * budgeting (FIFO truncation across all attachments) lives in
 * {@link OnboardingService}.
 */
export const MAX_EXTRACTED_CHARS_PER_ATTACHMENT = 50_000;

/** Allow-list of accepted MIME types (`type/subtype` exact or prefix match). */
const ALLOWED_MIME_PREFIXES = ['image/', 'text/'];
const ALLOWED_MIME_EXACT = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc — explicitly rejected below with a friendlier error
  'application/rtf',
  'text/rtf',
  'text/markdown',
  'text/csv',
  'application/octet-stream', // many browsers send .md/.csv this way
]);

const ALLOWED_EXTENSIONS = new Set([
  '.txt',
  '.md',
  '.csv',
  '.rtf',
  '.doc',
  '.docx',
  '.pdf',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
]);

const TEXT_EXTENSIONS = new Set(['.txt', '.md', '.csv', '.rtf']);
const IMAGE_MIME_RE = /^image\//;

export interface ExtractedAttachment {
  /** What kind of LLM transport this attachment uses. */
  kind: OnboardingAttachmentKind;
  /**
   * Plain-text contents (UTF-8) extracted from the file, if applicable.
   * `undefined` for images, which travel as binary vision blocks only.
   */
  text?: string;
  /** Whether `text` was truncated to {@link MAX_EXTRACTED_CHARS_PER_ATTACHMENT}. */
  truncated?: boolean;
}

/**
 * Per-attachment routing — given the raw bytes + MIME, decide how it will
 * appear to the LLM (image / pdf / text-bearing-document / plain text) and
 * extract any text we'll need on subsequent turns.
 *
 * Routing rules (matches the design in issue #68):
 * - `image/*`            → kind=`image`, no text
 * - `application/pdf`    → kind=`pdf`,   `pdfjs-dist` text for chip preview
 * - `text/*`/.md/.csv/.rtf → kind=`text`, UTF-8 read
 * - `.docx`              → kind=`document`, `mammoth.extractRawText()`
 * - `.doc`               → rejected with explicit error
 * - anything else        → rejected with explicit error
 */
@Injectable()
export class AttachmentExtractorService {
  private readonly logger = new Logger(AttachmentExtractorService.name);

  /**
   * Validate the file passes our allow-list and size cap. Throws
   * `BadRequestException` with a user-displayable message on rejection.
   */
  validate(filename: string, mimeType: string, sizeBytes: number): void {
    if (sizeBytes > MAX_ATTACHMENT_BYTES) {
      throw new BadRequestException(
        `File "${filename}" is ${(sizeBytes / 1024 / 1024).toFixed(1)} MB; the limit is 10 MB.`,
      );
    }
    const ext = this.extensionOf(filename);
    if (ext === '.doc') {
      throw new BadRequestException(
        `File "${filename}": legacy .doc not supported — please save as .docx or .pdf.`,
      );
    }
    const mimeOk =
      ALLOWED_MIME_EXACT.has(mimeType) ||
      ALLOWED_MIME_PREFIXES.some((p) => mimeType.startsWith(p));
    const extOk = ext !== '' && ALLOWED_EXTENSIONS.has(ext);
    if (!mimeOk && !extOk) {
      throw new BadRequestException(
        `File "${filename}" has an unsupported type (${mimeType || 'unknown'}).`,
      );
    }
  }

  /**
   * Extract text + classify the file. Caller is responsible for having
   * called {@link validate} first (the controller does both).
   */
  async extract(
    filename: string,
    mimeType: string,
    buffer: Buffer,
  ): Promise<ExtractedAttachment> {
    const ext = this.extensionOf(filename);

    if (IMAGE_MIME_RE.test(mimeType)) {
      return { kind: 'image' };
    }

    if (mimeType === 'application/pdf' || ext === '.pdf') {
      const text = await this.extractPdfText(buffer, filename);
      return this.maybeTruncate('pdf', text);
    }

    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      ext === '.docx'
    ) {
      const text = await this.extractDocxText(buffer, filename);
      return this.maybeTruncate('document', text);
    }

    if (
      ext === '.doc' ||
      mimeType === 'application/msword'
    ) {
      throw new BadRequestException(
        `File "${filename}": legacy .doc not supported — please save as .docx or .pdf.`,
      );
    }

    // Plain text family
    if (
      mimeType.startsWith('text/') ||
      TEXT_EXTENSIONS.has(ext) ||
      mimeType === 'application/rtf' ||
      mimeType === 'text/rtf'
    ) {
      const text = buffer.toString('utf8');
      return this.maybeTruncate('text', text);
    }

    throw new BadRequestException(
      `File "${filename}" has an unsupported type (${mimeType || 'unknown'}).`,
    );
  }

  private async extractPdfText(buffer: Buffer, filename: string): Promise<string> {
    try {
      // pdfjs-dist's legacy build is the supported entry point for Node.
      // Loaded dynamically so unit tests that don't exercise PDFs don't
      // pay the parse cost on import.
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(buffer),
        disableFontFace: true,
        useSystemFonts: false,
        isEvalSupported: false,
      });
      const doc = await loadingTask.promise;
      const pageTexts: string[] = [];
      for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
        const page = await doc.getPage(pageNum);
        const content = await page.getTextContent();
        const text = content.items
          .map((item) => ('str' in item ? item.str : ''))
          .join(' ');
        pageTexts.push(text);
      }
      return pageTexts.join('\n\n').trim();
    } catch (err) {
      this.logger.warn(
        `Failed to extract text from PDF "${filename}": ${err instanceof Error ? err.message : String(err)}`,
      );
      // Don't fail the whole upload — Anthropic still gets the doc block.
      return '';
    }
  }

  private async extractDocxText(buffer: Buffer, filename: string): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return (result.value ?? '').trim();
    } catch (err) {
      throw new BadRequestException(
        `File "${filename}": could not parse .docx (${err instanceof Error ? err.message : 'unknown error'}).`,
      );
    }
  }

  private maybeTruncate(
    kind: OnboardingAttachmentKind,
    text: string,
  ): ExtractedAttachment {
    if (text.length <= MAX_EXTRACTED_CHARS_PER_ATTACHMENT) {
      return { kind, text, truncated: false };
    }
    return {
      kind,
      text: text.slice(0, MAX_EXTRACTED_CHARS_PER_ATTACHMENT),
      truncated: true,
    };
  }

  private extensionOf(filename: string): string {
    const idx = filename.lastIndexOf('.');
    if (idx < 0) return '';
    return filename.slice(idx).toLowerCase();
  }
}
