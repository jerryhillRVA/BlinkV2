import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import {
  LlmService,
  isVerboseLoggingEnabled,
  redactSecrets,
  truncate,
} from './llm.service';
import {
  LLM_PROVIDER,
  type LlmProvider,
  type LlmCompletionOptions,
  type LlmCompletionResult,
} from './llm-provider.interface';

const baseUsage = { inputTokens: 100, outputTokens: 200 };

function makeProvider(
  result: Partial<LlmCompletionResult> = {},
): LlmProvider {
  return {
    providerId: 'anthropic',
    isConfigured: () => true,
    complete: vi.fn(async () => ({
      content: 'hi',
      stopReason: 'end_turn' as const,
      usage: { ...baseUsage },
      ...result,
    })),
  };
}

async function buildService(provider: LlmProvider) {
  const moduleRef = await Test.createTestingModule({
    providers: [LlmService, { provide: LLM_PROVIDER, useValue: provider }],
  }).compile();
  return moduleRef.get(LlmService);
}

describe('LlmService — verbose logging (#94)', () => {
  const originalFlag = process.env['LLM_VERBOSE_LOGGING'];

  afterEach(() => {
    if (originalFlag === undefined) {
      delete process.env['LLM_VERBOSE_LOGGING'];
    } else {
      process.env['LLM_VERBOSE_LOGGING'] = originalFlag;
    }
    vi.restoreAllMocks();
  });

  describe('isVerboseLoggingEnabled', () => {
    it('defaults to true when env var is unset', () => {
      delete process.env['LLM_VERBOSE_LOGGING'];
      expect(isVerboseLoggingEnabled()).toBe(true);
    });

    it.each(['false', 'FALSE', '0', 'no', 'off', ''])(
      'returns false for falsy value "%s"',
      (val) => {
        process.env['LLM_VERBOSE_LOGGING'] = val;
        expect(isVerboseLoggingEnabled()).toBe(false);
      },
    );

    it.each(['true', 'TRUE', '1', 'yes', 'on'])(
      'returns true for truthy value "%s"',
      (val) => {
        process.env['LLM_VERBOSE_LOGGING'] = val;
        expect(isVerboseLoggingEnabled()).toBe(true);
      },
    );
  });

  describe('redactSecrets', () => {
    it('replaces sk-ant- prefixed keys with a placeholder', () => {
      const dirty = 'oops sk-ant-AbC_123-deadBEEF in prompt';
      expect(redactSecrets(dirty)).toBe('oops sk-ant-***REDACTED*** in prompt');
    });

    it('redacts ANTHROPIC_API_KEY=... assignments regardless of case', () => {
      expect(redactSecrets('ANTHROPIC_API_KEY=sk-leaked-abc')).toContain(
        '***REDACTED***',
      );
      expect(redactSecrets('anthropic_api_key: sk-leaked-abc')).toContain(
        '***REDACTED***',
      );
    });

    it('passes plain text through unchanged', () => {
      expect(redactSecrets('hello world')).toBe('hello world');
    });
  });

  describe('truncate', () => {
    it('returns the input unchanged when within the cap', () => {
      expect(truncate('short')).toBe('short');
    });

    it('caps at 4000 chars by default and appends a marker with the original length', () => {
      const big = 'x'.repeat(5000);
      const out = truncate(big);
      expect(out.startsWith('x'.repeat(4000))).toBe(true);
      expect(out).toContain('truncated');
      expect(out).toContain('5000 total chars');
    });
  });

  describe('summarizeRequest', () => {
    it('captures message metadata, head/tail snippets, and tool definitions', async () => {
      const svc = await buildService(makeProvider());
      const opts: LlmCompletionOptions = {
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          {
            role: 'user',
            content: 'a'.repeat(1000) + 'TAILMARK',
          },
          {
            role: 'assistant',
            content: [
              { type: 'text', text: 'hello' },
              {
                type: 'image',
                mediaType: 'image/png',
                base64Data: 'AAAA'.repeat(50),
              },
            ],
          },
        ],
        temperature: 0.5,
        maxTokens: 1024,
        tools: [
          {
            name: 'submit_blueprint',
            description: 'Submit the Blueprint document.',
            inputSchema: { type: 'object', required: ['strategicSummary'] },
          },
        ],
        toolChoice: { type: 'tool', name: 'submit_blueprint' },
      };
      const summary = svc.summarizeRequest(opts);

      expect(summary.messageCount).toBe(3);
      expect(summary.temperature).toBe(0.5);
      expect(summary.maxTokens).toBe(1024);
      expect(summary.toolChoice).toEqual({ type: 'tool', name: 'submit_blueprint' });

      const messages = summary.messages as Array<Record<string, unknown>>;
      expect(messages[0].role).toBe('system');
      expect(messages[0].contentLength).toBe('You are a helpful assistant.'.length);

      // Long user turn captured as head + tail snippets, not full string.
      expect(messages[1].role).toBe('user');
      expect(messages[1].contentLength).toBe(1008);
      expect(messages[1].tail).toContain('TAILMARK');

      // Multimodal turn — image block summarised by byteCount, never base64.
      const blocks = (messages[2] as { blocks: Array<Record<string, unknown>> }).blocks;
      const imgBlock = blocks.find((b) => b.type === 'image');
      expect(imgBlock).toBeDefined();
      expect(imgBlock?.base64Bytes).toBeGreaterThan(0);
      expect(JSON.stringify(imgBlock)).not.toContain('AAAA');

      const tools = summary.tools as Array<Record<string, unknown>>;
      expect(tools[0].name).toBe('submit_blueprint');
      expect((tools[0].inputSchema as string).length).toBeLessThanOrEqual(220);
    });
  });

  describe('summarizeResponse', () => {
    it('caps content + toolUse.input and surfaces stopReason + usage + elapsedMs', async () => {
      const svc = await buildService(makeProvider());
      const result: LlmCompletionResult = {
        content: 'x'.repeat(5000),
        stopReason: 'tool_use',
        usage: { inputTokens: 1000, outputTokens: 2000 },
        toolUse: {
          name: 'submit_blueprint',
          input: { strategicSummary: 'y'.repeat(5000) },
        },
      };
      const summary = svc.summarizeResponse(result, 4242);

      expect(summary.stopReason).toBe('tool_use');
      expect(summary.elapsedMs).toBe(4242);
      expect(summary.usage).toEqual({ inputTokens: 1000, outputTokens: 2000 });
      expect((summary.content as string).length).toBeLessThan(5000);
      expect((summary.content as string)).toContain('truncated');

      const tu = summary.toolUse as { name: string; input: string };
      expect(tu.name).toBe('submit_blueprint');
      expect(tu.input).toContain('truncated');
    });

    it('omits toolUse when the result has none', async () => {
      const svc = await buildService(makeProvider());
      const summary = svc.summarizeResponse(
        {
          content: 'plain reply',
          stopReason: 'end_turn',
          usage: { inputTokens: 1, outputTokens: 1 },
        },
        100,
      );
      expect(summary.toolUse).toBeUndefined();
    });
  });

  describe('complete', () => {
    it('emits the llm-request + llm-response debug lines when verbose=true', async () => {
      process.env['LLM_VERBOSE_LOGGING'] = 'true';
      const provider = makeProvider({
        content: 'reply',
        toolUse: { name: 'submit_blueprint', input: { strategicSummary: 'ok' } },
        stopReason: 'tool_use',
      });
      const svc = await buildService(provider);
      const debugSpy = vi
        .spyOn(Logger.prototype, 'debug')
        .mockImplementation(() => undefined);

      await svc.complete({
        messages: [{ role: 'user', content: 'hi' }],
      });

      const lines = debugSpy.mock.calls.map((c) => String(c[0]));
      expect(lines.some((l) => l.startsWith('LLM call via anthropic'))).toBe(true);
      expect(lines.some((l) => l.startsWith('llm-request '))).toBe(true);
      expect(lines.some((l) => l.startsWith('LLM response in'))).toBe(true);
      expect(lines.some((l) => l.startsWith('llm-response '))).toBe(true);
    });

    it('omits the structured request/response lines when verbose=false', async () => {
      process.env['LLM_VERBOSE_LOGGING'] = 'false';
      const provider = makeProvider();
      const svc = await buildService(provider);
      const debugSpy = vi
        .spyOn(Logger.prototype, 'debug')
        .mockImplementation(() => undefined);

      await svc.complete({
        messages: [{ role: 'user', content: 'hi' }],
      });

      const lines = debugSpy.mock.calls.map((c) => String(c[0]));
      expect(lines.some((l) => l.startsWith('LLM call via anthropic'))).toBe(true);
      expect(lines.some((l) => l.startsWith('LLM response in'))).toBe(true);
      // No structured payload lines when the flag is off.
      expect(lines.some((l) => l.startsWith('llm-request '))).toBe(false);
      expect(lines.some((l) => l.startsWith('llm-response '))).toBe(false);
    });

    it('always WARNs when stopReason=max_tokens regardless of the verbose flag', async () => {
      process.env['LLM_VERBOSE_LOGGING'] = 'false';
      const provider = makeProvider({
        stopReason: 'max_tokens',
        usage: { inputTokens: 10, outputTokens: 64000 },
      });
      const svc = await buildService(provider);
      const warnSpy = vi
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => undefined);

      await svc.complete({ messages: [{ role: 'user', content: 'hi' }] });

      const calls = warnSpy.mock.calls.map((c) => String(c[0]));
      expect(calls.some((l) => l.includes('llm-stop max_tokens'))).toBe(true);
    });

    it('redacts API-key-shaped strings even when they appear in user content', async () => {
      process.env['LLM_VERBOSE_LOGGING'] = 'true';
      const provider = makeProvider({ content: 'oops sk-ant-LEAKED-deadbeef' });
      const svc = await buildService(provider);
      const debugSpy = vi
        .spyOn(Logger.prototype, 'debug')
        .mockImplementation(() => undefined);

      await svc.complete({
        messages: [
          { role: 'user', content: 'see key sk-ant-FAKE-deadbeef in prompt' },
        ],
      });

      const allLogs = debugSpy.mock.calls.map((c) => String(c[0])).join('\n');
      expect(allLogs).not.toContain('sk-ant-FAKE-deadbeef');
      expect(allLogs).not.toContain('sk-ant-LEAKED-deadbeef');
      expect(allLogs).toContain('***REDACTED***');
    });
  });
});
