import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
  Inject,
  Optional,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  CreateWorkspaceRequestContract,
  ListWorkspacesResponseContract,
  WorkspaceRegistryContract,
  WorkspaceRegistryEntryContract,
  TeamSettingsContract,
  TeamMemberContract,
} from '@blinksocial/contracts';
import { CreateWorkspaceResponse } from '@blinksocial/models';
import { validateCreateWorkspaceRequest } from '@blinksocial/contracts/validation';
import { generateTenantId } from '@blinksocial/core';
import { AgenticFilesystemService } from '../agentic-filesystem/agentic-filesystem.service';
import type { MockDataService } from '../mocks/mock-data.service';
import { UserService } from '../auth/user.service';

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

const VALID_TABS = new Set([
  'general', 'platforms', 'brand-voice', 'skills',
  'business-objectives', 'brand-positioning',
  'team', 'notifications', 'calendar', 'security',
  'wizard-state', 'onboarding-session',
]);

@Injectable()
export class WorkspacesService {
  private readonly logger = new Logger(WorkspacesService.name);

  constructor(
    private readonly fs: AgenticFilesystemService,
    @Inject('MOCK_DATA_SERVICE') @Optional()
    private readonly mockDataService: MockDataService | null,
    private readonly userService: UserService,
  ) {}

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

      await Promise.all([
        this.fs.uploadJsonFile(tenantId, 'settings', 'general.json', request.general),
        this.fs.uploadJsonFile(tenantId, 'settings', 'brand-voice.json', request.brandVoice),
        this.fs.uploadJsonFile(tenantId, 'settings', 'platforms.json', request.platforms),
        this.fs.uploadJsonFile(tenantId, 'settings', 'skills.json', request.skills ?? { skills: [] }),
        this.fs.uploadJsonFile(tenantId, 'settings', 'business-objectives.json', request.businessObjectives ?? []),
        this.fs.uploadJsonFile(tenantId, 'settings', 'brand-positioning.json', request.brandPositioning ?? {}),
        this.fs.uploadJsonFile(tenantId, 'settings', 'calendar.json', {}),
        this.fs.uploadJsonFile(tenantId, 'settings', 'notifications.json', {}),
        this.fs.uploadJsonFile(tenantId, 'settings', 'security.json', {}),
        ...request.audienceSegments.map((seg) =>
          this.fs.uploadJsonFile(tenantId, 'audience-segments', `${seg.id}.json`, seg)
        ),
        ...request.contentPillars.map((pillar) =>
          this.fs.uploadJsonFile(tenantId, 'content-pillars', `${pillar.id}.json`, pillar)
        ),
      ]);

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

