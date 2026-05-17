import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import type {
  ConceptDraftContract,
  ConceptDraftRequestContract,
  ConceptDraftResponseContract,
  ContentCtaContract,
  ContentObjectiveContract,
  CtaTypeContract,
} from '@blinksocial/contracts';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { LlmService } from '../llm/llm.service';
import { SkillRunnerService } from '../skills/skill-runner.service';
import { buildStubDraft } from './stubs';

const SKILL_ID = 'concept-draft';
const TOOL_NAME = 'emit_concept_draft';

const VALID_OBJECTIVES: readonly ContentObjectiveContract[] = [
  'awareness',
  'engagement',
  'traffic',
  'leads',
  'sales',
  'community',
  'recruiting',
  'lead-gen',
  'trust',
  'education',
  'conversion',
];

const VALID_CTA_TYPES: readonly CtaTypeContract[] = [
  'learn-more',
  'subscribe',
  'follow',
  'comment',
  'download',
  'buy',
  'book-call',
  'other',
];

interface PillarLite {
  id: string;
  name?: string;
  description?: string;
  color?: string;
}

interface SegmentLite {
  id: string;
  name?: string;
  description?: string;
}

interface BrandVoice {
  brandVoiceDescription?: string;
  toneGuidelines?: string[];
  toneTags?: string[];
}

interface BrandPositioning {
  positioningStatement?: string;
  targetCustomer?: string;
  problemSolved?: string;
  solution?: string;
  differentiator?: string;
}

@Injectable()
export class ConceptDraftService {
  private readonly logger = new Logger(ConceptDraftService.name);

  constructor(
    private readonly workspaces: WorkspacesService,
    private readonly llm: LlmService,
    private readonly skillRunner: SkillRunnerService,
  ) {}

  async generate(
    req: ConceptDraftRequestContract,
  ): Promise<ConceptDraftResponseContract> {
    this.validateRequest(req);
    const { workspaceId, draft } = req;

    const [brandVoice, brandPositioning, pillars, segments] = await Promise.all([
      this.loadBrandVoice(workspaceId),
      this.loadBrandPositioning(workspaceId),
      this.loadPillars(workspaceId),
      this.loadSegments(workspaceId),
    ]);

    // Server is authoritative on the "preserve user selections" rule:
    // the LLM's fallback values (if any) are overridden by these below.
    const pillarIdFallback =
      draft.pillarIds.length === 0 && pillars.length > 0 ? pillars[0].id : null;
    const segmentIdsFallback =
      draft.segmentIds.length === 0 ? segments.slice(0, 2).map((s) => s.id) : [];

    if (!this.llm.isConfigured()) {
      this.logger.debug(
        `LLM not configured — returning stub concept draft for objective=${draft.objective}`,
      );
      return {
        draft: buildStubDraft({
          objective: draft.objective,
          pillarIdFallback,
          segmentIdsFallback,
        }),
      };
    }

    const context = this.buildContext(
      draft,
      brandVoice,
      brandPositioning,
      pillars,
      segments,
    );
    const llmDraft = await this.runSkillWithRetry(context, pillars, segments);
    return {
      draft: {
        ...llmDraft,
        // Override the skill's fallback values with our server-computed
        // ones — the model is advisory on these two fields, never
        // authoritative.
        pillarIdFallback,
        segmentIdsFallback,
      },
    };
  }

  // ── validation ───────────────────────────────────────────────────────

  private validateRequest(req: ConceptDraftRequestContract): void {
    if (!req || typeof req !== 'object') {
      throw new BadRequestException('Request body is required.');
    }
    if (!req.workspaceId || typeof req.workspaceId !== 'string') {
      throw new BadRequestException('workspaceId is required.');
    }
    const draft = req.draft;
    if (!draft || typeof draft !== 'object') {
      throw new BadRequestException('draft is required.');
    }
    if (typeof draft.title !== 'string' || draft.title.trim().length === 0) {
      throw new BadRequestException('draft.title is required.');
    }
    if (!draft.objective || typeof draft.objective !== 'string') {
      throw new BadRequestException('draft.objective is required.');
    }
    if (!VALID_OBJECTIVES.includes(draft.objective)) {
      throw new BadRequestException(
        `draft.objective must be one of: ${VALID_OBJECTIVES.join(', ')}.`,
      );
    }
    if (!Array.isArray(draft.pillarIds)) {
      throw new BadRequestException('draft.pillarIds must be an array.');
    }
    if (!Array.isArray(draft.segmentIds)) {
      throw new BadRequestException('draft.segmentIds must be an array.');
    }
  }

