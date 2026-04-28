/**
 * A single block within a multimodal message. Mirrors the shape Anthropic
 * accepts so providers can pass it through unchanged.
 */
export type LlmContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; mediaType: string; base64Data: string }
  | { type: 'document'; mediaType: string; base64Data: string };

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  /**
   * Plain text (back-compat) or an array of multimodal content blocks.
   * Providers translate to their native shape; existing callers passing
   * strings continue to work.
   */
  content: string | LlmContentBlock[];
}

export interface LlmCompletionOptions {
  messages: LlmMessage[];
  maxTokens?: number;
  temperature?: number;
  stopSequences?: string[];
}

export interface LlmCompletionResult {
  content: string;
  stopReason: 'end_turn' | 'max_tokens' | 'stop_sequence';
  usage: { inputTokens: number; outputTokens: number };
}

export interface LlmProvider {
  readonly providerId: string;
  complete(options: LlmCompletionOptions): Promise<LlmCompletionResult>;
  isConfigured(): boolean;
}

export const LLM_PROVIDER = Symbol('LLM_PROVIDER');
