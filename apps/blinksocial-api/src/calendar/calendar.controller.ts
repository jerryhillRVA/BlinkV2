import { Controller, Get, Param } from '@nestjs/common';
import type { CalendarResponseContract } from '@blinksocial/contracts';
import { CalendarService } from './calendar.service';

@Controller('api/calendar')
export class CalendarController {
  constructor(private readonly service: CalendarService) {}

  @Get(':workspaceId')
  getCalendar(
    @Param('workspaceId') workspaceId: string,
  ): Promise<CalendarResponseContract> {
    return this.service.getCalendar(workspaceId);
  }
}
