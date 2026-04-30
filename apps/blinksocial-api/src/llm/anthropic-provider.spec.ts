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

  describe('tool-use forced output', () => {
    it('forwards tools and tool_choice to the SDK in Anthropic-native shape', async () => {
      const provider = buildProvider(stream);
      await provider.complete({
        messages: [{ role: 'user', content: 'go' }],
        tools: [
          {
            name: 'submit_blueprint',
            description: 'submit it',
            inputSchema: { type: 'object', required: ['x'], properties: { x: { type: 'string' } } },
          },
        ],
        toolChoice: { type: 'tool', name: 'submit_blueprint' },
      });
      const args = stream.mock.calls[0][0];
      expect(args.tools).toEqual([
        {
          name: 'submit_blueprint',
          description: 'submit it',
          input_schema: { type: 'object', required: ['x'], properties: { x: { type: 'string' } } },
        },
      ]);
      expect(args.tool_choice).toEqual({ type: 'tool', name: 'submit_blueprint' });
    });

    it('omits tool_choice when only tools are provided', async () => {
      const provider = buildProvider(stream);
      await provider.complete({
        messages: [{ role: 'user', content: 'go' }],
        tools: [{ name: 't', inputSchema: { type: 'object' } }],
      });
      const args = stream.mock.calls[0][0];
      expect(args.tools).toBeDefined();
      expect(args.tool_choice).toBeUndefined();
    });

    it('does NOT add tool fields when no tools are provided', async () => {
      const provider = buildProvider(stream);
      await provider.complete({ messages: [{ role: 'user', content: 'hi' }] });
      const args = stream.mock.calls[0][0];
      expect(args.tools).toBeUndefined();
      expect(args.tool_choice).toBeUndefined();
    });

    it('surfaces tool_use blocks as a structured `toolUse` field', async () => {
      const toolStream = vi.fn().mockReturnValue({
        finalMessage: vi.fn().mockResolvedValue({
          content: [
            { type: 'text', text: '' },
            { type: 'tool_use', id: 't1', name: 'submit_blueprint', input: { clientName: 'Acme' } },
          ],
          stop_reason: 'tool_use',
          usage: { input_tokens: 10, output_tokens: 4 },
        }),
      });
      const provider = buildProvider(toolStream);
      const result = await provider.complete({
        messages: [{ role: 'user', content: 'go' }],
        tools: [{ name: 'submit_blueprint', inputSchema: { type: 'object' } }],
        toolChoice: { type: 'tool', name: 'submit_blueprint' },
      });
      expect(result.stopReason).toBe('tool_use');
      expect(result.toolUse).toEqual({
        name: 'submit_blueprint',
        input: { clientName: 'Acme' },
      });
    });

    it('maps the four LlmToolChoice variants to Anthropic shape', async () => {
      for (const [choice, expected] of [
        ['auto', { type: 'auto' }],
        ['any', { type: 'any' }],
        ['none', { type: 'none' }],
        [{ type: 'tool', name: 'foo' }, { type: 'tool', name: 'foo' }],
      ] as const) {
        const s = vi.fn().mockReturnValue({
          finalMessage: vi.fn().mockResolvedValue({
            content: [{ type: 'text', text: '' }],
            stop_reason: 'end_turn',
            usage: { input_tokens: 1, output_tokens: 1 },
          }),
        });
        const provider = buildProvider(s);
        await provider.complete({
          messages: [{ role: 'user', content: 'go' }],
          tools: [{ name: 'foo', inputSchema: { type: 'object' } }],
          toolChoice: choice,
        });
        expect(s.mock.calls[0][0].tool_choice).toEqual(expected);
      }
    });
  });
});
