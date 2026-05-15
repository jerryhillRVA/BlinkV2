import { Module } from '@nestjs/common';
import { ContentItemsModule } from '../content-items/content-items.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { LlmModule } from '../llm/llm.module';
import { SkillsModule } from '../skills/skills.module';
import { AiAssistController } from './ai-assist.controller';
import { AiAssistService } from './ai-assist.service';

@Module({
  imports: [ContentItemsModule, WorkspacesModule, LlmModule, SkillsModule],
  controllers: [AiAssistController],
  providers: [AiAssistService],
})
export class AiAssistModule {}
