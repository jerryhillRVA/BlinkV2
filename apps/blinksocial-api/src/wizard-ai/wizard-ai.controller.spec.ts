import { Test } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';
import type { UserContract } from '@blinksocial/contracts';
import { WizardAiController } from './wizard-ai.controller';
import { WizardAiService } from './wizard-ai.service';

function buildReq(user?: UserContract): Request {
  const req = {} as Request & { user?: UserContract };
  if (user) req.user = user;
  return req;
}

function adminUser(): UserContract {
  return {
    id: 'u1',
    email: 'a@b.c',
    displayName: 'A',
    workspaces: [{ workspaceId: 't1', role: 'Admin' as const }],
  } as UserContract;
}

function memberUser(): UserContract {
  return {
    id: 'u2',
    email: 'm@b.c',
    displayName: 'M',
    workspaces: [{ workspaceId: 't1', role: 'Member' as const }],
  } as UserContract;
}

function bootstrapUser(): UserContract {
  return {
    id: 'u3',
    email: 'b@b.c',
    displayName: 'B',
    workspaces: [],
  } as UserContract;
}

describe('WizardAiController', () => {
  let controller: WizardAiController;
  let service: {
    generatePositioningStatement: ReturnType<typeof vi.fn>;
    suggestBusinessObjectives: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    service = {
      generatePositioningStatement: vi.fn().mockResolvedValue({ positioningStatement: 'OK' }),
      suggestBusinessObjectives: vi.fn().mockResolvedValue({ suggestions: [] }),
    };
    const moduleRef = await Test.createTestingModule({
      controllers: [WizardAiController],
      providers: [{ provide: WizardAiService, useValue: service }],
    }).compile();
    controller = moduleRef.get(WizardAiController);
  });

  it('rejects positioning-statement when no user on request', async () => {
    await expect(
      controller.positioningStatement(buildReq(), { solution: 'x' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects business-objectives when no user on request', async () => {
    await expect(
      controller.businessObjectives(buildReq(), { workspaceName: 'WS' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects positioning-statement for non-admin user', async () => {
    await expect(
      controller.positioningStatement(buildReq(memberUser()), { solution: 'x' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(service.generatePositioningStatement).not.toHaveBeenCalled();
  });

  it('rejects business-objectives for non-admin user', async () => {
    await expect(
      controller.businessObjectives(buildReq(memberUser()), { workspaceName: 'WS' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(service.suggestBusinessObjectives).not.toHaveBeenCalled();
  });

  it('allows admin user to call positioning-statement', async () => {
    await controller.positioningStatement(buildReq(adminUser()), { solution: 'x' });
    expect(service.generatePositioningStatement).toHaveBeenCalledWith({ solution: 'x' });
  });

  it('allows bootstrap user (no workspaces) to call business-objectives', async () => {
    await controller.businessObjectives(buildReq(bootstrapUser()), { workspaceName: 'WS' });
    expect(service.suggestBusinessObjectives).toHaveBeenCalledWith({ workspaceName: 'WS' });
  });

  it('passes empty object body when body is undefined for positioning-statement', async () => {
    await controller.positioningStatement(
      buildReq(adminUser()),
      undefined as unknown as Parameters<typeof controller.positioningStatement>[1],
    );
    expect(service.generatePositioningStatement).toHaveBeenCalledWith({});
  });

  it('passes empty object body when body is undefined for business-objectives', async () => {
    await controller.businessObjectives(
      buildReq(adminUser()),
      undefined as unknown as Parameters<typeof controller.businessObjectives>[1],
    );
    expect(service.suggestBusinessObjectives).toHaveBeenCalledWith({});
  });
});
