import {
  Injectable,
  Inject,
  Optional,
  Logger,
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  ContentItemContract,
  ContentItemsIndexContract,
  ContentItemsArchiveIndexContract,
  ContentItemsIndexEntryContract,
  CreateContentItemRequestContract,
  SendConceptBackResponseContract,
  UpdateContentItemRequestContract,
} from '@blinksocial/contracts';
import { AgenticFilesystemService } from '../agentic-filesystem/agentic-filesystem.service';
import type { MockDataService } from '../mocks/mock-data.service';

const NAMESPACE = 'content-items';
const INDEX_FILE = '_content-items-index.json';
const ARCHIVE_INDEX_FILE = '_content-items-archive-index.json';

@Injectable()
export class ContentItemsService {
  private readonly logger = new Logger(ContentItemsService.name);

  /**
   * Per-workspace serialization queue for index mutations. Reads + writes of
   * `_content-items-index.json` / `_content-items-archive-index.json` are NOT
   * atomic on AFS, so concurrent requests (e.g. AI batch create, Move to
   * Production with N targets) would otherwise race and drop rows (D-25).
   */
  private readonly indexLocks = new Map<string, Promise<unknown>>();

  constructor(
    private readonly fs: AgenticFilesystemService,
    @Inject('MOCK_DATA_SERVICE') @Optional()
    private readonly mockDataService: MockDataService | null,
  ) {}

  private withIndexLock<T>(
    workspaceId: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    const prev = this.indexLocks.get(workspaceId) ?? Promise.resolve();
    const next = prev.catch(() => undefined).then(fn);
    // Track the sanitized promise so a rejection from `fn` doesn't poison
    // the chain for the next caller; the original rejection is still
    // surfaced to *this* caller via `next`.
    this.indexLocks.set(
      workspaceId,
      next.catch(() => undefined),
    );
    return next;
  }

  // --- Projection ---

