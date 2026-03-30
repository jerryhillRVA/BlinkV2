import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  OnboardingSessionStatus,
  DiscoverySectionId,
  OnboardingMessageContract,
  BlueprintDocumentContract,
} from '@blinksocial/contracts';

export interface OnboardingSessionState {
  id: string;
  userId: string;
  status: OnboardingSessionStatus;
  createdAt: string;
  updatedAt: string;
  messages: OnboardingMessageContract[];
  discoveryData: Record<string, Record<string, unknown>>;
  sectionsCovered: DiscoverySectionId[];
  currentSection: DiscoverySectionId;
  readyToGenerate: boolean;
  blueprint: BlueprintDocumentContract | null;
}

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

@Injectable()
export class SessionStore {
  private readonly logger = new Logger(SessionStore.name);
  private readonly sessions = new Map<string, OnboardingSessionState>();

  create(userId: string): OnboardingSessionState {
    const id = randomUUID();
    const now = new Date().toISOString();
    const session: OnboardingSessionState = {
      id,
      userId,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      messages: [],
      discoveryData: {},
      sectionsCovered: [],
      currentSection: 'business',
      readyToGenerate: false,
      blueprint: null,
    };

    this.sessions.set(id, session);
    this.logger.debug(`Session created: ${id} for user ${userId}`);
    this.cleanExpired();
    return session;
  }

  get(id: string): OnboardingSessionState | null {
    return this.sessions.get(id) ?? null;
  }

  update(
    id: string,
    updates: Partial<OnboardingSessionState>,
  ): OnboardingSessionState {
    const session = this.sessions.get(id);
    if (!session) {
      throw new Error(`Session not found: ${id}`);
    }

    const updated = {
      ...session,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.sessions.set(id, updated);
    return updated;
  }

  delete(id: string): void {
    this.sessions.delete(id);
  }

  private cleanExpired(): void {
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      if (now - new Date(session.updatedAt).getTime() > SESSION_TTL_MS) {
        this.sessions.delete(id);
        this.logger.debug(`Expired session cleaned: ${id}`);
      }
    }
  }
}
