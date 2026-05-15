import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type {
  AiAssistFieldContract,
  AiAssistRequestContract,
  AiAssistResponseContract,
  ContentItemContract,
} from '@blinksocial/contracts';
import {
  AI_ASSIST_DEFAULT_COUNT,
  AI_ASSIST_MAX_COUNT,
  AI_ASSIST_MIN_COUNT,
  AI_ASSIST_FIELDS,
} from '@blinksocial/contracts';
import { ContentItemsService } from '../content-items/content-items.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { LlmService } from '../llm/llm.service';
import { SkillRunnerService } from '../skills/skill-runner.service';
import { buildStubValues } from './stubs';

type FieldStage = 'concept' | 'post';

const FIELD_STAGE: Readonly<Record<AiAssistFieldContract, FieldStage>> = {
  'concept-description': 'concept',
  'concept-hook-angle': 'concept',
  'post-key-message': 'post',
  'post-script-hook': 'post',
  'post-script-body': 'post',
  'post-script-cta': 'post',
  'post-caption': 'post',
  'post-hashtags': 'post',
};

const FIELD_SKILL_ID: Readonly<Record<AiAssistFieldContract, string>> = {
  'concept-description': 'field-assist-concept-description',
  'concept-hook-angle': 'field-assist-concept-hook-angle',
  'post-key-message': 'field-assist-post-key-message',
  'post-script-hook': 'field-assist-post-script-hook',
  'post-script-body': 'field-assist-post-script-body',
  'post-script-cta': 'field-assist-post-script-cta',
  'post-caption': 'field-assist-post-caption',
  'post-hashtags': 'field-assist-post-hashtags',
};

const TOOL_NAME = 'emit_field_values';

@Injectable()
export class AiAssistService {
  private readonly logger = new Logger(AiAssistService.name);

  constructor(
    private readonly contentItems: ContentItemsService,
    private readonly workspaces: WorkspacesService,
    private readonly llm: LlmService,
    private readonly skillRunner: SkillRunnerService,
  ) {}

  async assist(req: AiAssistRequestContract): Promise<AiAssistResponseContract> {
    this.validateRequest(req);
    const field = req.field;
    const count = this.resolveCount(req);

    const item = await this.loadItem(req.workspaceId, req.refId);
    this.assertStageMatches(field, item);

    if (!this.llm.isConfigured()) {
      this.logger.debug(
        `LLM not configured — returning stub values for ${field} on ${req.refId}`,
      );
      return { values: buildStubValues(field, count, item) };
    }

    const context = await this.buildContext(req.workspaceId, item);
    const values = await this.runSkill(field, count, context);
    return { values };
  }

  // ── validation ───────────────────────────────────────────────────────

  private validateRequest(req: AiAssistRequestContract): void {
    if (!req || typeof req !== 'object') {
      throw new BadRequestException('Request body is required.');
    }
    if (req.scope !== 'content-item') {
      throw new BadRequestException(`Unsupported scope: ${String(req.scope)}`);
    }
    if (!req.workspaceId || typeof req.workspaceId !== 'string') {
      throw new BadRequestException('workspaceId is required.');
    }
    if (!req.refId || typeof req.refId !== 'string') {
      throw new BadRequestException('refId is required.');
    }
    if (!AI_ASSIST_FIELDS.includes(req.field)) {
      throw new BadRequestException(`Unknown field: ${String(req.field)}`);
    }
    if (req.count !== undefined) {
      if (
        typeof req.count !== 'number' ||
        !Number.isFinite(req.count) ||
        !Number.isInteger(req.count) ||
        req.count < AI_ASSIST_MIN_COUNT ||
        req.count > AI_ASSIST_MAX_COUNT
      ) {
        throw new BadRequestException(
          `count must be an integer in [${AI_ASSIST_MIN_COUNT}, ${AI_ASSIST_MAX_COUNT}]`,
        );
      }
    }
  }

  private resolveCount(req: AiAssistRequestContract): number {
    return req.count ?? AI_ASSIST_DEFAULT_COUNT[req.field];
  }

