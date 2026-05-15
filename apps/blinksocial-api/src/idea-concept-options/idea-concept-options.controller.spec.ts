import { Test } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';
import type { UserContract } from '@blinksocial/contracts';
import { IdeaConceptOptionsController } from './idea-concept-options.controller';
import { IdeaConceptOptionsService } from './idea-concept-options.service';

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

describe('IdeaConceptOptionsController', () => {
  let controller: IdeaConceptOptionsController;
  let service: { generate: ReturnType<typeof vi.fn> };
  const originalAfsUrl = process.env['AGENTIC_FS_URL'];

  beforeEach(async () => {
    service = {
      generate: vi.fn().mockResolvedValue({ options: new Array(6).fill({ id: 'opt-x' }) }),
    };
    const moduleRef = await Test.createTestingModule({
      controllers: [IdeaConceptOptionsController],
      providers: [{ provide: IdeaConceptOptionsService, useValue: service }],
    }).compile();
    controller = moduleRef.get(IdeaConceptOptionsController);
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
    const body = { workspaceId: 'w1', refId: 'i-1' };
    const res = await controller.generate(buildReq(userWith('w1')), body);
    expect(res.options).toHaveLength(6);
    expect(service.generate).toHaveBeenCalledWith(body);
  });

  it('rejects with 403 when production user lacks role on the workspace', async () => {
    process.env['AGENTIC_FS_URL'] = 'http://afs.test';
    await expect(
      controller.generate(buildReq(userWith('other-ws')), {
        workspaceId: 'w1',
        refId: 'i-1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(service.generate).not.toHaveBeenCalled();
  });

  it('rejects with 403 when production env has no user on request', async () => {
    process.env['AGENTIC_FS_URL'] = 'http://afs.test';
    await expect(
      controller.generate(buildReq(), { workspaceId: 'w1', refId: 'i-1' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(service.generate).not.toHaveBeenCalled();
  });

  it('skips workspace check in mock-mode when no user is on the request', async () => {
    delete process.env['AGENTIC_FS_URL'];
    const res = await controller.generate(buildReq(), {
      workspaceId: 'w1',
      refId: 'i-1',
    });
    expect(res.options).toHaveLength(6);
    expect(service.generate).toHaveBeenCalled();
  });
});
