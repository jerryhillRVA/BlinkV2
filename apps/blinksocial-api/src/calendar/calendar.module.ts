import { Module } from '@nestjs/common';
import { AgenticFilesystemModule } from '../agentic-filesystem/agentic-filesystem.module';
import { MockDataModule } from '../mocks/mock-data.module';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';

@Module({
  imports: [AgenticFilesystemModule, MockDataModule],
  controllers: [CalendarController],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}
