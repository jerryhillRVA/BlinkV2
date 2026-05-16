import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  GeneratedIdeaContract,
  GenerateIdeasRequestContract,
  GenerateIdeasResponseContract,
} from '@blinksocial/contracts';
import { GENERATE_IDEAS_COUNT } from '@blinksocial/contracts';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { LlmService } from '../llm/llm.service';
import { SkillRunnerService } from '../skills/skill-runner.service';
import { buildStubIdeas } from './stubs';

const SKILL_ID = 'generated-ideas';
const TOOL_NAME = 'emit_generated_ideas';
const TITLE_MAX = 120;
const RATIONALE_MAX = 400;

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
export class GeneratedIdeasService {
  private readonly logger = new Logger(GeneratedIdeasService.name);

  constructor(
    private readonly workspaces: WorkspacesService,
    private readonly llm: LlmService,
    private readonly skillRunner: SkillRunnerService,
  ) {}

  async generate(
    req: GenerateIdeasRequestContract,
  ): Promise<GenerateIdeasResponseContract> {
    this.validateRequest(req);
    const requestedPillarIds = dedupe(req.pillarIds);

    const allPillars = await this.loadPillars(req.workspaceId);
    const knownIds = new Set(allPillars.map((p) => p.id));
    for (const pid of requestedPillarIds) {
      if (!knownIds.has(pid)) {
        throw new BadRequestException(
          `pillarId ${pid} is not on workspace ${req.workspaceId}`,
        );
      }
    }
    const requestedPillars = allPillars.filter((p) =>
      requestedPillarIds.includes(p.id),
    );

    if (!this.llm.isConfigured()) {
      this.logger.debug(
        `LLM not configured — returning stub ideas for workspace ${req.workspaceId}`,
      );
      return {
        ideas: buildStubIdeas(requestedPillarIds, () => this.newIdeaId()),
      };
    }

    const [brandVoice, brandPositioning, segments] = await Promise.all([
      this.loadBrandVoice(req.workspaceId),
      this.loadBrandPositioning(req.workspaceId),
      this.loadSegments(req.workspaceId),
    ]);

    const context = this.buildContext(
      requestedPillars,
      brandVoice,
      brandPositioning,
      segments,
    );
    const ideas = await this.runSkillWithRetry(context, requestedPillarIds);
    return { ideas };
  }

  // ── validation ───────────────────────────────────────────────────────

  private validateRequest(req: GenerateIdeasRequestContract): void {
    if (!req || typeof req !== 'object') {
      throw new BadRequestException('Request body is required.');
    }
    if (!req.workspaceId || typeof req.workspaceId !== 'string') {
      throw new BadRequestException('workspaceId is required.');
    }
    if (!Array.isArray(req.pillarIds) || req.pillarIds.length === 0) {
      throw new BadRequestException('pillarIds must be a non-empty array.');
    }
    for (const pid of req.pillarIds) {
      if (typeof pid !== 'string' || pid.trim().length === 0) {
        throw new BadRequestException('pillarIds must contain non-empty strings.');
      }
    }
  }

