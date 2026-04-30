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

/**
 * A tool the model can be instructed (or forced) to call. The provider
 * passes `inputSchema` straight through as the tool's JSON Schema input
 * spec. Anthropic guarantees that the `input` field on the resulting
 * `tool_use` block validates against this schema, which is the canonical
 * way to force structured output without relying on text-parse heuristics.
 */
export interface LlmTool {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
}

/**
 * - `'auto'`: model decides whether to call a tool (default if tools present)
 * - `'any'`: model must call one of the supplied tools
 * - `'none'`: model must not call any tool
 * - `{ type: 'tool', name }`: model must call the named tool exactly once
 */
export type LlmToolChoice =
  | 'auto'
  | 'any'
  | 'none'
  | { type: 'tool'; name: string };

export interface LlmCompletionOptions {
  messages: LlmMessage[];
  maxTokens?: number;
  temperature?: number;
  stopSequences?: string[];
  tools?: LlmTool[];
  toolChoice?: LlmToolChoice;
}

/** A `tool_use` content block returned by the model. */
export interface LlmToolUse {
  name: string;
  input: Record<string, unknown>;
}

export interface LlmCompletionResult {
  content: string;
  stopReason: 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use';
  usage: { inputTokens: number; outputTokens: number };
  toolUse?: LlmToolUse;
}

export interface LlmProvider {
  readonly providerId: string;
  complete(options: LlmCompletionOptions): Promise<LlmCompletionResult>;
  isConfigured(): boolean;
}

export const LLM_PROVIDER = Symbol('LLM_PROVIDER');
