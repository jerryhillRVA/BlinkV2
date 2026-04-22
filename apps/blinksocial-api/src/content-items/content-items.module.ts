import { Module } from '@nestjs/common';
import { AgenticFilesystemModule } from '../agentic-filesystem/agentic-filesystem.module';
import { MockDataModule } from '../mocks/mock-data.module';
import { ContentItemsController } from './content-items.controller';
import { ContentItemsService } from './content-items.service';

@Module({
  imports: [AgenticFilesystemModule, MockDataModule],
  controllers: [ContentItemsController],
  providers: [ContentItemsService],
  exports: [ContentItemsService],
})
export class ContentItemsModule {}