  // ── context loaders (lifted from idea-concept-options.service) ───────

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
    requestedPillars: readonly PillarLite[],
    brandVoice: Awaited<ReturnType<GeneratedIdeasService['loadBrandVoice']>>,
    brandPositioning: Awaited<ReturnType<GeneratedIdeasService['loadBrandPositioning']>>,
    segments: readonly SegmentLite[],
  ): Record<string, unknown> {
    return {
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
      pillars: requestedPillars.map((p) => removeEmpty({ ...p })),
      segments: segments.map((s) => removeEmpty({ ...s })),
      count: GENERATE_IDEAS_COUNT,
    };
  }

  // ── LLM call + validation ────────────────────────────────────────────

  private async runSkillWithRetry(
    context: Record<string, unknown>,
    requestedPillarIds: readonly string[],
  ): Promise<GeneratedIdeaContract[]> {
    const inputSchema = this.toolInputSchema(requestedPillarIds);

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const result = await this.skillRunner.run({
          skillId: SKILL_ID,
          conversationHistory: [{ role: 'user', content: JSON.stringify(context) }],
          temperature: 0.9,
          tool: {
            name: TOOL_NAME,
            description: `Emit exactly ${GENERATE_IDEAS_COUNT} generated-idea objects.`,
            inputSchema,
          },
        });
        return this.parseAndValidate(result.parsed, requestedPillarIds);
      } catch (err) {
        if (attempt === 2) {
          this.logger.warn(`generated-ideas skill failed twice: ${String(err)}`);
          throw new BadGatewayException(
            'AI generation failed. Please try again in a moment.',
          );
        }
        this.logger.debug(`generated-ideas attempt ${attempt} failed, retrying`);
      }
    }
    throw new BadGatewayException('AI generation failed.');
  }

  private parseAndValidate(
    parsed: Record<string, unknown> | null,
    requestedPillarIds: readonly string[],
  ): GeneratedIdeaContract[] {
    if (!parsed || !Array.isArray(parsed['ideas'])) {
      throw new Error('skill output missing ideas array');
    }
    const raw = parsed['ideas'] as unknown[];
    if (raw.length !== GENERATE_IDEAS_COUNT) {
      throw new Error(
        `skill returned ${raw.length} ideas, want ${GENERATE_IDEAS_COUNT}`,
      );
    }
    const known = new Set(requestedPillarIds);
    const shaped = raw.map((entry, index) =>
      this.shapeIdea(entry, index, known),
    );
    // Server-side round-robin: discard the model's pillarId choice and
    // re-assign deterministically. The model owns title+rationale; the
    // server owns distribution.
    return shaped.map((idea, i) => ({
      ...idea,
      pillarId: requestedPillarIds[i % requestedPillarIds.length],
    }));
  }

  private shapeIdea(
    entry: unknown,
    index: number,
    requestedPillarIds: ReadonlySet<string>,
  ): GeneratedIdeaContract {
    if (!entry || typeof entry !== 'object') {
      throw new Error(`idea ${index} is not an object`);
    }
    const e = entry as Record<string, unknown>;

    const title = readNonEmptyString(e, 'title', index, TITLE_MAX);
    const rationale = readNonEmptyString(e, 'rationale', index, RATIONALE_MAX);

    const pillarIdRaw = e['pillarId'];
    if (typeof pillarIdRaw !== 'string' || pillarIdRaw.trim().length === 0) {
      throw new Error(`idea ${index} pillarId must be a non-empty string`);
    }
    if (!requestedPillarIds.has(pillarIdRaw)) {
      throw new Error(`idea ${index} references unknown pillarId: ${pillarIdRaw}`);
    }

    return {
      id: this.newIdeaId(),
      title: title.trim(),
      rationale: rationale.trim(),
      pillarId: pillarIdRaw,
    };
  }

  private toolInputSchema(
    requestedPillarIds: readonly string[],
  ): Record<string, unknown> {
    return {
      type: 'object',
      properties: {
        ideas: {
          type: 'array',
          minItems: GENERATE_IDEAS_COUNT,
          maxItems: GENERATE_IDEAS_COUNT,
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', minLength: 1 },
              title: { type: 'string', minLength: 1, maxLength: TITLE_MAX },
              rationale: { type: 'string', minLength: 1, maxLength: RATIONALE_MAX },
              pillarId: { type: 'string', enum: [...requestedPillarIds] },
            },
            required: ['id', 'title', 'rationale', 'pillarId'],
          },
        },
      },
      required: ['ideas'],
    };
  }

  private newIdeaId(): string {
    return `gi-${randomUUID()}`;
  }
}

function readNonEmptyString(
  obj: Record<string, unknown>,
  key: string,
  index: number,
  maxLen: number,
): string {
  const v = obj[key];
  if (typeof v !== 'string' || v.trim().length === 0) {
    throw new Error(`idea ${index} ${key} must be a non-empty string`);
  }
  if (v.length > maxLen) {
    throw new Error(
      `idea ${index} ${key} exceeds max length ${maxLen}: ${v.length} chars`,
    );
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

function dedupe(arr: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of arr) {
    if (!seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}
