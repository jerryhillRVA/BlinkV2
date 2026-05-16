import { Test } from '@nestjs/testing';
import { BadGatewayException, BadRequestException } from '@nestjs/common';
import { GeneratedIdeasService } from './generated-ideas.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { LlmService } from '../llm/llm.service';
import { SkillRunnerService } from '../skills/skill-runner.service';

function validLlmIdea(
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> {
  return {
    id: 'gi-x',
    title: 'A sample generated title',
    rationale: 'A short rationale explaining why this works.',
    pillarId: 'p-1',
    ...overrides,
  };
}

function validLlmPayload(count = 6): Record<string, unknown> {
  return { ideas: new Array(count).fill(0).map(() => validLlmIdea()) };
}

describe('GeneratedIdeasService', () => {
  let service: GeneratedIdeasService;
  let workspaces: {
    getSettings: ReturnType<typeof vi.fn>;
    getNamespaceEntities: ReturnType<typeof vi.fn>;
  };
  let llm: { isConfigured: ReturnType<typeof vi.fn> };
  let skillRunner: { run: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    workspaces = {
      getSettings: vi.fn().mockResolvedValue(null),
      getNamespaceEntities: vi.fn().mockImplementation((_ws: string, ns: string) => {
        if (ns === 'content-pillars') {
          return Promise.resolve([
            { id: 'p-1', name: 'Pillar One', description: 'First' },
            { id: 'p-2', name: 'Pillar Two', description: 'Second' },
            { id: 'p-3', name: 'Pillar Three' },
          ]);
        }
        if (ns === 'audience-segments') {
          return Promise.resolve([
            { id: 's-1', name: 'Segment One' },
            { id: 's-2', name: 'Segment Two' },
          ]);
        }
        return Promise.resolve([]);
      }),
    };
    llm = { isConfigured: vi.fn().mockReturnValue(false) };
    skillRunner = { run: vi.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        GeneratedIdeasService,
        { provide: WorkspacesService, useValue: workspaces },
        { provide: LlmService, useValue: llm },
        { provide: SkillRunnerService, useValue: skillRunner },
      ],
    }).compile();
    service = moduleRef.get(GeneratedIdeasService);
  });

  // ── validation ──────────────────────────────────────────────────────

  it('rejects empty workspaceId', async () => {
    await expect(
      service.generate({ workspaceId: '', pillarIds: ['p-1'] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects empty pillarIds array', async () => {
    await expect(
      service.generate({ workspaceId: 'w', pillarIds: [] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects non-array pillarIds', async () => {
    await expect(
      service.generate({
        workspaceId: 'w',
        pillarIds: 'p-1' as unknown as string[],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects pillarIds containing empty strings', async () => {
    await expect(
      service.generate({ workspaceId: 'w', pillarIds: ['p-1', ''] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects unknown pillarIds not on the workspace', async () => {
    await expect(
      service.generate({ workspaceId: 'w', pillarIds: ['p-1', 'p-missing'] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  // ── stub mode ───────────────────────────────────────────────────────

  it('returns 6 stub ideas when LLM is not configured', async () => {
    const res = await service.generate({ workspaceId: 'w', pillarIds: ['p-1'] });
    expect(res.ideas).toHaveLength(6);
    for (const idea of res.ideas) {
      expect(idea.id).toMatch(/^gi-/);
      expect(idea.title.length).toBeGreaterThan(0);
      expect(idea.rationale.length).toBeGreaterThan(0);
      expect(idea.pillarId).toBe('p-1');
    }
    expect(skillRunner.run).not.toHaveBeenCalled();
  });

  it('stub mode distributes 6 ideas round-robin across 3 pillars', async () => {
    const res = await service.generate({
      workspaceId: 'w',
      pillarIds: ['p-1', 'p-2', 'p-3'],
    });
    expect(res.ideas.map((i) => i.pillarId)).toEqual([
      'p-1',
      'p-2',
      'p-3',
      'p-1',
      'p-2',
      'p-3',
    ]);
  });

  it('stub mode dedupes pillarIds before distribution', async () => {
    const res = await service.generate({
      workspaceId: 'w',
      pillarIds: ['p-1', 'p-1', 'p-2'],
    });
    expect(res.ideas.map((i) => i.pillarId)).toEqual([
      'p-1',
      'p-2',
      'p-1',
      'p-2',
      'p-1',
      'p-2',
    ]);
  });

  // ── skill mode happy path ───────────────────────────────────────────

  it('runs the skill and returns shaped ideas when LLM is configured', async () => {
    llm.isConfigured.mockReturnValue(true);
    skillRunner.run.mockResolvedValue({
      parsed: validLlmPayload(),
      content: '',
      usage: { inputTokens: 1, outputTokens: 1 },
      stopReason: 'tool_use',
    });

    const res = await service.generate({
      workspaceId: 'w',
      pillarIds: ['p-1', 'p-2'],
    });

    expect(res.ideas).toHaveLength(6);
    expect(skillRunner.run).toHaveBeenCalledTimes(1);
    expect(skillRunner.run).toHaveBeenCalledWith(
      expect.objectContaining({
        skillId: 'generated-ideas',
        tool: expect.objectContaining({ name: 'emit_generated_ideas' }),
      }),
    );
    for (const idea of res.ideas) {
      expect(idea.id).toMatch(/^gi-/);
      expect(idea.title.length).toBeGreaterThan(0);
      expect(idea.rationale.length).toBeGreaterThan(0);
    }
    // Server re-assigns pillarIds round-robin regardless of model output.
    expect(res.ideas.map((i) => i.pillarId)).toEqual([
      'p-1',
      'p-2',
      'p-1',
      'p-2',
      'p-1',
      'p-2',
    ]);
  });

  it('passes workspace + pillars + segments + count in the user-turn context', async () => {
    llm.isConfigured.mockReturnValue(true);
    workspaces.getSettings.mockImplementation(async (_ws: string, tab: string) => {
      if (tab === 'brand-voice') {
        return {
          brandVoiceDescription: 'Warm and inviting',
          toneGuidelines: ['Be direct'],
          toneTags: ['warm'],
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

    await service.generate({ workspaceId: 'w', pillarIds: ['p-1', 'p-2'] });

    const call = skillRunner.run.mock.calls[0][0];
    const userTurn = JSON.parse(call.conversationHistory[0].content) as Record<
      string,
      unknown
    >;
    expect(userTurn['workspace']).toMatchObject({
      brandVoice: 'Warm and inviting',
      positioningStatement: 'We help X do Y',
    });
    // Only the *requested* pillars are passed, not the workspace's full list.
    expect(userTurn['pillars']).toEqual([
      expect.objectContaining({ id: 'p-1' }),
      expect.objectContaining({ id: 'p-2' }),
    ]);
    expect(userTurn['segments']).toHaveLength(2);
    expect(userTurn['count']).toBe(6);
  });

  it('degrades to empty workspace context when settings loads reject', async () => {
    llm.isConfigured.mockReturnValue(true);
    workspaces.getSettings.mockRejectedValue(new Error('afs down'));
    skillRunner.run.mockResolvedValue({
      parsed: validLlmPayload(),
      content: '',
      usage: { inputTokens: 1, outputTokens: 1 },
      stopReason: 'tool_use',
    });

    const res = await service.generate({ workspaceId: 'w', pillarIds: ['p-1'] });
    expect(res.ideas).toHaveLength(6);
  });

  // ── skill mode failure modes ────────────────────────────────────────

  it('retries once on first-attempt failure and succeeds on the second', async () => {
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

    const res = await service.generate({ workspaceId: 'w', pillarIds: ['p-1'] });
    expect(res.ideas).toHaveLength(6);
    expect(skillRunner.run).toHaveBeenCalledTimes(2);
  });

  it('502s after two attempts when the skill keeps returning the wrong count', async () => {
    llm.isConfigured.mockReturnValue(true);
    skillRunner.run.mockResolvedValue({
      parsed: validLlmPayload(5),
      content: '',
      usage: { inputTokens: 1, outputTokens: 1 },
      stopReason: 'tool_use',
    });
    await expect(
      service.generate({ workspaceId: 'w', pillarIds: ['p-1'] }),
    ).rejects.toBeInstanceOf(BadGatewayException);
    expect(skillRunner.run).toHaveBeenCalledTimes(2);
  });

  it('502s when an idea references a pillarId outside the requested set', async () => {
    llm.isConfigured.mockReturnValue(true);
    const bad = validLlmPayload();
    (bad['ideas'] as Record<string, unknown>[])[0]['pillarId'] = 'p-not-in-request';
    skillRunner.run.mockResolvedValue({
      parsed: bad,
      content: '',
      usage: { inputTokens: 1, outputTokens: 1 },
      stopReason: 'tool_use',
    });
    await expect(
      service.generate({ workspaceId: 'w', pillarIds: ['p-1'] }),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('502s when an idea has an empty title', async () => {
    llm.isConfigured.mockReturnValue(true);
    const bad = validLlmPayload();
    (bad['ideas'] as Record<string, unknown>[])[0]['title'] = '';
    skillRunner.run.mockResolvedValue({
      parsed: bad,
      content: '',
      usage: { inputTokens: 1, outputTokens: 1 },
      stopReason: 'tool_use',
    });
    await expect(
      service.generate({ workspaceId: 'w', pillarIds: ['p-1'] }),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('502s when the skill output is missing the ideas array', async () => {
    llm.isConfigured.mockReturnValue(true);
    skillRunner.run.mockResolvedValue({
      parsed: { somethingElse: [] },
      content: '',
      usage: { inputTokens: 1, outputTokens: 1 },
      stopReason: 'tool_use',
    });
    await expect(
      service.generate({ workspaceId: 'w', pillarIds: ['p-1'] }),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });
});
