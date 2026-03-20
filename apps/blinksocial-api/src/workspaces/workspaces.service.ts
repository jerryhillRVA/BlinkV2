import {
  Injectable,
  BadRequestException,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  CreateWorkspaceRequestContract,
  ListWorkspacesResponseContract,
  WorkspaceRegistryContract,
  WorkspaceRegistryEntryContract,
} from '@blinksocial/contracts';
import { CreateWorkspaceResponse } from '@blinksocial/models';
import { validateCreateWorkspaceRequest } from '@blinksocial/contracts/validation';
import { generateTenantId } from '@blinksocial/core';
import { AgenticFilesystemService } from '../agentic-filesystem/agentic-filesystem.service';

const SYSTEM_TENANT = 'blinksocial_system';
const REGISTRY_NAMESPACE = 'registry';
const REGISTRY_FILENAME = 'workspaces.json';

const MOCK_WORKSPACES: ListWorkspacesResponseContract = {
  workspaces: [
    {
      id: 'hive-collective',
      name: 'Hive Collective',
      color: '#d94e33',
      status: 'active',
      createdAt: '2026-01-15T10:00:00Z',
    },
    {
      id: 'booze-kills',
      name: 'Booze Kills',
      color: '#2b6bff',
      status: 'active',
      createdAt: '2026-02-01T10:00:00Z',
    },
  ],
};

@Injectable()
export class WorkspacesService {
  private readonly logger = new Logger(WorkspacesService.name);

  constructor(private readonly fs: AgenticFilesystemService) {}

  validate(data: unknown): void {
    const result = validateCreateWorkspaceRequest(data);
    if (!result.valid) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Validation failed',
        errors: result.errors,
      });
    }
  }

  async create(
    request: CreateWorkspaceRequestContract
  ): Promise<CreateWorkspaceResponse> {
    if (!this.fs.isConfigured()) {
      return new CreateWorkspaceResponse({
        id: randomUUID(),
        tenantId: generateTenantId(request.general.workspaceName),
        workspaceName: request.general.workspaceName,
        status: 'active',
        createdAt: new Date().toISOString(),
      });
    }

    try {
      const tenantId = await this.resolveUniqueTenantId(
        request.general.workspaceName
      );
      const brandColor = request.general.brandColor ?? '#d94e33';

      // Upload all settings, segments, and pillars in parallel
      await Promise.all([
        // 8 settings files
        this.fs.uploadJsonFile(tenantId, 'settings', 'general.json', request.general),
        this.fs.uploadJsonFile(tenantId, 'settings', 'brand-voice.json', request.brandVoice),
        this.fs.uploadJsonFile(tenantId, 'settings', 'platforms.json', request.platforms),
        this.fs.uploadJsonFile(tenantId, 'settings', 'skills.json', request.skills),
        this.fs.uploadJsonFile(tenantId, 'settings', 'calendar.json', {}),
        this.fs.uploadJsonFile(tenantId, 'settings', 'notifications.json', {}),
        this.fs.uploadJsonFile(tenantId, 'settings', 'security.json', {}),
        this.fs.uploadJsonFile(tenantId, 'settings', 'team.json', {}),
        // Audience segments
        ...request.audienceSegments.map((seg) =>
          this.fs.uploadJsonFile(tenantId, 'audience-segments', `${seg.id}.json`, seg)
        ),
        // Content pillars
        ...request.contentPillars.map((pillar) =>
          this.fs.uploadJsonFile(tenantId, 'content-pillars', `${pillar.id}.json`, pillar)
        ),
      ]);

      // Update workspace registry
      await this.updateRegistry({
        tenantId,
        name: request.general.workspaceName,
        status: 'active',
        plan: 'free',
        brandColor,
        createdAt: new Date().toISOString(),
      });

      return new CreateWorkspaceResponse({
        id: randomUUID(),
        tenantId,
        workspaceName: request.general.workspaceName,
        status: 'active',
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ServiceUnavailableException
      ) {
        throw error;
      }
      this.logger.error('Failed to create workspace', error);
      throw new ServiceUnavailableException(
        'Storage service unavailable. Please try again later.'
      );
    }
  }

  async list(): Promise<ListWorkspacesResponseContract> {
    if (!this.fs.isConfigured()) {
      return MOCK_WORKSPACES;
    }

    try {
      const registry = await this.readRegistry();
      if (!registry) {
        return { workspaces: [] };
      }

      return {
        workspaces: registry.workspaces.map((entry) => ({
          id: entry.tenantId,
          name: entry.name,
          color: entry.brandColor ?? '#d94e33',
          status: entry.status,
          createdAt: entry.createdAt,
        })),
      };
    } catch (error) {
      this.logger.error('Failed to list workspaces', error);
      return { workspaces: [] };
    }
  }

  private async resolveUniqueTenantId(name: string): Promise<string> {
    let tenantId = generateTenantId(name);
    const registry = await this.readRegistry();
    if (!registry) return tenantId;

    const existingIds = new Set(registry.workspaces.map((w) => w.tenantId));
    let suffix = 2;
    const baseTenantId = tenantId;
    while (existingIds.has(tenantId)) {
      tenantId = `${baseTenantId}-${suffix}`;
      suffix++;
    }
    return tenantId;
  }

  private async readRegistry(): Promise<WorkspaceRegistryContract | null> {
    try {
      const entries = await this.fs.listDirectory(
        SYSTEM_TENANT,
        REGISTRY_NAMESPACE,
        REGISTRY_NAMESPACE
      );
      const registryFile = entries.find(
        (e) => e.type === 'file' && e.name === REGISTRY_FILENAME
      );
      if (!registryFile || !registryFile.file_id) {
        return null;
      }

      const files = await this.fs.batchRetrieve(SYSTEM_TENANT, [
        registryFile.file_id,
      ]);
      if (files.length === 0 || files[0].content_type === 'error') {
        return null;
      }

      return files[0].content as WorkspaceRegistryContract;
    } catch {
      return null;
    }
  }

  private async updateRegistry(
    entry: WorkspaceRegistryEntryContract
  ): Promise<void> {
    let entries: { name: string; type: string; file_id?: string }[] = [];
    try {
      entries = await this.fs.listDirectory(SYSTEM_TENANT, REGISTRY_NAMESPACE, REGISTRY_NAMESPACE);
    } catch {
      // Directory doesn't exist yet, will create fresh
    }

    const registryFile = entries.find(
      (e) => e.type === 'file' && e.name === REGISTRY_FILENAME
    );

    if (registryFile && registryFile.file_id) {
      const files = await this.fs.batchRetrieve(SYSTEM_TENANT, [
        registryFile.file_id,
      ]);
      let registry: WorkspaceRegistryContract = {
        workspaces: [],
        totalWorkspaces: 0,
      };
      if (files.length > 0 && files[0].content_type !== 'error') {
        registry = files[0].content as WorkspaceRegistryContract;
      }
      registry.workspaces.push(entry);
      registry.totalWorkspaces = registry.workspaces.length;
      await this.fs.replaceJsonFile(
        SYSTEM_TENANT,
        registryFile.file_id,
        REGISTRY_FILENAME,
        registry
      );
    } else {
      const registry: WorkspaceRegistryContract = {
        workspaces: [entry],
        totalWorkspaces: 1,
      };
      await this.fs.uploadJsonFile(
        SYSTEM_TENANT,
        REGISTRY_NAMESPACE,
        REGISTRY_FILENAME,
        registry
      );
    }
  }
}
