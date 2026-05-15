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
  IdeaConceptOptionsRequestContract,
  IdeaConceptOptionsResponseContract,
  UserContract,
} from '@blinksocial/contracts';
import { IdeaConceptOptionsService } from './idea-concept-options.service';

@Controller('api/idea-concept-options')
export class IdeaConceptOptionsController {
  private readonly logger = new Logger(IdeaConceptOptionsController.name);

  constructor(private readonly service: IdeaConceptOptionsService) {}

  @Post()
  async generate(
    @Req() req: Request,
    @Body() body: IdeaConceptOptionsRequestContract,
  ): Promise<IdeaConceptOptionsResponseContract> {
    this.assertWorkspaceAccess(req, body?.workspaceId);
    return this.service.generate(body);
  }

  /**
   * Per-workspace authz lifted from AiAssistController. In mock-mode
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
