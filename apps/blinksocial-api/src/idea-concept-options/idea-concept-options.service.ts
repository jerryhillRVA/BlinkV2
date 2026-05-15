import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  ConceptOptionContract,
  ConceptTargetPlatformContract,
  ContentCtaContract,
  ContentItemContract,
  ContentObjectiveContract,
  ContentTypeContract,
  CtaTypeContract,
  IdeaConceptOptionsRequestContract,
  IdeaConceptOptionsResponseContract,
  PlatformContract,
} from '@blinksocial/contracts';
import { IDEA_CONCEPT_OPTIONS_COUNT } from '@blinksocial/contracts';
import { ContentItemsService } from '../content-items/content-items.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { LlmService } from '../llm/llm.service';
import { SkillRunnerService } from '../skills/skill-runner.service';
import { buildStubOptions } from './stubs';

const SKILL_ID = 'idea-concept-options';
const TOOL_NAME = 'emit_concept_options';

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

const VALID_PLATFORMS: readonly PlatformContract[] = [
  'instagram',
  'tiktok',
  'youtube',
  'facebook',
  'linkedin',
  'x',
  'tbd',
];

const VALID_CONTENT_TYPES: readonly ContentTypeContract[] = [
  'reel',
  'carousel',
  'feed-post',
  'story',
  'guide',
  'live',
  'short-video',
  'photo-carousel',
  'long-form',
  'shorts',
  'live-stream',
  'community-post',
  'fb-link-post',
  'fb-feed-post',
  'fb-live',
  'fb-reel',
  'fb-story',
  'ln-text-post',
  'ln-document',
  'ln-article',
  'ln-video',
  'tweet',
  'thread',
  'quote',
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

@Injectable()
export class IdeaConceptOptionsService {
  private readonly logger = new Logger(IdeaConceptOptionsService.name);

  constructor(
    private readonly contentItems: ContentItemsService,
    private readonly workspaces: WorkspacesService,
    private readonly llm: LlmService,
    private readonly skillRunner: SkillRunnerService,
  ) {}

  async generate(
    req: IdeaConceptOptionsRequestContract,
  ): Promise<IdeaConceptOptionsResponseContract> {
    this.validateRequest(req);

    const item = await this.loadIdea(req.workspaceId, req.refId);

    const [pillars, segments] = await Promise.all([
      this.loadPillars(req.workspaceId),
      this.loadSegments(req.workspaceId),
    ]);

    if (!this.llm.isConfigured()) {
      this.logger.debug(
        `LLM not configured — returning stub concept options for ${req.refId}`,
      );
      return { options: buildStubOptions(pillars, segments, () => this.newOptionId()) };
    }

    const [brandVoice, brandPositioning] = await Promise.all([
      this.loadBrandVoice(req.workspaceId),
      this.loadBrandPositioning(req.workspaceId),
    ]);

    const context = this.buildContext(item, brandVoice, brandPositioning, pillars, segments);
    const options = await this.runSkillWithRetry(context, pillars, segments);
    return { options };
  }

  // ── validation ───────────────────────────────────────────────────────

  private validateRequest(req: IdeaConceptOptionsRequestContract): void {
    if (!req || typeof req !== 'object') {
      throw new BadRequestException('Request body is required.');
    }
    if (!req.workspaceId || typeof req.workspaceId !== 'string') {
      throw new BadRequestException('workspaceId is required.');
    }
    if (!req.refId || typeof req.refId !== 'string') {
      throw new BadRequestException('refId is required.');
    }
  }

  private async loadIdea(
    workspaceId: string,
    itemId: string,
  ): Promise<ContentItemContract> {
    let item: ContentItemContract;
    try {
      item = await this.contentItems.getItem(workspaceId, itemId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new BadRequestException(`Idea ${itemId} not found in workspace ${workspaceId}.`);
      }
      throw error;
    }
    if (item.stage !== 'idea') {
      throw new BadRequestException(
        `Item ${itemId} requires stage=idea; got stage=${item.stage}.`,
      );
    }
    return item;
  }

  // ── context loaders ──────────────────────────────────────────────────

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
        toneTags: Array.isArray(raw['toneTags']) ? (raw['toneTags'] as string[]) : undefined,
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
    item: ContentItemContract,
    brandVoice: Awaited<ReturnType<IdeaConceptOptionsService['loadBrandVoice']>>,
    brandPositioning: Awaited<ReturnType<IdeaConceptOptionsService['loadBrandPositioning']>>,
    pillars: readonly PillarLite[],
    segments: readonly SegmentLite[],
  ): Record<string, unknown> {
    return {
      idea: removeEmpty({
        id: item.id,
        title: item.title,
        description: item.description,
        objective: item.objective,
        tags: item.tags,
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
  ): Promise<ConceptOptionContract[]> {
    const inputSchema = this.toolInputSchema(pillars, segments);

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const result = await this.skillRunner.run({
          skillId: SKILL_ID,
          conversationHistory: [{ role: 'user', content: JSON.stringify(context) }],
          temperature: 0.8,
          tool: {
            name: TOOL_NAME,
            description: `Emit exactly ${IDEA_CONCEPT_OPTIONS_COUNT} concept option objects.`,
            inputSchema,
          },
        });

        const parsed = this.parseAndValidate(result.parsed, pillars, segments);
        return parsed;
      } catch (err) {
        if (attempt === 2) {
          this.logger.warn(`idea-concept-options skill failed twice: ${String(err)}`);
          throw new BadGatewayException(
            'AI generation failed. Please try again in a moment.',
          );
        }
        this.logger.debug(`idea-concept-options attempt ${attempt} failed, retrying`);
      }
    }
    throw new BadGatewayException('AI generation failed.');
  }

  private parseAndValidate(
    parsed: Record<string, unknown> | null,
    pillars: readonly PillarLite[],
    segments: readonly SegmentLite[],
  ): ConceptOptionContract[] {
    if (!parsed || !Array.isArray(parsed['options'])) {
      throw new Error('skill output missing options array');
    }
    const raw = parsed['options'] as unknown[];
    if (raw.length !== IDEA_CONCEPT_OPTIONS_COUNT) {
      throw new Error(
        `skill returned ${raw.length} options, want ${IDEA_CONCEPT_OPTIONS_COUNT}`,
      );
    }
    const pillarIds = new Set(pillars.map((p) => p.id));
    const segmentIds = new Set(segments.map((s) => s.id));
    return raw.map((entry, index) =>
      this.shapeOption(entry, index, pillarIds, segmentIds),
    );
  }

  private shapeOption(
    entry: unknown,
    index: number,
    pillarIds: ReadonlySet<string>,
    segmentIds: ReadonlySet<string>,
  ): ConceptOptionContract {
    if (!entry || typeof entry !== 'object') {
      throw new Error(`option ${index} is not an object`);
    }
    const e = entry as Record<string, unknown>;

    const angle = readNonEmptyString(e, 'angle', index);
    const description = readNonEmptyString(e, 'description', index);
    const objectiveAlignment = readNonEmptyString(e, 'objectiveAlignment', index);
    const suggestedFormatLabel = readNonEmptyString(e, 'suggestedFormatLabel', index);

    const objective = e['objective'];
    if (typeof objective !== 'string' || !VALID_OBJECTIVES.includes(objective as ContentObjectiveContract)) {
      throw new Error(`option ${index} has invalid objective: ${String(objective)}`);
    }

    const pillarIdsRaw = e['pillarIds'];
    if (!Array.isArray(pillarIdsRaw)) {
      throw new Error(`option ${index} pillarIds must be an array`);
    }
    const optionPillarIds = pillarIdsRaw.map((p) => String(p));
    for (const pid of optionPillarIds) {
      if (!pillarIds.has(pid) && pillarIds.size > 0) {
        throw new Error(`option ${index} references unknown pillar id: ${pid}`);
      }
    }

    const segmentIdsRaw = e['segmentIds'];
    if (!Array.isArray(segmentIdsRaw)) {
      throw new Error(`option ${index} segmentIds must be an array`);
    }
    const optionSegmentIds = segmentIdsRaw.map((s) => String(s));
    for (const sid of optionSegmentIds) {
      if (!segmentIds.has(sid) && segmentIds.size > 0) {
        throw new Error(`option ${index} references unknown segment id: ${sid}`);
      }
    }

    const targetPlatformsRaw = e['targetPlatforms'];
    if (!Array.isArray(targetPlatformsRaw) || targetPlatformsRaw.length === 0) {
      throw new Error(`option ${index} targetPlatforms must be a non-empty array`);
    }
    const targetPlatforms: ConceptTargetPlatformContract[] = targetPlatformsRaw.map((tp, j) => {
      if (!tp || typeof tp !== 'object') {
        throw new Error(`option ${index} targetPlatforms[${j}] is not an object`);
      }
      const t = tp as Record<string, unknown>;
      const platform = t['platform'];
      const contentType = t['contentType'];
      if (typeof platform !== 'string' || !VALID_PLATFORMS.includes(platform as PlatformContract)) {
        throw new Error(`option ${index} targetPlatforms[${j}] invalid platform: ${String(platform)}`);
      }
      if (typeof contentType !== 'string' || !VALID_CONTENT_TYPES.includes(contentType as ContentTypeContract)) {
        throw new Error(`option ${index} targetPlatforms[${j}] invalid contentType: ${String(contentType)}`);
      }
      return {
        platform: platform as PlatformContract,
        contentType: contentType as ContentTypeContract,
        postId: null,
      };
    });

    const ctaRaw = e['cta'];
    if (!ctaRaw || typeof ctaRaw !== 'object') {
      throw new Error(`option ${index} cta must be an object`);
    }
    const c = ctaRaw as Record<string, unknown>;
    const ctaType = c['type'];
    const ctaText = c['text'];
    if (typeof ctaType !== 'string' || !VALID_CTA_TYPES.includes(ctaType as CtaTypeContract)) {
      throw new Error(`option ${index} cta.type invalid: ${String(ctaType)}`);
    }
    if (typeof ctaText !== 'string' || ctaText.trim().length === 0) {
      throw new Error(`option ${index} cta.text must be a non-empty string`);
    }
    const cta: ContentCtaContract = { type: ctaType as CtaTypeContract, text: ctaText.trim() };

    return {
      id: this.newOptionId(),
      angle: angle.trim(),
      description: description.trim(),
      objectiveAlignment: objectiveAlignment.trim(),
      objective: objective as ContentObjectiveContract,
      pillarIds: optionPillarIds,
      segmentIds: optionSegmentIds,
      targetPlatforms,
      cta,
      suggestedFormatLabel: suggestedFormatLabel.trim(),
    };
  }

  private toolInputSchema(
    pillars: readonly PillarLite[],
    segments: readonly SegmentLite[],
  ): Record<string, unknown> {
    const pillarIdsEnum = pillars.map((p) => p.id);
    const segmentIdsEnum = segments.map((s) => s.id);
    const pillarItemSchema: Record<string, unknown> = { type: 'string' };
    if (pillarIdsEnum.length > 0) pillarItemSchema['enum'] = pillarIdsEnum;
    const segmentItemSchema: Record<string, unknown> = { type: 'string' };
    if (segmentIdsEnum.length > 0) segmentItemSchema['enum'] = segmentIdsEnum;

    return {
      type: 'object',
      properties: {
        options: {
          type: 'array',
          minItems: IDEA_CONCEPT_OPTIONS_COUNT,
          maxItems: IDEA_CONCEPT_OPTIONS_COUNT,
          items: {
            type: 'object',
            properties: {
              angle: { type: 'string', minLength: 1 },
              description: { type: 'string', minLength: 1 },
              objectiveAlignment: { type: 'string', minLength: 1 },
              objective: { type: 'string', enum: VALID_OBJECTIVES },
              pillarIds: { type: 'array', items: pillarItemSchema },
              segmentIds: { type: 'array', items: segmentItemSchema },
              targetPlatforms: {
                type: 'array',
                minItems: 1,
                items: {
                  type: 'object',
                  properties: {
                    platform: { type: 'string', enum: VALID_PLATFORMS },
                    contentType: { type: 'string', enum: VALID_CONTENT_TYPES },
                  },
                  required: ['platform', 'contentType'],
                },
              },
              cta: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: VALID_CTA_TYPES },
                  text: { type: 'string', minLength: 1 },
                },
                required: ['type', 'text'],
              },
              suggestedFormatLabel: { type: 'string', minLength: 1 },
            },
            required: [
              'angle',
              'description',
              'objectiveAlignment',
              'objective',
              'pillarIds',
              'segmentIds',
              'targetPlatforms',
              'cta',
              'suggestedFormatLabel',
            ],
          },
        },
      },
      required: ['options'],
    };
  }

  private newOptionId(): string {
    return `opt-${randomUUID()}`;
  }
}

function readNonEmptyString(
  obj: Record<string, unknown>,
  key: string,
  index: number,
): string {
  const v = obj[key];
  if (typeof v !== 'string' || v.trim().length === 0) {
    throw new Error(`option ${index} ${key} must be a non-empty string`);
  }
  return v;
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
