import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from '../llm/llm.service';
import { SkillLoaderService, type SkillDefinition } from './skill-loader.service';
import type { LlmMessage, LlmTool } from '../llm/llm-provider.interface';

/**
 * Forces the LLM to call a single tool whose `input_schema` IS the contract
 * the caller wants honored. The model's `input` to that tool call is
 * surfaced as `result.parsed`, bypassing text-extraction entirely.
 */
export interface SkillRunForcedTool extends LlmTool {
  /** Default true — set to false to allow the model to decline the tool. */
  force?: boolean;
}

export interface SkillRunContext {
  skillId: string;
  conversationHistory?: LlmMessage[];
  additionalContext?: string;
  maxTokens?: number;
  temperature?: number;
  tool?: SkillRunForcedTool;
}

export interface SkillRunResult {
  content: string;
  parsed: Record<string, unknown> | null;
  usage: { inputTokens: number; outputTokens: number };
  /** Name of the tool the model called, when tool-use was used. */
  toolName?: string;
  /**
   * Why the model stopped — `'tool_use'` when forced tool-choice succeeded,
   * `'end_turn'` for free-form replies, `'max_tokens'` when the cap fired.
   * Surfaced so callers' parse-miss WARN logs can record it (#94).
   */
  stopReason: 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use';
}

@Injectable()
export class SkillRunnerService {
  private readonly logger = new Logger(SkillRunnerService.name);

  constructor(
    private readonly llmService: LlmService,
    private readonly skillLoader: SkillLoaderService,
  ) {}

  async run(context: SkillRunContext): Promise<SkillRunResult> {
    const skill = this.skillLoader.loadSkill(context.skillId);
    const messages = this.assembleMessages(skill, context);

    const tool = context.tool;
    const force = tool ? tool.force !== false : false;

    const result = await this.llmService.complete({
      messages,
      // Pass through the caller's `maxTokens` if they specified one; otherwise
      // leave undefined so the provider applies its model-aware ceiling. We
      // deliberately do NOT cap output here — truncating an artifact mid-
      // generation makes downstream validation flaky and forces the LLM to
      // omit content for verbose brands. Token usage is tracked separately
      // via the returned `usage` payload.
      ...(context.maxTokens !== undefined ? { maxTokens: context.maxTokens } : {}),
      temperature: context.temperature ?? 0.7,
      ...(tool
        ? {
            tools: [
              {
                name: tool.name,
                ...(tool.description ? { description: tool.description } : {}),
                inputSchema: tool.inputSchema,
              },
            ],
            toolChoice: force ? { type: 'tool' as const, name: tool.name } : 'auto',
          }
        : {}),
    });

    // When tool-use is in play, the model's `input` IS the parsed object —
    // no text-extraction heuristic, no markdown-fence fallback, guaranteed
    // to validate against `inputSchema`. We still surface `content` for
    // diagnostics if the model emitted any prose alongside the tool call.
    if (tool && result.toolUse) {
      return {
        content: result.content,
        parsed: result.toolUse.input,
        usage: result.usage,
        toolName: result.toolUse.name,
        stopReason: result.stopReason,
      };
    }

    if (tool && force) {
      // Forced a tool but the provider returned no tool_use block. This
      // shouldn't happen under Anthropic's tool_choice contract; surface
      // explicitly rather than silently falling back to text-parse so the
      // caller's structured-422 path can react.
      this.logger.warn(
        `Skill "${context.skillId}" forced tool "${tool.name}" but no tool_use block was returned (stopReason=${result.stopReason}).`,
      );
    }

    const parsed = this.tryParseJson(result.content);

    return {
      content: result.content,
      parsed,
      usage: result.usage,
      stopReason: result.stopReason,
    };
  }

  private assembleMessages(
    skill: SkillDefinition,
    context: SkillRunContext,
  ): LlmMessage[] {
    const messages: LlmMessage[] = [];

    // Build system prompt from skill definition + templates
    let systemPrompt = skill.systemPrompt;

    // Append templates as context
    for (const [name, content] of Object.entries(skill.templates)) {
      if (name === 'output_schema') {
        systemPrompt += `\n\n## Output Schema\n\n\`\`\`json\n${content}\n\`\`\``;
      } else {
        systemPrompt += `\n\n## ${this.formatTemplateName(name)}\n\n${content}`;
      }
    }

    // Append additional context if provided
    if (context.additionalContext) {
      systemPrompt += `\n\n## Current State\n\n${context.additionalContext}`;
    }

    messages.push({ role: 'system', content: systemPrompt });

    // Add conversation history for multi-turn skills
    if (context.conversationHistory) {
      messages.push(
        ...context.conversationHistory.filter((m) => m.role !== 'system'),
      );
    }

    return messages;
  }

  private formatTemplateName(name: string): string {
    return name
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private tryParseJson(content: string): Record<string, unknown> | null {
    // Try to extract JSON from the response — it may be wrapped in markdown code blocks
    const jsonBlockMatch = content.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
    const jsonStr = jsonBlockMatch ? jsonBlockMatch[1] : content;

    try {
      const parsed = JSON.parse(jsonStr.trim());
      return typeof parsed === 'object' && parsed !== null ? parsed : null;
    } catch {
      return null;
    }
  }
}
