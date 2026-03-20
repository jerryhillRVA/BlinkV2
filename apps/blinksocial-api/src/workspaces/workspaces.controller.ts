import { Controller, Post, Get, Put, Body, Param } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import type { CreateWorkspaceRequestContract } from '@blinksocial/contracts';

@Controller('api/workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  create(@Body() body: CreateWorkspaceRequestContract) {
    this.workspacesService.validate(body);
    return this.workspacesService.create(body);
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
