import { Injectable, Logger } from '@nestjs/common';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import type { UserContract, AuthUserInfoContract, WorkspaceRole } from '@blinksocial/contracts';
import { AgenticFilesystemService } from '../agentic-filesystem/agentic-filesystem.service';
import { UserService } from './user.service';
import { SessionService } from './session.service';

export const BOOTSTRAP_EMAIL = 'blinkadmin@blinksocial.com';
const BOOTSTRAP_PASSWORD = 'blinksocial';
const BOOTSTRAP_DISPLAY_NAME = 'Blink Admin';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
    private readonly fs: AgenticFilesystemService,
  ) {}

  async needsBootstrap(): Promise<boolean> {
    return !(await this.userService.usersExist());
  }

  async authenticate(
    email: string,
    password: string,
  ): Promise<{ success: boolean; user?: UserContract; token?: string }> {
    // Bootstrap scenario: no users exist yet
    if (await this.needsBootstrap()) {
      if (
        email.toLowerCase() === BOOTSTRAP_EMAIL.toLowerCase() &&
        password === BOOTSTRAP_PASSWORD
      ) {
        const user = await this.createBootstrapUser();
        const session = await this.sessionService.create(user.id);
        await this.userService.updateLastLogin(user.id);
        return { success: true, user, token: session.token };
      }
      this.logger.warn(`Bootstrap login attempt with wrong credentials: ${email}`);
      return { success: false };
    }

    // Normal auth flow
    const user = await this.userService.findByEmail(email);
    if (!user) {
      this.logger.warn(`Login attempt for non-existent user: ${email}`);
      return { success: false };
    }

    if (!user.isActive) {
      this.logger.warn(`Login attempt for inactive user: ${email}`);
      return { success: false };
    }

    const passwordValid = await this.verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      this.logger.warn(`Failed login attempt for user: ${email}`);
      return { success: false };
    }

    const session = await this.sessionService.create(user.id);
    await this.userService.updateLastLogin(user.id);
    this.logger.log(`User ${email} logged in successfully`);
    return { success: true, user, token: session.token };
  }

  async validateSession(token: string): Promise<UserContract | null> {
    const session = await this.sessionService.findByToken(token);
    if (!session) return null;

    const user = await this.userService.findById(session.userId);
    if (!user || !user.isActive) {
      await this.sessionService.delete(token);
      return null;
    }

    await this.sessionService.updateActivity(token);
    return user;
  }

  async logout(token: string): Promise<boolean> {
    return this.sessionService.delete(token);
  }

  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.userService.findById(userId);
    if (!user) return { success: false, message: 'User not found' };

    const valid = await this.verifyPassword(currentPassword, user.passwordHash);
    if (!valid) return { success: false, message: 'Current password is incorrect' };

    const hash = await this.hashPassword(newPassword);
    const updated = await this.userService.updatePassword(userId, hash);
    if (!updated) return { success: false, message: 'Failed to update password' };

    this.logger.log(`Password changed for user ${userId}`);
    return { success: true, message: 'Password changed successfully' };
  }

  generatePassword(length = 12): string {
    return randomBytes(length).toString('base64url').slice(0, length);
  }

  toAuthUserInfo(user: UserContract): AuthUserInfoContract {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      workspaces: user.workspaces.map((w) => ({
        workspaceId: w.workspaceId,
        role: w.role,
      })),
    };
  }

  private async createBootstrapUser(): Promise<UserContract> {
    const hash = await this.hashPassword(BOOTSTRAP_PASSWORD);

    // In mock mode, give admin access to mock workspaces
    const workspaces: { workspaceId: string; role: WorkspaceRole }[] = [];
    if (!this.fs.isConfigured()) {
      workspaces.push(
        { workspaceId: 'hive-collective', role: 'Admin' },
        { workspaceId: 'booze-kills', role: 'Admin' },
      );
    }
    // In AFS mode, bootstrap admin starts with no workspaces.
    // They gain access when they create a workspace.

    const user = await this.userService.create({
      email: BOOTSTRAP_EMAIL,
      displayName: BOOTSTRAP_DISPLAY_NAME,
      passwordHash: hash,
      workspaces,
    });
    this.logger.log(`Created bootstrap admin user with access to ${workspaces.length} workspaces`);
    return user;
  }
}
