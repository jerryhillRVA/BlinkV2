import { SetMetadata } from '@nestjs/common';
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { UserContract } from '@blinksocial/contracts';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserContract | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return (request as Request & { user?: UserContract }).user;
  },
);
