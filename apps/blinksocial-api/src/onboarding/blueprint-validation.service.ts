import { Injectable, Logger } from '@nestjs/common';
import { Ajv, type ErrorObject, type ValidateFunction } from 'ajv';
import * as fs from 'fs';
import * as path from 'path';
import type { ValidationErrorContract } from '@blinksocial/contracts';

const SCHEMA_FILENAME = 'blueprint.schema.json';
const SKILL_ID = 'onboarding-consultant';

@Injectable()
export class BlueprintValidationService {
  private readonly logger = new Logger(BlueprintValidationService.name);
  private readonly validator: ValidateFunction;

  constructor() {
    const schemaPath = this.resolveSchemaPath();
    const schemaJson = fs.readFileSync(schemaPath, 'utf-8');
    const schema = JSON.parse(schemaJson);
    const ajv = new Ajv({ allErrors: true, strict: false });
    this.validator = ajv.compile(schema);
    this.logger.log(`Blueprint schema loaded from ${schemaPath}`);
  }

  validate(
    data: unknown,
  ): { valid: true } | { valid: false; errors: ValidationErrorContract[] } {
    const valid = this.validator(data);
    if (valid) {
      return { valid: true };
    }

    const errors: ValidationErrorContract[] = (this.validator.errors ?? []).map(
      (err: ErrorObject) => ({
        field:
          err.instancePath ||
          (err.params && 'missingProperty' in err.params
            ? `/${(err.params as { missingProperty: string }).missingProperty}`
            : ''),
        message: err.message ?? 'Validation error',
      }),
    );
    return { valid: false, errors };
  }

  private resolveSchemaPath(): string {
    const candidates = [
      path.join(__dirname, 'skills', 'definitions', SKILL_ID, 'templates', SCHEMA_FILENAME),
      path.join(__dirname, '..', 'dist', 'skills', 'definitions', SKILL_ID, 'templates', SCHEMA_FILENAME),
      path.join(__dirname, '..', '..', 'src', 'skills', 'definitions', SKILL_ID, 'templates', SCHEMA_FILENAME),
      path.join(
        process.cwd(),
        'apps',
        'blinksocial-api',
        'dist',
        'skills',
        'definitions',
        SKILL_ID,
        'templates',
        SCHEMA_FILENAME,
      ),
      path.join(
        process.cwd(),
        'apps',
        'blinksocial-api',
        'src',
        'skills',
        'definitions',
        SKILL_ID,
        'templates',
        SCHEMA_FILENAME,
      ),
    ];

    const found = candidates.find((p) => fs.existsSync(p));
    if (!found) {
      throw new Error(
        `Blueprint schema not found. Searched: ${candidates.join(', ')}`,
      );
    }
    return found;
  }
}
