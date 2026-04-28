import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import type {
  GeneratePositioningStatementRequestContract,
  GeneratePositioningStatementResponseContract,
  SuggestBusinessObjectivesRequestContract,
  SuggestBusinessObjectivesResponseContract,
  BusinessObjectiveContract,
  ObjectiveCategory,
} from '@blinksocial/contracts';
import { SkillRunnerService } from '../skills/skill-runner.service';

const POSITIONING_SKILL_ID = 'positioning-statement';
const OBJECTIVES_SKILL_ID = 'business-objectives-suggest';

const VALID_CATEGORIES: ReadonlySet<ObjectiveCategory> = new Set<ObjectiveCategory>([
  'growth',
  'revenue',
  'awareness',
  'trust',
  'community',
  'engagement',
]);

@Injectable()
export class WizardAiService {
  private readonly logger = new Logger(WizardAiService.name);

  constructor(private readonly skillRunner: SkillRunnerService) {}

  async generatePositioningStatement(
    req: GeneratePositioningStatementRequestContract,
  ): Promise<GeneratePositioningStatementResponseContract> {
    const hasAnyPositioningField = [
      req.targetCustomer,
      req.problemSolved,
      req.solution,
      req.differentiator,
    ].some((v) => typeof v === 'string' && v.trim().length > 0);

    if (!hasAnyPositioningField) {
      throw new BadRequestException(
        'At least one positioning field (targetCustomer, problemSolved, solution, differentiator) must be provided.',
      );
    }

    const result = await this.skillRunner.run({
      skillId: POSITIONING_SKILL_ID,
      conversationHistory: [{ role: 'user', content: JSON.stringify(req) }],
      temperature: 0.5,
    });

    const parsed = result.parsed;
    const raw =
      parsed && typeof parsed['positioningStatement'] === 'string'
        ? (parsed['positioningStatement'] as string)
        : '';
    const trimmed = raw.trim();

    if (!trimmed) {
      this.logger.warn(
        `Positioning skill returned malformed/empty response. content=${result.content.slice(0, 200)}`,
      );
      throw new BadRequestException(
        'Failed to generate a positioning statement. Please try again.',
      );
    }

    return { positioningStatement: trimmed };
  }

  async suggestBusinessObjectives(
    req: SuggestBusinessObjectivesRequestContract,
  ): Promise<SuggestBusinessObjectivesResponseContract> {
    const hasContext =
      (typeof req.workspaceName === 'string' && req.workspaceName.trim().length > 0) ||
      (typeof req.purpose === 'string' && req.purpose.trim().length > 0) ||
      (typeof req.mission === 'string' && req.mission.trim().length > 0) ||
      (Array.isArray(req.audienceSegments) &&
        req.audienceSegments.some((s) => s?.name?.trim?.()));

    if (!hasContext) {
      throw new BadRequestException(
        'At least one of workspaceName, purpose, mission, or a named audience segment is required.',
      );
    }

    const result = await this.skillRunner.run({
      skillId: OBJECTIVES_SKILL_ID,
      conversationHistory: [{ role: 'user', content: JSON.stringify(req) }],
      temperature: 0.6,
    });

    const parsed = result.parsed;
    const rawSuggestions = parsed && Array.isArray(parsed['suggestions'])
      ? (parsed['suggestions'] as unknown[])
      : null;

    if (!rawSuggestions) {
      this.logger.warn(
        `Objectives skill returned malformed response. content=${result.content.slice(0, 200)}`,
      );
      throw new BadRequestException(
        'Failed to generate objective suggestions. Please try again.',
      );
    }

    const suggestions: BusinessObjectiveContract[] = rawSuggestions.map((entry, index) =>
      this.validateAndShapeSuggestion(entry, index),
    );

    return { suggestions };
  }

  private validateAndShapeSuggestion(
    entry: unknown,
    index: number,
  ): BusinessObjectiveContract {
    if (!entry || typeof entry !== 'object') {
      throw new BadRequestException(
        `Suggestion at index ${index} is not an object.`,
      );
    }
    const e = entry as Record<string, unknown>;

    const statement = typeof e['statement'] === 'string' ? e['statement'].trim() : '';
    if (!statement) {
      throw new BadRequestException(
        `Suggestion at index ${index} is missing a non-empty statement.`,
      );
    }

    const category = e['category'];
    if (typeof category !== 'string' || !VALID_CATEGORIES.has(category as ObjectiveCategory)) {
      throw new BadRequestException(
        `Suggestion at index ${index} has invalid category: ${String(category)}`,
      );
    }

    const targetRaw = e['target'];
    let target = 0;
    if (typeof targetRaw === 'number' && Number.isFinite(targetRaw)) {
      target = targetRaw;
    } else if (typeof targetRaw === 'string' && targetRaw.trim() !== '') {
      const parsedNum = Number(targetRaw);
      target = Number.isFinite(parsedNum) ? parsedNum : 0;
    }

    const unit = typeof e['unit'] === 'string' ? e['unit'] : '';
    const timeframe = typeof e['timeframe'] === 'string' ? e['timeframe'] : '';

    return {
      id: `ai-${index}`,
      category: category as ObjectiveCategory,
      statement,
      target,
      unit,
      timeframe,
      status: 'on-track',
    };
  }
}
