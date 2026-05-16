import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CalendarModule } from './calendar.module';
import { CalendarController } from './calendar.controller';
import { AgenticFilesystemService } from '../agentic-filesystem/agentic-filesystem.service';
import { ContentItemsService } from '../content-items/content-items.service';
import { CalendarService } from './calendar.service';
import type { CalendarSettingsContract } from '@blinksocial/contracts';

describe('Calendar API (integration)', () => {
  let app: INestApplication;
  let controller: CalendarController;

  beforeAll(async () => {
    // Force mock-mode so this smoke suite stays deterministic regardless of
    // whether `AGENTIC_FS_URL` is set in the env. The AFS-mode integration
    // block below covers the real-AFS path under its own describe.skip guard.
    const module = await Test.createTestingModule({
      imports: [CalendarModule],
    })
      .overrideProvider(AgenticFilesystemService)
      .useValue({
        isConfigured: () => false,
        listDirectory: async () => [],
        batchRetrieve: async () => [],
      })
      .compile();
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

/**
 * Ticket #130: AFS-mode integration. Skips when `AGENTIC_FS_URL` is unset —
 * matches the pattern in `agentic-filesystem.integration.spec.ts` and
 * `content-items.integration.spec.ts`. Each test uses its own tenant so
 * cases can't leak across each other.
 */

const AFS_SKIP = !process.env['AGENTIC_FS_URL'];
const AFS_SUFFIX = Math.random().toString(36).slice(2, 10);
const TC2_TENANT = `__test_cal_tc2_${AFS_SUFFIX}__`;
const TC3_TENANT = `__test_cal_tc3_${AFS_SUFFIX}__`;
const TC4_TENANT = `__test_cal_tc4_${AFS_SUFFIX}__`;

(AFS_SKIP ? describe.skip : describe)(
  'CalendarService (integration, AFS)',
  () => {
    let fs: AgenticFilesystemService;
    let contentSvc: ContentItemsService;
    let calendarSvc: CalendarService;

    beforeAll(() => {
      fs = new AgenticFilesystemService();
      contentSvc = new ContentItemsService(fs, null);
      calendarSvc = new CalendarService(fs, null);
    });

    afterAll(async () => {
      for (const t of [TC2_TENANT, TC3_TENANT, TC4_TENANT]) {
        try {
          await fs.deleteTenant(t);
        } catch {
          // best-effort cleanup
        }
      }
    });

    it('TC-2: an IG-Reel post appears on the calendar with the mapper-emitted field shape', async () => {
      const post = await contentSvc.createItem(TC2_TENANT, {
        stage: 'post',
        status: 'scheduled',
        title: 'TC-2 reel',
        description: 'desc',
        pillarIds: [],
        segmentIds: [],
        platform: 'instagram',
        contentType: 'reel',
        owner: 'Test Owner',
        scheduledAt: '2026-05-20T14:00:00.000Z',
      } as unknown as Parameters<ContentItemsService['createItem']>[1]);

      const response = await calendarSvc.getCalendar(TC2_TENANT);
      expect(response.workspaceId).toBe(TC2_TENANT);
      const reel = response.items.find((i) => i.id === post.id);
      expect(reel).toEqual({
        id: post.id,
        title: 'TC-2 reel',
        platform: 'instagram',
        canonicalType: 'VIDEO_SHORT_VERTICAL',
        status: 'scheduled',
        owner: 'Test Owner',
        scheduledAt: '2026-05-20T14:00:00.000Z',
        blockers: [],
      });
      // No settings written → no milestones for this item.
      expect(
        response.milestones.filter((m) => m.contentId === post.id),
      ).toEqual([]);
    }, 60_000);

    it('TC-3: settings/calendar.json deadline template drives the milestones[] array', async () => {
      const settings: CalendarSettingsContract = {
        enableDeadlineTemplates: true,
        deadlineTemplates: {
          VIDEO_SHORT_VERTICAL: {
            milestones: [
              { milestoneType: 'draft_due', offsetDays: -7, required: true },
              { milestoneType: 'assets_due', offsetDays: -5, required: true },
              { milestoneType: 'qa_due', offsetDays: -2, required: true },
            ],
            phases: [],
          },
        },
        reminderSettings: {
          milestone72h: false,
          milestone24h: false,
          milestoneOverdue: false,
          publish24h: false,
        },
        autoCreateOnPublish: false,
      };
      await fs.uploadJsonFile(
        TC3_TENANT,
        'settings',
        'calendar.json',
        settings,
      );

      const post = await contentSvc.createItem(TC3_TENANT, {
        stage: 'post',
        status: 'scheduled',
        title: 'TC-3 reel',
        description: 'desc',
        pillarIds: [],
        segmentIds: [],
        platform: 'instagram',
        contentType: 'reel',
        owner: 'Owner-TC3',
        scheduledAt: '2026-06-01T14:00:00.000Z',
      } as unknown as Parameters<ContentItemsService['createItem']>[1]);

      const response = await calendarSvc.getCalendar(TC3_TENANT);
      const milestones = response.milestones
        .filter((m) => m.contentId === post.id)
        .map((m) => ({
          type: m.milestoneType,
          dueAt: m.dueAt,
          owner: m.milestoneOwner,
          required: m.isRequired,
        }));
      expect(milestones).toEqual([
        {
          type: 'draft_due',
          dueAt: '2026-05-25T14:00:00.000Z',
          owner: 'Owner-TC3',
          required: true,
        },
        {
          type: 'assets_due',
          dueAt: '2026-05-27T14:00:00.000Z',
          owner: 'Owner-TC3',
          required: true,
        },
        {
          type: 'qa_due',
          dueAt: '2026-05-30T14:00:00.000Z',
          owner: 'Owner-TC3',
          required: true,
        },
      ]);
    }, 60_000);

    it('TC-4: a fresh AFS workspace returns empty items + milestones, not a 5xx', async () => {
      const response = await calendarSvc.getCalendar(TC4_TENANT);
      expect(response).toEqual({
        workspaceId: TC4_TENANT,
        referenceDate: '2026-05-01T00:00:00.000Z',
        items: [],
        milestones: [],
      });
    }, 30_000);
  },
);
