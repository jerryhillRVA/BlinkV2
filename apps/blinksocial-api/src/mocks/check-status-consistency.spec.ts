import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * Ticket #117: idea/concept items in mock workspaces must follow the
 * lineage rule — `used` iff at least one child exists, otherwise `new`.
 * This spec walks every mock workspace's primary + archive indexes and
 * fails CI on drift.
 */

const MOCK_ROOT = join(__dirname, 'data');

function readIndex(workspace: string, file: string): { items: Row[] } {
  const path = join(
    MOCK_ROOT,
    workspace,
    'content-items',
    file,
  );
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return { items: [] };
  }
}

interface Row {
  id: string;
  stage: 'idea' | 'concept' | 'post';
  status: string;
  parentIdeaId: string | null;
  parentConceptId: string | null;
}

function discoverWorkspaces(): string[] {
  return readdirSync(MOCK_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

describe('mock content-items lineage consistency', () => {
  const workspaces = discoverWorkspaces();

  if (workspaces.length === 0) {
    it.skip('no mock workspaces found', () => undefined);
    return;
  }

  for (const ws of workspaces) {
    describe(ws, () => {
      const primary = readIndex(ws, '_content-items-index.json');
      const archive = readIndex(ws, '_content-items-archive-index.json');
      const all: Row[] = [...primary.items, ...archive.items];

      it('every idea/concept has status in [new, used]', () => {
        for (const r of all) {
          if (r.stage === 'idea' || r.stage === 'concept') {
            expect(['new', 'used']).toContain(r.status);
          }
        }
      });

      it('idea is `used` iff at least one child concept points to it', () => {
        for (const r of all) {
          if (r.stage !== 'idea') continue;
          const hasChild = all.some(
            (s) => s.stage === 'concept' && s.parentIdeaId === r.id,
          );
          const expected = hasChild ? 'used' : 'new';
          expect({ id: r.id, status: r.status }).toEqual({
            id: r.id,
            status: expected,
          });
        }
      });

      it('concept is `used` iff at least one child post points to it', () => {
        for (const r of all) {
          if (r.stage !== 'concept') continue;
          const hasChild = all.some(
            (s) => s.stage === 'post' && s.parentConceptId === r.id,
          );
          const expected = hasChild ? 'used' : 'new';
          expect({ id: r.id, status: r.status }).toEqual({
            id: r.id,
            status: expected,
          });
        }
      });
    });
  }
});
