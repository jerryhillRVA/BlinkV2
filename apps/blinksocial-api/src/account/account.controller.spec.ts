import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type {
  AuthUserInfoContract,
  UserContract,
} from '@blinksocial/contracts';
import { AccountController } from './account.controller';
import type { AuthService } from '../auth/auth.service';
import type { UserService } from '../auth/user.service';
import type { SessionService } from '../auth/session.service';

const ADMIN_CALLER: UserContract = {
  id: 'u1',
  email: 'admin@test.com',
  displayName: 'Admin',
  passwordHash: 'h',
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  workspaces: [
    { workspaceId: 'test-ws', role: 'Admin', joinedAt: '2026-01-01T00:00:00Z' },
  ],
};

const VIEWER_CALLER: UserContract = {
  ...ADMIN_CALLER,
  workspaces: [
    { workspaceId: 'test-ws', role: 'Viewer', joinedAt: '2026-01-01T00:00:00Z' },
  ],
};

const TARGET_USER: UserContract = {
  id: 'u2',
  email: 'target@test.com',
  displayName: 'Target',
  passwordHash: 'oldHash',
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  workspaces: [
    { workspaceId: 'test-ws', role: 'Viewer', joinedAt: '2026-01-01T00:00:00Z' },
  ],
};

const BOOTSTRAP_USER: UserContract = {
  ...TARGET_USER,
  id: 'u-bootstrap',
  email: 'blinkadmin@blinksocial.com',
  displayName: 'Blink Admin',
};

function makeController(overrides: {
  findById?: ReturnType<typeof vi.fn>;
  updatePassword?: ReturnType<typeof vi.fn>;
  generatePassword?: ReturnType<typeof vi.fn>;
  hashPassword?: ReturnType<typeof vi.fn>;
  deleteAllForUser?: ReturnType<typeof vi.fn>;
  toAuthUserInfo?: ReturnType<typeof vi.fn>;
} = {}) {
  const findById = overrides.findById ?? vi.fn().mockResolvedValue(TARGET_USER);
  const updatePassword =
    overrides.updatePassword ?? vi.fn().mockResolvedValue(true);
  const generatePassword =
    overrides.generatePassword ?? vi.fn().mockReturnValue('newTempPw123');
  const hashPassword =
    overrides.hashPassword ?? vi.fn().mockResolvedValue('newHashed');
  const deleteAllForUser =
    overrides.deleteAllForUser ?? vi.fn().mockResolvedValue(2);
  const toAuthUserInfo =
    overrides.toAuthUserInfo ??
    vi.fn().mockImplementation(
      (user: UserContract): AuthUserInfoContract => ({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        workspaces: user.workspaces.map((w) => ({
          workspaceId: w.workspaceId,
          role: w.role,
        })),
      }),
    );

  const userService = {
    findById,
    updatePassword,
    listByWorkspace: vi.fn(),
  } as unknown as UserService;

  const authService = {
    generatePassword,
    hashPassword,
    toAuthUserInfo,
  } as unknown as AuthService;

  const sessionService = {
    deleteAllForUser,
  } as unknown as SessionService;

  return {
    controller: new AccountController(authService, userService, sessionService),
    findById,
    updatePassword,
    generatePassword,
    hashPassword,
    deleteAllForUser,
    toAuthUserInfo,
  };
}

