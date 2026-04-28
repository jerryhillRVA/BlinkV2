import { Module } from '@nestjs/common';
import { SkillsModule } from '../skills/skills.module';
import { AuthModule } from '../auth/auth.module';
import { WizardAiController } from './wizard-ai.controller';
import { WizardAiService } from './wizard-ai.service';

@Module({
  imports: [SkillsModule, AuthModule],
  controllers: [WizardAiController],
  providers: [WizardAiService],
})
export class WizardAiModule {}
