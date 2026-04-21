import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { HealthModule } from '../health/health.module';
import { AgenticFilesystemModule } from '../agentic-filesystem/agentic-filesystem.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { AuthModule } from '../auth/auth.module';
import { AccountModule } from '../account/account.module';
import { AuthGuard } from '../auth/auth.guard';
import { LlmModule } from '../llm/llm.module';
import { SkillsModule } from '../skills/skills.module';
import { OnboardingModule } from '../onboarding/onboarding.module';
import { ContentItemsModule } from '../content-items/content-items.module';
import { AngularSsrModule } from '../angular-ssr/angular-ssr.module';

@Module({
  imports: [
    HealthModule,
    AgenticFilesystemModule,
    AuthModule,
    AccountModule,
    WorkspacesModule,
    LlmModule,
    SkillsModule,
    OnboardingModule,
    ContentItemsModule,
    // AngularSsrModule must be last — it registers a catch-all middleware
    AngularSsrModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useExisting: AuthGuard,
    },
  ],
})
export class AppModule {}
