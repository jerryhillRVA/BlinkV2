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
  AiAssistRequestContract,
  AiAssistResponseContract,
  UserContract,
} from '@blinksocial/contracts';
import { AiAssistService } from './ai-assist.service';

@Controller('api/ai-assist')
export class AiAssistController {
  private readonly logger = new Logger(AiAssistController.name);

  constructor(private readonly aiAssist: AiAssistService) {}

  @Post()
  async assist(
    @Req() req: Request,
    @Body() body: AiAssistRequestContract,
  ): Promise<AiAssistResponseContract> {
    this.assertWorkspaceAccess(req, body?.workspaceId);
    return this.aiAssist.assist(body);
  }

  /**
   * Per-workspace authz: the caller must have a role on the workspace that
   * owns the target item. In mock-mode (`AGENTIC_FS_URL` unset) the shared
   * AuthGuard allows unauthenticated requests through — so when `req.user`
   * is absent here we skip the check, matching how other workspace-scoped
   * endpoints behave in dev/e2e.
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
