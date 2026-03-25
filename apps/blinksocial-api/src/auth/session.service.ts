import { Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import type {
  SessionContract,
  SessionsFileContract,
} from '@blinksocial/contracts';
import { AgenticFilesystemService } from '../agentic-filesystem/agentic-filesystem.service';

const SYSTEM_TENANT = 'blinksocial_system';
const SESSIONS_NAMESPACE = 'sessions';
const SESSIONS_FILENAME = 'sessions.json';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  /** In-memory fallback when AFS is not configured */
  private inMemorySessions: SessionContract[] = [];

  constructor(private readonly fs: AgenticFilesystemService) {}

  async create(userId: string): Promise<SessionContract> {
    const now = new Date();
    const session: SessionContract = {
      token: randomBytes(24).toString('base64url'),
      userId,
      createdAt: now.toISOString(),
      lastActivity: now.toISOString(),
      expiresAt: new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
    };

    const sessions = await this.readSessions();
    sessions.push(session);
    await this.writeSessions(sessions);
    return session;
  }

  async findByToken(token: string): Promise<SessionContract | null> {
    const sessions = await this.readSessions();
    const session = sessions.find((s) => s.token === token);
    if (!session) return null;

    // Check expiry
    if (new Date(session.expiresAt) < new Date()) {
      await this.delete(token);
      return null;
    }

    return session;
  }

  async updateActivity(token: string): Promise<void> {
    const sessions = await this.readSessions();
    const idx = sessions.findIndex((s) => s.token === token);
    if (idx === -1) return;

    sessions[idx].lastActivity = new Date().toISOString();
    await this.writeSessions(sessions);
  }

  async delete(token: string): Promise<boolean> {
    const sessions = await this.readSessions();
    const filtered = sessions.filter((s) => s.token !== token);
    if (filtered.length === sessions.length) return false;

    await this.writeSessions(filtered);
    return true;
  }

  async cleanupExpired(): Promise<number> {
    const sessions = await this.readSessions();
    const now = new Date();
    const active = sessions.filter((s) => new Date(s.expiresAt) > now);
    const removed = sessions.length - active.length;
    if (removed > 0) {
      await this.writeSessions(active);
    }
    return removed;
  }

  // ─── Private Helpers ───

  private async readSessions(): Promise<SessionContract[]> {
    if (!this.fs.isConfigured()) {
      return [...this.inMemorySessions];
    }

    try {
      const entries = await this.fs.listDirectory(SYSTEM_TENANT, SESSIONS_NAMESPACE);
      const file = entries.find(
        (e) => e.type === 'file' && e.name === SESSIONS_FILENAME,
      );
      if (!file?.file_id) return [];

      const files = await this.fs.batchRetrieve(SYSTEM_TENANT, [file.file_id]);
      if (files.length === 0 || files[0].content_type === 'error') return [];

      const data = files[0].content as SessionsFileContract;
      return data.sessions ?? [];
    } catch {
      return [];
    }
  }

  private async writeSessions(sessions: SessionContract[]): Promise<void> {
    if (!this.fs.isConfigured()) {
      this.inMemorySessions = [...sessions];
      return;
    }

    const data: SessionsFileContract = { sessions };

    try {
      const entries = await this.fs.listDirectory(SYSTEM_TENANT, SESSIONS_NAMESPACE);
      const file = entries.find(
        (e) => e.type === 'file' && e.name === SESSIONS_FILENAME,
      );

      if (file?.file_id) {
        await this.fs.replaceJsonFile(SYSTEM_TENANT, file.file_id, SESSIONS_FILENAME, data);
      } else {
        await this.fs.uploadJsonFile(SYSTEM_TENANT, SESSIONS_NAMESPACE, SESSIONS_FILENAME, data);
      }
    } catch (error) {
      this.logger.error('Failed to write sessions', error);
      throw error;
    }
  }
}
