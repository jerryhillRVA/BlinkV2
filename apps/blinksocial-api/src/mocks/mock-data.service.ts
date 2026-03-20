import { Injectable } from '@nestjs/common';
import { readFile } from 'fs/promises';
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
}
