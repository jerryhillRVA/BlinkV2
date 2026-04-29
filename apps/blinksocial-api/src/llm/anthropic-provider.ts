import Anthropic from '@anthropic-ai/sdk';
import { Logger } from '@nestjs/common';
import type {
  LlmProvider,
  LlmCompletionOptions,
  LlmCompletionResult,
  LlmMessage,
  LlmContentBlock,
} from './llm-provider.interface';

const DEFAULT_MODEL = 'claude-sonnet-4-6';
/**
 * Use the model's maximum supported output (Sonnet 4-class models support
 * up to 64k output tokens). The Anthropic SDK requires `max_tokens`, so we
 * cannot omit it — instead we lift it to the ceiling so artifacts are
 * never truncated for verbose brands. Callers that need a deliberately
 * smaller cap (e.g. classification prompts) can still pass `maxTokens`
 * explicitly. Token usage is tracked via the returned `usage` payload.
 */
const DEFAULT_MAX_TOKENS = 64000;

export class AnthropicProvider implements LlmProvider {
  readonly providerId = 'anthropic';
  private readonly logger = new Logger(AnthropicProvider.name);
  private readonly client: Anthropic | null;
  private readonly model: string;

  constructor() {
    const apiKey = process.env['ANTHROPIC_API_KEY'];
    this.model = process.env['ANTHROPIC_MODEL'] || DEFAULT_MODEL;

    if (apiKey) {
      this.client = new Anthropic({ apiKey, maxRetries: 3 });
      this.logger.log(`Anthropic provider initialized with model: ${this.model}`);
    } else {
      this.client = null;
      this.logger.warn(
        'ANTHROPIC_API_KEY not set — LLM calls will fail. Set it in .env to enable AI skills.',
      );
    }
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  async complete(options: LlmCompletionOptions): Promise<LlmCompletionResult> {
    if (!this.client) {
      throw new Error(
        'Anthropic provider is not configured. Set ANTHROPIC_API_KEY in .env.',
      );
    }

    const systemMessage = options.messages.find((m) => m.role === 'system');
    const conversationMessages = options.messages
      .filter((m): m is LlmMessage & { role: 'user' | 'assistant' } => m.role !== 'system');

    // System messages must be plain text — Anthropic's `system` field is a string.
    const systemText =
      systemMessage && typeof systemMessage.content === 'string'
        ? systemMessage.content
        : undefined;

    // Use the streaming API. The non-streaming `messages.create()` call
    // refuses any request whose `max_tokens` is high enough that output
    // could plausibly take more than 10 minutes ("Streaming is required
    // for operations that may take longer than 10 minutes"). Since we
    // deliberately set `max_tokens` to the model ceiling (#71 — never
    // truncate artifacts), we must use streaming. We still hand callers
    // a single assembled `LlmCompletionResult`, so this is invisible to
    // every consumer.
    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
      temperature: options.temperature,
      stop_sequences: options.stopSequences,
      ...(systemText ? { system: systemText } : {}),
      messages: conversationMessages.map((m) => ({
        role: m.role,
        content:
          typeof m.content === 'string'
            ? m.content
            : this.toAnthropicContentBlocks(m.content),
      })),
    });

    const response = await stream.finalMessage();

    const textBlock = response.content.find((block) => block.type === 'text');
    const content = textBlock?.type === 'text' ? textBlock.text : '';

    // Loud warning when the model actually hits the ceiling — we'd rather
    // know than silently ship a truncated artifact. Downstream validators
    // will reject incomplete JSON, but a log helps diagnose the cause.
    if (response.stop_reason === 'max_tokens') {
      this.logger.warn(
        `LLM response was truncated by max_tokens cap (${response.usage.output_tokens} output tokens consumed). Consider raising DEFAULT_MAX_TOKENS or chunking the request.`,
      );
    }

    return {
      content,
      stopReason: response.stop_reason === 'end_turn' ? 'end_turn'
        : response.stop_reason === 'max_tokens' ? 'max_tokens'
        : 'stop_sequence',
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }

  /**
   * Translate our provider-neutral content blocks into the shape the
   * Anthropic SDK expects on `messages[].content`.
   */
  private toAnthropicContentBlocks(
    blocks: LlmContentBlock[],
  ): Array<
    | Anthropic.Messages.TextBlockParam
    | Anthropic.Messages.ImageBlockParam
    | Anthropic.Messages.DocumentBlockParam
  > {
    return blocks.map((b) => {
      if (b.type === 'text') {
        return { type: 'text', text: b.text } as Anthropic.Messages.TextBlockParam;
      }
      if (b.type === 'image') {
        return {
          type: 'image',
          source: {
            type: 'base64',
            media_type:
              b.mediaType as Anthropic.Messages.Base64ImageSource['media_type'],
            data: b.base64Data,
          },
        } as Anthropic.Messages.ImageBlockParam;
      }
      // document — Anthropic supports base64 PDFs natively.
      return {
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: b.base64Data,
        },
      } as Anthropic.Messages.DocumentBlockParam;
    });
  }
}
