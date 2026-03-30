import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from '../llm/llm.service';
import { SkillLoaderService, type SkillDefinition } from './skill-loader.service';
import type { LlmMessage } from '../llm/llm-provider.interface';

export interface SkillRunContext {
  skillId: string;
  conversationHistory?: LlmMessage[];
  additionalContext?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface SkillRunResult {
  content: string;
  parsed: Record<string, unknown> | null;
  usage: { inputTokens: number; outputTokens: number };
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

    const result = await this.llmService.complete({
      messages,
      maxTokens: context.maxTokens ?? 4096,
      temperature: context.temperature ?? 0.7,
    });

    const parsed = this.tryParseJson(result.content);

    return {
      content: result.content,
      parsed,
      usage: result.usage,
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
