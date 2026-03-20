import { Injectable, BadRequestException, NotFoundException, Inject, Optional } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { CreateWorkspaceRequestContract } from '@blinksocial/contracts';
import { CreateWorkspaceResponse } from '@blinksocial/models';
import { validateCreateWorkspaceRequest } from '@blinksocial/contracts/validation';
import type { MockDataService } from '../mocks/mock-data.service';

const VALID_TABS = new Set([
  'general', 'platforms', 'brand-voice', 'skills',
  'team', 'notifications', 'calendar', 'security',
]);

@Injectable()
export class WorkspacesService {
  constructor(
    @Inject('MOCK_DATA_SERVICE') @Optional()
    private readonly mockDataService: MockDataService | null,
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

  create(request: CreateWorkspaceRequestContract): CreateWorkspaceResponse {
    return new CreateWorkspaceResponse({
      id: randomUUID(),
      workspaceName: request.general.workspaceName,
      status: 'active',
      createdAt: new Date().toISOString(),
    });
  }

  async getSettings(workspaceId: string, tab: string): Promise<unknown> {
    if (!VALID_TABS.has(tab)) {
      throw new NotFoundException(`Unknown settings tab: ${tab}`);
    }

    if (this.mockDataService?.isMockWorkspace(workspaceId)) {
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

    if (this.mockDataService?.isMockWorkspace(workspaceId)) {
      // Mock workspaces: no-op, return data as-is
      return data;
    }

    throw new NotFoundException(`Workspace not found: ${workspaceId}`);
  }
}
