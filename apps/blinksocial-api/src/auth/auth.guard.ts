import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { UserContract } from '@blinksocial/contracts';
import { IS_PUBLIC_KEY } from './decorators';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies?.['session_token'];

    // Mock-mode dev bypass: when AGENTIC_FS_URL is unset, the API delegates
    // to MockDataService for read endpoints. Allow unauthenticated access
    // so dev / e2e flows don't have to maintain a real session, but still
    // honour a valid session if one is presented (so login flow stays
    // exercisable locally). This branch never runs in production because
    // AGENTIC_FS_URL is always set there.
    if (!process.env['AGENTIC_FS_URL']) {
      if (!token) return true;
      const user = await this.authService.validateSession(token);
      if (user) {
        (request as Request & { user: UserContract }).user = user;
      }
      return true;
    }

    if (!token) {
      throw new UnauthorizedException('Not authenticated');
    }

    const user = await this.authService.validateSession(token);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    // Attach user to request for downstream handlers
    (request as Request & { user: UserContract }).user = user;
    return true;
  }
}
