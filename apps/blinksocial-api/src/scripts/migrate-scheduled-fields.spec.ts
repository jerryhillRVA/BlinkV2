import {
  migrateContentItem,
  LegacyContentItem,
  LegacyIndexEntry,
} from './migrate-scheduled-fields';

function makeItem(overrides: Partial<LegacyContentItem> = {}): LegacyContentItem {
  return {
    status: 'draft',
    ...overrides,
  };
}

function makeEntry(overrides: Partial<LegacyIndexEntry> = {}): LegacyIndexEntry {
  return {
    id: 'c-1',
    status: 'draft',
    scheduledAt: null,
    ...overrides,
  };
}

describe('migrateContentItem (transform)', () => {
  it('synthesizes scheduledAt from legacy scheduledDate at midnight UTC', () => {
    const item = makeItem({ scheduledDate: '2026-06-15', status: 'scheduled' });
    const entry = makeEntry({ scheduledDate: '2026-06-15', status: 'scheduled' });

    const result = migrateContentItem(item, entry);

    expect(result.changed).toBe(true);
    expect(result.item?.scheduledAt).toBe('2026-06-15T00:00:00.000Z');
    expect(result.item).not.toHaveProperty('scheduledDate');
    expect(result.indexEntry?.scheduledAt).toBe('2026-06-15T00:00:00.000Z');
    expect(result.indexEntry).not.toHaveProperty('scheduledDate');
  });

  it('synthesizes scheduledAt from publishConfig.scheduleAt (16-char local form → UTC)', () => {
    const item = makeItem({
      status: 'review',
      production: {
        qa: {
          publishConfig: {
            publishAction: 'schedule',
            scheduleAt: '2026-07-04T09:30',
          },
        },
      },
    });
    const entry = makeEntry({ status: 'review' });

    const result = migrateContentItem(item, entry);

    expect(result.changed).toBe(true);
    expect(result.item?.scheduledAt).toBe('2026-07-04T09:30:00.000Z');
    expect(result.item?.production?.qa?.publishConfig).not.toHaveProperty('scheduleAt');
    expect(result.item?.production?.qa?.publishConfig?.publishAction).toBe('schedule');
    // Status also flips review → scheduled because publishAction === 'schedule'.
    expect(result.item?.status).toBe('scheduled');
    expect(result.indexEntry?.status).toBe('scheduled');
  });

  it('flips status review → scheduled when publishAction is "schedule" (even if scheduledAt already set)', () => {
    const item = makeItem({
      status: 'review',
      scheduledAt: '2026-06-01T15:00:00.000Z',
      production: {
        qa: { publishConfig: { publishAction: 'schedule' } },
      },
    });
    const entry = makeEntry({ status: 'review', scheduledAt: '2026-06-01T15:00:00.000Z' });

    const result = migrateContentItem(item, entry);

    expect(result.changed).toBe(true);
    expect(result.item?.status).toBe('scheduled');
    expect(result.item?.scheduledAt).toBe('2026-06-01T15:00:00.000Z');
  });

  it('strips legacy fields even when canonical scheduledAt already exists', () => {
    const item = makeItem({
      status: 'scheduled',
      scheduledAt: '2026-08-10T14:00:00.000Z',
      scheduledDate: '2026-08-10',
      production: {
        qa: {
          publishConfig: {
            publishAction: 'schedule',
            scheduleAt: '2026-08-10T14:00',
          },
        },
      },
    });
    const entry = makeEntry({
      status: 'scheduled',
      scheduledAt: '2026-08-10T14:00:00.000Z',
      scheduledDate: '2026-08-10',
    });

    const result = migrateContentItem(item, entry);

    expect(result.changed).toBe(true);
    expect(result.item).not.toHaveProperty('scheduledDate');
    expect(result.item?.production?.qa?.publishConfig).not.toHaveProperty('scheduleAt');
    expect(result.item?.scheduledAt).toBe('2026-08-10T14:00:00.000Z');
    expect(result.indexEntry).not.toHaveProperty('scheduledDate');
  });

  it('is a no-op on already-migrated items', () => {
    const item = makeItem({
      status: 'scheduled',
      scheduledAt: '2026-09-01T12:00:00.000Z',
      production: { qa: { publishConfig: { publishAction: 'schedule' } } },
    });
    const entry = makeEntry({
      status: 'scheduled',
      scheduledAt: '2026-09-01T12:00:00.000Z',
    });

    const result = migrateContentItem(item, entry);

    expect(result.changed).toBe(false);
    expect(result.item).toBeUndefined();
    expect(result.indexEntry).toBeUndefined();
  });

  it('skips synthesis when publishConfig.scheduleAt is unparseable', () => {
    const item = makeItem({
      status: 'review',
      production: {
        qa: {
          publishConfig: { publishAction: 'schedule', scheduleAt: 'not-a-date' },
        },
      },
    });
    const entry = makeEntry({ status: 'review' });

    const result = migrateContentItem(item, entry);

    // The bad pcAt isn't promoted, but the status flip still applies and
    // the bad field is stripped — both count as legitimate migrations.
    expect(result.changed).toBe(true);
    expect(result.item?.scheduledAt).toBeUndefined();
    expect(result.item?.production?.qa?.publishConfig).not.toHaveProperty('scheduleAt');
    expect(result.item?.status).toBe('scheduled');
  });

  it('does not mutate the input objects', () => {
    const item = makeItem({
      status: 'review',
      scheduledDate: '2026-06-15',
      production: {
        qa: { publishConfig: { publishAction: 'schedule', scheduleAt: '2026-06-15T09:00' } },
      },
    });
    const entry = makeEntry({ status: 'review', scheduledDate: '2026-06-15' });
    const itemSnapshot = JSON.parse(JSON.stringify(item));
    const entrySnapshot = JSON.parse(JSON.stringify(entry));

    migrateContentItem(item, entry);

    expect(item).toEqual(itemSnapshot);
    expect(entry).toEqual(entrySnapshot);
  });

  it('is idempotent — running the result through migrate again is a no-op', () => {
    const item = makeItem({
      status: 'review',
      scheduledDate: '2026-06-15',
      production: {
        qa: { publishConfig: { publishAction: 'schedule', scheduleAt: '2026-06-15T09:00' } },
      },
    });
    const entry = makeEntry({ status: 'review', scheduledDate: '2026-06-15' });

    const first = migrateContentItem(item, entry);
    expect(first.changed).toBe(true);

    const second = migrateContentItem(first.item!, first.indexEntry!);
    expect(second.changed).toBe(false);
  });

  it('is idempotent for "used" items where the item has no scheduledAt key and the entry has scheduledAt: null', () => {
    // Pre-#150 index entries projected scheduledAt as null for non-scheduled
    // items; the item file itself had no scheduledAt key. Naive `!==` between
    // null and undefined keeps tripping changed=true forever.
    const item: LegacyContentItem = { status: 'used' };
    const entry: LegacyIndexEntry = {
      id: 'c-used',
      status: 'used',
      scheduledAt: null,
      scheduledDate: null,
    };

    const first = migrateContentItem(item, entry);
    expect(first.changed).toBe(true);
    expect(first.indexEntry).not.toHaveProperty('scheduledDate');
    expect(first.indexEntry?.scheduledAt).toBeNull();

    const second = migrateContentItem(first.item!, first.indexEntry!);
    expect(second.changed).toBe(false);
  });
});
