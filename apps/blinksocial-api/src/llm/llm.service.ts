import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  LLM_PROVIDER,
  type LlmProvider,
  type LlmCompletionOptions,
  type LlmCompletionResult,
  type LlmMessage,
  type LlmContentBlock,
  type LlmTool,
  type LlmToolChoice,
} from './llm-provider.interface';

/**
 * Per-field cap on every value embedded in a verbose log line. A single
 * over-verbose Blueprint shouldn't blow up the log file. Applied to
 * `content`, `toolUse.input`, `inputSchema`, system prompts, and the
 * head/tail snippets of long conversation turns.
 */
const VERBOSE_FIELD_CHAR_CAP = 4000;

/**
 * Length of the head/tail snippets captured from each conversation turn
 * when verbose logging is on. The snippet pair plus the length give enough
 * context to reconstruct the LLM's view without dumping entire turns.
 */
const TURN_SNIPPET_CHARS = 200;

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  constructor(@Inject(LLM_PROVIDER) private readonly provider: LlmProvider) {}

  get providerId(): string {
    return this.provider.providerId;
  }

  isConfigured(): boolean {
    return this.provider.isConfigured();
  }

  async complete(options: LlmCompletionOptions): Promise<LlmCompletionResult> {
    const messageCount = options.messages.length;
    const verbose = isVerboseLoggingEnabled();

    // Always log the terse one-line summary so existing log-grep workflows
    // keep working. Verbose mode adds a structured request payload below.
    this.logger.debug(
      `LLM call via ${this.provider.providerId}: ${messageCount} messages`,
    );

    if (verbose) {
      try {
        this.logger.debug(
          `llm-request ${JSON.stringify(this.summarizeRequest(options))}`,
        );
      } catch (err) {
        // Defensive — never let log serialization break the actual call.
        this.logger.warn(
          `llm-verbose-logging summarizeRequest failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    const startTime = Date.now();
    try {
      const result = await this.provider.complete(options);
      const elapsed = Date.now() - startTime;
      this.logger.debug(
        `LLM response in ${elapsed}ms — ${result.usage.inputTokens} in / ${result.usage.outputTokens} out`,
      );

      if (verbose) {
        try {
          this.logger.debug(
            `llm-response ${JSON.stringify(this.summarizeResponse(result, elapsed))}`,
          );
        } catch (err) {
          this.logger.warn(
            `llm-verbose-logging summarizeResponse failed: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }

      // Always WARN on max_tokens — interesting regardless of the verbose flag.
      if (result.stopReason === 'max_tokens') {
        this.logger.warn(
          `llm-stop max_tokens — ${result.usage.outputTokens} out tokens consumed; ` +
            `consider raising maxTokens or chunking the request.`,
        );
      }

      return result;
    } catch (error) {
      const elapsed = Date.now() - startTime;
      this.logger.error(
        `LLM call failed after ${elapsed}ms: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Verbose-mode payload summarizers (kept on the service for unit testability)
  // ---------------------------------------------------------------------------

  /**
   * Build a redacted, length-capped representation of an LLM request suitable
   * for a single log line. Content blocks (image base64) are dropped to a
   * placeholder; long fields are truncated to {@link VERBOSE_FIELD_CHAR_CAP}.
   * Anthropic API key is never read here, but a defensive scrub still strips
   * any key-shaped substring that may have been interpolated into a prompt.
   */
  summarizeRequest(options: LlmCompletionOptions): Record<string, unknown> {
    return {
      model: process.env['ANTHROPIC_MODEL'] || 'claude-sonnet-4-6',
      messageCount: options.messages.length,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      stopSequences: options.stopSequences,
      toolChoice: options.toolChoice
        ? this.summarizeToolChoice(options.toolChoice)
        : undefined,
      tools: options.tools?.map((t) => this.summarizeTool(t)),
      messages: options.messages.map((m) => this.summarizeMessage(m)),
    };
  }

  /**
   * Build a redacted, length-capped representation of an LLM response. Both
   * the free-form `content` text and any tool-use `input` are surfaced so
   * `/generate` parse-miss WARNs can correlate against the actual model
   * output. JSON-stringified bodies are capped at
   * {@link VERBOSE_FIELD_CHAR_CAP} per field (#94).
   */
  summarizeResponse(
    result: LlmCompletionResult,
    elapsedMs: number,
  ): Record<string, unknown> {
    return {
      stopReason: result.stopReason,
      elapsedMs,
      usage: result.usage,
      content: truncate(redactSecrets(result.content)),
      toolUse: result.toolUse
        ? {
            name: result.toolUse.name,
            input: truncate(
              redactSecrets(safeJsonStringify(result.toolUse.input)),
            ),
          }
        : undefined,
    };
  }

  private summarizeMessage(msg: LlmMessage): Record<string, unknown> {
    if (typeof msg.content === 'string') {
      return {
        role: msg.role,
        contentLength: msg.content.length,
        head: redactSecrets(msg.content.slice(0, TURN_SNIPPET_CHARS)),
        tail:
          msg.content.length > TURN_SNIPPET_CHARS * 2
            ? redactSecrets(msg.content.slice(-TURN_SNIPPET_CHARS))
            : undefined,
      };
    }
    return {
      role: msg.role,
      blocks: msg.content.map((b) => this.summarizeBlock(b)),
    };
  }

  private summarizeBlock(block: LlmContentBlock): Record<string, unknown> {
    if (block.type === 'text') {
      return {
        type: 'text',
        contentLength: block.text.length,
        head: redactSecrets(block.text.slice(0, TURN_SNIPPET_CHARS)),
        tail:
          block.text.length > TURN_SNIPPET_CHARS * 2
            ? redactSecrets(block.text.slice(-TURN_SNIPPET_CHARS))
            : undefined,
      };
    }
    // image / document — never log base64 bytes.
    return {
      type: block.type,
      mediaType: block.mediaType,
      base64Bytes: block.base64Data.length,
    };
  }

  private summarizeTool(tool: LlmTool): Record<string, unknown> {
    return {
      name: tool.name,
      description: tool.description
        ? truncate(tool.description, TURN_SNIPPET_CHARS)
        : undefined,
      inputSchema: truncate(safeJsonStringify(tool.inputSchema), 200),
    };
  }

  private summarizeToolChoice(
    choice: LlmToolChoice,
  ): Record<string, unknown> | string {
    if (typeof choice === 'string') return choice;
    return { type: 'tool', name: choice.name };
  }
}

/**
 * Reads `LLM_VERBOSE_LOGGING` at call time (not module-load time) so tests
 * can flip the flag with `process.env['LLM_VERBOSE_LOGGING'] = 'false'` and
 * see the change immediately. Default `true` while reliability stabilizes
 * (#94, AC-B). Recognized truthy values: any non-empty string except
 * `'false'`, `'0'`, `'no'`, `'off'` (case-insensitive).
 */
export function isVerboseLoggingEnabled(): boolean {
  const raw = process.env['LLM_VERBOSE_LOGGING'];
  if (raw === undefined) return true;
  const lower = raw.trim().toLowerCase();
  return !(lower === 'false' || lower === '0' || lower === 'no' || lower === 'off' || lower === '');
}

/** Cap a string at the verbose-mode per-field char limit. Exported for tests. */
export function truncate(value: string, cap: number = VERBOSE_FIELD_CHAR_CAP): string {
  if (value.length <= cap) return value;
  return `${value.slice(0, cap)}…[truncated, ${value.length} total chars]`;
}

/**
 * Strip anything that looks like a secret before it goes to the log.
 * Anthropic API keys carry the `sk-ant-` prefix; redact aggressively even
 * though they should never appear in log payloads to begin with. Exported
 * for tests.
 */
export function redactSecrets(value: string): string {
  return value
    .replace(/sk-ant-[A-Za-z0-9_-]+/g, 'sk-ant-***REDACTED***')
    .replace(/(ANTHROPIC_API_KEY[\s=:]*)([^\s",}]+)/gi, '$1***REDACTED***');
}

function safeJsonStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return '[unserializable]';
  }
}
