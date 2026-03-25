import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  UserContract,
  UsersFileContract,
  WorkspaceRole,
} from '@blinksocial/contracts';
import { AgenticFilesystemService } from '../agentic-filesystem/agentic-filesystem.service';

const SYSTEM_TENANT = 'blinksocial_system';
const USERS_NAMESPACE = 'users';
const USERS_FILENAME = 'users.json';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  /** In-memory fallback when AFS is not configured */
  private inMemoryUsers: UserContract[] = [];

  constructor(private readonly fs: AgenticFilesystemService) {}

  async usersExist(): Promise<boolean> {
    const users = await this.readUsers();
    return users.length > 0;
  }

  async findByEmail(email: string): Promise<UserContract | null> {
    const users = await this.readUsers();
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
  }

  async findById(id: string): Promise<UserContract | null> {
    const users = await this.readUsers();
    return users.find((u) => u.id === id) ?? null;
  }

  async create(params: {
    email: string;
    displayName: string;
    passwordHash: string;
    workspaces?: { workspaceId: string; role: WorkspaceRole }[];
  }): Promise<UserContract> {
    const now = new Date().toISOString();
    const user: UserContract = {
      id: randomUUID(),
      email: params.email,
      displayName: params.displayName,
      passwordHash: params.passwordHash,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      workspaces: (params.workspaces ?? []).map((w) => ({
        ...w,
        joinedAt: now,
      })),
    };

    const users = await this.readUsers();
    users.push(user);
    await this.writeUsers(users);

    return user;
  }

  async updatePassword(userId: string, passwordHash: string): Promise<boolean> {
    const users = await this.readUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return false;

    users[idx] = {
      ...users[idx],
      passwordHash,
      updatedAt: new Date().toISOString(),
    };
    await this.writeUsers(users);
    return true;
  }

  async updateLastLogin(userId: string): Promise<void> {
    const users = await this.readUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return;

    users[idx] = {
      ...users[idx],
      lastLogin: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await this.writeUsers(users);
  }

  async addWorkspaceAccess(
    userId: string,
    workspaceId: string,
    role: WorkspaceRole,
  ): Promise<boolean> {
    const users = await this.readUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return false;

    const user = users[idx];
    const existing = user.workspaces.find((w) => w.workspaceId === workspaceId);
    if (existing) {
      existing.role = role;
    } else {
      user.workspaces.push({
        workspaceId,
        role,
        joinedAt: new Date().toISOString(),
      });
    }
    user.updatedAt = new Date().toISOString();
    await this.writeUsers(users);
    return true;
  }

  async removeWorkspaceAccess(
    userId: string,
    workspaceId: string,
  ): Promise<boolean> {
    const users = await this.readUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return false;

    users[idx].workspaces = users[idx].workspaces.filter(
      (w) => w.workspaceId !== workspaceId,
    );
    users[idx].updatedAt = new Date().toISOString();
    await this.writeUsers(users);
    return true;
  }

  async updateWorkspaceRole(
    userId: string,
    workspaceId: string,
    role: WorkspaceRole,
  ): Promise<boolean> {
    return this.addWorkspaceAccess(userId, workspaceId, role);
  }

  async listByWorkspace(workspaceId: string): Promise<UserContract[]> {
    const users = await this.readUsers();
    return users.filter((u) =>
      u.workspaces.some((w) => w.workspaceId === workspaceId),
    );
  }

  // ─── Private Helpers ───

  private async readUsers(): Promise<UserContract[]> {
    if (!this.fs.isConfigured()) {
      return [...this.inMemoryUsers];
    }

    try {
      const entries = await this.fs.listDirectory(SYSTEM_TENANT, USERS_NAMESPACE);
      const file = entries.find(
        (e) => e.type === 'file' && e.name === USERS_FILENAME,
      );
      if (!file?.file_id) return [];

      const files = await this.fs.batchRetrieve(SYSTEM_TENANT, [file.file_id]);
      if (files.length === 0 || files[0].content_type === 'error') return [];

      const data = files[0].content as UsersFileContract;
      return data.users ?? [];
    } catch {
      return [];
    }
  }

  private async writeUsers(users: UserContract[]): Promise<void> {
    if (!this.fs.isConfigured()) {
      this.inMemoryUsers = [...users];
      return;
    }

    const data: UsersFileContract = { users };

    try {
      const entries = await this.fs.listDirectory(SYSTEM_TENANT, USERS_NAMESPACE);
      const file = entries.find(
        (e) => e.type === 'file' && e.name === USERS_FILENAME,
      );

      if (file?.file_id) {
        await this.fs.replaceJsonFile(SYSTEM_TENANT, file.file_id, USERS_FILENAME, data);
      } else {
        await this.fs.uploadJsonFile(SYSTEM_TENANT, USERS_NAMESPACE, USERS_FILENAME, data);
      }
    } catch (error) {
      this.logger.error('Failed to write users', error);
      throw error;
    }
  }
}
