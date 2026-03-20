import { Module } from '@nestjs/common';
import { AgenticFilesystemModule } from '../agentic-filesystem/agentic-filesystem.module';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';

@Module({
  imports: [AgenticFilesystemModule],
  controllers: [WorkspacesController],
  providers: [WorkspacesService],
})
export class WorkspacesModule {}
