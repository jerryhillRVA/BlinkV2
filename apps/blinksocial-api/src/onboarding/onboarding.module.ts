import { Module } from '@nestjs/common';
import { SkillsModule } from '../skills/skills.module';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { SessionStore } from './session-store';

@Module({
  imports: [SkillsModule],
  controllers: [OnboardingController],
  providers: [OnboardingService, SessionStore],
})
export class OnboardingModule {}
