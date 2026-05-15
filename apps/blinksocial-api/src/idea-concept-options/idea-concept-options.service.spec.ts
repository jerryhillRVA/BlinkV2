import { Test } from '@nestjs/testing';
import {
  BadGatewayException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import type {
  ConceptOptionContract,
  ContentItemContract,
} from '@blinksocial/contracts';
import { IdeaConceptOptionsService } from './idea-concept-options.service';
import { ContentItemsService } from '../content-items/content-items.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { LlmService } from '../llm/llm.service';
import { SkillRunnerService } from '../skills/skill-runner.service';

function buildIdea(overrides: Partial<ContentItemContract> = {}): ContentItemContract {
  return {
    id: 'i-1',
    stage: 'idea',
    status: 'new',
    title: 'Test idea',
    description: 'A short description',
    pillarIds: ['p-1'],
    segmentIds: ['s-1'],
    objective: 'awareness',
    tags: ['mobility'],
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
    ...overrides,
  } as ContentItemContract;
}

function validLlmOption(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    angle: 'Authority Builder — The science behind why this works',
    description: 'Educational deep-dive that explains the why behind the idea.',
    objectiveAlignment: 'Build active community of 2,000 members',
    objective: 'trust',
    pillarIds: ['p-1'],
    segmentIds: ['s-1'],
    targetPlatforms: [{ platform: 'instagram', contentType: 'reel' }],
    cta: { type: 'comment', text: 'Save this for later' },
    suggestedFormatLabel: 'Reel',
    ...overrides,
  };
}

function validLlmPayload(count = 6): Record<string, unknown> {
  return { options: new Array(count).fill(0).map(() => validLlmOption()) };
}

