import { Module } from '@nestjs/common';
import { SkillsModule } from '../skills/skills.module';
import { AgenticFilesystemModule } from '../agentic-filesystem/agentic-filesystem.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { AuthModule } from '../auth/auth.module';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { SessionStore } from './session-store';
import { WorkspaceBuilderService } from './workspace-builder.service';
import { BlueprintValidationService } from './blueprint-validation.service';
import { AttachmentExtractorService } from './attachment-extractor.service';

@Module({
  imports: [SkillsModule, AgenticFilesystemModule, WorkspacesModule, AuthModule],
  controllers: [OnboardingController],
  providers: [
    OnboardingService,
    SessionStore,
    WorkspaceBuilderService,
    BlueprintValidationService,
    AttachmentExtractorService,
  ],
})
export class OnboardingModule {}
