import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  ForbiddenException,
  Logger,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import type {
  UserContract,
  CreateSessionRequestContract,
  SendMessageRequestContract,
} from '@blinksocial/contracts';
import { OnboardingService, type IncomingAttachment } from './onboarding.service';

/** Per-file size cap, mirrored in `AttachmentExtractorService.MAX_ATTACHMENT_BYTES`. */
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
/** Maximum number of attachments accepted in a single turn. */
const MAX_FILES_PER_TURN = 20;

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
  @UseInterceptors(
    FilesInterceptor('files', MAX_FILES_PER_TURN, {
      limits: { fileSize: MAX_ATTACHMENT_BYTES },
    }),
  )
  async sendMessage(
    @Req() req: Request,
    @Param('id') sessionId: string,
    @Body() body: SendMessageRequestContract,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const user = this.extractUser(req);
    this.assertAdminAccess(user);
    const incoming: IncomingAttachment[] = (files ?? []).map((f) => ({
      filename: f.originalname,
      mimeType: f.mimetype,
      buffer: f.buffer,
      sizeBytes: f.size,
    }));
    return this.onboardingService.handleMessage(
      sessionId,
      user.id,
      body.content ?? '',
      incoming,
    );
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
