import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { WizardAiService } from './wizard-ai.service';
import { SkillRunnerService } from '../skills/skill-runner.service';

describe('WizardAiService', () => {
  let service: WizardAiService;
  let skillRunner: { run: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    skillRunner = { run: vi.fn() };
    const moduleRef = await Test.createTestingModule({
      providers: [
        WizardAiService,
        { provide: SkillRunnerService, useValue: skillRunner },
      ],
    }).compile();
    service = moduleRef.get(WizardAiService);
  });

  describe('generatePositioningStatement', () => {
    it('returns trimmed statement on happy path', async () => {
      skillRunner.run.mockResolvedValue({
        content: '{"positioningStatement":"  For everyone, we deliver wins.  "}',
        parsed: { positioningStatement: '  For everyone, we deliver wins.  ' },
        usage: { inputTokens: 10, outputTokens: 5 },
      });

      const res = await service.generatePositioningStatement({
        targetCustomer: 'Devs',
        problemSolved: 'slow builds',
        solution: 'fast CI',
        differentiator: 'speed',
      });

      expect(res.positioningStatement).toBe('For everyone, we deliver wins.');
      expect(skillRunner.run).toHaveBeenCalledWith(
        expect.objectContaining({
          skillId: 'positioning-statement',
          temperature: 0.5,
        }),
      );
      const callArg = skillRunner.run.mock.calls[0][0];
      expect(callArg.conversationHistory).toEqual([
        {
          role: 'user',
          content: expect.stringContaining('"targetCustomer":"Devs"'),
        },
      ]);
    });

    it('works with only one positioning field set', async () => {
      skillRunner.run.mockResolvedValue({
        content: '',
        parsed: { positioningStatement: 'Statement based on solution.' },
        usage: { inputTokens: 1, outputTokens: 1 },
      });

      const res = await service.generatePositioningStatement({ solution: 'a thing' });
      expect(res.positioningStatement).toBe('Statement based on solution.');
      expect(skillRunner.run).toHaveBeenCalled();
    });

    it('throws BadRequest when all four positioning fields are empty/whitespace and skips LLM', async () => {
      await expect(
        service.generatePositioningStatement({
          targetCustomer: '   ',
          problemSolved: '',
          solution: undefined,
          differentiator: '',
          workspaceName: 'WS',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(skillRunner.run).not.toHaveBeenCalled();
    });

    it('throws BadRequest when LLM returns malformed JSON (parsed is null)', async () => {
      skillRunner.run.mockResolvedValue({
        content: 'not json',
        parsed: null,
        usage: { inputTokens: 1, outputTokens: 1 },
      });
      await expect(
        service.generatePositioningStatement({ solution: 'x' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequest when LLM returns whitespace-only positioningStatement', async () => {
      skillRunner.run.mockResolvedValue({
        content: '{"positioningStatement":"   "}',
        parsed: { positioningStatement: '   ' },
        usage: { inputTokens: 1, outputTokens: 1 },
      });
      await expect(
        service.generatePositioningStatement({ solution: 'x' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('suggestBusinessObjectives', () => {
    function happyResponse() {
      return {
        content: '',
        parsed: {
          suggestions: [
            { category: 'growth', statement: 'Grow audience to 10k', target: 10000, unit: 'followers', timeframe: 'Q3 2026' },
            { category: 'engagement', statement: 'Hit 5% engagement', target: 5, unit: '%', timeframe: 'Q4 2026' },
            { category: 'awareness', statement: 'Reach 50k impressions', target: 50000, unit: 'impressions', timeframe: 'Q4 2026' },
          ],
        },
        usage: { inputTokens: 10, outputTokens: 5 },
      };
    }

    it('returns N suggestions with assigned ai-<n> ids and valid categories', async () => {
      skillRunner.run.mockResolvedValue(happyResponse());

      const res = await service.suggestBusinessObjectives({
        workspaceName: 'WS',
        purpose: 'Help devs',
      });

      expect(res.suggestions).toHaveLength(3);
      expect(res.suggestions[0].id).toBe('ai-0');
      expect(res.suggestions[1].id).toBe('ai-1');
      expect(res.suggestions[2].id).toBe('ai-2');
      expect(res.suggestions.every((s) => s.id.match(/^ai-\d+$/))).toBe(true);
      expect(res.suggestions[0].category).toBe('growth');
      expect(res.suggestions[0].status).toBe('on-track');
    });

    it('throws BadRequest with no context at all', async () => {
      await expect(
        service.suggestBusinessObjectives({}),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        service.suggestBusinessObjectives({ audienceSegments: [{ name: '   ' }] }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(skillRunner.run).not.toHaveBeenCalled();
    });

    it('accepts audience-only context', async () => {
      skillRunner.run.mockResolvedValue(happyResponse());
      await service.suggestBusinessObjectives({
        audienceSegments: [{ name: 'Founders' }],
      });
      expect(skillRunner.run).toHaveBeenCalled();
    });

    it('throws BadRequest when a suggestion has invalid category', async () => {
      skillRunner.run.mockResolvedValue({
        content: '',
        parsed: {
          suggestions: [
            { category: 'impact', statement: 'Make impact', target: 1, unit: 'x', timeframe: 'soon' },
          ],
        },
        usage: { inputTokens: 1, outputTokens: 1 },
      });
      await expect(
        service.suggestBusinessObjectives({ workspaceName: 'WS' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequest when a suggestion has empty statement', async () => {
      skillRunner.run.mockResolvedValue({
        content: '',
        parsed: {
          suggestions: [
            { category: 'growth', statement: '   ', target: 1, unit: 'x', timeframe: 'soon' },
          ],
        },
        usage: { inputTokens: 1, outputTokens: 1 },
      });
      await expect(
        service.suggestBusinessObjectives({ workspaceName: 'WS' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequest when LLM returns no suggestions array', async () => {
      skillRunner.run.mockResolvedValue({
        content: 'gibberish',
        parsed: null,
        usage: { inputTokens: 1, outputTokens: 1 },
      });
      await expect(
        service.suggestBusinessObjectives({ workspaceName: 'WS' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequest when a suggestion is not an object', async () => {
      skillRunner.run.mockResolvedValue({
        content: '',
        parsed: { suggestions: ['not an object'] },
        usage: { inputTokens: 1, outputTokens: 1 },
      });
      await expect(
        service.suggestBusinessObjectives({ workspaceName: 'WS' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('coerces string target to number, defaults to 0 on non-numeric', async () => {
      skillRunner.run.mockResolvedValue({
        content: '',
        parsed: {
          suggestions: [
            { category: 'growth', statement: 'A goal', target: '1500', unit: 'subs', timeframe: 'Q1' },
            { category: 'trust', statement: 'B goal', target: 'not-a-number', unit: '', timeframe: '' },
          ],
        },
        usage: { inputTokens: 1, outputTokens: 1 },
      });
      const res = await service.suggestBusinessObjectives({ workspaceName: 'WS' });
      expect(res.suggestions[0].target).toBe(1500);
      expect(res.suggestions[1].target).toBe(0);
    });

    it('passes existingObjectives through as a user-turn JSON message', async () => {
      skillRunner.run.mockResolvedValue(happyResponse());
      await service.suggestBusinessObjectives({
        workspaceName: 'WS',
        existingObjectives: [{ statement: 'Manual goal', category: 'growth' }],
      });
      const callArg = skillRunner.run.mock.calls[0][0];
      expect(callArg.conversationHistory).toEqual([
        {
          role: 'user',
          content: expect.stringContaining('"statement":"Manual goal"'),
        },
      ]);
      expect(callArg.skillId).toBe('business-objectives-suggest');
      expect(callArg.temperature).toBe(0.6);
    });
  });
});
