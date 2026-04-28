export type OnboardingAttachmentKind = 'image' | 'pdf' | 'document' | 'text';

/**
 * A user-uploaded asset attached to an onboarding chat message.
 *
 * Persisted as part of the message log on the session. Binary bytes live in
 * AFS at `tenant://onboarding-attachments/<messageId>/<id>__<filename>`;
 * extracted text (when applicable) lives sidecar at
 * `tenant://settings/onboarding-attachments-text/<id>.json`.
 */
export interface OnboardingAttachmentContract {
  /** UUID assigned at upload time. */
  id: string;
  /** Original filename as supplied by the user, sanitized for filesystem use. */
  filename: string;
  /** Best-effort MIME type — the browser-provided value. */
  mimeType: string;
  /** Size of the original upload in bytes. */
  sizeBytes: number;
  /** AFS file_id for retrieving the binary. */
  fileId: string;
  /** How this attachment is fed to the LLM. */
  kind: OnboardingAttachmentKind;
  /** ≤ 280-char snippet of extracted text — used for chip tooltips. */
  textPreview?: string;
}

export interface OnboardingMessageContract {
  /**
   * Stable per-message UUID. Older sessions written before this field
   * existed may omit it; readers should fall back to `timestamp` when absent.
   */
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  attachments?: OnboardingAttachmentContract[];
}
