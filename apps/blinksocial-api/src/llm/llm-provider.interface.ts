export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
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
