import { AgenticFilesystemService } from '../agentic-filesystem/agentic-filesystem.service';
import { runMigration, LegacyContentItem, LegacyIndexEntry } from './migrate-scheduled-fields';

const SKIP = !process.env['AGENTIC_FS_URL'];
const TEST_TENANT = '__test_migrate_scheduled_fields__';
const NAMESPACE = 'content-items';
const INDEX_FILE = '_content-items-index.json';

const SILENT_LOGGER = {
  log: () => undefined,
  error: () => undefined,
};

interface SeededItem {
  id: string;
  item: LegacyContentItem;
  entry: LegacyIndexEntry;
  expectScheduledAt: string | null;
  expectStatus: string;
}

(SKIP ? describe.skip : describe)('migrate-scheduled-fields (integration)', () => {
  let fs: AgenticFilesystemService;

  const seedItems: SeededItem[] = [
    // Branch 1: legacy date-only → midnight UTC.
    {
      id: 'mig-1-date-only',
      item: {
        status: 'scheduled',
        scheduledDate: '2026-06-15',
      },
      entry: {
        id: 'mig-1-date-only',
        status: 'scheduled',
        scheduledDate: '2026-06-15',
        scheduledAt: null,
      },
      expectScheduledAt: '2026-06-15T00:00:00.000Z',
      expectStatus: 'scheduled',
    },
    // Branch 2: legacy publishConfig.scheduleAt (16-char) + status flip.
    {
      id: 'mig-2-pc-schedule',
      item: {
        status: 'review',
        production: {
          qa: {
            publishConfig: {
              publishAction: 'schedule',
              scheduleAt: '2026-07-04T09:30',
            },
          },
        },
      },
      entry: {
        id: 'mig-2-pc-schedule',
        status: 'review',
        scheduledAt: null,
      },
      expectScheduledAt: '2026-07-04T09:30:00.000Z',
      expectStatus: 'scheduled',
    },
    // Branch 3: already-canonical, no-op.
    {
      id: 'mig-3-canonical',
      item: {
        status: 'scheduled',
        scheduledAt: '2026-09-01T12:00:00.000Z',
      },
      entry: {
        id: 'mig-3-canonical',
        status: 'scheduled',
        scheduledAt: '2026-09-01T12:00:00.000Z',
      },
      expectScheduledAt: '2026-09-01T12:00:00.000Z',
      expectStatus: 'scheduled',
    },
    // Branch 4: dual-written (scheduledAt + scheduledDate) → strip date only.
    {
      id: 'mig-4-dual-written',
      item: {
        status: 'scheduled',
        scheduledAt: '2026-08-10T14:00:00.000Z',
        scheduledDate: '2026-08-10',
      },
      entry: {
        id: 'mig-4-dual-written',
        status: 'scheduled',
        scheduledAt: '2026-08-10T14:00:00.000Z',
        scheduledDate: '2026-08-10',
      },
      expectScheduledAt: '2026-08-10T14:00:00.000Z',
      expectStatus: 'scheduled',
    },
  ];

  beforeAll(async () => {
    fs = new AgenticFilesystemService();

    // Seed: one item JSON per seed entry + the index aggregate.
    for (const seed of seedItems) {
      await fs.uploadJsonFile(TEST_TENANT, NAMESPACE, `${seed.id}.json`, seed.item);
    }
    await fs.uploadJsonFile(TEST_TENANT, NAMESPACE, INDEX_FILE, {
      items: seedItems.map((s) => s.entry),
      totalCount: seedItems.length,
      lastUpdated: new Date().toISOString(),
    });
  }, 60_000);

  afterAll(async () => {
    try {
      await fs.deleteTenant(TEST_TENANT);
    } catch {
      // best-effort
    }
  }, 30_000);

  it('migrates all four legacy shapes and is idempotent on second run', async () => {
    // First run: writes are applied.
    const first = await runMigration(
      fs,
      { workspace: TEST_TENANT, dryRun: false },
      SILENT_LOGGER,
    );
    expect(first.workspacesScanned).toBe(1);
    // Three of four items change: branches 1, 2, and 4. Branch 3 is canonical.
    expect(first.itemsMigrated).toBe(3);
    expect(first.itemsSkipped).toBe(1);

    // Verify final state per item.
    for (const seed of seedItems) {
      const entries = await fs.listDirectory(TEST_TENANT, NAMESPACE);
      const fileEntry = entries.find((e) => e.name === `${seed.id}.json`);
      expect(fileEntry?.file_id).toBeDefined();
      const files = await fs.batchRetrieve(TEST_TENANT, [fileEntry!.file_id!]);
      const persisted = files[0].content as LegacyContentItem;
      expect(persisted.scheduledAt ?? null).toBe(seed.expectScheduledAt);
      expect(persisted.status).toBe(seed.expectStatus);
      expect(persisted).not.toHaveProperty('scheduledDate');
      expect(persisted.production?.qa?.publishConfig ?? {}).not.toHaveProperty('scheduleAt');
    }

    // Second run: nothing to do.
    const second = await runMigration(
      fs,
      { workspace: TEST_TENANT, dryRun: false },
      SILENT_LOGGER,
    );
    expect(second.itemsMigrated).toBe(0);
    expect(second.itemsSkipped).toBe(seedItems.length);
  }, 120_000);
});
