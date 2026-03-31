import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import type { Request } from 'express';
import type {
  UserContract,
  CreateSessionRequestContract,
  SendMessageRequestContract,
} from '@blinksocial/contracts';
import { OnboardingService } from './onboarding.service';

@Controller('api/onboarding')
export class OnboardingController {
  private readonly logger = new Logger(OnboardingController.name);

  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('sessions')
  async createSession(
    @Req() req: Request,
    @Body() body: CreateSessionRequestContract,
  ) {
    const user = this.extractUser(req);
    this.assertAdminAccess(user);
    return this.onboardingService.createSession(
      user.id,
      body.workspaceName,
      body.businessName,
    );
  }

  @Post('sessions/:id/messages')
  async sendMessage(
    @Req() req: Request,
    @Param('id') sessionId: string,
    @Body() body: SendMessageRequestContract,
  ) {
    const user = this.extractUser(req);
    this.assertAdminAccess(user);
    return this.onboardingService.handleMessage(sessionId, user.id, body.content);
  }

  @Get('sessions/:id')
  async getSession(@Req() req: Request, @Param('id') sessionId: string) {
    const user = this.extractUser(req);
    this.assertAdminAccess(user);
    return this.onboardingService.getSession(sessionId, user.id);
  }

  @Get('sessions/by-workspace/:tenantId')
  async resumeSession(
    @Req() req: Request,
    @Param('tenantId') tenantId: string,
  ) {
    const user = this.extractUser(req);
    this.assertAdminAccess(user);
    return this.onboardingService.resumeSession(tenantId, user.id);
  }

  @Post('sessions/:id/generate')
  async generateBlueprint(
    @Req() req: Request,
    @Param('id') sessionId: string,
  ) {
    const user = this.extractUser(req);
    this.assertAdminAccess(user);
    return this.onboardingService.generateBlueprint(sessionId, user.id);
  }

  @Post('sessions/:id/create-workspace')
  async createWorkspaceFromBlueprint(
    @Req() req: Request,
    @Param('id') sessionId: string,
  ) {
    const user = this.extractUser(req);
    this.assertAdminAccess(user);
    return this.onboardingService.createWorkspaceFromBlueprint(
      sessionId,
      user.id,
    );
  }

  private extractUser(req: Request): UserContract {
    const user = (req as Request & { user?: UserContract }).user;
    if (!user) {
      throw new ForbiddenException('User not found on request');
    }
    return user;
  }

  private assertAdminAccess(user: UserContract): void {
    // Allow if user is Admin of any workspace, or if bootstrap user (no workspaces)
    const isAdmin =
      user.workspaces.length === 0 ||
      user.workspaces.some((w) => w.role === 'Admin');

    if (!isAdmin) {
      throw new ForbiddenException(
        'Admin access required to use the onboarding feature',
      );
    }
  }
}
