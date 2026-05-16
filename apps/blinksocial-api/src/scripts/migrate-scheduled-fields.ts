import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../app/app.module';
import { AgenticFilesystemService } from '../agentic-filesystem/agentic-filesystem.service';
import type {
  ContentItemContract,
  ContentItemsIndexContract,
  ContentItemsIndexEntryContract,
} from '@blinksocial/contracts';

const CONTENT_ITEMS_NAMESPACE = 'content-items';
const INDEX_FILE = '_content-items-index.json';
const ARCHIVE_INDEX_FILE = '_content-items-archive-index.json';

/**
 * Legacy shape of a content item JSON file prior to #150. Carries the
 * removed fields so the transform function can detect and strip them.
 * `scheduleAt` under `publishConfig` and a top-level `scheduledDate` are
 * the two surfaces being deleted; `scheduledAt` (canonical) stays.
 */
export interface LegacyContentItem {
  status?: string;
  scheduledAt?: string | null;
  scheduledDate?: string | null;
  production?: {
    qa?: {
      publishConfig?: {
        publishAction?: string;
        scheduleAt?: string;
        [key: string]: unknown;
      };
    } & Record<string, unknown>;
  } & Record<string, unknown>;
  [key: string]: unknown;
}

export interface LegacyIndexEntry {
  id?: string;
  status?: string;
  scheduledAt?: string | null;
  scheduledDate?: string | null;
  [key: string]: unknown;
}

export interface TransformResult {
  changed: boolean;
  /** Item JSON after migration (omitted when `changed === false`). */
  item?: LegacyContentItem;
  /** Index entry after migration (omitted when `changed === false`). */
  indexEntry?: LegacyIndexEntry;
}

/**
 * Pure migration transform. Exported separately so it can be unit-tested
 * without bootstrapping NestJS / AFS. Receives the legacy item + its index
 * entry (which may already be canonical-shaped) and returns the migrated
 * pair, or `{ changed: false }` if no migration applies.
 *
 * Rules (per #150 design):
 *   1. Synthesize `scheduledAt` from `scheduledDate` (midnight UTC).
 *   2. Else from `production.qa.publishConfig.scheduleAt` (16-char
 *      `YYYY-MM-DDTHH:mm` form treated as UTC, mirroring the retired
 *      reconciler's `datetimeLocalToIso` rule).
 *   3. If `publishConfig.publishAction === 'schedule'` and
 *      `status === 'review'`, flip status to `'scheduled'`.
 *   4. Always strip top-level `scheduledDate` and
 *      `production.qa.publishConfig.scheduleAt`.
 */
export function migrateContentItem(
  item: LegacyContentItem,
  indexEntry: LegacyIndexEntry,
): TransformResult {
  const nextItem: LegacyContentItem = { ...item };
  const nextEntry: LegacyIndexEntry = { ...indexEntry };
  let changed = false;

  const pc = nextItem.production?.qa?.publishConfig;
  const pcAt = pc?.scheduleAt;

  // 1 + 2: synthesize scheduledAt if missing.
  if (!nextItem.scheduledAt) {
    if (nextItem.scheduledDate) {
      nextItem.scheduledAt = `${nextItem.scheduledDate}T00:00:00.000Z`;
      changed = true;
    } else if (pcAt) {
      const utcStr = pcAt.length === 16 ? `${pcAt}:00.000Z` : pcAt;
      const parsed = new Date(utcStr);
      if (!Number.isNaN(parsed.getTime())) {
        nextItem.scheduledAt = parsed.toISOString();
        changed = true;
      }
    }
  }

  // 3: review → scheduled flip when the publish action was 'schedule'.
  if (pc?.publishAction === 'schedule' && nextItem.status === 'review') {
    nextItem.status = 'scheduled';
    changed = true;
  }

  // 4: strip legacy fields. Always do this when present, even if the item
  // already had `scheduledAt` set (so dual-written legacy state collapses).
  if ('scheduledDate' in nextItem) {
    delete nextItem.scheduledDate;
    changed = true;
  }
  if (pc && 'scheduleAt' in pc) {
    // Clone nested objects up the path so the original input isn't mutated.
    const nextPc = { ...pc };
    delete nextPc.scheduleAt;
    const nextQa = { ...(nextItem.production?.qa ?? {}), publishConfig: nextPc };
    nextItem.production = { ...(nextItem.production ?? {}), qa: nextQa };
    changed = true;
  }

  // Mirror onto the index entry: drop scheduledDate, sync scheduledAt + status.
  if ('scheduledDate' in nextEntry) {
    delete nextEntry.scheduledDate;
    changed = true;
  }
  // Coalesce both sides to `null` for the comparison so a `scheduledAt: null`
  // entry paired with a missing `scheduledAt` key on the item file (the common
  // pre-#150 shape for non-scheduled items) doesn't keep tripping `changed`
  // every time — the canonical absence is `null`, regardless of whether the
  // original was a missing key or an explicit `null`.
  const desiredScheduledAt = nextItem.scheduledAt ?? null;
  const currentScheduledAt = nextEntry.scheduledAt ?? null;
  if (currentScheduledAt !== desiredScheduledAt) {
    nextEntry.scheduledAt = desiredScheduledAt;
    changed = true;
  }
  if (nextEntry.status !== nextItem.status && nextItem.status !== undefined) {
    nextEntry.status = nextItem.status;
    changed = true;
  }

  if (!changed) return { changed: false };
  return { changed: true, item: nextItem, indexEntry: nextEntry };
}