  // ── context loaders (failures degrade to null/[]) ────────────────────

  private async loadBrandVoice(workspaceId: string): Promise<BrandVoice | null> {
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

  private async loadBrandPositioning(
    workspaceId: string,
  ): Promise<BrandPositioning | null> {
    try {
      const raw = (await this.workspaces.getSettings(workspaceId, 'brand-positioning')) as
        | Record<string, unknown>
        | null;
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

  private async loadPillars(workspaceId: string): Promise<PillarLite[]> {
    try {
      const all = (await this.workspaces.getNamespaceEntities(
        workspaceId,
        'content-pillars',
      )) as unknown[];
      return all
        .filter((p): p is Record<string, unknown> => !!p && typeof p === 'object')
        .filter((p) => typeof p['id'] === 'string')
        .map((p) => ({
          id: p['id'] as string,
          name: typeof p['name'] === 'string' ? (p['name'] as string) : undefined,
          description:
            typeof p['description'] === 'string' ? (p['description'] as string) : undefined,
          color: typeof p['color'] === 'string' ? (p['color'] as string) : undefined,
        }));
    } catch {
      return [];
    }
  }

  private async loadSegments(workspaceId: string): Promise<SegmentLite[]> {
    try {
      const all = (await this.workspaces.getNamespaceEntities(
        workspaceId,
        'audience-segments',
      )) as unknown[];
      return all
        .filter((s): s is Record<string, unknown> => !!s && typeof s === 'object')
        .filter((s) => typeof s['id'] === 'string')
        .map((s) => ({
          id: s['id'] as string,
          name: typeof s['name'] === 'string' ? (s['name'] as string) : undefined,
          description:
            typeof s['description'] === 'string' ? (s['description'] as string) : undefined,
        }));
    } catch {
      return [];
    }
  }

  // ── context assembly ─────────────────────────────────────────────────

  private buildContext(
    draft: ConceptDraftRequestContract['draft'],
    brandVoice: BrandVoice | null,
    brandPositioning: BrandPositioning | null,
    pillars: readonly PillarLite[],
    segments: readonly SegmentLite[],
  ): Record<string, unknown> {
    return {
      draft: removeEmpty({
        title: draft.title,
        objective: draft.objective,
        pillarIds: draft.pillarIds,
        segmentIds: draft.segmentIds,
      }),
      workspace: removeEmpty({
        brandVoice: brandVoice?.brandVoiceDescription,
        toneGuidelines: brandVoice?.toneGuidelines,
        toneTags: brandVoice?.toneTags,
        positioningStatement: brandPositioning?.positioningStatement,
        targetCustomer: brandPositioning?.targetCustomer,
        problemSolved: brandPositioning?.problemSolved,
        solution: brandPositioning?.solution,
        differentiator: brandPositioning?.differentiator,
      }),
      pillars: pillars.map((p) => removeEmpty({ ...p })),
      segments: segments.map((s) => removeEmpty({ ...s })),
    };
  }

  // ── LLM call + validation ────────────────────────────────────────────

  private async runSkillWithRetry(
    context: Record<string, unknown>,
    pillars: readonly PillarLite[],
    segments: readonly SegmentLite[],
  ): Promise<ConceptDraftContract> {
    const inputSchema = this.toolInputSchema(pillars, segments);

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const result = await this.skillRunner.run({
          skillId: SKILL_ID,
          conversationHistory: [{ role: 'user', content: JSON.stringify(context) }],
          temperature: 0.7,
          tool: {
            name: TOOL_NAME,
            description: 'Emit exactly one concept draft object.',
            inputSchema,
          },
        });
        return this.parseAndValidate(result.parsed, pillars, segments);
      } catch (err) {
        if (attempt === 2) {
          this.logger.warn(`concept-draft skill failed twice: ${String(err)}`);
          throw new BadGatewayException(
            'AI generation failed. Please try again in a moment.',
          );
        }
        this.logger.debug(`concept-draft attempt ${attempt} failed, retrying`);
      }
    }
    throw new BadGatewayException('AI generation failed.');
  }

  private parseAndValidate(
    parsed: Record<string, unknown> | null,
    pillars: readonly PillarLite[],
    segments: readonly SegmentLite[],
  ): ConceptDraftContract {
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('skill output missing object');
    }

    const description = parsed['description'];
    if (typeof description !== 'string' || description.trim().length === 0) {
      throw new Error('skill output description must be a non-empty string');
    }
    const hook = parsed['hook'];
    if (typeof hook !== 'string' || hook.trim().length === 0) {
      throw new Error('skill output hook must be a non-empty string');
    }

    const ctaRaw = parsed['cta'];
    let cta: ContentCtaContract | null;
    if (ctaRaw === null || ctaRaw === undefined) {
      cta = null;
    } else if (typeof ctaRaw === 'object') {
      const c = ctaRaw as Record<string, unknown>;
      const ctaType = c['type'];
      const ctaText = c['text'];
      if (typeof ctaType !== 'string' || !VALID_CTA_TYPES.includes(ctaType as CtaTypeContract)) {
        throw new Error(`skill output cta.type invalid: ${String(ctaType)}`);
      }
      if (typeof ctaText !== 'string' || ctaText.trim().length === 0) {
        throw new Error('skill output cta.text must be a non-empty string');
      }
      cta = { type: ctaType as CtaTypeContract, text: ctaText.trim() };
    } else {
      throw new Error('skill output cta must be null or an object');
    }

    const pillarIds = new Set(pillars.map((p) => p.id));
    const segmentIds = new Set(segments.map((s) => s.id));

    const pillarIdFallbackRaw = parsed['pillarIdFallback'];
    let pillarIdFallback: string | null;
    if (pillarIdFallbackRaw === null || pillarIdFallbackRaw === undefined) {
      pillarIdFallback = null;
    } else if (typeof pillarIdFallbackRaw === 'string') {
      if (pillarIds.size > 0 && !pillarIds.has(pillarIdFallbackRaw)) {
        throw new Error(
          `skill output pillarIdFallback ${pillarIdFallbackRaw} not in workspace catalog`,
        );
      }
      pillarIdFallback = pillarIdFallbackRaw;
    } else {
      throw new Error('skill output pillarIdFallback must be null or a string');
    }

    const segmentIdsFallbackRaw = parsed['segmentIdsFallback'];
    if (!Array.isArray(segmentIdsFallbackRaw)) {
      throw new Error('skill output segmentIdsFallback must be an array');
    }
    const segmentIdsFallback = segmentIdsFallbackRaw.map((s) => String(s));
    for (const sid of segmentIdsFallback) {
      if (segmentIds.size > 0 && !segmentIds.has(sid)) {
        throw new Error(
          `skill output segmentIdsFallback id ${sid} not in workspace catalog`,
        );
      }
    }

    return {
      description: description.trim(),
      hook: hook.trim(),
      cta,
      pillarIdFallback,
      segmentIdsFallback,
    };
  }

