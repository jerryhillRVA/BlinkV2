import { Module } from '@nestjs/common';
import { ContentItemsModule } from '../content-items/content-items.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { LlmModule } from '../llm/llm.module';
import { SkillsModule } from '../skills/skills.module';
import { IdeaConceptOptionsController } from './idea-concept-options.controller';
import { IdeaConceptOptionsService } from './idea-concept-options.service';

@Module({
  imports: [ContentItemsModule, WorkspacesModule, LlmModule, SkillsModule],
  controllers: [IdeaConceptOptionsController],
  providers: [IdeaConceptOptionsService],
})
export class IdeaConceptOptionsModule {}
