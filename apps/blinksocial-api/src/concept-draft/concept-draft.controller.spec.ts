import { Test } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';
import type {
  ConceptDraftRequestContract,
  UserContract,
} from '@blinksocial/contracts';
import { ConceptDraftController } from './concept-draft.controller';
import { ConceptDraftService } from './concept-draft.service';

function buildReq(user?: UserContract): Request {
  const req = {} as Request & { user?: UserContract };
  if (user) req.user = user;
  return req;
}

function userWith(...wsIds: string[]): UserContract {
  return {
    id: 'u',
    email: 'u@b.c',
    displayName: 'U',
    workspaces: wsIds.map((id) => ({ workspaceId: id, role: 'Member' as const })),
  } as UserContract;
}

function validBody(): ConceptDraftRequestContract {
  return {
    workspaceId: 'w1',
    draft: {
      title: 'Why teams need rituals',
      objective: 'engagement',
      pillarIds: [],
      segmentIds: [],
    },
  };
}

describe('ConceptDraftController', () => {
  let controller: ConceptDraftController;
  let service: { generate: ReturnType<typeof vi.fn> };
  const originalAfsUrl = process.env['AGENTIC_FS_URL'];

  beforeEach(async () => {
    service = {
      generate: vi.fn().mockResolvedValue({
        draft: {
          description: 'desc',
          hook: 'hook',
          cta: null,
          pillarIdFallback: null,
          segmentIdsFallback: [],
        },
      }),
    };
    const moduleRef = await Test.createTestingModule({
      controllers: [ConceptDraftController],
      providers: [{ provide: ConceptDraftService, useValue: service }],
    }).compile();
    controller = moduleRef.get(ConceptDraftController);
  });

  afterEach(() => {
    if (originalAfsUrl === undefined) {
      delete process.env['AGENTIC_FS_URL'];
    } else {
      process.env['AGENTIC_FS_URL'] = originalAfsUrl;
    }
  });

  it('delegates to the service on the happy path', async () => {
    process.env['AGENTIC_FS_URL'] = 'http://afs.test';
    const body = validBody();
    const res = await controller.generate(buildReq(userWith('w1')), body);
    expect(res.draft.description).toBe('desc');
    expect(service.generate).toHaveBeenCalledWith(body);
  });

  it('rejects with 403 when production user lacks role on the workspace', async () => {
    process.env['AGENTIC_FS_URL'] = 'http://afs.test';
    await expect(
      controller.generate(buildReq(userWith('other-ws')), validBody()),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(service.generate).not.toHaveBeenCalled();
  });

  it('rejects with 403 when production env has no user on request', async () => {
    process.env['AGENTIC_FS_URL'] = 'http://afs.test';
    await expect(
      controller.generate(buildReq(), validBody()),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(service.generate).not.toHaveBeenCalled();
  });

  it('skips workspace check in mock-mode when no user is on the request', async () => {
    delete process.env['AGENTIC_FS_URL'];
    const res = await controller.generate(buildReq(), validBody());
    expect(res.draft.hook).toBe('hook');
    expect(service.generate).toHaveBeenCalled();
  });
});
