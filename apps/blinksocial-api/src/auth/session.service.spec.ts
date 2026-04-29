import type { SessionContract } from '@blinksocial/contracts';
import { SessionService } from './session.service';
import type { AgenticFilesystemService } from '../agentic-filesystem/agentic-filesystem.service';

function makeService(): SessionService {
  const fs = { isConfigured: () => false } as unknown as AgenticFilesystemService;
  return new SessionService(fs);
}

function seedSession(
  service: SessionService,
  overrides: Partial<SessionContract> & { token: string; userId: string },
): SessionContract {
  const now = new Date().toISOString();
  const session: SessionContract = {
    token: overrides.token,
    userId: overrides.userId,
    createdAt: overrides.createdAt ?? now,
    lastActivity: overrides.lastActivity ?? now,
    expiresAt:
      overrides.expiresAt ??
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (service as any).inMemorySessions.push(session);
  return session;
}

describe('SessionService.deleteAllForUser', () => {
  it('returns 0 and writes nothing when the user has no sessions', async () => {
    const service = makeService();
    seedSession(service, { token: 't1', userId: 'other' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const writeSpy = vi.spyOn(service as any, 'writeSessions');
    const removed = await service.deleteAllForUser('target');
    expect(removed).toBe(0);
    expect(writeSpy).not.toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((service as any).inMemorySessions).toHaveLength(1);
  });

  it('removes a single session belonging to the target', async () => {
    const service = makeService();
    seedSession(service, { token: 't1', userId: 'target' });
    const removed = await service.deleteAllForUser('target');
    expect(removed).toBe(1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((service as any).inMemorySessions).toHaveLength(0);
  });

  it('removes multiple sessions belonging to the target', async () => {
    const service = makeService();
    seedSession(service, { token: 't1', userId: 'target' });
    seedSession(service, { token: 't2', userId: 'target' });
    seedSession(service, { token: 't3', userId: 'target' });
    const removed = await service.deleteAllForUser('target');
    expect(removed).toBe(3);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((service as any).inMemorySessions).toHaveLength(0);
  });

  it('leaves other users\' sessions untouched', async () => {
    const service = makeService();
    seedSession(service, { token: 't1', userId: 'target' });
    seedSession(service, { token: 't2', userId: 'other-a' });
    seedSession(service, { token: 't3', userId: 'target' });
    seedSession(service, { token: 't4', userId: 'other-b' });
    const removed = await service.deleteAllForUser('target');
    expect(removed).toBe(2);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const remaining = (service as any).inMemorySessions as SessionContract[];
    expect(remaining.map((s) => s.token).sort()).toEqual(['t2', 't4']);
    expect(remaining.every((s) => s.userId !== 'target')).toBe(true);
  });
});
