import { Injectable } from '@nestjs/common';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class MockDataService {
  private readonly dataDir = join(__dirname, 'data');

  private readonly mockTenants = new Set(['hive-collective', 'booze-kills']);

  /**
   * In-memory write layer for mock workspaces. Keyed by workspaceId → itemId.
   * Lives for the lifetime of the Nest process — restarting the API resets
   * the mocks to whatever the on-disk JSON seeds say. This is what makes
   * PUTs against mock workspaces "stick" within a session (e.g. advancing
   * production.productionStep so the next visit lands the user on the
   * step they advanced to), without dirtying the checked-in seed files.
   */
  private readonly itemOverrides = new Map<string, Map<string, unknown>>();

  /**
   * In-memory write layer for namespace-aggregate files (e.g. the content-items
   * primary/archive index). Keyed by workspaceId → namespace → filename → data.
   * Same lifecycle as itemOverrides — cleared on process restart. Required so
   * that mock-mode create/delete/cascade flows produce a coherent index that
   * subsequent GETs can observe (#126).
   */
  private readonly aggregateOverrides = new Map<
    string,
    Map<string, Map<string, unknown>>
  >();

  /**
   * Records the ids that the mock layer has explicitly deleted in this session.
   * Used to mask seed JSON for items that have since been removed. Keyed by
   * workspaceId.
   */
  private readonly deletedItems = new Map<string, Set<string>>();

  isMockWorkspace(workspaceId: string): boolean {
    return this.mockTenants.has(workspaceId);
  }

  /**
   * Record an in-memory override for a single content item. Subsequent
   * calls to {@link getItemFile} for the same (workspaceId, itemId) return
   * this object instead of reading the seed JSON.
   */
  setItemOverride(
    workspaceId: string,
    itemId: string,
    item: unknown,
  ): void {
    if (!this.isMockWorkspace(workspaceId)) return;
    let workspaceMap = this.itemOverrides.get(workspaceId);
    if (!workspaceMap) {
      workspaceMap = new Map<string, unknown>();
      this.itemOverrides.set(workspaceId, workspaceMap);
    }
    workspaceMap.set(itemId, item);
    // If a previous session deleted this id, an override re-instates it.
    this.deletedItems.get(workspaceId)?.delete(itemId);
  }

  /**
   * Mark an item as deleted in the mock layer. Removes any override and
   * masks the seed JSON so {@link getItemFile} returns null afterwards.
   * No-op for non-mock workspaces.
   */
  deleteItemOverride(workspaceId: string, itemId: string): void {
    if (!this.isMockWorkspace(workspaceId)) return;
    this.itemOverrides.get(workspaceId)?.delete(itemId);
    let deleted = this.deletedItems.get(workspaceId);
    if (!deleted) {
      deleted = new Set<string>();
      this.deletedItems.set(workspaceId, deleted);
    }
    deleted.add(itemId);
  }

  /**
   * Read the override for a namespace-aggregate file (e.g. the content-items
   * index). Returns the in-memory object when one has been written this
   * session, else `undefined`.
   */
  getAggregateOverride(
    workspaceId: string,
    namespace: string,
    filename: string,
  ): unknown | undefined {
    return this.aggregateOverrides
      .get(workspaceId)
      ?.get(namespace)
      ?.get(filename);
  }

  /**
   * Write an in-memory override for a namespace-aggregate file. Subsequent
   * calls to {@link getNamespaceAggregate} return this object instead of
   * reading the seed JSON. No-op for non-mock workspaces.
   */
  setAggregateOverride(
    workspaceId: string,
    namespace: string,
    filename: string,
    data: unknown,
  ): void {
    if (!this.isMockWorkspace(workspaceId)) return;
    let workspaceMap = this.aggregateOverrides.get(workspaceId);
    if (!workspaceMap) {
      workspaceMap = new Map<string, Map<string, unknown>>();
      this.aggregateOverrides.set(workspaceId, workspaceMap);
    }
    let namespaceMap = workspaceMap.get(namespace);
    if (!namespaceMap) {
      namespaceMap = new Map<string, unknown>();
      workspaceMap.set(namespace, namespaceMap);
    }
    namespaceMap.set(filename, data);
  }

  async getSettings(workspaceId: string, tab: string): Promise<unknown | null> {
    if (!this.isMockWorkspace(workspaceId)) {
      return null;
    }
    const filePath = join(this.dataDir, workspaceId, 'settings', `${tab}.json`);
    try {
      const content = await readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  async getNamespaceDocs(workspaceId: string, namespace: string): Promise<unknown[]> {
    if (!this.isMockWorkspace(workspaceId)) {
      return [];
    }
    const dirPath = join(this.dataDir, workspaceId, namespace);
    try {
      const files = await readdir(dirPath);
      const jsonFiles = files.filter((f) => f.endsWith('.json') && !f.startsWith('_'));
      const results = await Promise.all(
        jsonFiles.map(async (f) => {
          const content = await readFile(join(dirPath, f), 'utf-8');
          return JSON.parse(content);
        })
      );
      return results;
    } catch {
      return [];
    }
  }

  async getNamespaceAggregate(
    workspaceId: string,
    namespace: string,
    filename: string,
  ): Promise<unknown | null> {
    if (!this.isMockWorkspace(workspaceId)) {
      return null;
    }
    // In-memory overrides take precedence over the seed JSON so writes
    // (index mutations from create/delete/cascade) are observable in the
    // same session.
    const override = this.getAggregateOverride(workspaceId, namespace, filename);
    if (override !== undefined) return override;
    const filePath = join(this.dataDir, workspaceId, namespace, filename);
    try {
      const content = await readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  async getItemFile(
    workspaceId: string,
    itemId: string,
  ): Promise<unknown | null> {
    if (!this.isMockWorkspace(workspaceId)) {
      return null;
    }
    // Deleted in this session — mask the seed.
    if (this.deletedItems.get(workspaceId)?.has(itemId)) {
      return null;
    }
    // In-memory overrides take precedence over the seed JSON so writes
    // PUT against mock workspaces are observable on subsequent reads.
    const override = this.itemOverrides.get(workspaceId)?.get(itemId);
    if (override !== undefined) return override;
    const filePath = join(
      this.dataDir,
      workspaceId,
      'content-items',
      `${itemId}.json`,
    );
    try {
      const content = await readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
}