describe('IdeaConceptOptionsService', () => {
  let service: IdeaConceptOptionsService;
  let contentItems: { getItem: ReturnType<typeof vi.fn> };
  let workspaces: {
    getSettings: ReturnType<typeof vi.fn>;
    getNamespaceEntities: ReturnType<typeof vi.fn>;
  };
  let llm: { isConfigured: ReturnType<typeof vi.fn> };
  let skillRunner: { run: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    contentItems = { getItem: vi.fn().mockResolvedValue(buildIdea()) };
    workspaces = {
      getSettings: vi.fn().mockResolvedValue(null),
      getNamespaceEntities: vi.fn().mockImplementation((_ws: string, ns: string) => {
        if (ns === 'content-pillars') {
          return Promise.resolve([
            { id: 'p-1', name: 'Pillar One' },
            { id: 'p-2', name: 'Pillar Two' },
          ]);
        }
        if (ns === 'audience-segments') {
          return Promise.resolve([
            { id: 's-1', name: 'Segment One' },
            { id: 's-2', name: 'Segment Two' },
            { id: 's-3', name: 'Segment Three' },
          ]);
        }
        return Promise.resolve([]);
      }),
    };
    llm = { isConfigured: vi.fn().mockReturnValue(false) };
    skillRunner = { run: vi.fn() };
    const moduleRef = await Test.createTestingModule({
      providers: [
        IdeaConceptOptionsService,
        { provide: ContentItemsService, useValue: contentItems },
        { provide: WorkspacesService, useValue: workspaces },
        { provide: LlmService, useValue: llm },
        { provide: SkillRunnerService, useValue: skillRunner },
      ],
    }).compile();
    service = moduleRef.get(IdeaConceptOptionsService);
  });

  // ── validation ──────────────────────────────────────────────────────

  it('rejects empty workspaceId', async () => {
    await expect(service.generate({ workspaceId: '', refId: 'i-1' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects empty refId', async () => {
    await expect(service.generate({ workspaceId: 'w', refId: '' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects when the item is not idea-stage', async () => {
    contentItems.getItem.mockResolvedValue(buildIdea({ stage: 'concept' }));
    await expect(
      service.generate({ workspaceId: 'w', refId: 'c-1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('translates content-items NotFoundException to BadRequest', async () => {
    contentItems.getItem.mockRejectedValue(new NotFoundException('gone'));
    await expect(
      service.generate({ workspaceId: 'w', refId: 'missing' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  // ── stub mode ───────────────────────────────────────────────────────

  it('returns 6 stub options when the LLM is not configured', async () => {
    const res = await service.generate({ workspaceId: 'w', refId: 'i-1' });
    expect(res.options).toHaveLength(6);
    for (const opt of res.options) {
      expect(typeof opt.id).toBe('string');
      expect(opt.id.length).toBeGreaterThan(0);
      expect(opt.angle.length).toBeGreaterThan(0);
      expect(opt.description.length).toBeGreaterThan(0);
      expect(Array.isArray(opt.pillarIds)).toBe(true);
      expect(Array.isArray(opt.segmentIds)).toBe(true);
      expect(opt.targetPlatforms.length).toBeGreaterThan(0);
      expect(opt.cta.text.length).toBeGreaterThan(0);
    }
    expect(skillRunner.run).not.toHaveBeenCalled();
  });

  it('stub mode assigns pillar ids from the workspace pillar list (round-robin)', async () => {
    const res = await service.generate({ workspaceId: 'w', refId: 'i-1' });
    const all = res.options.flatMap((o) => o.pillarIds);
    expect(all.length).toBeGreaterThan(0);
    expect(all.every((id) => id === 'p-1' || id === 'p-2')).toBe(true);
  });

  it('stub mode assigns segment ids from the workspace segment list', async () => {
    const res = await service.generate({ workspaceId: 'w', refId: 'i-1' });
    const all = res.options.flatMap((o) => o.segmentIds);
    expect(all.length).toBeGreaterThan(0);
    expect(all.every((id) => ['s-1', 's-2', 's-3'].includes(id))).toBe(true);
  });

  it('stub mode emits empty pillar/segment arrays when the workspace has none', async () => {
    workspaces.getNamespaceEntities.mockResolvedValue([]);
    const res = await service.generate({ workspaceId: 'w', refId: 'i-1' });
    for (const opt of res.options) {
      expect(opt.pillarIds).toEqual([]);
      expect(opt.segmentIds).toEqual([]);
    }
  });

  // ── skill mode happy path ───────────────────────────────────────────

  it('runs the skill and returns shaped options when LLM is configured', async () => {
    llm.isConfigured.mockReturnValue(true);
    skillRunner.run.mockResolvedValue({
      parsed: validLlmPayload(),
      content: '',
      usage: { inputTokens: 1, outputTokens: 1 },
      stopReason: 'tool_use',
    });

    const res = await service.generate({ workspaceId: 'w', refId: 'i-1' });

    expect(res.options).toHaveLength(6);
    expect(skillRunner.run).toHaveBeenCalledTimes(1);
    expect(skillRunner.run).toHaveBeenCalledWith(
      expect.objectContaining({
        skillId: 'idea-concept-options',
        tool: expect.objectContaining({ name: 'emit_concept_options' }),
      }),
    );
    for (const opt of res.options) {
      expect(opt.id).toMatch(/^opt-/);
      expect(opt.pillarIds).toEqual(['p-1']);
      expect(opt.segmentIds).toEqual(['s-1']);
      expect(opt.targetPlatforms[0].postId).toBeNull();
    }
  });

  it('passes idea + workspace + pillars + segments in the user-turn context', async () => {
    llm.isConfigured.mockReturnValue(true);
    workspaces.getSettings.mockImplementation(async (_ws: string, tab: string) => {
      if (tab === 'brand-voice') {
        return {
          brandVoiceDescription: 'Warm and inviting',
          toneGuidelines: ['Be direct'],
          toneTags: ['warm', 'energetic'],
        };
      }
      if (tab === 'brand-positioning') {
        return {
          positioningStatement: 'We help X do Y',
          targetCustomer: 'X',
          problemSolved: 'Y',
          solution: 'Z',
          differentiator: 'D',
        };
      }
      return null;
    });
    skillRunner.run.mockResolvedValue({
      parsed: validLlmPayload(),
      content: '',
      usage: { inputTokens: 1, outputTokens: 1 },
      stopReason: 'tool_use',
    });

    await service.generate({ workspaceId: 'w', refId: 'i-1' });

    const call = skillRunner.run.mock.calls[0][0];
    const userTurn = JSON.parse(call.conversationHistory[0].content) as Record<string, unknown>;
    expect(userTurn['idea']).toMatchObject({
      id: 'i-1',
      title: 'Test idea',
      objective: 'awareness',
    });
    expect(userTurn['workspace']).toMatchObject({
      brandVoice: 'Warm and inviting',
      positioningStatement: 'We help X do Y',
    });
    expect(userTurn['pillars']).toHaveLength(2);
    expect(userTurn['segments']).toHaveLength(3);
  });

  it('omits empty idea fields from the context payload', async () => {
    llm.isConfigured.mockReturnValue(true);
    contentItems.getItem.mockResolvedValue(buildIdea({ description: '', tags: [] }));
    skillRunner.run.mockResolvedValue({
      parsed: validLlmPayload(),
      content: '',
      usage: { inputTokens: 1, outputTokens: 1 },
      stopReason: 'tool_use',
    });

    await service.generate({ workspaceId: 'w', refId: 'i-1' });

    const call = skillRunner.run.mock.calls[0][0];
    const userTurn = JSON.parse(call.conversationHistory[0].content) as Record<string, unknown>;
    const idea = userTurn['idea'] as Record<string, unknown>;
    expect(idea).not.toHaveProperty('description');
    expect(idea).not.toHaveProperty('tags');
  });

  it('degrades to nulls when settings loads reject', async () => {
    llm.isConfigured.mockReturnValue(true);
    workspaces.getSettings.mockRejectedValue(new Error('afs down'));
    skillRunner.run.mockResolvedValue({
      parsed: validLlmPayload(),
      content: '',
      usage: { inputTokens: 1, outputTokens: 1 },
      stopReason: 'tool_use',
    });

    const res = await service.generate({ workspaceId: 'w', refId: 'i-1' });
    expect(res.options).toHaveLength(6);
  });

  // ── skill mode failure modes (502 after one retry) ──────────────────

  it('502s after one retry when the skill returns the wrong option count', async () => {
    llm.isConfigured.mockReturnValue(true);
    skillRunner.run.mockResolvedValue({
      parsed: validLlmPayload(5),
      content: '',
      usage: { inputTokens: 1, outputTokens: 1 },
      stopReason: 'tool_use',
    });
    await expect(
      service.generate({ workspaceId: 'w', refId: 'i-1' }),
    ).rejects.toBeInstanceOf(BadGatewayException);
    expect(skillRunner.run).toHaveBeenCalledTimes(2);
  });

  it('502s when an option references an unknown pillar id', async () => {
    llm.isConfigured.mockReturnValue(true);
    const bad = validLlmPayload();
    (bad['options'] as Record<string, unknown>[])[0]['pillarIds'] = ['p-not-in-ws'];
    skillRunner.run.mockResolvedValue({
      parsed: bad,
      content: '',
      usage: { inputTokens: 1, outputTokens: 1 },
      stopReason: 'tool_use',
    });
    await expect(
      service.generate({ workspaceId: 'w', refId: 'i-1' }),
    ).rejects.toBeInstanceOf(BadGatewayException);
    expect(skillRunner.run).toHaveBeenCalledTimes(2);
  });

  it('502s when an option references an unknown segment id', async () => {
    llm.isConfigured.mockReturnValue(true);
    const bad = validLlmPayload();
    (bad['options'] as Record<string, unknown>[])[0]['segmentIds'] = ['s-not-in-ws'];
    skillRunner.run.mockResolvedValue({
      parsed: bad,
      content: '',
      usage: { inputTokens: 1, outputTokens: 1 },
      stopReason: 'tool_use',
    });
    await expect(
      service.generate({ workspaceId: 'w', refId: 'i-1' }),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('502s when an option has an objective outside the closed union', async () => {
    llm.isConfigured.mockReturnValue(true);
    const bad = validLlmPayload();
    (bad['options'] as Record<string, unknown>[])[2]['objective'] = 'not-an-objective';
    skillRunner.run.mockResolvedValue({
      parsed: bad,
      content: '',
      usage: { inputTokens: 1, outputTokens: 1 },
      stopReason: 'tool_use',
    });
    await expect(
      service.generate({ workspaceId: 'w', refId: 'i-1' }),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('502s when an option has an invalid platform or contentType', async () => {
    llm.isConfigured.mockReturnValue(true);
    const bad = validLlmPayload();
    (bad['options'] as Record<string, unknown>[])[1]['targetPlatforms'] = [
      { platform: 'myspace', contentType: 'reel' },
    ];
    skillRunner.run.mockResolvedValue({
      parsed: bad,
      content: '',
      usage: { inputTokens: 1, outputTokens: 1 },
      stopReason: 'tool_use',
    });
    await expect(
      service.generate({ workspaceId: 'w', refId: 'i-1' }),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('retries once and succeeds on the second attempt', async () => {
    llm.isConfigured.mockReturnValue(true);
    skillRunner.run
      .mockResolvedValueOnce({
        parsed: validLlmPayload(5),
        content: '',
        usage: { inputTokens: 1, outputTokens: 1 },
        stopReason: 'tool_use',
      })
      .mockResolvedValueOnce({
        parsed: validLlmPayload(),
        content: '',
        usage: { inputTokens: 1, outputTokens: 1 },
        stopReason: 'tool_use',
      });
    const res = await service.generate({ workspaceId: 'w', refId: 'i-1' });
    expect(res.options).toHaveLength(6);
    expect(skillRunner.run).toHaveBeenCalledTimes(2);
  });

  it('502s when the skill runner itself throws (twice)', async () => {
    llm.isConfigured.mockReturnValue(true);
    skillRunner.run.mockRejectedValue(new Error('llm exploded'));
    await expect(
      service.generate({ workspaceId: 'w', refId: 'i-1' }),
    ).rejects.toBeInstanceOf(BadGatewayException);
    expect(skillRunner.run).toHaveBeenCalledTimes(2);
  });

  // ── tool input schema ───────────────────────────────────────────────

  it('passes pillar and segment ids as enums in the tool input schema', async () => {
    llm.isConfigured.mockReturnValue(true);
    skillRunner.run.mockResolvedValue({
      parsed: validLlmPayload(),
      content: '',
      usage: { inputTokens: 1, outputTokens: 1 },
      stopReason: 'tool_use',
    });
    await service.generate({ workspaceId: 'w', refId: 'i-1' });

    const call = skillRunner.run.mock.calls[0][0];
    const itemSchema = call.tool.inputSchema.properties.options.items;
    expect(itemSchema.properties.pillarIds.items.enum).toEqual(['p-1', 'p-2']);
    expect(itemSchema.properties.segmentIds.items.enum).toEqual(['s-1', 's-2', 's-3']);
    expect(call.tool.inputSchema.properties.options.minItems).toBe(6);
    expect(call.tool.inputSchema.properties.options.maxItems).toBe(6);
  });

  it('omits the enum constraint when the workspace has no pillars/segments', async () => {
    llm.isConfigured.mockReturnValue(true);
    workspaces.getNamespaceEntities.mockResolvedValue([]);
    const payload = validLlmPayload();
    for (const o of payload['options'] as Record<string, unknown>[]) {
      o['pillarIds'] = [];
      o['segmentIds'] = [];
    }
    skillRunner.run.mockResolvedValue({
      parsed: payload,
      content: '',
      usage: { inputTokens: 1, outputTokens: 1 },
      stopReason: 'tool_use',
    });
    await service.generate({ workspaceId: 'w', refId: 'i-1' });

    const call = skillRunner.run.mock.calls[0][0];
    const itemSchema = call.tool.inputSchema.properties.options.items;
    expect(itemSchema.properties.pillarIds.items.enum).toBeUndefined();
    expect(itemSchema.properties.segmentIds.items.enum).toBeUndefined();
  });

  it('shapes options as ConceptOptionContract', async () => {
    llm.isConfigured.mockReturnValue(true);
    skillRunner.run.mockResolvedValue({
      parsed: validLlmPayload(),
      content: '',
      usage: { inputTokens: 1, outputTokens: 1 },
      stopReason: 'tool_use',
    });
    const res = await service.generate({ workspaceId: 'w', refId: 'i-1' });
    const opt: ConceptOptionContract = res.options[0];
    expect(opt.angle).toBeTruthy();
    expect(opt.objectiveAlignment).toBeTruthy();
    expect(opt.cta).toMatchObject({ type: 'comment' });
  });
});
