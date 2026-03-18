import { Controller, Post, Body } from '@nestjs/common';
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
}
