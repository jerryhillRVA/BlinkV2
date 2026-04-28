import {
  Controller,
  Post,
  Body,
  Req,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import type { Request } from 'express';
import type {
  UserContract,
  GeneratePositioningStatementRequestContract,
  GeneratePositioningStatementResponseContract,
  SuggestBusinessObjectivesRequestContract,
  SuggestBusinessObjectivesResponseContract,
} from '@blinksocial/contracts';
import { WizardAiService } from './wizard-ai.service';

@Controller('api/wizard-ai')
export class WizardAiController {
  private readonly logger = new Logger(WizardAiController.name);

  constructor(private readonly wizardAi: WizardAiService) {}

  @Post('positioning-statement')
  async positioningStatement(
    @Req() req: Request,
    @Body() body: GeneratePositioningStatementRequestContract,
  ): Promise<GeneratePositioningStatementResponseContract> {
    const user = this.extractUser(req);
    this.assertAdminAccess(user);
    return this.wizardAi.generatePositioningStatement(body ?? {});
  }

  @Post('business-objectives')
  async businessObjectives(
    @Req() req: Request,
    @Body() body: SuggestBusinessObjectivesRequestContract,
  ): Promise<SuggestBusinessObjectivesResponseContract> {
    const user = this.extractUser(req);
    this.assertAdminAccess(user);
    return this.wizardAi.suggestBusinessObjectives(body ?? {});
  }

  private extractUser(req: Request): UserContract {
    const user = (req as Request & { user?: UserContract }).user;
    if (!user) {
      throw new ForbiddenException('User not found on request');
    }
    return user;
  }

  private assertAdminAccess(user: UserContract): void {
    const isAdmin =
      user.workspaces.length === 0 ||
      user.workspaces.some((w) => w.role === 'Admin');
    if (!isAdmin) {
      throw new ForbiddenException(
        'Admin access required to use wizard AI generation',
      );
    }
  }
}
