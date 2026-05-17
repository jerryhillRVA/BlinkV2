import { Test } from '@nestjs/testing';
import { BadGatewayException, BadRequestException } from '@nestjs/common';
import type {
  ConceptDraftRequestContract,
  ContentObjectiveContract,
} from '@blinksocial/contracts';
import { ConceptDraftService } from './concept-draft.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { LlmService } from '../llm/llm.service';
import { SkillRunnerService } from '../skills/skill-runner.service';

function validBody(
  overrides: Partial<ConceptDraftRequestContract['draft']> = {},
): ConceptDraftRequestContract {
  return {
    workspaceId: 'w1',
    draft: {
      title: 'Why teams need rituals',
      objective: 'engagement',
      pillarIds: [],
      segmentIds: [],
      ...overrides,
    },
  };
}

function validLlmDraft(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    description: 'A description that the LLM produced for the draft.',
    hook: 'A hook line the LLM came up with.',
    cta: { type: 'comment', text: 'Drop your thoughts in the comments below' },
    pillarIdFallback: 'p-1',
    segmentIdsFallback: ['s-1', 's-2'],
    ...overrides,
  };
}

describe('ConceptDraftService', () => {
  let service: ConceptDraftService;
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
        ConceptDraftService,
        { provide: WorkspacesService, useValue: workspaces },
        { provide: LlmService, useValue: llm },
        { provide: SkillRunnerService, useValue: skillRunner },
      ],
    }).compile();
    service = moduleRef.get(ConceptDraftService);
  });

  // ── validation ───────────────────────────────────────────────────────

  describe('validation', () => {
    it('rejects missing workspaceId', async () => {
      await expect(
        service.generate({ draft: validBody().draft } as unknown as ConceptDraftRequestContract),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects empty title', async () => {
      await expect(service.generate(validBody({ title: '' }))).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects whitespace-only title', async () => {
      await expect(service.generate(validBody({ title: '   ' }))).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects missing objective', async () => {
      const body = validBody();
      delete (body.draft as Partial<typeof body.draft>).objective;
      await expect(service.generate(body)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects objective outside the union', async () => {
      await expect(
        service.generate(
          validBody({ objective: 'not-real' as unknown as ContentObjectiveContract }),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects non-array pillarIds', async () => {
      await expect(
        service.generate(
          validBody({ pillarIds: 'foo' as unknown as string[] }),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects null segmentIds', async () => {
      await expect(
        service.generate(
          validBody({ segmentIds: null as unknown as string[] }),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects non-integer bounds.descriptionMax', async () => {
      await expect(
        service.generate({
          ...validBody(),
          bounds: { descriptionMax: 12.5 as unknown as number },
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects out-of-range bounds.hookMax', async () => {
      await expect(
        service.generate({ ...validBody(), bounds: { hookMax: 0 } }),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        service.generate({ ...validBody(), bounds: { hookMax: 999999 } }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('accepts omitted bounds (treats request as unbounded)', async () => {
      const res = await service.generate(validBody());
      expect(res.draft).toBeDefined();
    });
  });

  // ── stub mode (LLM not configured) ───────────────────────────────────

  describe('stub mode', () => {
    beforeEach(() => llm.isConfigured.mockReturnValue(false));

    const CTA_MAPPED = [
      ['awareness', 'learn-more', 'Learn more about this in our bio link'],
      ['engagement', 'comment', 'Drop your thoughts in the comments below'],
      ['trust', 'learn-more', 'See the full breakdown at the link in bio'],
      ['leads', 'book-call', 'Book a free call — link in bio'],
      ['conversion', 'buy', 'Shop now — link in bio'],
    ] as const;

    for (const [obj, type, text] of CTA_MAPPED) {
      it(`returns ported CTA for objective=${obj}`, async () => {
        const res = await service.generate(
          validBody({ objective: obj as ContentObjectiveContract }),
        );
        expect(res.draft.cta).toEqual({ type, text });
      });
    }

    const CTA_UNMAPPED: ContentObjectiveContract[] = [
      'traffic',
      'sales',
      'community',
      'recruiting',
      'lead-gen',
      'education',
    ];

    for (const obj of CTA_UNMAPPED) {
      it(`returns cta=null for objective=${obj}`, async () => {
        const res = await service.generate(validBody({ objective: obj }));
        expect(res.draft.cta).toBeNull();
      });
    }

    it('uses first pillar as fallback when user has none selected', async () => {
      const res = await service.generate(validBody());
      expect(res.draft.pillarIdFallback).toBe('p-1');
    });

    it('returns null pillarIdFallback when user has chips selected', async () => {
      const res = await service.generate(validBody({ pillarIds: ['p-2'] }));
      expect(res.draft.pillarIdFallback).toBeNull();
    });

    it('uses first two segments as fallback when user has none selected', async () => {
      const res = await service.generate(validBody());
      expect(res.draft.segmentIdsFallback).toEqual(['s-1', 's-2']);
    });

    it('returns empty segmentIdsFallback when user has chips selected', async () => {
      const res = await service.generate(validBody({ segmentIds: ['s-3'] }));
      expect(res.draft.segmentIdsFallback).toEqual([]);
    });

    it('returns null pillarIdFallback when workspace has no pillars', async () => {
      workspaces.getNamespaceEntities.mockImplementation((_ws, ns) =>
        ns === 'content-pillars' ? Promise.resolve([]) : Promise.resolve([{ id: 's-1' }]),
      );
      const res = await service.generate(validBody());
      expect(res.draft.pillarIdFallback).toBeNull();
    });

    it('returns description + hook from the ported lookup table', async () => {
      const res = await service.generate(validBody({ objective: 'engagement' }));
      expect(res.draft.description.length).toBeGreaterThan(0);
      expect(res.draft.hook.length).toBeGreaterThan(0);
      expect(res.draft.description).toContain('Spark conversation');
    });
  });

  // ── skill mode (LLM configured) ──────────────────────────────────────

  describe('skill mode', () => {
    beforeEach(() => llm.isConfigured.mockReturnValue(true));

    it('returns the LLM draft on the happy path', async () => {
      skillRunner.run.mockResolvedValue({ parsed: validLlmDraft(), stopReason: 'tool_use' });
      const res = await service.generate(validBody());
      expect(res.draft.description).toContain('the LLM produced');
      expect(res.draft.hook).toContain('hook line the LLM');
      expect(res.draft.cta).toEqual({
        type: 'comment',
        text: 'Drop your thoughts in the comments below',
      });
    });

    it('passes the draft + workspace + pillar + segment context to the skill', async () => {
      workspaces.getSettings.mockImplementation((_ws, key) => {
        if (key === 'brand-voice')
          return Promise.resolve({ brandVoiceDescription: 'punchy' });
        if (key === 'brand-positioning')
          return Promise.resolve({ positioningStatement: 'we win because X' });
        return Promise.resolve(null);
      });
      skillRunner.run.mockResolvedValue({ parsed: validLlmDraft(), stopReason: 'tool_use' });
      await service.generate(validBody({ pillarIds: ['p-1'] }));

      expect(skillRunner.run).toHaveBeenCalledOnce();
      const call = skillRunner.run.mock.calls[0][0];
      expect(call.skillId).toBe('concept-draft');
      const userMsg = JSON.parse(call.conversationHistory[0].content);
      expect(userMsg.draft.title).toBe('Why teams need rituals');
      expect(userMsg.draft.objective).toBe('engagement');
      expect(userMsg.draft.pillarIds).toEqual(['p-1']);
      expect(userMsg.workspace.brandVoice).toBe('punchy');
      expect(userMsg.workspace.positioningStatement).toBe('we win because X');
      expect(userMsg.pillars).toHaveLength(2);
      expect(userMsg.segments).toHaveLength(3);
    });

    it('overrides LLM fallbacks with server-computed values when user had chips selected', async () => {
      skillRunner.run.mockResolvedValue({
        parsed: validLlmDraft({ pillarIdFallback: 'p-2', segmentIdsFallback: ['s-3'] }),
        stopReason: 'tool_use',
      });
      const res = await service.generate(
        validBody({ pillarIds: ['p-1'], segmentIds: ['s-3'] }),
      );
      expect(res.draft.pillarIdFallback).toBeNull();
      expect(res.draft.segmentIdsFallback).toEqual([]);
    });

    it('keeps server-computed fallbacks when user had no chips selected', async () => {
      skillRunner.run.mockResolvedValue({
        parsed: validLlmDraft({ pillarIdFallback: null, segmentIdsFallback: [] }),
        stopReason: 'tool_use',
      });
      const res = await service.generate(validBody());
      expect(res.draft.pillarIdFallback).toBe('p-1');
      expect(res.draft.segmentIdsFallback).toEqual(['s-1', 's-2']);
    });

    it('throws 502 after one retry when LLM returns pillarIdFallback outside the catalog', async () => {
      skillRunner.run.mockResolvedValue({
        parsed: validLlmDraft({ pillarIdFallback: 'p-unknown' }),
        stopReason: 'tool_use',
      });
      await expect(service.generate(validBody())).rejects.toBeInstanceOf(BadGatewayException);
      expect(skillRunner.run).toHaveBeenCalledTimes(2);
    });

    it('throws 502 after one retry when LLM returns segmentIdsFallback id outside the catalog', async () => {
      skillRunner.run.mockResolvedValue({
        parsed: validLlmDraft({ segmentIdsFallback: ['s-unknown'] }),
        stopReason: 'tool_use',
      });
      await expect(service.generate(validBody())).rejects.toBeInstanceOf(BadGatewayException);
      expect(skillRunner.run).toHaveBeenCalledTimes(2);
    });

    it('throws 502 after one retry when LLM returns unknown cta.type', async () => {
      skillRunner.run.mockResolvedValue({
        parsed: validLlmDraft({ cta: { type: 'invented', text: 'click here' } }),
        stopReason: 'tool_use',
      });
      await expect(service.generate(validBody())).rejects.toBeInstanceOf(BadGatewayException);
      expect(skillRunner.run).toHaveBeenCalledTimes(2);
    });

    it('throws 502 when skillRunner.run throws on both attempts', async () => {
      skillRunner.run.mockRejectedValue(new Error('network'));
      await expect(service.generate(validBody())).rejects.toBeInstanceOf(BadGatewayException);
      expect(skillRunner.run).toHaveBeenCalledTimes(2);
    });

    it('retries once then succeeds on second attempt', async () => {
      skillRunner.run
        .mockRejectedValueOnce(new Error('first try'))
        .mockResolvedValueOnce({ parsed: validLlmDraft(), stopReason: 'tool_use' });
      const res = await service.generate(validBody());
      expect(res.draft.description).toContain('the LLM produced');
      expect(skillRunner.run).toHaveBeenCalledTimes(2);
    });

    it('accepts cta=null in LLM output for objectives without a CTA', async () => {
      skillRunner.run.mockResolvedValue({
        parsed: validLlmDraft({ cta: null }),
        stopReason: 'tool_use',
      });
      const res = await service.generate(validBody({ objective: 'community' }));
      expect(res.draft.cta).toBeNull();
    });

    it('degrades gracefully when context loaders throw', async () => {
      workspaces.getSettings.mockRejectedValue(new Error('upstream down'));
      workspaces.getNamespaceEntities.mockRejectedValue(new Error('upstream down'));
      skillRunner.run.mockResolvedValue({
        parsed: validLlmDraft({ pillarIdFallback: null, segmentIdsFallback: [] }),
        stopReason: 'tool_use',
      });
      const res = await service.generate(validBody());
      expect(res.draft.description.length).toBeGreaterThan(0);
      // No pillars/segments available → fallbacks degrade
      expect(res.draft.pillarIdFallback).toBeNull();
      expect(res.draft.segmentIdsFallback).toEqual([]);
    });

    it('forwards bounds into the skill JSON context and the forced-tool maxLength', async () => {
      skillRunner.run.mockResolvedValue({ parsed: validLlmDraft(), stopReason: 'tool_use' });
      await service.generate({
        ...validBody(),
        bounds: { descriptionMax: 400, hookMax: 120 },
      });
      const call = skillRunner.run.mock.calls[0][0];
      const userMsg = JSON.parse(call.conversationHistory[0].content);
      expect(userMsg.bounds).toEqual({ descriptionMax: 400, hookMax: 120 });
      const schema = call.tool.inputSchema as Record<string, Record<string, unknown>>;
      expect((schema['properties'] as Record<string, Record<string, unknown>>)['description']['maxLength']).toBe(400);
      expect((schema['properties'] as Record<string, Record<string, unknown>>)['hook']['maxLength']).toBe(120);
    });

    it('truncates over-length LLM description + hook back to bounds (belt-and-suspenders)', async () => {
      const longDesc = 'a'.repeat(800);
      const longHook = 'b'.repeat(300);
      skillRunner.run.mockResolvedValue({
        parsed: validLlmDraft({ description: longDesc, hook: longHook }),
        stopReason: 'tool_use',
      });
      const res = await service.generate({
        ...validBody(),
        bounds: { descriptionMax: 400, hookMax: 120 },
      });
      expect(res.draft.description.length).toBeLessThanOrEqual(400);
      expect(res.draft.hook.length).toBeLessThanOrEqual(120);
    });

    it('leaves LLM output untouched when bounds omitted', async () => {
      const longDesc = 'a'.repeat(800);
      skillRunner.run.mockResolvedValue({
        parsed: validLlmDraft({ description: longDesc }),
        stopReason: 'tool_use',
      });
      const res = await service.generate(validBody());
      expect(res.draft.description.length).toBe(800);
    });
  });

  describe('stub mode bounds enforcement', () => {
    beforeEach(() => llm.isConfigured.mockReturnValue(false));

    it('truncates ported stub description when descriptionMax is smaller than the stub', async () => {
      const res = await service.generate({
        ...validBody({ objective: 'engagement' }),
        bounds: { descriptionMax: 20 },
      });
      expect(res.draft.description.length).toBeLessThanOrEqual(20);
    });
  });
});
