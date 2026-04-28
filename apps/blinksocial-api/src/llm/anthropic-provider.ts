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
const DEFAULT_MAX_TOKENS = 4096;

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

    const response = await this.client.messages.create({
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

    const textBlock = response.content.find((block) => block.type === 'text');
    const content = textBlock?.type === 'text' ? textBlock.text : '';

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