  projectIndexEntry(item: ContentItemContract): ContentItemsIndexEntryContract {
    return {
      id: item.id,
      stage: item.stage,
      status: item.status,
      title: item.title,
      platform: item.platform ?? null,
      contentType: item.contentType ?? null,
      pillarIds: item.pillarIds ?? [],
      segmentIds: item.segmentIds ?? [],
      owner: item.owner ?? null,
      parentIdeaId: item.parentIdeaId ?? null,
      parentConceptId: item.parentConceptId ?? null,
      scheduledAt: item.scheduledAt ?? null,
      // #140: surface the new optional fields on the lite entry so
      // pipeline cards render correctly without a full-item fetch.
      publishedAt: item.publishedAt,
      isExported: item.isExported,
      archived: item.archived ?? false,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  // --- Public endpoints ---

  async getIndex(workspaceId: string): Promise<ContentItemsIndexContract> {
    if (this.fs.isConfigured()) {
      try {
        return await this.readIndex(workspaceId);
      } catch (error) {
        this.logger.error(`Failed to read ${workspaceId}/${INDEX_FILE}`, error);
        throw new ServiceUnavailableException('Storage service unavailable.');
      }
    }

    if (this.mockDataService?.isMockWorkspace(workspaceId)) {
      const data = (await this.mockDataService.getNamespaceAggregate(
        workspaceId,
        NAMESPACE,
        INDEX_FILE,
      )) as ContentItemsIndexContract | null;
      return data ?? this.emptyIndex();
    }

    throw new NotFoundException(`Workspace not found: ${workspaceId}`);
  }

  async getArchiveIndex(
    workspaceId: string,
  ): Promise<ContentItemsArchiveIndexContract> {
    if (this.fs.isConfigured()) {
      try {
        return await this.readArchiveIndex(workspaceId);
      } catch (error) {
        this.logger.error(
          `Failed to read ${workspaceId}/${ARCHIVE_INDEX_FILE}`,
          error,
        );
        throw new ServiceUnavailableException('Storage service unavailable.');
      }
    }

    if (this.mockDataService?.isMockWorkspace(workspaceId)) {
      const data = (await this.mockDataService.getNamespaceAggregate(
        workspaceId,
        NAMESPACE,
        ARCHIVE_INDEX_FILE,
      )) as ContentItemsArchiveIndexContract | null;
      return data ?? this.emptyIndex();
    }

    throw new NotFoundException(`Workspace not found: ${workspaceId}`);
  }

  async getItem(
    workspaceId: string,
    itemId: string,
  ): Promise<ContentItemContract> {
    if (this.fs.isConfigured()) {
      try {
        const item = await this.readItem(workspaceId, itemId);
        if (!item) {
          throw new NotFoundException(`Item not found: ${itemId}`);
        }
        return item;
      } catch (error) {
        if (error instanceof NotFoundException) throw error;
        this.logger.error(`Failed to read ${workspaceId}/${itemId}`, error);
        throw new ServiceUnavailableException('Storage service unavailable.');
      }
    }

    if (this.mockDataService?.isMockWorkspace(workspaceId)) {
      const item = (await this.mockDataService.getItemFile(
        workspaceId,
        itemId,
      )) as ContentItemContract | null;
      if (!item) {
        throw new NotFoundException(`Item not found: ${itemId}`);
      }
      return item;
    }

    throw new NotFoundException(`Workspace not found: ${workspaceId}`);
  }

  async createItem(
    workspaceId: string,
    request: CreateContentItemRequestContract,
  ): Promise<ContentItemContract> {
    const now = new Date().toISOString();
    const item: ContentItemContract = {
      ...(request as Partial<ContentItemContract>),
      id: `c-${randomUUID()}`,
      stage: request.stage,
      status: request.status,
      title: request.title,
      description: request.description ?? '',
      pillarIds: request.pillarIds ?? [],
      segmentIds: request.segmentIds ?? [],
      tags: request.tags ?? [],
      archived: request.archived ?? false,
      createdAt: now,
      updatedAt: now,
    };

    if (!this.fs.isConfigured()) {
      if (this.mockDataService?.isMockWorkspace(workspaceId)) {
        // #126: persist the new item + index row + cascade in the mock
        // override layer so subsequent GETs (and the pipeline view) reflect
        // the create. Without this, mock-mode Move-to-Production silently
        // dropped its writes.
        this.mockDataService.setItemOverride(workspaceId, item.id, item);
        const idx = await this.mockReadIndex(workspaceId);
        idx.items.push(this.projectIndexEntry(item));
        await this.mockWriteIndex(workspaceId, idx);
        const parentId = this.resolveParentId(item);
        if (parentId) {
          await this.mockFlipParentToUsed(workspaceId, parentId);
        }
        return item;
      }
      throw new NotFoundException(`Workspace not found: ${workspaceId}`);
    }

    try {
      await this.upsertItemFile(workspaceId, item);
    } catch (error) {
      this.logger.error(`Failed to write item ${item.id}`, error);
      throw new ServiceUnavailableException('Storage service unavailable.');
    }

    // Ticket #117: flip the parent's status to `'used'` in the same handler
    // so the pipeline reflects child existence atomically. If the flip
    // throws we roll back the child file so we don't leave a half-flipped
    // lineage (best-effort — true ACID isn't possible against AgenticFS).
    const parentId = this.resolveParentId(item);
    if (parentId) {
      try {
        await this.flipParentToUsed(workspaceId, parentId);
      } catch (flipError) {
        this.logger.error(
          `Parent flip failed for child ${item.id} → ${parentId}; rolling back child`,
          flipError,
        );
        try {
          await this.deleteItemFile(workspaceId, item.id);
        } catch (rollbackError) {
          this.logger.error(
            `Rollback of child ${item.id} also failed`,
            rollbackError,
          );
        }
        throw new ServiceUnavailableException(
          'Storage service unavailable.',
        );
      }
    }

    // Best-effort index update. Ordering: item first, index second.
    // Serialized per-workspace so concurrent creates don't clobber each other (D-25).
    try {
      await this.withIndexLock(workspaceId, async () => {
        const idx = await this.readIndex(workspaceId);
        idx.items.push(this.projectIndexEntry(item));
        await this.writeIndex(workspaceId, idx);
      });
    } catch (error) {
      this.logger.error(
        `Item ${item.id} written but index update failed — reconciliation TODO`,
        error,
      );
    }

    return item;
  }

  /**
   * The id of the lineage parent for a freshly-created child item:
   *   - concept with `parentIdeaId` → that idea
   *   - post with `parentConceptId` → that concept
   *   - anything else → no parent flip applies
   * Returns `null` when there's nothing to flip.
   */
  private resolveParentId(item: ContentItemContract): string | null {
    if (item.stage === 'concept' && item.parentIdeaId) {
      return item.parentIdeaId;
    }
    if (item.stage === 'post' && item.parentConceptId) {
      return item.parentConceptId;
    }
    return null;
  }

  /**
   * Reads the parent, sets `status: 'used'` if not already, and rewrites
   * both the item file and the primary-index row under the per-workspace
   * lock. No-op if the parent is missing or already `'used'`.
   */
  private async flipParentToUsed(
    workspaceId: string,
    parentId: string,
  ): Promise<void> {
    await this.withIndexLock(workspaceId, async () => {
      const parent = await this.readItem(workspaceId, parentId);
      if (!parent) return;
      if (parent.status === 'used') return;
      const updated: ContentItemContract = {
        ...parent,
        status: 'used',
        updatedAt: new Date().toISOString(),
      };
      await this.upsertItemFile(workspaceId, updated);
      const whichIndex = updated.archived ? 'archive' : 'primary';
      await this.replaceIndexRow(workspaceId, updated, whichIndex);
    });
  }

  /**
   * Reverse of `flipParentToUsed` — used by `deleteItem` / `updateItem`
   * when the last remaining child is removed. Skips the write if the
   * parent already shows `'new'` (idempotent).
   */
  private async flipParentToNew(
    workspaceId: string,
    parentId: string,
  ): Promise<void> {
    await this.withIndexLock(workspaceId, async () => {
      const parent = await this.readItem(workspaceId, parentId);
      if (!parent) return;
      if (parent.status === 'new') return;
      const updated: ContentItemContract = {
        ...parent,
        status: 'new',
        updatedAt: new Date().toISOString(),
      };
      await this.upsertItemFile(workspaceId, updated);
      const whichIndex = updated.archived ? 'archive' : 'primary';
      await this.replaceIndexRow(workspaceId, updated, whichIndex);
    });
  }

  /**
   * Counts remaining children of `parentId` across both primary and
   * archive indexes (archived siblings still count — they may be
   * unarchived). Used to decide whether removing a child should trigger
   * the parent un-flip.
   */
  private async countRemainingChildren(
    workspaceId: string,
    parentId: string,
    parentStage: 'idea' | 'concept',
  ): Promise<number> {
    const primary = await this.readIndex(workspaceId);
    const archive = await this.readArchiveIndex(workspaceId);
    const rows = [...primary.items, ...archive.items];
    if (parentStage === 'idea') {
      return rows.filter(
        (r) => r.stage === 'concept' && r.parentIdeaId === parentId,
      ).length;
    }
    return rows.filter(
      (r) => r.stage === 'post' && r.parentConceptId === parentId,
    ).length;
  }

  private async deleteItemFile(
    workspaceId: string,
    itemId: string,
  ): Promise<void> {
    const entries = await this.fs.listDirectory(workspaceId, NAMESPACE);
    const file = entries.find(
      (e) => e.type === 'file' && e.name === `${itemId}.json`,
    );
    if (file?.file_id) {
      await this.fs.deleteFile(workspaceId, file.file_id);
    }
  }

  async updateItem(
    workspaceId: string,
    itemId: string,
    patch: UpdateContentItemRequestContract,
  ): Promise<ContentItemContract> {
    if (!this.fs.isConfigured()) {
      if (this.mockDataService?.isMockWorkspace(workspaceId)) {
        const existing = (await this.mockDataService.getItemFile(
          workspaceId,
          itemId,
        )) as ContentItemContract | null;
        const base = existing ?? {
          id: itemId,
          stage: 'idea',
          status: 'new',
          title: '',
          description: '',
          pillarIds: [],
          segmentIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as ContentItemContract;
        const merged = {
          ...base,
          ...patch,
          id: itemId,
          updatedAt: new Date().toISOString(),
        } as ContentItemContract;
        // Ticket #134: same deep-merge for milestoneOverrides as the AFS branch.
        if (patch.milestoneOverrides) {
          merged.milestoneOverrides = {
            ...(base.milestoneOverrides ?? {}),
            ...patch.milestoneOverrides,
          };
        }
        // Persist in-memory so the next GET reflects this write — e.g.
        // advancing production.productionStep lands the user on the new
        // step on the next visit instead of reverting to the seed.
        this.mockDataService.setItemOverride(workspaceId, itemId, merged);
        // Also refresh the lite-entry projection on the index aggregate
        // so subsequent /index GETs surface the new status / platform /
        // publishedAt / isExported fields without a full-item fetch.
        // Without this, pipeline-card status / Exported pill / etc. stay
        // stuck on the seed until the cache happens to re-fetch the
        // detail. Mirrors the AFS-branch index update below.
        await this.mockReplaceIndexRow(workspaceId, merged);
        return merged;
      }
      throw new NotFoundException(`Workspace not found: ${workspaceId}`);
    }

    try {
      const existing = await this.readItem(workspaceId, itemId);
      if (!existing) {
        throw new NotFoundException(`Item not found: ${itemId}`);
      }
      const updated: ContentItemContract = {
        ...existing,
        ...patch,
        id: existing.id,
        createdAt: existing.createdAt,
        updatedAt: new Date().toISOString(),
      };
      // Ticket #134: deep-merge `milestoneOverrides` so a patch that only
      // overrides one milestone type does not wipe other types' overrides.
      if (patch.milestoneOverrides) {
        updated.milestoneOverrides = {
          ...(existing.milestoneOverrides ?? {}),
          ...patch.milestoneOverrides,
        };
      }

      await this.upsertItemFile(workspaceId, updated);

      // Serialize all index writes per workspace (D-25).
      try {
        await this.withIndexLock(workspaceId, async () => {
          const wasArchived = !!existing.archived;
          const isArchived = !!updated.archived;
          if (wasArchived !== isArchived) {
            // archived flag flipped — move the row between indexes atomically
            const primary = await this.readIndex(workspaceId);
            const archive = await this.readArchiveIndex(workspaceId);
            const row = this.projectIndexEntry(updated);
            if (isArchived) {
              primary.items = primary.items.filter((r) => r.id !== updated.id);
              const i = archive.items.findIndex((r) => r.id === updated.id);
              if (i === -1) archive.items.push(row);
              else archive.items[i] = row;
            } else {
              archive.items = archive.items.filter((r) => r.id !== updated.id);
              const i = primary.items.findIndex((r) => r.id === updated.id);
              if (i === -1) primary.items.push(row);
              else primary.items[i] = row;
            }
            await this.writeIndex(workspaceId, primary);
            await this.writeArchiveIndex(workspaceId, archive);
          } else {
            const whichIndex = isArchived ? 'archive' : 'primary';
            await this.replaceIndexRow(workspaceId, updated, whichIndex);
          }
        });
      } catch (error) {
        this.logger.error(
          `Item ${updated.id} written but index update failed — reconciliation TODO`,
          error,
        );
      }

      // Ticket #117: if the patch changed `stage`, treat the item as
      // "removed from the old parent" — re-evaluate the old parent and
      // un-flip if no children remain. Covers the hypothetical
      // post→concept demote path before that UI affordance lands.
      if (existing.stage !== updated.stage) {
        await this.maybeUnflipParent(workspaceId, existing);
      }

      return updated;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to update ${workspaceId}/${itemId}`, error);
      throw new ServiceUnavailableException('Storage service unavailable.');
    }
  }

  async archiveItem(
    workspaceId: string,
    itemId: string,
  ): Promise<ContentItemContract> {
    return this.setArchivedFlag(workspaceId, itemId, true);
  }

  async unarchiveItem(
    workspaceId: string,
    itemId: string,
  ): Promise<ContentItemContract> {
    return this.setArchivedFlag(workspaceId, itemId, false);
  }

  async deleteItem(
    workspaceId: string,
    itemId: string,
  ): Promise<{ deleted: true; id: string }> {
    if (!this.fs.isConfigured()) {
      if (this.mockDataService?.isMockWorkspace(workspaceId)) {
        // #126: full mock-mode delete — remove the override (and mask any
        // seed JSON for this id), strip the row from primary/archive index,
        // and run the parent un-flip cascade so deleting the last child
        // returns the parent to 'new'.
        const existing = (await this.mockDataService.getItemFile(
          workspaceId,
          itemId,
        )) as ContentItemContract | null;
        this.mockDataService.deleteItemOverride(workspaceId, itemId);
        const primary = await this.mockReadIndex(workspaceId);
        primary.items = primary.items.filter((r) => r.id !== itemId);
        await this.mockWriteIndex(workspaceId, primary);
        const archive = await this.mockReadArchiveIndex(workspaceId);
        archive.items = archive.items.filter((r) => r.id !== itemId);
        await this.mockWriteArchiveIndex(workspaceId, archive);
        if (existing) {
          await this.mockMaybeUnflipParent(workspaceId, existing);
        }
        return { deleted: true, id: itemId };
      }
      throw new NotFoundException(`Workspace not found: ${workspaceId}`);
    }

    try {
      const existing = await this.readItem(workspaceId, itemId);
      if (!existing) {
        throw new NotFoundException(`Item not found: ${itemId}`);
      }

      await this.deleteItemFile(workspaceId, itemId);

      try {
        const whichIndex = existing.archived ? 'archive' : 'primary';
        await this.withIndexLock(workspaceId, () =>
          this.removeIndexRow(workspaceId, itemId, whichIndex),
        );
      } catch (error) {
        this.logger.error(
          `Item ${itemId} deleted but index update failed — reconciliation TODO`,
          error,
        );
      }

      // Ticket #117: if the deleted item was the last remaining child of
      // its parent, flip the parent back to `'new'` so the pipeline can
      // surface it again. Best-effort — the client reconcileLineageStatuses
      // pass acts as a safety net if this fails.
      await this.maybeUnflipParent(workspaceId, existing);

      return { deleted: true, id: itemId };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to delete ${workspaceId}/${itemId}`, error);
      throw new ServiceUnavailableException('Storage service unavailable.');
    }
  }

  /**
   * Ticket #118: cascade-soft-delete every live post under the given concept,
   * then flip the concept's status from `'used'` → `'new'`. The two-phase
   * operation is wrapped in a try/catch that unwinds already-archived posts
   * on failure, so a partial flip never leaves a `'used'` concept with no
   * remaining live children.
   */
  async sendConceptBack(
    workspaceId: string,
    conceptId: string,
  ): Promise<SendConceptBackResponseContract> {
    if (!this.fs.isConfigured()) {
      if (this.mockDataService?.isMockWorkspace(workspaceId)) {
        // #126: full mock-mode cascade — archive each live child post via
        // setArchivedFlag (which handles override + index moves in the
        // mock branch), then flip the concept's override to 'new'.
        const concept = (await this.mockDataService.getItemFile(
          workspaceId,
          conceptId,
        )) as ContentItemContract | null;
        if (!concept) {
          throw new NotFoundException(`Item not found: ${conceptId}`);
        }
        if (concept.stage !== 'concept') {
          throw new BadRequestException(
            `Item ${conceptId} is not a concept (stage=${concept.stage})`,
          );
        }
        const primary = await this.mockReadIndex(workspaceId);
        const archive = await this.mockReadArchiveIndex(workspaceId);
        const liveChildren = primary.items.filter(
          (r) =>
            r.stage === 'post' && r.parentConceptId === conceptId && !r.archived,
        );
        const alreadyArchivedPostIds = archive.items
          .filter((r) => r.stage === 'post' && r.parentConceptId === conceptId)
          .map((r) => r.id);
        const archivedPostIds: string[] = [];
        for (const child of liveChildren) {
          await this.setArchivedFlag(workspaceId, child.id, true);
          archivedPostIds.push(child.id);
        }
        await this.mockFlipParentToNew(workspaceId, conceptId);
        return {
          conceptId,
          archivedPostIds,
          alreadyArchivedPostIds,
          conceptStatus: 'new',
        };
      }
      throw new NotFoundException(`Workspace not found: ${workspaceId}`);
    }

    const concept = await this.readItem(workspaceId, conceptId);
    if (!concept) {
      throw new NotFoundException(`Item not found: ${conceptId}`);
    }
    if (concept.stage !== 'concept') {
      throw new BadRequestException(
        `Item ${conceptId} is not a concept (stage=${concept.stage})`,
      );
    }

    const primary = await this.readIndex(workspaceId);
    const archive = await this.readArchiveIndex(workspaceId);

    const liveChildren = primary.items.filter(
      (r) =>
        r.stage === 'post' && r.parentConceptId === conceptId && !r.archived,
    );
    const alreadyArchivedPostIds = archive.items
      .filter((r) => r.stage === 'post' && r.parentConceptId === conceptId)
      .map((r) => r.id);

    const archivedPostIds: string[] = [];
    try {
      for (const child of liveChildren) {
        await this.setArchivedFlag(workspaceId, child.id, true);
        archivedPostIds.push(child.id);
      }
    } catch (archiveError) {
      this.logger.error(
        `sendConceptBack: cascade archive failed mid-flight — rolling back ${archivedPostIds.length} archives`,
        archiveError,
      );
      await this.rollbackArchives(workspaceId, archivedPostIds);
      throw new ServiceUnavailableException('Storage service unavailable.');
    }

    try {
      await this.flipParentToNew(workspaceId, conceptId);
    } catch (flipError) {
      this.logger.error(
        `sendConceptBack: concept flip failed — rolling back ${archivedPostIds.length} archives`,
        flipError,
      );
      await this.rollbackArchives(workspaceId, archivedPostIds);
      throw new ServiceUnavailableException('Storage service unavailable.');
    }

    return {
      conceptId,
      archivedPostIds,
      alreadyArchivedPostIds,
      conceptStatus: 'new',
    };
  }

  private async rollbackArchives(
    workspaceId: string,
    ids: string[],
  ): Promise<void> {
    for (const id of [...ids].reverse()) {
      try {
        await this.setArchivedFlag(workspaceId, id, false);
      } catch (rollbackError) {
        this.logger.error(
          `sendConceptBack rollback failed for ${id}`,
          rollbackError,
        );
      }
    }
  }

  /**
   * After a child item is removed (delete or stage-change), check whether
   * its parent has any remaining children. If zero, flip the parent back
   * to `'new'`. Logs and continues on failure — never blocks the caller.
   *
   * NOTE: this only fires when the *removed* item is itself a child
   * (concept with `parentIdeaId` or post with `parentConceptId`).
   */
  private async maybeUnflipParent(
    workspaceId: string,
    removed: ContentItemContract,
  ): Promise<void> {
    let parentId: string | null = null;
    let parentStage: 'idea' | 'concept' | null = null;
    if (removed.stage === 'concept' && removed.parentIdeaId) {
      parentId = removed.parentIdeaId;
      parentStage = 'idea';
    } else if (removed.stage === 'post' && removed.parentConceptId) {
      parentId = removed.parentConceptId;
      parentStage = 'concept';
    }
    if (!parentId || !parentStage) return;

    try {
      const remaining = await this.countRemainingChildren(
        workspaceId,
        parentId,
        parentStage,
      );
      if (remaining > 0) return;
      await this.flipParentToNew(workspaceId, parentId);
    } catch (error) {
      this.logger.error(
        `Parent un-flip failed — leaving as \`used\` (parent=${parentId})`,
        error,
      );
    }
  }

  // --- Internal: reads ---

  private async readIndex(
    workspaceId: string,
  ): Promise<ContentItemsIndexContract> {
    const data = await this.readAggregate(workspaceId, INDEX_FILE);
    return (data as ContentItemsIndexContract | null) ?? this.emptyIndex();
  }

  private async readArchiveIndex(
    workspaceId: string,
  ): Promise<ContentItemsArchiveIndexContract> {
    const data = await this.readAggregate(workspaceId, ARCHIVE_INDEX_FILE);
    return (data as ContentItemsArchiveIndexContract | null) ?? this.emptyIndex();
  }

  private async readAggregate(
    workspaceId: string,
    filename: string,
  ): Promise<unknown | null> {
    let entries: Awaited<
      ReturnType<AgenticFilesystemService['listDirectory']>
    > = [];
    try {
      entries = await this.fs.listDirectory(workspaceId, NAMESPACE);
    } catch {
      return null;
    }
    const file = entries.find(
      (e) => e.type === 'file' && e.name === filename,
    );
    if (!file?.file_id) return null;
    const files = await this.fs.batchRetrieve(workspaceId, [file.file_id]);
    if (files.length === 0 || files[0].content_type === 'error') return null;
    return files[0].content;
  }

  private async readItem(
    workspaceId: string,
    itemId: string,
  ): Promise<ContentItemContract | null> {
    let entries: Awaited<
      ReturnType<AgenticFilesystemService['listDirectory']>
    > = [];
    try {
      entries = await this.fs.listDirectory(workspaceId, NAMESPACE);
    } catch {
      return null;
    }
    const file = entries.find(
      (e) => e.type === 'file' && e.name === `${itemId}.json`,
    );
    if (!file?.file_id) return null;
    const files = await this.fs.batchRetrieve(workspaceId, [file.file_id]);
    if (files.length === 0 || files[0].content_type === 'error') return null;
    return files[0].content as ContentItemContract;
  }

  // --- Internal: writes ---

  private async writeIndex(
    workspaceId: string,
    idx: ContentItemsIndexContract,
  ): Promise<void> {
    idx.totalCount = idx.items.length;
    idx.lastUpdated = new Date().toISOString();
    await this.upsertAggregate(workspaceId, INDEX_FILE, idx);
  }

  private async writeArchiveIndex(
    workspaceId: string,
    idx: ContentItemsArchiveIndexContract,
  ): Promise<void> {
    idx.totalCount = idx.items.length;
    idx.lastUpdated = new Date().toISOString();
    await this.upsertAggregate(workspaceId, ARCHIVE_INDEX_FILE, idx);
  }

  private async upsertAggregate(
    workspaceId: string,
    filename: string,
    data: unknown,
  ): Promise<void> {
    let entries: Awaited<
      ReturnType<AgenticFilesystemService['listDirectory']>
    > = [];
    try {
      entries = await this.fs.listDirectory(workspaceId, NAMESPACE);
    } catch {
      // Namespace doesn't exist yet — upload will create it.
    }
    const file = entries.find(
      (e) => e.type === 'file' && e.name === filename,
    );
    if (file?.file_id) {
      await this.fs.replaceJsonFile(workspaceId, file.file_id, filename, data);
    } else {
      await this.fs.uploadJsonFile(workspaceId, NAMESPACE, filename, data);
    }
  }

  private async upsertItemFile(
    workspaceId: string,
    item: ContentItemContract,
  ): Promise<void> {
    const filename = `${item.id}.json`;
    let entries: Awaited<
      ReturnType<AgenticFilesystemService['listDirectory']>
    > = [];
    try {
      entries = await this.fs.listDirectory(workspaceId, NAMESPACE);
    } catch {
      // Namespace doesn't exist yet — upload will create it.
    }
    const file = entries.find(
      (e) => e.type === 'file' && e.name === filename,
    );
    if (file?.file_id) {
      await this.fs.replaceJsonFile(workspaceId, file.file_id, filename, item);
    } else {
      await this.fs.uploadJsonFile(workspaceId, NAMESPACE, filename, item);
    }
  }

  // --- Internal: index mutations ---

  private async replaceIndexRow(
    workspaceId: string,
    item: ContentItemContract,
    which: 'primary' | 'archive',
  ): Promise<void> {
    const row = this.projectIndexEntry(item);
    if (which === 'primary') {
      const idx = await this.readIndex(workspaceId);
      const i = idx.items.findIndex((r) => r.id === item.id);
      if (i === -1) idx.items.push(row);
      else idx.items[i] = row;
      await this.writeIndex(workspaceId, idx);
    } else {
      const idx = await this.readArchiveIndex(workspaceId);
      const i = idx.items.findIndex((r) => r.id === item.id);
      if (i === -1) idx.items.push(row);
      else idx.items[i] = row;
      await this.writeArchiveIndex(workspaceId, idx);
    }
  }

  private async removeIndexRow(
    workspaceId: string,
    itemId: string,
    which: 'primary' | 'archive',
  ): Promise<void> {
    if (which === 'primary') {
      const idx = await this.readIndex(workspaceId);
      idx.items = idx.items.filter((r) => r.id !== itemId);
      await this.writeIndex(workspaceId, idx);
    } else {
      const idx = await this.readArchiveIndex(workspaceId);
      idx.items = idx.items.filter((r) => r.id !== itemId);
      await this.writeArchiveIndex(workspaceId, idx);
    }
  }

  private async setArchivedFlag(
    workspaceId: string,
    itemId: string,
    archived: boolean,
  ): Promise<ContentItemContract> {
    if (!this.fs.isConfigured()) {
      if (this.mockDataService?.isMockWorkspace(workspaceId)) {
        const existing = (await this.mockDataService.getItemFile(
          workspaceId,
          itemId,
        )) as ContentItemContract | null;
        if (!existing) {
          throw new NotFoundException(`Item not found: ${itemId}`);
        }
        if (!!existing.archived === archived) {
          return existing;
        }
        const updated: ContentItemContract = {
          ...existing,
          archived,
          updatedAt: new Date().toISOString(),
        };
        // #126: persist the override + move the row between primary and
        // archive index in the mock layer, mirroring the AFS branch below.
        this.mockDataService.setItemOverride(workspaceId, itemId, updated);
        const primary = await this.mockReadIndex(workspaceId);
        const archiveIdx = await this.mockReadArchiveIndex(workspaceId);
        const row = this.projectIndexEntry(updated);
        if (archived) {
          primary.items = primary.items.filter((r) => r.id !== itemId);
          const i = archiveIdx.items.findIndex((r) => r.id === itemId);
          if (i === -1) archiveIdx.items.push(row);
          else archiveIdx.items[i] = row;
        } else {
          archiveIdx.items = archiveIdx.items.filter((r) => r.id !== itemId);
          const i = primary.items.findIndex((r) => r.id === itemId);
          if (i === -1) primary.items.push(row);
          else primary.items[i] = row;
        }
        await this.mockWriteIndex(workspaceId, primary);
        await this.mockWriteArchiveIndex(workspaceId, archiveIdx);
        return updated;
      }
      throw new NotFoundException(`Workspace not found: ${workspaceId}`);
    }

    try {
      const existing = await this.readItem(workspaceId, itemId);
      if (!existing) {
        throw new NotFoundException(`Item not found: ${itemId}`);
      }
      if (!!existing.archived === archived) {
        return existing;
      }

      const updated: ContentItemContract = {
        ...existing,
        archived,
        updatedAt: new Date().toISOString(),
      };

      await this.upsertItemFile(workspaceId, updated);

      try {
        await this.withIndexLock(workspaceId, async () => {
          const primary = await this.readIndex(workspaceId);
          const archive = await this.readArchiveIndex(workspaceId);
          const row = this.projectIndexEntry(updated);

          if (archived) {
            primary.items = primary.items.filter((r) => r.id !== itemId);
            const i = archive.items.findIndex((r) => r.id === itemId);
            if (i === -1) archive.items.push(row);
            else archive.items[i] = row;
          } else {
            archive.items = archive.items.filter((r) => r.id !== itemId);
            const i = primary.items.findIndex((r) => r.id === itemId);
            if (i === -1) primary.items.push(row);
            else primary.items[i] = row;
          }

          await this.writeIndex(workspaceId, primary);
          await this.writeArchiveIndex(workspaceId, archive);
        });
      } catch (error) {
        this.logger.error(
          `Item ${itemId} archive flag flipped but index update failed — reconciliation TODO`,
          error,
        );
      }

      return updated;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(
        `Failed to ${archived ? 'archive' : 'unarchive'} ${workspaceId}/${itemId}`,
        error,
      );
      throw new ServiceUnavailableException('Storage service unavailable.');
    }
  }

  private emptyIndex(): ContentItemsIndexContract {
    return {
      items: [],
      totalCount: 0,
      lastUpdated: new Date().toISOString(),
    };
  }

  // --- Internal: mock-mode helpers (ticket #126) ---
  //
  // These mirror the AFS helpers above but route through MockDataService's
  // in-memory override layer. They exist so the mock branches of createItem,
  // deleteItem, setArchivedFlag, and sendConceptBack produce a coherent
  // index + cascade without touching the real filesystem. No-ops degrade
  // gracefully when mockDataService is unavailable.

  private async mockReadIndex(
    workspaceId: string,
  ): Promise<ContentItemsIndexContract> {
    const data = (await this.mockDataService?.getNamespaceAggregate(
      workspaceId,
      NAMESPACE,
      INDEX_FILE,
    )) as ContentItemsIndexContract | null;
    // Deep-clone so mutations don't bleed back into the seed JSON cache.
    return data
      ? (JSON.parse(JSON.stringify(data)) as ContentItemsIndexContract)
      : this.emptyIndex();
  }

  private async mockReadArchiveIndex(
    workspaceId: string,
  ): Promise<ContentItemsArchiveIndexContract> {
    const data = (await this.mockDataService?.getNamespaceAggregate(
      workspaceId,
      NAMESPACE,
      ARCHIVE_INDEX_FILE,
    )) as ContentItemsArchiveIndexContract | null;
    return data
      ? (JSON.parse(JSON.stringify(data)) as ContentItemsArchiveIndexContract)
      : this.emptyIndex();
  }

  private async mockWriteIndex(
    workspaceId: string,
    idx: ContentItemsIndexContract,
  ): Promise<void> {
    if (!this.mockDataService) return;
    idx.totalCount = idx.items.length;
    idx.lastUpdated = new Date().toISOString();
    this.mockDataService.setAggregateOverride(
      workspaceId,
      NAMESPACE,
      INDEX_FILE,
      idx,
    );
  }

  private async mockWriteArchiveIndex(
    workspaceId: string,
    idx: ContentItemsArchiveIndexContract,
  ): Promise<void> {
    if (!this.mockDataService) return;
    idx.totalCount = idx.items.length;
    idx.lastUpdated = new Date().toISOString();
    this.mockDataService.setAggregateOverride(
      workspaceId,
      NAMESPACE,
      ARCHIVE_INDEX_FILE,
      idx,
    );
  }

  /**
   * Mock-mode equivalent of {@link flipParentToUsed}. Reads the parent
   * override (or seed), sets `status: 'used'` if not already, writes the
   * patched override back, and patches the row in the matching index.
   */
  private async mockFlipParentToUsed(
    workspaceId: string,
    parentId: string,
  ): Promise<void> {
    if (!this.mockDataService) return;
    const parent = (await this.mockDataService.getItemFile(
      workspaceId,
      parentId,
    )) as ContentItemContract | null;
    if (!parent) return;
    if (parent.status === 'used') return;
    const updated: ContentItemContract = {
      ...parent,
      status: 'used',
      updatedAt: new Date().toISOString(),
    };
    this.mockDataService.setItemOverride(workspaceId, parentId, updated);
    await this.mockReplaceIndexRow(workspaceId, updated);
  }

  /**
   * Mock-mode equivalent of {@link flipParentToNew}.
   */
  private async mockFlipParentToNew(
    workspaceId: string,
    parentId: string,
  ): Promise<void> {
    if (!this.mockDataService) return;
    const parent = (await this.mockDataService.getItemFile(
      workspaceId,
      parentId,
    )) as ContentItemContract | null;
    if (!parent) return;
    if (parent.status === 'new') return;
    const updated: ContentItemContract = {
      ...parent,
      status: 'new',
      updatedAt: new Date().toISOString(),
    };
    this.mockDataService.setItemOverride(workspaceId, parentId, updated);
    await this.mockReplaceIndexRow(workspaceId, updated);
  }

  /**
   * Mock-mode equivalent of {@link maybeUnflipParent}. Counts remaining
   * children of the removed item's parent across both mock indexes; if
   * zero, flips the parent's override status back to `'new'`.
   */
  private async mockMaybeUnflipParent(
    workspaceId: string,
    removed: ContentItemContract,
  ): Promise<void> {
    let parentId: string | null = null;
    let parentStage: 'idea' | 'concept' | null = null;
    if (removed.stage === 'concept' && removed.parentIdeaId) {
      parentId = removed.parentIdeaId;
      parentStage = 'idea';
    } else if (removed.stage === 'post' && removed.parentConceptId) {
      parentId = removed.parentConceptId;
      parentStage = 'concept';
    }
    if (!parentId || !parentStage) return;

    const primary = await this.mockReadIndex(workspaceId);
    const archive = await this.mockReadArchiveIndex(workspaceId);
    const rows = [...primary.items, ...archive.items];
    const remaining =
      parentStage === 'idea'
        ? rows.filter(
            (r) => r.stage === 'concept' && r.parentIdeaId === parentId,
          ).length
        : rows.filter(
            (r) => r.stage === 'post' && r.parentConceptId === parentId,
          ).length;
    if (remaining > 0) return;
    await this.mockFlipParentToNew(workspaceId, parentId);
  }

  /**
   * Find the row matching `item.id` in either the primary or archive mock
   * index and replace it with a freshly-projected row. No-op if the row
   * isn't present in either index.
   */
  private async mockReplaceIndexRow(
    workspaceId: string,
    item: ContentItemContract,
  ): Promise<void> {
    const row = this.projectIndexEntry(item);
    const primary = await this.mockReadIndex(workspaceId);
    const primaryIdx = primary.items.findIndex((r) => r.id === item.id);
    if (primaryIdx !== -1) {
      primary.items[primaryIdx] = row;
      await this.mockWriteIndex(workspaceId, primary);
      return;
    }
    const archive = await this.mockReadArchiveIndex(workspaceId);
    const archiveIdx = archive.items.findIndex((r) => r.id === item.id);
    if (archiveIdx !== -1) {
      archive.items[archiveIdx] = row;
      await this.mockWriteArchiveIndex(workspaceId, archive);
    }
  }
}
