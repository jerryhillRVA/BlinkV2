import {
  Body,
  Controller,
  ForbiddenException,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import type {
  GenerateIdeasRequestContract,
  GenerateIdeasResponseContract,
  UserContract,
} from '@blinksocial/contracts';
import { GeneratedIdeasService } from './generated-ideas.service';

@Controller('api/generated-ideas')
export class GeneratedIdeasController {
  private readonly logger = new Logger(GeneratedIdeasController.name);

  constructor(private readonly service: GeneratedIdeasService) {}

  @Post()
  async generate(
    @Req() req: Request,
    @Body() body: GenerateIdeasRequestContract,
  ): Promise<GenerateIdeasResponseContract> {
    this.assertWorkspaceAccess(req, body?.workspaceId);
    return this.service.generate(body);
  }

  /**
   * Per-workspace authz lifted from IdeaConceptOptionsController. In mock-mode
   * (`AGENTIC_FS_URL` unset) the shared AuthGuard allows unauthenticated
   * requests; we mirror that bypass here.
   */
  private assertWorkspaceAccess(req: Request, workspaceId: string | undefined): void {
    const user = (req as Request & { user?: UserContract }).user;
    if (!user) {
      if (process.env['AGENTIC_FS_URL']) {
        throw new ForbiddenException('Authentication required.');
      }
      return;
    }
    if (!workspaceId) return;
    const ok = user.workspaces.some((w) => w.workspaceId === workspaceId);
    if (!ok) {
      throw new ForbiddenException('Access denied for this workspace.');
    }
  }
}
