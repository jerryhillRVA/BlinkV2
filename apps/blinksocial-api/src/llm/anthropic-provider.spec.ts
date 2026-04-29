import { AnthropicProvider } from './anthropic-provider';

/**
 * The provider is constructed against `process.env['ANTHROPIC_API_KEY']`. We
 * set a fake key, then swap the internal SDK client with a mock so we can
 * inspect the wire shape without making a real API call.
 *
 * The provider uses the streaming API (`messages.stream(...).finalMessage()`)
 * so the mock returns a stream-shaped object whose `finalMessage()` resolves
 * to the same payload the non-streaming call used to return.
 */
function buildProvider(stream: ReturnType<typeof vi.fn>) {
  process.env['ANTHROPIC_API_KEY'] = 'test-key';
  const provider = new AnthropicProvider();
  // private field swap — test-only access
  (provider as unknown as { client: { messages: { stream: typeof stream } } }).client = {
    messages: { stream },
  };
  return provider;
}

describe('AnthropicProvider', () => {
  let stream: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    stream = vi.fn().mockReturnValue({
      finalMessage: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'hi' }],
        stop_reason: 'end_turn',
        usage: { input_tokens: 5, output_tokens: 2 },
      }),
    });
  });

  it('forwards string-content messages to the SDK unchanged', async () => {
    const provider = buildProvider(stream);
    await provider.complete({
      messages: [
        { role: 'system', content: 'sys prompt' },
        { role: 'user', content: 'hello' },
      ],
      maxTokens: 256,
    });
    expect(stream).toHaveBeenCalledTimes(1);
    const args = stream.mock.calls[0][0];
    expect(args.system).toBe('sys prompt');
    expect(args.messages).toEqual([{ role: 'user', content: 'hello' }]);
  });

  it('translates content-block arrays into Anthropic image/document/text params', async () => {
    const provider = buildProvider(stream);
    await provider.complete({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'see this' },
            { type: 'image', mediaType: 'image/png', base64Data: 'AAAA' },
            { type: 'document', mediaType: 'application/pdf', base64Data: 'BBBB' },
          ],
        },
      ],
    });
    const args = stream.mock.calls[0][0];
    const blocks = args.messages[0].content;
    expect(Array.isArray(blocks)).toBe(true);
    expect(blocks[0]).toEqual({ type: 'text', text: 'see this' });
    expect(blocks[1]).toMatchObject({
      type: 'image',
      source: { type: 'base64', media_type: 'image/png', data: 'AAAA' },
    });
    expect(blocks[2]).toMatchObject({
      type: 'document',
      source: { type: 'base64', media_type: 'application/pdf', data: 'BBBB' },
    });
  });

  it('extracts the SDK response back into our LlmCompletionResult shape', async () => {
    const provider = buildProvider(stream);
    const result = await provider.complete({ messages: [{ role: 'user', content: 'hi' }] });
    expect(result.content).toBe('hi');
    expect(result.stopReason).toBe('end_turn');
    expect(result.usage).toEqual({ inputTokens: 5, outputTokens: 2 });
  });
});
