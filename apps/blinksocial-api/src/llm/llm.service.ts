import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  LLM_PROVIDER,
  type LlmProvider,
  type LlmCompletionOptions,
  type LlmCompletionResult,
} from './llm-provider.interface';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  constructor(@Inject(LLM_PROVIDER) private readonly provider: LlmProvider) {}

  get providerId(): string {
    return this.provider.providerId;
  }

  isConfigured(): boolean {
    return this.provider.isConfigured();
  }

  async complete(options: LlmCompletionOptions): Promise<LlmCompletionResult> {
    const messageCount = options.messages.length;
    this.logger.debug(
      `LLM call via ${this.provider.providerId}: ${messageCount} messages`,
    );

    const startTime = Date.now();
    try {
      const result = await this.provider.complete(options);
      const elapsed = Date.now() - startTime;
      this.logger.debug(
        `LLM response in ${elapsed}ms — ${result.usage.inputTokens} in / ${result.usage.outputTokens} out`,
      );
      return result;
    } catch (error) {
      const elapsed = Date.now() - startTime;
      this.logger.error(
        `LLM call failed after ${elapsed}ms: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
