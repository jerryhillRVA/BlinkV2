import { Ajv, type ErrorObject } from 'ajv';
import addFormatsModule from 'ajv-formats';
import type { ValidationErrorContract } from './create-workspace-response.js';

import enumsSchema from '../schemas/workspaces/enums.schema.json' with { type: 'json' };
import generalSchema from '../schemas/workspaces/general.schema.json' with { type: 'json' };
import platformsSchema from '../schemas/workspaces/platforms.schema.json' with { type: 'json' };
import brandVoiceSchema from '../schemas/workspaces/brand-voice.schema.json' with { type: 'json' };
import skillsSchema from '../schemas/workspaces/skills.schema.json' with { type: 'json' };
import contentPillarSchema from '../schemas/workspaces/content-pillar.schema.json' with { type: 'json' };
import audienceSegmentSchema from '../schemas/workspaces/audience-segment.schema.json' with { type: 'json' };
import createWorkspaceRequestSchema from '../schemas/workspaces/create-workspace-request.schema.json' with { type: 'json' };

// CJS default export under nodenext: runtime resolves to the callable plugin
const addFormats = addFormatsModule as unknown as (ajv: Ajv) => Ajv;

let ajvInstance: Ajv | null = null;

function getAjv(): Ajv {
  if (!ajvInstance) {
    ajvInstance = new Ajv({ allErrors: true, strict: false, validateSchema: false });
    addFormats(ajvInstance);
    ajvInstance.addSchema(enumsSchema);
    ajvInstance.addSchema(generalSchema);
    ajvInstance.addSchema(platformsSchema);
    ajvInstance.addSchema(brandVoiceSchema);
    ajvInstance.addSchema(skillsSchema);
    ajvInstance.addSchema(contentPillarSchema);
    ajvInstance.addSchema(audienceSegmentSchema);
    ajvInstance.addSchema(createWorkspaceRequestSchema);
  }
  return ajvInstance;
}

export function validateCreateWorkspaceRequest(
  data: unknown
): { valid: true } | { valid: false; errors: ValidationErrorContract[] } {
  const ajv = getAjv();
  const validate = ajv.getSchema(
    'https://blinksocial.io/schemas/create-workspace-request.schema.json'
  );
  if (!validate) {
    return { valid: false, errors: [{ field: '', message: 'Schema not found' }] };
  }

  const valid = validate(data);
  if (valid) {
    return { valid: true };
  }

  const errors: ValidationErrorContract[] = (validate.errors ?? []).map((err: ErrorObject) => ({
    field: err.instancePath || (err.params && 'missingProperty' in err.params
      ? `/${err.params['missingProperty']}`
      : ''),
    message: err.message ?? 'Validation error',
  }));

  return { valid: false, errors };
}
