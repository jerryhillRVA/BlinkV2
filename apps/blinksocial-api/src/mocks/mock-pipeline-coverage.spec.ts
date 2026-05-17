import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * #140 regression guard: every mock workspace must seed at least one
 * card in every pipeline column. The frontend's PIPELINE_COLUMNS rules
 * are mirrored here verbatim so a drift in either place fails the test.
 *
 * Columns (post-#140):
 *  - Ideas        — stage='idea',    status='new'
 *  - Concepts     — stage='concept', status='new'
 *  - Post Builder — status in {'in-progress', 'review'} (#140 folded
 *                   review back into Post Builder from the old combined
 *                   Scheduled column).
 *  - Scheduled    — status='scheduled' (#140: 'review' no longer counts)
 *  - Published    — status='published'
 *
 * Plus: scheduled items must carry `publishConfig.publishAction='schedule'`
 *       (or `isExported: true`) so the frontend's `downgradeOrphanedScheduled`
 *       normalization doesn't punt them to Post Builder on read.
 *       Published items must carry a `publishedAt` so the calendar event
 *       util emits a publish event for them.
 */
const WORKSPACES = ['hive-collective', 'booze-kills'] as const;
const DATA_DIR = join(__dirname, 'data');

interface IndexEntry {
  id: string;
  stage: 'idea' | 'concept' | 'post';
  status: string;
  publishedAt?: string;
  isExported?: boolean;
  archived?: boolean;
}

interface IndexFile {
  items: IndexEntry[];
  totalCount: number;
  lastUpdated: string;
}

function loadIndex(workspaceId: string): IndexEntry[] {
  const path = join(
    DATA_DIR,
    workspaceId,
    'content-items',
    '_content-items-index.json',
  );
  const raw = readFileSync(path, 'utf-8');
  const parsed = JSON.parse(raw) as IndexFile;
  return parsed.items.filter((i) => !i.archived);
}

function loadItemFile(workspaceId: string, itemId: string): Record<string, unknown> {
  const path = join(DATA_DIR, workspaceId, 'content-items', `${itemId}.json`);
  return JSON.parse(readFileSync(path, 'utf-8')) as Record<string, unknown>;
}

const COLUMN_PREDICATES: ReadonlyArray<readonly [string, (i: IndexEntry) => boolean]> = [
  ['Ideas',        (i) => i.stage === 'idea' && i.status === 'new'],
  ['Concepts',     (i) => i.stage === 'concept' && i.status === 'new'],
  ['Post Builder', (i) => i.status === 'in-progress' || i.status === 'review'],
  ['Scheduled',    (i) => i.status === 'scheduled'],
  ['Published',    (i) => i.status === 'published'],
];

describe('mock-data pipeline coverage', () => {
  for (const ws of WORKSPACES) {
    describe(ws, () => {
      const items = loadIndex(ws);

      for (const [col, pred] of COLUMN_PREDICATES) {
        it(`has ≥1 item in the ${col} column`, () => {
          const matches = items.filter(pred);
          expect(matches.length).toBeGreaterThan(0);
        });
      }

      it('every scheduled item is #140-coherent (publishAction=schedule OR isExported=true)', () => {
        const scheduled = items.filter((i) => i.status === 'scheduled');
        for (const entry of scheduled) {
          const full = loadItemFile(ws, entry.id) as {
            production?: { qa?: { publishConfig?: { publishAction?: string } } };
            isExported?: boolean;
          };
          const action = full.production?.qa?.publishConfig?.publishAction;
          const coherent = action === 'schedule' || full.isExported === true;
          expect(coherent).toBe(true);
        }
      });

      it('every published item carries publishedAt', () => {
        const published = items.filter((i) => i.status === 'published');
        for (const entry of published) {
          const full = loadItemFile(ws, entry.id) as { publishedAt?: string };
          expect(full.publishedAt).toBeTruthy();
        }
      });
    });
  }

  // #140 spec calls for an Export-Packet variant on each workspace so the
  // gray Exported pill is exercisable in dev.
  it('each workspace seeds at least one isExported=true item', () => {
    for (const ws of WORKSPACES) {
      const items = loadIndex(ws);
      const exported = items.filter((i) => i.isExported === true);
      expect(exported.length).toBeGreaterThan(0);
    }
  });
});
