export type AiAssistFieldContract =
  | 'concept-description'
  | 'concept-hook-angle'
  | 'post-key-message'
  | 'post-script-hook'
  | 'post-script-body'
  | 'post-script-cta'
  | 'post-caption'
  | 'post-hashtags';

export type AiAssistScopeContract = 'content-item';

export interface AiAssistRequestContract {
  scope: AiAssistScopeContract;
  workspaceId: string;
  refId: string;
  field: AiAssistFieldContract;
  count?: number;
}

export interface AiAssistResponseContract {
  values: string[];
}

export const AI_ASSIST_FIELDS: readonly AiAssistFieldContract[] = [
  'concept-description',
  'concept-hook-angle',
  'post-key-message',
  'post-script-hook',
  'post-script-body',
  'post-script-cta',
  'post-caption',
  'post-hashtags',
] as const;

export const AI_ASSIST_DEFAULT_COUNT: Readonly<Record<AiAssistFieldContract, number>> = {
  'concept-description': 1,
  'concept-hook-angle': 1,
  'post-key-message': 1,
  'post-script-hook': 3,
  'post-script-body': 1,
  'post-script-cta': 1,
  'post-caption': 1,
  'post-hashtags': 5,
} as const;

export const AI_ASSIST_MIN_COUNT = 1;
export const AI_ASSIST_MAX_COUNT = 10;
