import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CalendarModule } from './calendar.module';
import { CalendarController } from './calendar.controller';

describe('Calendar API (integration)', () => {
  let app: INestApplication;
  let controller: CalendarController;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [CalendarModule],
    }).compile();
    app = module.createNestApplication();
    controller = app.get(CalendarController);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('boots CalendarModule cleanly and exposes the controller', () => {
    expect(controller).toBeDefined();
  });

  it('returns a well-formed response for a real workspace id', async () => {
    const res = await controller.getCalendar('hive-collective');
    expect(res.workspaceId).toBe('hive-collective');
    expect(typeof res.referenceDate).toBe('string');
    expect(Number.isNaN(Date.parse(res.referenceDate))).toBe(false);
    expect(Array.isArray(res.items)).toBe(true);
    expect(Array.isArray(res.milestones)).toBe(true);
    expect(res.items.length).toBeGreaterThan(0);
    const itemIds = new Set(res.items.map((i) => i.id));
    for (const m of res.milestones) {
      expect(itemIds.has(m.contentId)).toBe(true);
    }
  });

  it('produces deterministic output for the same workspace id', async () => {
    const a = await controller.getCalendar('blink-integration');
    const b = await controller.getCalendar('blink-integration');
    expect(a.items.map((i) => i.id)).toEqual(b.items.map((i) => i.id));
  });
});
