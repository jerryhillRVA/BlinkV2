import { Reflector } from '@nestjs/core';
import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { UserContract } from '@blinksocial/contracts';
import { AuthGuard } from './auth.guard';
import type { AuthService } from './auth.service';

function makeContext(
  cookies: Record<string, string> = {},
): { context: ExecutionContext; request: Record<string, unknown> } {
  const request: Record<string, unknown> = { cookies };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => () => undefined,
    getClass: () => class TestController {},
  } as unknown as ExecutionContext;
  return { context, request };
}

const ADMIN_USER: UserContract = {
  id: 'u1',
  email: 'admin@example.com',
  displayName: 'Admin',
  workspaces: [],
};

describe('AuthGuard', () => {
  const ORIGINAL_AGENTIC_FS_URL = process.env['AGENTIC_FS_URL'];

  afterEach(() => {
    if (ORIGINAL_AGENTIC_FS_URL === undefined) {
      delete process.env['AGENTIC_FS_URL'];
    } else {
      process.env['AGENTIC_FS_URL'] = ORIGINAL_AGENTIC_FS_URL;
    }
  });

  function buildGuard(
    overrides: Partial<{ isPublic: boolean; user: UserContract | null }> = {},
  ) {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(overrides.isPublic ?? false),
    } as unknown as Reflector;
    const validateSession = vi.fn().mockResolvedValue(overrides.user ?? null);
    const authService = { validateSession } as unknown as AuthService;
    return { guard: new AuthGuard(authService, reflector), validateSession };
  }

  it('allows @Public() routes regardless of token', async () => {
    process.env['AGENTIC_FS_URL'] = 'http://example.com';
    const { guard } = buildGuard({ isPublic: true });
    const { context } = makeContext();
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('throws Unauthorized for missing token when AGENTIC_FS_URL is set (real backend mode)', async () => {
    process.env['AGENTIC_FS_URL'] = 'http://example.com';
    const { guard } = buildGuard();
    const { context } = makeContext();
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('bypasses auth when AGENTIC_FS_URL is unset (mock mode) and no session is present', async () => {
    delete process.env['AGENTIC_FS_URL'];
    const { guard, validateSession } = buildGuard();
    const { context, request } = makeContext();
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(validateSession).not.toHaveBeenCalled();
    // No user attached — handlers running in mock mode must not assume one.
    expect((request as { user?: unknown }).user).toBeUndefined();
  });

  it('still validates a real session when AGENTIC_FS_URL is unset and a token is present', async () => {
    delete process.env['AGENTIC_FS_URL'];
    const { guard, validateSession } = buildGuard({ user: ADMIN_USER });
    const { context, request } = makeContext({ session_token: 'abc' });
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(validateSession).toHaveBeenCalledWith('abc');
    expect((request as { user?: UserContract }).user).toBe(ADMIN_USER);
  });

  it('throws Unauthorized for an invalid session token in real-backend mode', async () => {
    process.env['AGENTIC_FS_URL'] = 'http://example.com';
    const { guard } = buildGuard({ user: null });
    const { context } = makeContext({ session_token: 'expired' });
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
