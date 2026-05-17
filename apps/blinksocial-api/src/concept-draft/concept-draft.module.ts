import { Module } from '@nestjs/common';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { LlmModule } from '../llm/llm.module';
import { SkillsModule } from '../skills/skills.module';
import { ConceptDraftController } from './concept-draft.controller';
import { ConceptDraftService } from './concept-draft.service';

@Module({
  imports: [WorkspacesModule, LlmModule, SkillsModule],
  controllers: [ConceptDraftController],
  providers: [ConceptDraftService],
})
export class ConceptDraftModule {}
