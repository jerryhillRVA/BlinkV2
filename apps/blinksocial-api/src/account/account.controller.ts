import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import type {
  UserContract,
  ChangePasswordRequestContract,
  CreateUserRequestContract,
  CreateUserResponseContract,
  AuthUserInfoContract,
  UpdateUserRoleRequestContract,
  WorkspaceRole,
} from '@blinksocial/contracts';
import { CurrentUser } from '../auth/decorators';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../auth/user.service';

@Controller('api/account')
export class AccountController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Get('me')
  async me(@CurrentUser() user: UserContract): Promise<AuthUserInfoContract> {
    return this.authService.toAuthUserInfo(user);
  }

  @Put('password')
  async changePassword(
    @CurrentUser() user: UserContract,
    @Body() body: ChangePasswordRequestContract,
  ): Promise<{ message: string }> {
    if (!body.currentPassword || !body.newPassword) {
      throw new BadRequestException('Current and new password are required');
    }
    if (body.newPassword.length < 8) {
      throw new BadRequestException('New password must be at least 8 characters');
    }

    const result = await this.authService.changePassword(
      user.id,
      body.currentPassword,
      body.newPassword,
    );

    if (!result.success) {
      throw new BadRequestException(result.message);
    }

    return { message: result.message };
  }

  @Get(':workspaceId/users')
  async listUsers(
    @CurrentUser() user: UserContract,
    @Param('workspaceId') workspaceId: string,
  ): Promise<{ users: AuthUserInfoContract[] }> {
    this.requireWorkspaceAdmin(user, workspaceId);
    const users = await this.userService.listByWorkspace(workspaceId);
    return {
      users: users.map((u) => this.authService.toAuthUserInfo(u)),
    };
  }

  @Post(':workspaceId/users')
  async createUser(
    @CurrentUser() user: UserContract,
    @Param('workspaceId') workspaceId: string,
    @Body() body: CreateUserRequestContract,
  ): Promise<CreateUserResponseContract> {
    this.requireWorkspaceAdmin(user, workspaceId);

    if (!body.email || !body.displayName) {
      throw new BadRequestException('Email and display name are required');
    }

    // Check if user already exists
    const existing = await this.userService.findByEmail(body.email);
    if (existing) {
      // Add workspace access to existing user
      const added = await this.userService.addWorkspaceAccess(
        existing.id,
        workspaceId,
        body.role ?? 'Viewer',
      );
      if (!added) throw new BadRequestException('Failed to add workspace access');

      const updated = await this.userService.findById(existing.id);
      return {
        user: this.authService.toAuthUserInfo(updated!),
        temporaryPassword: '',
        message: `Existing user ${body.email} added to workspace`,
      };
    }

    // Create new user with temp password
    const tempPassword = this.authService.generatePassword();
    const hash = await this.authService.hashPassword(tempPassword);

    const newUser = await this.userService.create({
      email: body.email,
      displayName: body.displayName,
      passwordHash: hash,
      workspaces: [{ workspaceId, role: body.role ?? 'Viewer' }],
    });

    return {
      user: this.authService.toAuthUserInfo(newUser),
      temporaryPassword: tempPassword,
      message: `User created with temporary password`,
    };
  }

  @Put(':workspaceId/users/:userId/role')
  async updateUserRole(
    @CurrentUser() user: UserContract,
    @Param('workspaceId') workspaceId: string,
    @Param('userId') userId: string,
    @Body() body: UpdateUserRoleRequestContract,
  ): Promise<{ message: string }> {
    this.requireWorkspaceAdmin(user, workspaceId);

    if (!body.role) {
      throw new BadRequestException('Role is required');
    }

    // Prevent demoting the last admin
    if (body.role !== 'Admin') {
      const admins = (await this.userService.listByWorkspace(workspaceId)).filter(
        (u) => u.workspaces.some(
          (w) => w.workspaceId === workspaceId && w.role === 'Admin',
        ),
      );
      if (admins.length === 1 && admins[0].id === userId) {
        throw new BadRequestException('Cannot demote the last admin');
      }
    }

    const updated = await this.userService.updateWorkspaceRole(
      userId,
      workspaceId,
      body.role as WorkspaceRole,
    );
    if (!updated) throw new NotFoundException('User not found');

    return { message: 'Role updated successfully' };
  }

  @Delete(':workspaceId/users/:userId')
  async removeUser(
    @CurrentUser() user: UserContract,
    @Param('workspaceId') workspaceId: string,
    @Param('userId') userId: string,
  ): Promise<{ message: string }> {
    this.requireWorkspaceAdmin(user, workspaceId);

    // Prevent removing the last admin
    const admins = (await this.userService.listByWorkspace(workspaceId)).filter(
      (u) => u.workspaces.some(
        (w) => w.workspaceId === workspaceId && w.role === 'Admin',
      ),
    );
    if (admins.length === 1 && admins[0].id === userId) {
      throw new BadRequestException('Cannot remove the last admin');
    }

    // Prevent self-removal
    if (user.id === userId) {
      throw new BadRequestException('Cannot remove yourself from the workspace');
    }

    const removed = await this.userService.removeWorkspaceAccess(userId, workspaceId);
    if (!removed) throw new NotFoundException('User not found');

    return { message: 'User removed from workspace' };
  }

  private requireWorkspaceAdmin(user: UserContract, workspaceId: string): void {
    const access = user.workspaces.find((w) => w.workspaceId === workspaceId);
    if (!access || access.role !== 'Admin') {
      throw new ForbiddenException('Admin access required');
    }
  }
}