  /**
   * Create a workspace with only a name and status (minimal — used by onboarding).
   * If a full CreateWorkspaceRequestContract is provided, all settings are persisted.
   */
  async createInStatus(
    workspaceName: string,
    status: 'onboarding' | 'creating',
    fullRequest?: CreateWorkspaceRequestContract,
  ): Promise<CreateWorkspaceResponse> {
    const tenantId = await this.resolveUniqueTenantId(workspaceName);
    const brandColor = fullRequest?.general?.brandColor ?? '#d94e33';

    if (!this.fs.isConfigured()) {
      return new CreateWorkspaceResponse({
        id: randomUUID(),
        tenantId,
        workspaceName,
        status,
        createdAt: new Date().toISOString(),
      });
    }

    try {
      if (fullRequest) {
        // Full workspace creation with given status
        const generalWithStatus = { ...fullRequest.general, status };
        await Promise.all([
          this.fs.uploadJsonFile(tenantId, 'settings', 'general.json', generalWithStatus),
          this.fs.uploadJsonFile(tenantId, 'settings', 'brand-voice.json', fullRequest.brandVoice),
          this.fs.uploadJsonFile(tenantId, 'settings', 'platforms.json', fullRequest.platforms),
          this.fs.uploadJsonFile(tenantId, 'settings', 'skills.json', fullRequest.skills ?? { skills: [] }),
          this.fs.uploadJsonFile(tenantId, 'settings', 'business-objectives.json', fullRequest.businessObjectives ?? []),
          this.fs.uploadJsonFile(tenantId, 'settings', 'brand-positioning.json', fullRequest.brandPositioning ?? {}),
          this.fs.uploadJsonFile(tenantId, 'settings', 'calendar.json', {}),
          this.fs.uploadJsonFile(tenantId, 'settings', 'notifications.json', {}),
          this.fs.uploadJsonFile(tenantId, 'settings', 'security.json', {}),
          ...fullRequest.audienceSegments.map((seg) =>
            this.fs.uploadJsonFile(tenantId, 'audience-segments', `${seg.id}.json`, seg)
          ),
          ...fullRequest.contentPillars.map((pillar) =>
            this.fs.uploadJsonFile(tenantId, 'content-pillars', `${pillar.id}.json`, pillar)
          ),
        ]);
      } else {
        // Minimal workspace — only general.json with name + status
        await this.fs.uploadJsonFile(tenantId, 'settings', 'general.json', {
          workspaceName,
          status,
        });
      }

      await this.updateRegistry({
        tenantId,
        name: workspaceName,
        status,
        plan: 'free',
        brandColor,
        createdAt: new Date().toISOString(),
      });

      return new CreateWorkspaceResponse({
        id: randomUUID(),
        tenantId,
        workspaceName,
        status,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ServiceUnavailableException
      ) {
        throw error;
      }
      this.logger.error('Failed to create workspace in status', error);
      throw new ServiceUnavailableException(
        'Storage service unavailable. Please try again later.',
      );
    }
  }

  /**
   * Transition a workspace's status (e.g., 'onboarding' → 'creating').
   * Updates both general.json and the registry entry.
   */
  async transitionStatus(
    workspaceId: string,
    newStatus: 'onboarding' | 'creating' | 'active',
  ): Promise<void> {
    if (!this.fs.isConfigured()) return;

    try {
      const generalContent = await this.readSettingsFile(workspaceId, 'general');
      if (generalContent) {
        const general = generalContent as Record<string, unknown>;
        general['status'] = newStatus;
        await this.writeSettingsFile(workspaceId, 'general', general);
      }

      const registry = await this.readRegistry();
      if (registry) {
        const entry = registry.workspaces.find((w) => w.tenantId === workspaceId);
        if (entry) {
          entry.status = newStatus;
          await this.writeRegistry(registry);
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to transition workspace ${workspaceId} to ${newStatus}`,
        error,
      );
    }
  }

  /**
   * Transition a workspace from 'creating' to 'active'.
   * Reads wizard-state.json, persists its formData to individual settings files,
   * then deletes wizard-state.json.
   */
  async finalizeWorkspace(workspaceId: string): Promise<{ status: string }> {
    if (!this.fs.isConfigured()) {
      return { status: 'active' };
    }

    try {
      // 1. Read wizard-state.json and persist its formData to individual settings files
      const wizardContent = await this.readSettingsFile(workspaceId, 'wizard-state');
      if (wizardContent) {
        const wizardState = wizardContent as {
          formData?: CreateWorkspaceRequestContract;
        };
        if (wizardState.formData) {
          const request = wizardState.formData;
          // Merge wizard formData into general.json (preserve existing fields, add purpose/mission/etc.)
          const existingGeneral = (await this.readSettingsFile(workspaceId, 'general') ?? {}) as Record<string, unknown>;
          const mergedGeneral = {
            ...existingGeneral,
            ...request.general,
            status: 'active',
          };

          await Promise.all([
            this.writeSettingsFile(workspaceId, 'general', mergedGeneral),
            request.brandVoice
              ? this.writeSettingsFile(workspaceId, 'brand-voice', request.brandVoice)
              : Promise.resolve(),
            request.platforms
              ? this.writeSettingsFile(workspaceId, 'platforms', request.platforms)
              : Promise.resolve(),
            request.skills
              ? this.writeSettingsFile(workspaceId, 'skills', request.skills)
              : Promise.resolve(),
            this.writeSettingsFile(workspaceId, 'business-objectives', request.businessObjectives ?? []),
            this.writeSettingsFile(workspaceId, 'brand-positioning', request.brandPositioning ?? {}),
            this.writeSettingsFile(workspaceId, 'calendar', {}),
            this.writeSettingsFile(workspaceId, 'notifications', {}),
            this.writeSettingsFile(workspaceId, 'security', {}),
            ...(request.audienceSegments ?? []).map((seg) =>
              this.fs.uploadJsonFile(workspaceId, 'audience-segments', `${seg.id}.json`, seg)
            ),
            ...(request.contentPillars ?? []).map((pillar) =>
              this.fs.uploadJsonFile(workspaceId, 'content-pillars', `${pillar.id}.json`, pillar)
            ),
          ]);
        }
      } else {
        // No wizard-state found — just update status in general.json
        const generalContent = await this.readSettingsFile(workspaceId, 'general');
        if (generalContent) {
          const general = generalContent as Record<string, unknown>;
          general['status'] = 'active';
          await this.writeSettingsFile(workspaceId, 'general', general);
        }
      }

      // 2. Update registry entry status
      const registry = await this.readRegistry();
      if (registry) {
        const entry = registry.workspaces.find((w) => w.tenantId === workspaceId);
        if (entry) {
          entry.status = 'active';
          await this.writeRegistry(registry);
        }
      }

      // 3. Delete wizard-state.json if it exists
      try {
        const entries = await this.fs.listDirectory(workspaceId, 'settings');
        const wizardFile = entries.find(
          (e) => e.type === 'file' && e.name === 'wizard-state.json',
        );
        if (wizardFile?.file_id) {
          await this.fs.deleteFile(workspaceId, wizardFile.file_id);
        }
      } catch {
        // wizard-state.json may not exist, that's fine
      }

      return { status: 'active' };
    } catch (error) {
      this.logger.error(`Failed to finalize workspace ${workspaceId}`, error);
      throw new ServiceUnavailableException(
        'Storage service unavailable. Please try again later.',
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

  async getSettings(workspaceId: string, tab: string): Promise<unknown> {
    if (!VALID_TABS.has(tab)) {
      throw new NotFoundException(`Unknown settings tab: ${tab}`);
    }

    if (this.fs.isConfigured()) {
      try {
        // Verify workspace exists in registry
        const registry = await this.readRegistry();
        const exists = registry?.workspaces.some((w) => w.tenantId === workspaceId);
        if (!exists) {
          throw new NotFoundException(`Workspace not found: ${workspaceId}`);
        }

        const content = await this.readSettingsFile(workspaceId, tab);
        const settings = (content ?? {}) as Record<string, unknown>;

        if (tab === 'general') {
          const segments = await this.readNamespaceDocs(workspaceId, 'audience-segments');
          if (segments.length > 0) {
            // Map demographics -> ageRange for the UI contract
            settings['audienceSegments'] = (segments as Record<string, unknown>[]).map((s) => {
              const seg = { ...s };
              if (seg['demographics'] && !seg['ageRange']) {
                seg['ageRange'] = seg['demographics'];
              }
              return seg;
            });
          }
          // Hydrate brandVoice from the brand-voice settings file
          if (!settings['brandVoice']) {
            const brandVoice = await this.readSettingsFile(workspaceId, 'brand-voice');
            if (brandVoice) {
              const bv = brandVoice as Record<string, unknown>;
              if (bv['brandVoiceDescription']) {
                settings['brandVoice'] = bv['brandVoiceDescription'];
              }
            }
          }
        }

        if (tab === 'brand-voice') {
          const pillars = await this.readNamespaceDocs(workspaceId, 'content-pillars');
          if (pillars.length > 0) {
            settings['contentPillars'] = (pillars as Record<string, unknown>[]).map((p) => {
              const pillar = { ...p };
              // Normalize platformDistribution to targetPlatforms if targetPlatforms is absent
              if (!pillar['targetPlatforms'] && pillar['platformDistribution']) {
                pillar['targetPlatforms'] = Object.keys(
                  pillar['platformDistribution'] as Record<string, number>
                );
              }
              return pillar;
            });
          }
          // Populate audienceOptions from audience segment IDs and include segment details
          const segments = await this.readNamespaceDocs(workspaceId, 'audience-segments');
          if (segments.length > 0) {
            const segRecords = segments as Record<string, unknown>[];
            settings['audienceOptions'] = segRecords.map(
              (s) => (s['id'] as string) ?? ''
            );
            settings['audienceSegments'] = segRecords;
          }
        }

        if (tab === 'team') {
          // Serve team data from users.json instead of team.json
          const teamData = await this.getTeamFromUsers(workspaceId);
          return teamData;
        }

        if (tab === 'calendar') {
          if (!settings['deadlineTemplates'] || typeof settings['deadlineTemplates'] !== 'object') {
            settings['deadlineTemplates'] = {};
          }
          if (!settings['reminderSettings'] || typeof settings['reminderSettings'] !== 'object') {
            settings['reminderSettings'] = {
              milestone72h: true,
              milestone24h: true,
              milestoneOverdue: true,
              publish24h: true,
            };
          }
          if (settings['autoCreateOnPublish'] === undefined) {
            settings['autoCreateOnPublish'] = false;
          }
        }

        return settings;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }
        this.logger.error(`Failed to read settings ${workspaceId}/${tab}`, error);
        throw new ServiceUnavailableException(
          'Storage service unavailable. Please try again later.'
        );
      }
    }

    // Fall back to mock data only when AFS is not configured
    if (!this.fs.isConfigured() && this.mockDataService?.isMockWorkspace(workspaceId)) {
      const data = await this.mockDataService.getSettings(workspaceId, tab);
      if (data === null) {
        throw new NotFoundException(`Settings not found for ${workspaceId}/${tab}`);
      }
      return data;
    }

    throw new NotFoundException(`Workspace not found: ${workspaceId}`);
  }

  async updateSettings(workspaceId: string, tab: string, data: unknown): Promise<unknown> {
    if (!VALID_TABS.has(tab)) {
      throw new NotFoundException(`Unknown settings tab: ${tab}`);
    }

    if (!this.fs.isConfigured() && this.mockDataService?.isMockWorkspace(workspaceId)) {
      return data;
    }

    if (this.fs.isConfigured()) {
      try {
        // Verify workspace exists in registry
        const registry = await this.readRegistry();
        const exists = registry?.workspaces.some((w) => w.tenantId === workspaceId);
        if (!exists) {
          throw new NotFoundException(`Workspace not found: ${workspaceId}`);
        }

        const record = data as Record<string, unknown>;

        if (tab === 'general' && Array.isArray(record['audienceSegments'])) {
          // Map ageRange -> demographics for storage
          const segments = (record['audienceSegments'] as { id: string; [k: string]: unknown }[]).map((s) => {
            const seg = { ...s };
            if (seg['ageRange']) {
              seg['demographics'] = seg['ageRange'];
              delete seg['ageRange'];
            }
            return seg;
          });
          await this.syncNamespaceDocs(workspaceId, 'audience-segments', segments);
          const { audienceSegments: _segments, ...settingsOnly } = record;
          await this.writeSettingsFile(workspaceId, tab, settingsOnly);
        } else if (tab === 'brand-voice' && Array.isArray(record['contentPillars'])) {
          const pillars = record['contentPillars'] as { id: string; [k: string]: unknown }[];
          await this.syncNamespaceDocs(workspaceId, 'content-pillars', pillars);
          const { contentPillars: _pillars, ...settingsOnly } = record;
          await this.writeSettingsFile(workspaceId, tab, settingsOnly);
        } else {
          await this.writeSettingsFile(workspaceId, tab, data);
        }

        return data;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }
        this.logger.error(`Failed to write settings ${workspaceId}/${tab}`, error);
        throw new ServiceUnavailableException(
          'Storage service unavailable. Please try again later.'
        );
      }
    }

    throw new NotFoundException(`Workspace not found: ${workspaceId}`);
  }

  private async getTeamFromUsers(workspaceId: string): Promise<TeamSettingsContract> {
    const users = await this.userService.listByWorkspace(workspaceId);
    const members: TeamMemberContract[] = users.map((u) => {
      const access = u.workspaces.find((w) => w.workspaceId === workspaceId);
      return {
        id: u.id,
        name: u.displayName,
        email: u.email,
        role: access?.role ?? 'Viewer',
        status: u.isActive ? 'active' as const : 'deactivated' as const,
        joinedAt: access?.joinedAt,
      };
    });
    return { members };
  }

  private async readSettingsFile(
    tenantId: string,
    tab: string
  ): Promise<unknown | null> {
    const filename = `${tab}.json`;
    let entries: { name: string; type: string; file_id?: string }[] = [];
    try {
      entries = await this.fs.listDirectory(tenantId, 'settings');
    } catch {
      return null;
    }

    const file = entries.find(
      (e) => e.type === 'file' && e.name === filename
    );
    if (!file || !file.file_id) {
      return null;
    }

    const files = await this.fs.batchRetrieve(tenantId, [file.file_id]);
    if (files.length === 0 || files[0].content_type === 'error') {
      return null;
    }

    return files[0].content;
  }

  private async writeSettingsFile(
    tenantId: string,
    tab: string,
    data: unknown
  ): Promise<void> {
    const filename = `${tab}.json`;
    let entries: { name: string; type: string; file_id?: string }[] = [];
    try {
      entries = await this.fs.listDirectory(tenantId, 'settings');
    } catch {
      // Directory doesn't exist yet, will create via upload
    }

    const file = entries.find(
      (e) => e.type === 'file' && e.name === filename
    );

    if (file && file.file_id) {
      await this.fs.replaceJsonFile(tenantId, file.file_id, filename, data);
    } else {
      await this.fs.uploadJsonFile(tenantId, 'settings', filename, data);
    }
  }

  private async readNamespaceDocs(
    tenantId: string,
    namespace: string
  ): Promise<unknown[]> {
    let entries: { name: string; type: string; file_id?: string }[] = [];
    try {
      entries = await this.fs.listDirectory(tenantId, namespace);
    } catch {
      return [];
    }

    const fileIds = entries
      .filter((e): e is typeof e & { file_id: string } => e.type === 'file' && !!e.file_id)
      .map((e) => e.file_id);

    if (fileIds.length === 0) return [];

    const files = await this.fs.batchRetrieve(tenantId, fileIds);
    return files
      .filter((f) => f.content_type !== 'error' && f.content != null)
      .map((f) => f.content as unknown);
  }

  private async syncNamespaceDocs(
    tenantId: string,
    namespace: string,
    docs: { id: string; [k: string]: unknown }[]
  ): Promise<void> {
    let entries: { name: string; type: string; file_id?: string }[] = [];
    try {
      entries = await this.fs.listDirectory(tenantId, namespace);
    } catch {
      // Namespace doesn't exist yet
    }

    const existingFiles = new Map(
      entries
        .filter((e): e is typeof e & { file_id: string } => e.type === 'file' && !!e.file_id)
        .map((e) => [e.name, e.file_id])
    );

    const newDocNames = new Set(docs.map((d) => `${d.id}.json`));

    // Delete docs that are no longer present
    const deletions = [...existingFiles.entries()]
      .filter(([name]) => !newDocNames.has(name))
      .map(([, fileId]) => this.fs.deleteFile(tenantId, fileId));

    // Upsert each doc
    const upserts = docs.map((doc) => {
      const filename = `${doc.id}.json`;
      const existingId = existingFiles.get(filename);
      if (existingId) {
        return this.fs.replaceJsonFile(tenantId, existingId, filename, doc);
      }
      return this.fs.uploadJsonFile(tenantId, namespace, filename, doc);
    });

    await Promise.all([...deletions, ...upserts]);
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
      entries = await this.fs.listDirectory(SYSTEM_TENANT, REGISTRY_NAMESPACE);
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

  private async writeRegistry(
    registry: WorkspaceRegistryContract
  ): Promise<void> {
    let entries: { name: string; type: string; file_id?: string }[] = [];
    try {
      entries = await this.fs.listDirectory(SYSTEM_TENANT, REGISTRY_NAMESPACE);
    } catch {
      // Directory doesn't exist yet
    }

    const registryFile = entries.find(
      (e) => e.type === 'file' && e.name === REGISTRY_FILENAME
    );

    registry.totalWorkspaces = registry.workspaces.length;

    if (registryFile && registryFile.file_id) {
      await this.fs.replaceJsonFile(
        SYSTEM_TENANT,
        registryFile.file_id,
        REGISTRY_FILENAME,
        registry
      );
    } else {
      await this.fs.uploadJsonFile(
        SYSTEM_TENANT,
        REGISTRY_NAMESPACE,
        REGISTRY_FILENAME,
        registry
      );
    }
  }
}