describe('AccountController.resetUserPassword', () => {
  it('returns temp password and wipes target sessions on happy path (TC1)', async () => {
    const { controller, updatePassword, deleteAllForUser, hashPassword } =
      makeController();
    const resp = await controller.resetUserPassword(ADMIN_CALLER, 'test-ws', 'u2');

    expect(resp.user.id).toBe('u2');
    expect(resp.user.email).toBe('target@test.com');
    expect(resp.temporaryPassword).toBe('newTempPw123');
    expect(resp.message).toBe('Password reset');
    expect(hashPassword).toHaveBeenCalledWith('newTempPw123');
    expect(updatePassword).toHaveBeenCalledWith('u2', 'newHashed');
    expect(deleteAllForUser).toHaveBeenCalledWith('u2');
  });

  it('throws ForbiddenException when caller is not admin of the workspace (TC2)', async () => {
    const { controller, updatePassword, deleteAllForUser } = makeController();
    await expect(
      controller.resetUserPassword(VIEWER_CALLER, 'test-ws', 'u2'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(updatePassword).not.toHaveBeenCalled();
    expect(deleteAllForUser).not.toHaveBeenCalled();
  });

  it('throws ForbiddenException when caller is admin of a different workspace (TC3)', async () => {
    const otherWsAdmin: UserContract = {
      ...ADMIN_CALLER,
      workspaces: [
        {
          workspaceId: 'other-ws',
          role: 'Admin',
          joinedAt: '2026-01-01T00:00:00Z',
        },
      ],
    };
    const { controller, updatePassword, deleteAllForUser } = makeController();
    await expect(
      controller.resetUserPassword(otherWsAdmin, 'test-ws', 'u2'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(updatePassword).not.toHaveBeenCalled();
    expect(deleteAllForUser).not.toHaveBeenCalled();
  });

  it('throws BadRequestException on self-reset (TC4)', async () => {
    const { controller, updatePassword, deleteAllForUser } = makeController();
    await expect(
      controller.resetUserPassword(ADMIN_CALLER, 'test-ws', ADMIN_CALLER.id),
    ).rejects.toThrow('Use Profile Settings to change your own password');
    expect(updatePassword).not.toHaveBeenCalled();
    expect(deleteAllForUser).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when target is the bootstrap admin (TC5)', async () => {
    const { controller, updatePassword, deleteAllForUser } = makeController({
      findById: vi.fn().mockResolvedValue({
        ...BOOTSTRAP_USER,
        workspaces: [
          {
            workspaceId: 'test-ws',
            role: 'Admin',
            joinedAt: '2026-01-01T00:00:00Z',
          },
        ],
      }),
    });
    await expect(
      controller.resetUserPassword(ADMIN_CALLER, 'test-ws', 'u-bootstrap'),
    ).rejects.toThrow("Cannot reset bootstrap admin's password");
    expect(updatePassword).not.toHaveBeenCalled();
    expect(deleteAllForUser).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when target user does not exist (TC6)', async () => {
    const { controller, updatePassword, deleteAllForUser } = makeController({
      findById: vi.fn().mockResolvedValue(null),
    });
    await expect(
      controller.resetUserPassword(ADMIN_CALLER, 'test-ws', 'ghost'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(updatePassword).not.toHaveBeenCalled();
    expect(deleteAllForUser).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when target user is not a member of the workspace (TC6)', async () => {
    const otherWsTarget: UserContract = {
      ...TARGET_USER,
      workspaces: [
        {
          workspaceId: 'other-ws',
          role: 'Viewer',
          joinedAt: '2026-01-01T00:00:00Z',
        },
      ],
    };
    const { controller, updatePassword, deleteAllForUser } = makeController({
      findById: vi.fn().mockResolvedValue(otherWsTarget),
    });
    await expect(
      controller.resetUserPassword(ADMIN_CALLER, 'test-ws', 'u2'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(updatePassword).not.toHaveBeenCalled();
    expect(deleteAllForUser).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when updatePassword fails to find the user (race)', async () => {
    const { controller, deleteAllForUser } = makeController({
      updatePassword: vi.fn().mockResolvedValue(false),
    });
    await expect(
      controller.resetUserPassword(ADMIN_CALLER, 'test-ws', 'u2'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(deleteAllForUser).not.toHaveBeenCalled();
  });

  it('matches bootstrap email case-insensitively', async () => {
    const mixedCase: UserContract = {
      ...BOOTSTRAP_USER,
      email: 'BlinkAdmin@BlinkSocial.com',
      workspaces: [
        {
          workspaceId: 'test-ws',
          role: 'Admin',
          joinedAt: '2026-01-01T00:00:00Z',
        },
      ],
    };
    const { controller } = makeController({
      findById: vi.fn().mockResolvedValue(mixedCase),
    });
    await expect(
      controller.resetUserPassword(ADMIN_CALLER, 'test-ws', mixedCase.id),
    ).rejects.toThrow("Cannot reset bootstrap admin's password");
  });

  it('does not log plaintext password in audit message', async () => {
    const logSpy = vi
      .spyOn(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (await import('@nestjs/common')).Logger.prototype as any,
        'log',
      )
      .mockImplementation(() => undefined);
    const { controller } = makeController();
    await controller.resetUserPassword(ADMIN_CALLER, 'test-ws', 'u2');
    const logged = logSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(logged).toContain('Password reset by admin');
    expect(logged).toContain(ADMIN_CALLER.email);
    expect(logged).toContain(TARGET_USER.email);
    expect(logged).toContain('test-ws');
    expect(logged).not.toContain('newTempPw123');
    logSpy.mockRestore();
  });
});