interface CliOptions {
  afsUrl: string;
  workspace?: string;
  dryRun: boolean;
}

function parseArgs(argv: string[]): CliOptions {
  let afsUrl: string | undefined;
  let workspace: string | undefined;
  let dryRun = false;
  for (const arg of argv) {
    if (arg.startsWith('--afs-url=')) afsUrl = arg.slice('--afs-url='.length);
    else if (arg.startsWith('--workspace=')) workspace = arg.slice('--workspace='.length);
    else if (arg === '--dry-run') dryRun = true;
  }
  if (!afsUrl) {
    throw new Error(
      'Missing required --afs-url=<url> argument. Usage: migrate-scheduled-fields --afs-url=https://afs.example.com [--workspace=<id>] [--dry-run]',
    );
  }
  return { afsUrl, workspace, dryRun };
}

export async function runMigration(
  fs: AgenticFilesystemService,
  options: { workspace?: string; dryRun: boolean },
  logger: { log: (msg: string) => void; error: (msg: string, err?: unknown) => void },
): Promise<{
  workspacesScanned: number;
  itemsMigrated: number;
  itemsSkipped: number;
}> {
  const tenants = options.workspace
    ? [options.workspace]
    : await fs.listTenants();

  let itemsMigrated = 0;
  let itemsSkipped = 0;

  for (const tenant of tenants) {
    try {
      const indexFileId = await findFileId(fs, tenant, INDEX_FILE);
      const archiveFileId = await findFileId(fs, tenant, ARCHIVE_INDEX_FILE);
      const indices: Array<{ which: 'primary' | 'archive'; fileId: string | null; filename: string }> = [
        { which: 'primary', fileId: indexFileId, filename: INDEX_FILE },
        { which: 'archive', fileId: archiveFileId, filename: ARCHIVE_INDEX_FILE },
      ];

      for (const { fileId, filename } of indices) {
        if (!fileId) continue;
        const indexDoc = await readJson<ContentItemsIndexContract>(fs, tenant, fileId);
        if (!indexDoc?.items) continue;
        const nextEntries: ContentItemsIndexEntryContract[] = [];
        let indexChanged = false;

        for (const entry of indexDoc.items) {
          if (!entry.id) {
            nextEntries.push(entry);
            continue;
          }
          const itemFileId = await findFileId(fs, tenant, `${entry.id}.json`);
          if (!itemFileId) {
            nextEntries.push(entry);
            itemsSkipped += 1;
            continue;
          }
          const item = await readJson<ContentItemContract>(fs, tenant, itemFileId);
          if (!item) {
            nextEntries.push(entry);
            itemsSkipped += 1;
            continue;
          }
          const result = migrateContentItem(
            item as unknown as LegacyContentItem,
            entry as unknown as LegacyIndexEntry,
          );
          if (!result.changed) {
            nextEntries.push(entry);
            itemsSkipped += 1;
            continue;
          }
          nextEntries.push(result.indexEntry as unknown as ContentItemsIndexEntryContract);
          indexChanged = true;
          if (!options.dryRun) {
            await fs.replaceJsonFile(tenant, itemFileId, `${entry.id}.json`, result.item);
          }
          itemsMigrated += 1;
          logger.log(`  ${options.dryRun ? '[dry-run]' : '[migrate]'} ${tenant}/${entry.id}`);
        }

        if (indexChanged && !options.dryRun) {
          const nextIndex: ContentItemsIndexContract = {
            ...indexDoc,
            items: nextEntries,
            totalCount: nextEntries.length,
            lastUpdated: new Date().toISOString(),
          };
          await fs.replaceJsonFile(tenant, fileId, filename, nextIndex);
        }
      }
    } catch (err) {
      logger.error(`Migration failed for tenant ${tenant}`, err);
    }
  }

  return { workspacesScanned: tenants.length, itemsMigrated, itemsSkipped };
}

async function findFileId(
  fs: AgenticFilesystemService,
  tenant: string,
  filename: string,
): Promise<string | null> {
  try {
    const entries = await fs.listDirectory(tenant, CONTENT_ITEMS_NAMESPACE);
    const file = entries.find((e) => e.type === 'file' && e.name === filename);
    return file?.file_id ?? null;
  } catch {
    return null;
  }
}

async function readJson<T>(
  fs: AgenticFilesystemService,
  tenant: string,
  fileId: string,
): Promise<T | null> {
  const files = await fs.batchRetrieve(tenant, [fileId]);
  if (files.length === 0 || files[0].content_type === 'error') return null;
  return files[0].content as T;
}

/* istanbul ignore next */
async function main(): Promise<void> {
  const logger = new Logger('migrate-scheduled-fields');
  const options = parseArgs(process.argv.slice(2));
  process.env['AGENTIC_FS_URL'] = options.afsUrl;
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  try {
    const fs = app.get(AgenticFilesystemService);
    logger.log(
      `Starting migration (dryRun=${options.dryRun}, workspace=${options.workspace ?? 'all'})`,
    );
    const summary = await runMigration(
      fs,
      { workspace: options.workspace, dryRun: options.dryRun },
      {
        log: (msg) => logger.log(msg),
        error: (msg, err) => logger.error(msg, err as Error),
      },
    );
    logger.log(JSON.stringify(summary));
  } finally {
    await app.close();
  }
}

if (require.main === module) {
  main().catch((err) => {
    process.stderr.write(`${err instanceof Error ? err.stack ?? err.message : String(err)}\n`);
    process.exit(1);
  });
}
