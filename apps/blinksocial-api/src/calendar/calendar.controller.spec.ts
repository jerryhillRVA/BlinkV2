import { Test } from '@nestjs/testing';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import type { CalendarResponseContract } from '@blinksocial/contracts';

describe('CalendarController', () => {
  let controller: CalendarController;
  const getCalendar = vi.fn<
    (id: string) => Promise<CalendarResponseContract>
  >();

  beforeEach(async () => {
    getCalendar.mockReset();
    const module = await Test.createTestingModule({
      controllers: [CalendarController],
      providers: [{ provide: CalendarService, useValue: { getCalendar } }],
    }).compile();
    controller = module.get(CalendarController);
  });

  it('delegates to CalendarService with the path workspaceId', async () => {
    const stub: CalendarResponseContract = {
      workspaceId: 'hive-collective',
      referenceDate: '2026-05-01T00:00:00.000Z',
      items: [],
      milestones: [],
    };
    getCalendar.mockResolvedValueOnce(stub);
    const result = await controller.getCalendar('hive-collective');
    expect(getCalendar).toHaveBeenCalledWith('hive-collective');
    expect(result).toBe(stub);
  });
});
