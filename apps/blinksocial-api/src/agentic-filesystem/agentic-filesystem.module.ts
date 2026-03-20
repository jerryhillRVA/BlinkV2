import { Module } from '@nestjs/common';
import { AgenticFilesystemService } from './agentic-filesystem.service';

@Module({
  providers: [AgenticFilesystemService],
  exports: [AgenticFilesystemService],
})
export class AgenticFilesystemModule {}
