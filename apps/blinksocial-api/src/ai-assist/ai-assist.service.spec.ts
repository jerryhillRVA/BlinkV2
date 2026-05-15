import { Test } from '@nestjs/testing';
import { BadGatewayException, BadRequestException, NotFoundException } from '@nestjs/common';
import type { ContentItemContract } from '@blinksocial/contracts';
import { AiAssistService } from './ai-assist.service';
import { ContentItemsService } from '../content-items/content-items.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { LlmService } from '../llm/llm.service';
import { SkillRunnerService } from '../skills/skill-runner.service';

function buildConcept(overrides: Partial<ContentItemContract> = {}): ContentItemContract {
  return {
    id: 'c-1',
    stage: 'concept',
    status: 'new',
    title: 'How morning routines work',
    description: '',
    pillarIds: ['p-1'],
    segmentIds: ['s-1'],
    objective: 'awareness',
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
    ...overrides,
  } as ContentItemContract;
}

function buildPost(overrides: Partial<ContentItemContract> = {}): ContentItemContract {
  return {
    id: 'p-1',
    stage: 'post',
    status: 'in-progress',
    title: 'Morning routine reel',
    description: '',
    pillarIds: [],
    segmentIds: [],
    parentConceptId: 'c-1',
    keyMessage: 'Make mornings work for you.',
    platform: 'instagram',
    contentType: 'reel',
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
    ...overrides,
  } as ContentItemContract;
}

