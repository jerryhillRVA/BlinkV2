import {
  Injectable,
  Inject,
  Optional,
  Logger,
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

  constructor(
    private readonly fs: AgenticFilesystemService,
    @Inject('MOCK_DATA_SERVICE') @Optional()
    private readonly mockDataService: MockDataService | null,
  ) {}

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
      scheduledDate: item.scheduledDate ?? null,
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
      archived: request.archived ?? false,
      createdAt: now,
      updatedAt: now,
    };

    if (!this.fs.isConfigured()) {
      if (this.mockDataService?.isMockWorkspace(workspaceId)) {
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

    // Best-effort index update. Ordering: item first, index second.
    try {
      const idx = await this.readIndex(workspaceId);
      idx.items.push(this.projectIndexEntry(item));
      await this.writeIndex(workspaceId, idx);
    } catch (error) {
      this.logger.error(
        `Item ${item.id} written but index update failed — reconciliation TODO`,
        error,
      );
    }

    return item;
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
          status: 'draft',
          title: '',
          description: '',
          pillarIds: [],
          segmentIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as ContentItemContract;
        return {
          ...base,
          ...patch,
          id: itemId,
          updatedAt: new Date().toISOString(),
        } as ContentItemContract;
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

      await this.upsertItemFile(workspaceId, updated);

      try {
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
      } catch (error) {
        this.logger.error(
          `Item ${updated.id} written but index update failed — reconciliation TODO`,
          error,
        );
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
        return { deleted: true, id: itemId };
      }
      throw new NotFoundException(`Workspace not found: ${workspaceId}`);
    }

    try {
      const existing = await this.readItem(workspaceId, itemId);
      if (!existing) {
        throw new NotFoundException(`Item not found: ${itemId}`);
      }

      const entries = await this.fs.listDirectory(workspaceId, NAMESPACE);
      const file = entries.find(
        (e) => e.type === 'file' && e.name === `${itemId}.json`,
      );
      if (file?.file_id) {
        await this.fs.deleteFile(workspaceId, file.file_id);
      }

      try {
        const whichIndex = existing.archived ? 'archive' : 'primary';
        await this.removeIndexRow(workspaceId, itemId, whichIndex);
      } catch (error) {
        this.logger.error(
          `Item ${itemId} deleted but index update failed — reconciliation TODO`,
          error,
        );
      }

      return { deleted: true, id: itemId };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to delete ${workspaceId}/${itemId}`, error);
      throw new ServiceUnavailableException('Storage service unavailable.');
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
        return {
          ...(existing ?? ({ id: itemId } as ContentItemContract)),
          archived,
          updatedAt: new Date().toISOString(),
        } as ContentItemContract;
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
}
