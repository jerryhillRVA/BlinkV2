import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { SkillRunnerService } from './skill-runner.service';
import { SkillLoaderService, type SkillDefinition } from './skill-loader.service';
import { LlmService } from '../llm/llm.service';
import type {
  LlmCompletionOptions,
  LlmCompletionResult,
} from '../llm/llm-provider.interface';

const STUB_SKILL: SkillDefinition = {
  id: 'test-skill',
  name: 'Test Skill',
  description: '',
  type: 'single-turn',
  systemPrompt: 'You are a test assistant.',
  templates: {},
  prompts: {},
};

async function buildRunner(
  llmComplete: (opts: LlmCompletionOptions) => Promise<LlmCompletionResult>,
) {
  const llmService = { complete: vi.fn(llmComplete) } as unknown as LlmService;
  const moduleRef = await Test.createTestingModule({
    providers: [
      SkillRunnerService,
      { provide: LlmService, useValue: llmService },
      {
        provide: SkillLoaderService,
        useValue: { loadSkill: () => STUB_SKILL },
      },
    ],
  }).compile();
  return {
    runner: moduleRef.get(SkillRunnerService),
    llmService,
  };
}

describe('SkillRunnerService — tool-use plumbing (#94, AC-C)', () => {
  afterEach(() => {
    // Restore any Logger spies set by individual tests so call history
    // does not leak between test cases.
    vi.restoreAllMocks();
  });

  it('forwards `tool` as `tools[]` + forced `toolChoice` and unwraps `result.toolUse.input` into `parsed`', async () => {
    const { runner, llmService } = await buildRunner(async () => ({
      content: '',
      stopReason: 'tool_use',
      usage: { inputTokens: 10, outputTokens: 20 },
      toolUse: {
        name: 'submit_blueprint',
        input: { strategicSummary: 'all good' },
      },
    }));

    const result = await runner.run({
      skillId: 'test-skill',
      conversationHistory: [{ role: 'user', content: 'go' }],
      tool: {
        name: 'submit_blueprint',
        description: 'Submit the Blueprint.',
        inputSchema: { type: 'object', required: ['strategicSummary'] },
      },
    });

    // Forced tool-choice (default `force=true`) forwarded to the provider.
    const opts = (llmService.complete as unknown as { mock: { calls: [LlmCompletionOptions][] } })
      .mock.calls.at(-1)?.[0] as LlmCompletionOptions;
    expect(opts.tools).toEqual([
      {
        name: 'submit_blueprint',
        description: 'Submit the Blueprint.',
        inputSchema: { type: 'object', required: ['strategicSummary'] },
      },
    ]);
    expect(opts.toolChoice).toEqual({ type: 'tool', name: 'submit_blueprint' });

    // Tool input lands in `parsed`, bypassing tryParseJson.
    expect(result.parsed).toEqual({ strategicSummary: 'all good' });
    expect(result.toolName).toBe('submit_blueprint');
    expect(result.stopReason).toBe('tool_use');
  });

  it('passes `toolChoice: "auto"` when `tool.force === false`', async () => {
    const { runner, llmService } = await buildRunner(async () => ({
      content: '',
      stopReason: 'tool_use',
      usage: { inputTokens: 0, outputTokens: 0 },
      toolUse: {
        name: 'submit_agent_turn',
        input: { agentMessage: 'hi' },
      },
    }));

    await runner.run({
      skillId: 'test-skill',
      conversationHistory: [{ role: 'user', content: 'go' }],
      tool: {
        name: 'submit_agent_turn',
        inputSchema: { type: 'object' },
        force: false,
      },
    });

    const opts = (llmService.complete as unknown as { mock: { calls: [LlmCompletionOptions][] } })
      .mock.calls.at(-1)?.[0] as LlmCompletionOptions;
    expect(opts.toolChoice).toBe('auto');
  });

  it('emits a defensive WARN when forced tool-use produces no `tool_use` block (#94, AC-C)', async () => {
    const { runner } = await buildRunner(async () => ({
      content: 'free-form prose without a tool_use block',
      stopReason: 'end_turn',
      usage: { inputTokens: 0, outputTokens: 0 },
      // No `toolUse` field — the provider declined the forced tool. Anthropic's
      // `tool_choice: { type: 'tool', name }` contract should make this
      // impossible, but guard anyway because failure is silent otherwise.
    }));

    const warnSpy = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);

    const result = await runner.run({
      skillId: 'test-skill',
      conversationHistory: [{ role: 'user', content: 'go' }],
      tool: {
        name: 'submit_blueprint',
        inputSchema: { type: 'object' },
      },
    });

    const warnLines = warnSpy.mock.calls.map((c) => String(c[0]));
    expect(
      warnLines.some(
        (l) =>
          l.includes('forced tool "submit_blueprint"') &&
          l.includes('no tool_use block'),
      ),
    ).toBe(true);

    // Falls through to text-parse fallback — `parsed` is null because the
    // free-form prose isn't valid JSON.
    expect(result.parsed).toBeNull();
    expect(result.stopReason).toBe('end_turn');
  });

  it('does NOT emit the defensive forced-tool WARN when no tool was passed (text-parse path)', async () => {
    const { runner } = await buildRunner(async () => ({
      content: '{"agentMessage":"all good"}',
      stopReason: 'end_turn',
      usage: { inputTokens: 0, outputTokens: 0 },
    }));

    const warnSpy = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);

    const result = await runner.run({
      skillId: 'test-skill',
      conversationHistory: [{ role: 'user', content: 'go' }],
      // no `tool` — legacy text-parse path
    });

    // The forced-tool WARN must not appear. Other WARNs (e.g. from
    // unrelated services constructed in the test module) may exist; we
    // only police the one this test cares about.
    const warnLines = warnSpy.mock.calls.map((c) => String(c[0]));
    expect(warnLines.some((l) => l.includes('forced tool'))).toBe(false);
    expect(result.parsed).toEqual({ agentMessage: 'all good' });
  });
});