  private assertStageMatches(
    field: AiAssistFieldContract,
    item: ContentItemContract,
  ): void {
    const expected = FIELD_STAGE[field];
    if (expected === 'concept' && item.stage !== 'concept') {
      throw new BadRequestException(
        `Field ${field} requires a concept-stage item; got stage=${item.stage}`,
      );
    }
    if (expected === 'post' && item.stage !== 'post') {
      throw new BadRequestException(
        `Field ${field} requires a post-stage item; got stage=${item.stage}`,
      );
    }
  }

  // ── context assembly ────────────────────────────────────────────────

  private async loadItem(
    workspaceId: string,
    itemId: string,
  ): Promise<ContentItemContract> {
    try {
      return await this.contentItems.getItem(workspaceId, itemId);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw error;
    }
  }

  private async buildContext(
    workspaceId: string,
    item: ContentItemContract,
  ): Promise<Record<string, unknown>> {
    const [parentConcept, brandVoice, brandPositioning, pillars, segments] =
      await Promise.all([
        this.loadParentConcept(workspaceId, item),
        this.loadBrandVoice(workspaceId),
        this.loadBrandPositioning(workspaceId),
        this.loadPillars(workspaceId, item),
        this.loadSegments(workspaceId, item),
      ]);

    return {
      item: this.projectItem(item),
      parentConcept: parentConcept ? this.projectItem(parentConcept) : null,
      workspace: {
        brandVoice: brandVoice?.brandVoiceDescription ?? null,
        toneGuidelines: brandVoice?.toneGuidelines ?? [],
        toneTags: brandVoice?.toneTags ?? [],
        positioningStatement: brandPositioning?.positioningStatement ?? null,
        targetCustomer: brandPositioning?.targetCustomer ?? null,
        problemSolved: brandPositioning?.problemSolved ?? null,
        solution: brandPositioning?.solution ?? null,
        differentiator: brandPositioning?.differentiator ?? null,
      },
      pillars,
      segments,
      targetPlatform: this.projectTargetPlatform(item),
    };
  }

  private async loadParentConcept(
    workspaceId: string,
    item: ContentItemContract,
  ): Promise<ContentItemContract | null> {
    if (item.stage !== 'post' || !item.parentConceptId) return null;
    try {
      return await this.contentItems.getItem(workspaceId, item.parentConceptId);
    } catch {
      // Parent went missing — degrade silently rather than failing the call.
      return null;
    }
  }

  private async loadBrandVoice(workspaceId: string): Promise<{
    brandVoiceDescription?: string;
    toneGuidelines?: string[];
    toneTags?: string[];
  } | null> {
    try {
      const raw = (await this.workspaces.getSettings(workspaceId, 'brand-voice')) as
        | Record<string, unknown>
        | null;
      if (!raw) return null;
      return {
        brandVoiceDescription:
          typeof raw['brandVoiceDescription'] === 'string'
            ? (raw['brandVoiceDescription'] as string)
            : undefined,
        toneGuidelines: Array.isArray(raw['toneGuidelines'])
          ? (raw['toneGuidelines'] as string[])
          : undefined,
        toneTags: Array.isArray(raw['toneTags'])
          ? (raw['toneTags'] as string[])
          : undefined,
      };
    } catch {
      return null;
    }
  }

  private async loadBrandPositioning(workspaceId: string): Promise<{
    positioningStatement?: string;
    targetCustomer?: string;
    problemSolved?: string;
    solution?: string;
    differentiator?: string;
  } | null> {
    try {
      const raw = (await this.workspaces.getSettings(
        workspaceId,
        'brand-positioning',
      )) as Record<string, unknown> | null;
      if (!raw) return null;
      const pick = (k: string): string | undefined =>
        typeof raw[k] === 'string' ? (raw[k] as string) : undefined;
      return {
        positioningStatement: pick('positioningStatement'),
        targetCustomer: pick('targetCustomer'),
        problemSolved: pick('problemSolved'),
        solution: pick('solution'),
        differentiator: pick('differentiator'),
      };
    } catch {
      return null;
    }
  }

  private async loadPillars(
    workspaceId: string,
    item: ContentItemContract,
  ): Promise<unknown[]> {
    const ids = item.pillarIds ?? [];
    if (ids.length === 0) return [];
    try {
      const all = await this.workspaces.getNamespaceEntities(
        workspaceId,
        'content-pillars',
      );
      return (all as Array<{ id: string }>).filter((p) => ids.includes(p.id));
    } catch {
      return [];
    }
  }

