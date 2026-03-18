import type {
  CreateWorkspaceResponseContract,
  ValidationErrorContract,
  CreateWorkspaceErrorContract,
} from '@blinksocial/contracts';

export class CreateWorkspaceResponse implements CreateWorkspaceResponseContract {
  readonly id: string;
  readonly workspaceName: string;
  readonly status: 'active';
  readonly createdAt: string;

  constructor(data: CreateWorkspaceResponseContract) {
    this.id = data.id;
    this.workspaceName = data.workspaceName;
    this.status = data.status;
    this.createdAt = data.createdAt;
  }
}

export class ValidationError implements ValidationErrorContract {
  readonly field: string;
  readonly message: string;

  constructor(data: ValidationErrorContract) {
    this.field = data.field;
    this.message = data.message;
  }
}

export class CreateWorkspaceError implements CreateWorkspaceErrorContract {
  readonly statusCode: number;
  readonly message: string;
  readonly errors?: ValidationError[];

  constructor(data: CreateWorkspaceErrorContract) {
    this.statusCode = data.statusCode;
    this.message = data.message;
    this.errors = data.errors?.map((e: ValidationErrorContract) => new ValidationError(e));
  }
}
