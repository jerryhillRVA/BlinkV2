import { Controller, Post, Get, Put, Body, Param, Req } from '@nestjs/common';
import type { Request } from 'express';
import { WorkspacesService } from './workspaces.service';
import { UserService } from '../auth/user.service';
import type { CreateWorkspaceRequestContract, UserContract } from '@blinksocial/contracts';

@Controller('api/workspaces')
export class WorkspacesController {
  constructor(
    private readonly workspacesService: WorkspacesService,
    private readonly userService: UserService,
  ) {}

  @Get()
  async list(@Req() req: Request) {
    const user = (req as Request & { user?: UserContract }).user;
    const result = await this.workspacesService.list();

    // Filter workspaces to only those the user has access to
    if (user) {
      const accessibleIds = new Set((user.workspaces ?? []).map((w) => w.workspaceId));
      result.workspaces = result.workspaces.filter((w) => accessibleIds.has(w.id));
    }

    return result;
  }

  @Post()
  async create(@Req() req: Request, @Body() body: CreateWorkspaceRequestContract) {
    this.workspacesService.validate(body);
    const response = await this.workspacesService.create(body);

    // Add the creating user as Admin of the new workspace
    const user = (req as Request & { user?: UserContract }).user;
    if (user && response.tenantId) {
      await this.userService.addWorkspaceAccess(user.id, response.tenantId, 'Admin');
    }

    return response;
  }

  @Get(':id/settings/:tab')
  getSettings(@Param('id') id: string, @Param('tab') tab: string) {
    return this.workspacesService.getSettings(id, tab);
  }

  @Post(':id/finalize')
  async finalizeWorkspace(@Param('id') id: string) {
    return this.workspacesService.finalizeWorkspace(id);
  }

  @Put(':id/settings/:tab')
  updateSettings(
    @Param('id') id: string,
    @Param('tab') tab: string,
    @Body() body: unknown,
  ) {
    return this.workspacesService.updateSettings(id, tab, body);
  }

  // --- Namespace entity endpoints (research-sources, competitor-insights) ---

  @Get(':id/research-sources')
  getResearchSources(@Param('id') id: string) {
    return this.workspacesService.getNamespaceEntities(id, 'research-sources');
  }

  @Put(':id/research-sources')
  saveResearchSources(@Param('id') id: string, @Body() body: { id: string }[]) {
    return this.workspacesService.saveNamespaceEntities(id, 'research-sources', body);
  }

  @Get(':id/competitor-insights')
  getCompetitorInsights(@Param('id') id: string) {
    return this.workspacesService.getNamespaceEntities(id, 'competitor-insights');
  }

  @Put(':id/competitor-insights')
  saveCompetitorInsights(@Param('id') id: string, @Body() body: { id: string }[]) {
    return this.workspacesService.saveNamespaceEntities(id, 'competitor-insights', body);
  }

  // --- Namespace aggregate endpoints (content-mix, audience-insights) ---

  @Get(':id/content-mix')
  getContentMix(@Param('id') id: string) {
    return this.workspacesService.getNamespaceAggregateEndpoint(id, 'content-pillars', '_content-mix.json');
  }

  @Put(':id/content-mix')
  saveContentMix(@Param('id') id: string, @Body() body: unknown) {
    return this.workspacesService.saveNamespaceAggregateEndpoint(id, 'content-pillars', '_content-mix.json', body);
  }

  @Get(':id/audience-insights')
  getAudienceInsights(@Param('id') id: string) {
    return this.workspacesService.getNamespaceAggregateEndpoint(id, 'audience-segments', '_audience-insights.json');
  }

  @Put(':id/audience-insights')
  saveAudienceInsights(@Param('id') id: string, @Body() body: unknown) {
    return this.workspacesService.saveNamespaceAggregateEndpoint(id, 'audience-segments', '_audience-insights.json', body);
  }
}
