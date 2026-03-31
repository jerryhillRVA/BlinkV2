import { Global, Module } from '@nestjs/common';
import { LLM_PROVIDER } from './llm-provider.interface';
import { AnthropicProvider } from './anthropic-provider';
import { LlmService } from './llm.service';

@Global()
@Module({
  providers: [
    {
      provide: LLM_PROVIDER,
      useFactory: () => new AnthropicProvider(),
    },
    LlmService,
  ],
  exports: [LlmService],
})
export class LlmModule {}
