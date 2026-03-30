import { Module } from '@nestjs/common';
import { SkillLoaderService } from './skill-loader.service';
import { SkillRunnerService } from './skill-runner.service';

@Module({
  providers: [SkillLoaderService, SkillRunnerService],
  exports: [SkillLoaderService, SkillRunnerService],
})
export class SkillsModule {}
