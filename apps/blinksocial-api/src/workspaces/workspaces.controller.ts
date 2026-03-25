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

  @Put(':id/settings/:tab')
  updateSettings(
    @Param('id') id: string,
    @Param('tab') tab: string,
    @Body() body: unknown,
  ) {
    return this.workspacesService.updateSettings(id, tab, body);
  }
}