  private toolInputSchema(
    pillars: readonly PillarLite[],
    segments: readonly SegmentLite[],
  ): Record<string, unknown> {
    const pillarIdsEnum = pillars.map((p) => p.id);
    const segmentIdsEnum = segments.map((s) => s.id);

    const pillarIdFallbackSchema: Record<string, unknown> = {
      oneOf: [
        { type: 'null' },
        pillarIdsEnum.length > 0
          ? { type: 'string', enum: pillarIdsEnum }
          : { type: 'string' },
      ],
    };

    const segmentItemSchema: Record<string, unknown> =
      segmentIdsEnum.length > 0
        ? { type: 'string', enum: segmentIdsEnum }
        : { type: 'string' };

    return {
      type: 'object',
      properties: {
        description: { type: 'string', minLength: 1 },
        hook: { type: 'string', minLength: 1 },
        cta: {
          oneOf: [
            { type: 'null' },
            {
              type: 'object',
              properties: {
                type: { type: 'string', enum: VALID_CTA_TYPES },
                text: { type: 'string', minLength: 1 },
              },
              required: ['type', 'text'],
            },
          ],
        },
        pillarIdFallback: pillarIdFallbackSchema,
        segmentIdsFallback: { type: 'array', items: segmentItemSchema },
      },
      required: ['description', 'hook', 'cta', 'pillarIdFallback', 'segmentIdsFallback'],
    };
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
