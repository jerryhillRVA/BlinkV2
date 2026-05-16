import { Module } from '@nestjs/common';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { LlmModule } from '../llm/llm.module';
import { SkillsModule } from '../skills/skills.module';
import { GeneratedIdeasController } from './generated-ideas.controller';
import { GeneratedIdeasService } from './generated-ideas.service';

@Module({
  imports: [WorkspacesModule, LlmModule, SkillsModule],
  controllers: [GeneratedIdeasController],
  providers: [GeneratedIdeasService],
})
export class GeneratedIdeasModule {}
