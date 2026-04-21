import { Injectable } from '@nestjs/common';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class MockDataService {
  private readonly dataDir = join(__dirname, 'data');

  private readonly mockTenants = new Set(['hive-collective', 'booze-kills']);

  isMockWorkspace(workspaceId: string): boolean {
    return this.mockTenants.has(workspaceId);
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