  private async loadSegments(
    workspaceId: string,
    item: ContentItemContract,
  ): Promise<unknown[]> {
    const ids = item.segmentIds ?? [];
    if (ids.length === 0) return [];
    try {
      const all = await this.workspaces.getNamespaceEntities(
        workspaceId,
        'audience-segments',
      );
      return (all as Array<{ id: string }>).filter((s) => ids.includes(s.id));
    } catch {
      return [];
    }
  }

  /**
   * Reduce the content item to the fields that meaningfully shape the
   * generated text — the prompt stays small and the model can't be
   * derailed by unrelated workflow metadata.
   */
  private projectItem(item: ContentItemContract): Record<string, unknown> {
    const draft = item.production?.draft;
    const packaging = item.production?.packaging?.instagram;
    return removeEmpty({
      id: item.id,
      stage: item.stage,
      title: item.title,
      description: item.description,
      hook: item.hook,
      objective: item.objective,
      keyMessage: item.keyMessage,
      tonePreset: item.tonePreset,
      cta: item.cta,
      platform: item.platform,
      contentType: item.contentType,
      pillarIds: item.pillarIds,
      segmentIds: item.segmentIds,
      script: draft?.video
        ? removeEmpty({
            hook: draft.video.hook,
            body: draft.video.body,
            cta: draft.video.cta,
          })
        : undefined,
      packaging: packaging
        ? removeEmpty({
            caption: packaging.caption,
            hashtags: packaging.hashtags,
          })
        : undefined,
    });
  }

  private projectTargetPlatform(
    item: ContentItemContract,
  ): { platform: string; contentType: string | null } | null {
    if (item.targetPlatforms && item.targetPlatforms.length > 0) {
      const tp = item.targetPlatforms[0];
      return {
        platform: tp.platform,
        contentType: tp.contentType ?? null,
      };
    }
    if (item.platform) {
      return {
        platform: item.platform,
        contentType: item.contentType ?? null,
      };
    }
    return null;
  }

  // ── LLM call ─────────────────────────────────────────────────────────

  private async runSkill(
    field: AiAssistFieldContract,
    count: number,
    context: Record<string, unknown>,
  ): Promise<string[]> {
    const skillId = FIELD_SKILL_ID[field];
    const result = await this.skillRunner.run({
      skillId,
      conversationHistory: [
        { role: 'user', content: JSON.stringify({ field, count, context }) },
      ],
      temperature: 0.7,
      tool: {
        name: TOOL_NAME,
        description: `Emit exactly ${count} suggestion(s) for the ${field} field.`,
        inputSchema: {
          type: 'object',
          properties: {
            values: {
              type: 'array',
              minItems: count,
              maxItems: count,
              items: { type: 'string', minLength: 1 },
            },
          },
          required: ['values'],
        },
      },
    });

    const parsed = result.parsed;
    const rawValues = parsed && Array.isArray(parsed['values']) ? (parsed['values'] as unknown[]) : null;
    if (!rawValues || rawValues.length !== count) {
      this.logger.warn(
        `Skill ${skillId} returned malformed values (length=${rawValues?.length ?? 0}, want=${count}). stop=${result.stopReason}`,
      );
      throw new BadGatewayException(
        'AI generation failed. Please try again in a moment.',
      );
    }

    const cleaned = rawValues
      .map((v) => (typeof v === 'string' ? v.trim() : ''))
      .filter((v) => v.length > 0);

    if (cleaned.length !== count) {
      this.logger.warn(
        `Skill ${skillId} returned ${cleaned.length} non-empty value(s), want ${count}`,
      );
      throw new BadGatewayException(
        'AI generation failed. Please try again in a moment.',
      );
    }
    return cleaned;
  }
}

function removeEmpty<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (typeof v === 'string' && v.trim() === '') continue;
    if (Array.isArray(v) && v.length === 0) continue;
    if (typeof v === 'object' && !Array.isArray(v)) {
      const inner = v as Record<string, unknown>;
      if (Object.keys(inner).length === 0) continue;
    }
    out[k] = v;
  }
  return out as T;
}
