import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * Posts carry two parent-concept fields for historical reasons:
 *   - `parentConceptId` — the canonical lineage pointer that drives the
 *     pipeline's lineage rule (#117) and the index projection.
 *   - `conceptId` — a web-side alias the post-detail components read to
 *     resolve the parent concept for the Content Concept sidebar card.
 *
 * The content-state service aliases parentConceptId → conceptId when the
 * latter is missing, but if BOTH are explicitly set on a full-item JSON
 * mock and diverge, the (wrong) `conceptId` wins. This spec walks every
 * mock workspace's post*.json files and fails CI when the two fields
 * disagree — catches the bug class that pointed post1 ("Mobility Flow
 * Reel") at concept1 ("Anti-Inflammatory Breakfasts Carousel").
 */

const MOCK_ROOT = join(__dirname, 'data');

interface PostJson {
  id?: string;
  stage?: string;
  conceptId?: string | null;
  parentConceptId?: string | null;
}

function discoverWorkspaces(): string[] {
  return readdirSync(MOCK_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

function postFilesIn(workspace: string): string[] {
  const dir = join(MOCK_ROOT, workspace, 'content-items');
  try {
    return readdirSync(dir).filter((f) => /^post.*\.json$/.test(f));
  } catch {
    return [];
  }
}

function readJson(workspace: string, file: string): PostJson {
  const path = join(MOCK_ROOT, workspace, 'content-items', file);
  return JSON.parse(readFileSync(path, 'utf-8')) as PostJson;
}

describe('mock post conceptId / parentConceptId consistency', () => {
  const workspaces = discoverWorkspaces();

  if (workspaces.length === 0) {
    it.skip('no mock workspaces found', () => undefined);
    return;
  }

  for (const ws of workspaces) {
    describe(ws, () => {
      const files = postFilesIn(ws);

      if (files.length === 0) {
        it.skip(`no post*.json files in ${ws}`, () => undefined);
        return;
      }

      for (const file of files) {
        it(`${file}: conceptId === parentConceptId when both present`, () => {
          const post = readJson(ws, file);
          // Only enforce when BOTH fields are present. A post with only
          // parentConceptId is fine — the content-state alias fills in
          // conceptId at read time.
          if (
            post.conceptId == null ||
            post.parentConceptId == null
          ) {
            return;
          }
          expect({
            file,
            conceptId: post.conceptId,
            parentConceptId: post.parentConceptId,
          }).toEqual({
            file,
            conceptId: post.parentConceptId,
            parentConceptId: post.parentConceptId,
          });
        });
      }
    });
  }
});
