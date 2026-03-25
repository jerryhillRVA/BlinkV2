import { Module } from '@nestjs/common';
import { AgenticFilesystemModule } from '../agentic-filesystem/agentic-filesystem.module';
import { MockDataModule } from '../mocks/mock-data.module';
import { AuthModule } from '../auth/auth.module';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';

@Module({
  imports: [AgenticFilesystemModule, MockDataModule, AuthModule],
  controllers: [WorkspacesController],
  providers: [WorkspacesService],
})
export class WorkspacesModule {}
