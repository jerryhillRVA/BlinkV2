import type { ContentObjectiveContract } from '../workspace/content-item.js';

export type AiAssistFieldContract =
  | 'concept-description'
  | 'concept-hook-angle'
  | 'post-key-message'
  | 'post-script-hook'
  | 'post-script-body'
  | 'post-script-cta'
  | 'post-caption'
  | 'post-hashtags';

export type AiAssistDraftFieldContract =
  | 'concept-description'
  | 'concept-hook-angle';

export type AiAssistScopeContract = 'content-item' | 'draft';

export interface AiAssistDraftSnapshot {
  title: string;
  description?: string;
  hook?: string;
  objective?: ContentObjectiveContract;
  pillarIds: string[];
  segmentIds: string[];
}

export type AiAssistRequestContract =
  | {
      scope: 'content-item';
      workspaceId: string;
      refId: string;
      field: AiAssistFieldContract;
      count?: number;
    }
  | {
      scope: 'draft';
      workspaceId: string;
      draft: AiAssistDraftSnapshot;
      field: AiAssistDraftFieldContract;
      count?: number;
    };

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

export const AI_ASSIST_DRAFT_FIELDS: readonly AiAssistDraftFieldContract[] = [
  'concept-description',
  'concept-hook-angle',
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