describe('AiAssistService', () => {
  let service: AiAssistService;
  let contentItems: {
    getItem: ReturnType<typeof vi.fn>;
  };
  let workspaces: {
    getSettings: ReturnType<typeof vi.fn>;
    getNamespaceEntities: ReturnType<typeof vi.fn>;
  };
  let llm: { isConfigured: ReturnType<typeof vi.fn> };
  let skillRunner: { run: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    contentItems = { getItem: vi.fn() };
    workspaces = {
      getSettings: vi.fn().mockResolvedValue({}),
      getNamespaceEntities: vi.fn().mockResolvedValue([]),
    };
    llm = { isConfigured: vi.fn().mockReturnValue(false) };
    skillRunner = { run: vi.fn() };
    const moduleRef = await Test.createTestingModule({
      providers: [
        AiAssistService,
        { provide: ContentItemsService, useValue: contentItems },
        { provide: WorkspacesService, useValue: workspaces },
        { provide: LlmService, useValue: llm },
        { provide: SkillRunnerService, useValue: skillRunner },
      ],
    }).compile();
    service = moduleRef.get(AiAssistService);
  });

  // ─── validation ──────────────────────────────────────────────────

  it('rejects unsupported scope', async () => {
    await expect(
      service.assist({ scope: 'unknown' as never, workspaceId: 'w', refId: 'c-1', field: 'concept-description' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects empty workspaceId', async () => {
    await expect(
      service.assist({ scope: 'content-item', workspaceId: '', refId: 'c-1', field: 'concept-description' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects empty refId', async () => {
    await expect(
      service.assist({ scope: 'content-item', workspaceId: 'w', refId: '', field: 'concept-description' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects unknown field', async () => {
    await expect(
      service.assist({
        scope: 'content-item',
        workspaceId: 'w',
        refId: 'c-1',
        field: 'bogus' as never,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it.each([0, 11, 1.5, NaN])('rejects count out of range (%s)', async (count) => {
    await expect(
      service.assist({
        scope: 'content-item',
        workspaceId: 'w',
        refId: 'c-1',
        field: 'concept-description',
        count: count as number,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('accepts count = 1 and count = 10 as valid bounds', async () => {
    contentItems.getItem.mockResolvedValue(buildConcept());
    const lo = await service.assist({
      scope: 'content-item',
      workspaceId: 'w',
      refId: 'c-1',
      field: 'concept-description',
      count: 1,
    });
    expect(lo.values).toHaveLength(1);
    const hi = await service.assist({
      scope: 'content-item',
      workspaceId: 'w',
      refId: 'c-1',
      field: 'concept-description',
      count: 10,
    });
    expect(hi.values).toHaveLength(10);
  });

  // ─── stage-matching ──────────────────────────────────────────────

  it('rejects when concept-* field is asked of a post-stage item', async () => {
    contentItems.getItem.mockResolvedValue(buildPost());
    await expect(
      service.assist({
        scope: 'content-item',
        workspaceId: 'w',
        refId: 'p-1',
        field: 'concept-description',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when post-* field is asked of a concept-stage item', async () => {
    contentItems.getItem.mockResolvedValue(buildConcept());
    await expect(
      service.assist({
        scope: 'content-item',
        workspaceId: 'w',
        refId: 'c-1',
        field: 'post-key-message',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('propagates NotFoundException from the item loader', async () => {
    contentItems.getItem.mockRejectedValue(new NotFoundException('missing'));
    await expect(
      service.assist({
        scope: 'content-item',
        workspaceId: 'w',
        refId: 'c-missing',
        field: 'concept-description',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  // ─── stub mode (LLM not configured) ──────────────────────────────

  it('returns stub copy when LLM is not configured (default count = 1)', async () => {
    contentItems.getItem.mockResolvedValue(buildConcept({ objective: 'engagement' }));
    const res = await service.assist({
      scope: 'content-item',
      workspaceId: 'w',
      refId: 'c-1',
      field: 'concept-description',
    });
    expect(res.values).toHaveLength(1);
    expect(res.values[0]).toContain('How morning routines work');
    expect(skillRunner.run).not.toHaveBeenCalled();
  });

  it('returns 3 hook-bank stubs by default for post-script-hook', async () => {
    contentItems.getItem.mockResolvedValue(buildPost());
    const res = await service.assist({
      scope: 'content-item',
      workspaceId: 'w',
      refId: 'p-1',
      field: 'post-script-hook',
    });
    expect(res.values).toHaveLength(3);
    expect(new Set(res.values).size).toBe(3); // three distinct hooks
  });

  it('returns 5 hashtag stubs by default for post-hashtags', async () => {
    contentItems.getItem.mockResolvedValue(buildPost());
    const res = await service.assist({
      scope: 'content-item',
      workspaceId: 'w',
      refId: 'p-1',
      field: 'post-hashtags',
    });
    expect(res.values).toHaveLength(5);
    expect(res.values.every((v) => v.startsWith('#'))).toBe(true);
  });

  it('returns the same caption stub for count=1 captions', async () => {
    contentItems.getItem.mockResolvedValue(buildPost());
    const res = await service.assist({
      scope: 'content-item',
      workspaceId: 'w',
      refId: 'p-1',
      field: 'post-caption',
    });
    expect(res.values).toHaveLength(1);
    expect(res.values[0]).toMatch(/Stop scrolling/);
  });

  // ─── LLM mode ────────────────────────────────────────────────────

  it('runs the matching skill and returns values when LLM is configured', async () => {
    llm.isConfigured.mockReturnValue(true);
    contentItems.getItem.mockResolvedValue(buildConcept());
    skillRunner.run.mockResolvedValue({
      content: '',
      parsed: { values: ['Generated description.'] },
      usage: { inputTokens: 1, outputTokens: 1 },
      toolName: 'emit_field_values',
      stopReason: 'tool_use',
    });
    const res = await service.assist({
      scope: 'content-item',
      workspaceId: 'w',
      refId: 'c-1',
      field: 'concept-description',
    });
    expect(res.values).toEqual(['Generated description.']);
    const callArg = skillRunner.run.mock.calls[0][0];
    expect(callArg.skillId).toBe('field-assist-concept-description');
    expect(callArg.tool.name).toBe('emit_field_values');
    expect(callArg.tool.inputSchema.properties.values.minItems).toBe(1);
    expect(callArg.tool.inputSchema.properties.values.maxItems).toBe(1);
  });

  it('forwards count to the tool schema minItems / maxItems', async () => {
    llm.isConfigured.mockReturnValue(true);
    contentItems.getItem.mockResolvedValue(buildPost());
    skillRunner.run.mockResolvedValue({
      content: '',
      parsed: { values: ['a', 'b', 'c'] },
      usage: { inputTokens: 1, outputTokens: 1 },
      toolName: 'emit_field_values',
      stopReason: 'tool_use',
    });
    await service.assist({
      scope: 'content-item',
      workspaceId: 'w',
      refId: 'p-1',
      field: 'post-script-hook',
    });
    const callArg = skillRunner.run.mock.calls[0][0];
    expect(callArg.tool.inputSchema.properties.values.minItems).toBe(3);
    expect(callArg.tool.inputSchema.properties.values.maxItems).toBe(3);
  });

  it('throws 502 when LLM returns wrong number of values', async () => {
    llm.isConfigured.mockReturnValue(true);
    contentItems.getItem.mockResolvedValue(buildPost());
    skillRunner.run.mockResolvedValue({
      content: '',
      parsed: { values: ['only one'] },
      usage: { inputTokens: 1, outputTokens: 1 },
      stopReason: 'tool_use',
    });
    await expect(
      service.assist({
        scope: 'content-item',
        workspaceId: 'w',
        refId: 'p-1',
        field: 'post-script-hook', // wants 3
      }),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('throws 502 when LLM returns malformed parse (no values array)', async () => {
    llm.isConfigured.mockReturnValue(true);
    contentItems.getItem.mockResolvedValue(buildConcept());
    skillRunner.run.mockResolvedValue({
      content: 'not json',
      parsed: null,
      usage: { inputTokens: 1, outputTokens: 1 },
      stopReason: 'end_turn',
    });
    await expect(
      service.assist({
        scope: 'content-item',
        workspaceId: 'w',
        refId: 'c-1',
        field: 'concept-description',
      }),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('throws 502 when one returned value is empty/whitespace', async () => {
    llm.isConfigured.mockReturnValue(true);
    contentItems.getItem.mockResolvedValue(buildConcept());
    skillRunner.run.mockResolvedValue({
      content: '',
      parsed: { values: ['  '] },
      usage: { inputTokens: 1, outputTokens: 1 },
      stopReason: 'tool_use',
    });
    await expect(
      service.assist({
        scope: 'content-item',
        workspaceId: 'w',
        refId: 'c-1',
        field: 'concept-description',
      }),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  // ─── context assembly ────────────────────────────────────────────

  it('loads parent concept when the field is on a post', async () => {
    llm.isConfigured.mockReturnValue(true);
    const post = buildPost();
    const concept = buildConcept({ id: 'c-1', description: 'Parent description.' });
    contentItems.getItem.mockImplementation(async (_w: string, id: string) =>
      id === post.id ? post : concept,
    );
    skillRunner.run.mockResolvedValue({
      content: '',
      parsed: { values: ['caption'] },
      usage: { inputTokens: 1, outputTokens: 1 },
      stopReason: 'tool_use',
    });
    await service.assist({
      scope: 'content-item',
      workspaceId: 'w',
      refId: post.id,
      field: 'post-caption',
    });
    expect(contentItems.getItem).toHaveBeenCalledWith('w', post.id);
    expect(contentItems.getItem).toHaveBeenCalledWith('w', concept.id);
    const userTurn = JSON.parse(skillRunner.run.mock.calls[0][0].conversationHistory[0].content);
    expect(userTurn.context.parentConcept).toMatchObject({ id: 'c-1' });
  });

  it('does NOT load a parent for concept-stage requests', async () => {
    llm.isConfigured.mockReturnValue(true);
    contentItems.getItem.mockResolvedValue(buildConcept());
    skillRunner.run.mockResolvedValue({
      content: '',
      parsed: { values: ['x'] },
      usage: { inputTokens: 1, outputTokens: 1 },
      stopReason: 'tool_use',
    });
    await service.assist({
      scope: 'content-item',
      workspaceId: 'w',
      refId: 'c-1',
      field: 'concept-description',
    });
    expect(contentItems.getItem).toHaveBeenCalledTimes(1);
  });

  it('passes brand voice + positioning + selected pillars/segments into the user turn', async () => {
    llm.isConfigured.mockReturnValue(true);
    contentItems.getItem.mockResolvedValue(buildConcept({ pillarIds: ['p-1'], segmentIds: ['s-1'] }));
    workspaces.getSettings.mockImplementation(async (_w: string, tab: string) =>
      tab === 'brand-voice'
        ? { brandVoiceDescription: 'Warm and direct.', toneTags: ['friendly'] }
        : tab === 'brand-positioning'
          ? { positioningStatement: 'We make X simple.' }
          : null,
    );
    workspaces.getNamespaceEntities.mockImplementation(async (_w: string, ns: string) =>
      ns === 'content-pillars'
        ? [{ id: 'p-1', name: 'Wellness' }, { id: 'p-2', name: 'Career' }]
        : [{ id: 's-1', name: 'Women 40+' }],
    );
    skillRunner.run.mockResolvedValue({
      content: '',
      parsed: { values: ['ok'] },
      usage: { inputTokens: 1, outputTokens: 1 },
      stopReason: 'tool_use',
    });

    await service.assist({
      scope: 'content-item',
      workspaceId: 'w',
      refId: 'c-1',
      field: 'concept-description',
    });

    const userTurn = JSON.parse(skillRunner.run.mock.calls[0][0].conversationHistory[0].content);
    expect(userTurn.context.workspace.brandVoice).toBe('Warm and direct.');
    expect(userTurn.context.workspace.positioningStatement).toBe('We make X simple.');
    expect(userTurn.context.pillars).toEqual([{ id: 'p-1', name: 'Wellness' }]);
    expect(userTurn.context.segments).toEqual([{ id: 's-1', name: 'Women 40+' }]);
  });

  it('skips workspace settings loads when they throw — degrades to empty', async () => {
    llm.isConfigured.mockReturnValue(true);
    contentItems.getItem.mockResolvedValue(buildConcept());
    workspaces.getSettings.mockRejectedValue(new Error('boom'));
    workspaces.getNamespaceEntities.mockRejectedValue(new Error('boom'));
    skillRunner.run.mockResolvedValue({
      content: '',
      parsed: { values: ['ok'] },
      usage: { inputTokens: 1, outputTokens: 1 },
      stopReason: 'tool_use',
    });
    await expect(
      service.assist({
        scope: 'content-item',
        workspaceId: 'w',
        refId: 'c-1',
        field: 'concept-description',
      }),
    ).resolves.toEqual({ values: ['ok'] });
  });

  it('drops empty/undefined fields from the projected item to keep prompts small', async () => {
    llm.isConfigured.mockReturnValue(true);
    contentItems.getItem.mockResolvedValue(
      buildConcept({ description: '', hook: undefined, keyMessage: '   ' }),
    );
    skillRunner.run.mockResolvedValue({
      content: '',
      parsed: { values: ['ok'] },
      usage: { inputTokens: 1, outputTokens: 1 },
      stopReason: 'tool_use',
    });
    await service.assist({
      scope: 'content-item',
      workspaceId: 'w',
      refId: 'c-1',
      field: 'concept-description',
    });
    const userTurn = JSON.parse(skillRunner.run.mock.calls[0][0].conversationHistory[0].content);
    expect(userTurn.context.item.description).toBeUndefined();
    expect(userTurn.context.item.hook).toBeUndefined();
    expect(userTurn.context.item.keyMessage).toBeUndefined();
  });

  it('projects targetPlatform from item.targetPlatforms[0] when present, else falls back to item.platform/contentType', async () => {
    llm.isConfigured.mockReturnValue(true);
    contentItems.getItem.mockResolvedValue(
      buildPost({
        targetPlatforms: [{ platform: 'tiktok', contentType: 'short-video' }],
      }),
    );
    skillRunner.run.mockResolvedValue({
      content: '',
      parsed: { values: ['ok'] },
      usage: { inputTokens: 1, outputTokens: 1 },
      stopReason: 'tool_use',
    });
    await service.assist({
      scope: 'content-item',
      workspaceId: 'w',
      refId: 'p-1',
      field: 'post-caption',
    });
    const userTurn = JSON.parse(skillRunner.run.mock.calls[0][0].conversationHistory[0].content);
    expect(userTurn.context.targetPlatform).toEqual({
      platform: 'tiktok',
      contentType: 'short-video',
    });
  });
});
