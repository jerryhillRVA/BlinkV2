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
  ConceptDraftRequestContract,
  ConceptDraftResponseContract,
  UserContract,
} from '@blinksocial/contracts';
import { ConceptDraftService } from './concept-draft.service';

@Controller('api/concept-draft')
export class ConceptDraftController {
  private readonly logger = new Logger(ConceptDraftController.name);

  constructor(private readonly service: ConceptDraftService) {}

  @Post()
  async generate(
    @Req() req: Request,
    @Body() body: ConceptDraftRequestContract,
  ): Promise<ConceptDraftResponseContract> {
    this.assertWorkspaceAccess(req, body?.workspaceId);
    return this.service.generate(body);
  }

  /**
   * Per-workspace authz lifted verbatim from
   * `IdeaConceptOptionsController.assertWorkspaceAccess`. Mock-mode
   * bypass: when `req.user` is absent and `AGENTIC_FS_URL` is unset
   * (dev/CI) the shared AuthGuard already lets the request through, so
   * we skip the workspace check here too.
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
