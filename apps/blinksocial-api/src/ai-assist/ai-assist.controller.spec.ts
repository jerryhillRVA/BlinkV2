import { Test } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';
import type { UserContract } from '@blinksocial/contracts';
import { AiAssistController } from './ai-assist.controller';
import { AiAssistService } from './ai-assist.service';

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

describe('AiAssistController', () => {
  let controller: AiAssistController;
  let service: { assist: ReturnType<typeof vi.fn> };
  const originalAfsUrl = process.env['AGENTIC_FS_URL'];

  beforeEach(async () => {
    service = { assist: vi.fn().mockResolvedValue({ values: ['ok'] }) };
    const moduleRef = await Test.createTestingModule({
      controllers: [AiAssistController],
      providers: [{ provide: AiAssistService, useValue: service }],
    }).compile();
    controller = moduleRef.get(AiAssistController);
  });

  afterEach(() => {
    if (originalAfsUrl === undefined) {
      delete process.env['AGENTIC_FS_URL'];
    } else {
      process.env['AGENTIC_FS_URL'] = originalAfsUrl;
    }
  });

  it('delegates to AiAssistService on happy path with workspace access', async () => {
    process.env['AGENTIC_FS_URL'] = 'http://afs.test';
    const body = {
      scope: 'content-item' as const,
      workspaceId: 'w1',
      refId: 'c-1',
      field: 'concept-description' as const,
    };
    const res = await controller.assist(buildReq(userWith('w1')), body);
    expect(res).toEqual({ values: ['ok'] });
    expect(service.assist).toHaveBeenCalledWith(body);
  });

  it('rejects with 403 when production user lacks role on the target workspace', async () => {
    process.env['AGENTIC_FS_URL'] = 'http://afs.test';
    await expect(
      controller.assist(buildReq(userWith('other-ws')), {
        scope: 'content-item',
        workspaceId: 'w1',
        refId: 'c-1',
        field: 'concept-description',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(service.assist).not.toHaveBeenCalled();
  });

  it('rejects with 403 when production env has no user on request', async () => {
    process.env['AGENTIC_FS_URL'] = 'http://afs.test';
    await expect(
      controller.assist(buildReq(), {
        scope: 'content-item',
        workspaceId: 'w1',
        refId: 'c-1',
        field: 'concept-description',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(service.assist).not.toHaveBeenCalled();
  });

  it('skips workspace check in mock-mode when no user is on the request', async () => {
    delete process.env['AGENTIC_FS_URL'];
    const res = await controller.assist(buildReq(), {
      scope: 'content-item',
      workspaceId: 'w1',
      refId: 'c-1',
      field: 'concept-description',
    });
    expect(res).toEqual({ values: ['ok'] });
    expect(service.assist).toHaveBeenCalled();
  });

  it('delegates draft-scope requests to AiAssistService', async () => {
    process.env['AGENTIC_FS_URL'] = 'http://afs.test';
    const body = {
      scope: 'draft' as const,
      workspaceId: 'w1',
      field: 'concept-description' as const,
      draft: {
        title: 'Morning mobility flow',
        objective: 'engagement' as const,
        pillarIds: [],
        segmentIds: [],
      },
    };
    const res = await controller.assist(buildReq(userWith('w1')), body);
    expect(res).toEqual({ values: ['ok'] });
    expect(service.assist).toHaveBeenCalledWith(body);
  });

  it('rejects draft-scope with 403 when production user lacks role on the target workspace', async () => {
    process.env['AGENTIC_FS_URL'] = 'http://afs.test';
    await expect(
      controller.assist(buildReq(userWith('other-ws')), {
        scope: 'draft',
        workspaceId: 'w1',
        field: 'concept-description',
        draft: { title: 'X', pillarIds: [], segmentIds: [] },
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(service.assist).not.toHaveBeenCalled();
  });
});
