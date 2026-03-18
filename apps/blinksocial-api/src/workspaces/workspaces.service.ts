import { Injectable, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { CreateWorkspaceRequestContract } from '@blinksocial/contracts';
import { CreateWorkspaceResponse } from '@blinksocial/models';
import { validateCreateWorkspaceRequest } from '@blinksocial/contracts/validation';

@Injectable()
export class WorkspacesService {
  validate(data: unknown): void {
    const result = validateCreateWorkspaceRequest(data);
    if (!result.valid) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Validation failed',
        errors: result.errors,
      });
    }
  }

  create(request: CreateWorkspaceRequestContract): CreateWorkspaceResponse {
    return new CreateWorkspaceResponse({
      id: randomUUID(),
      workspaceName: request.general.workspaceName,
      status: 'active',
      createdAt: new Date().toISOString(),
    });
  }
}
