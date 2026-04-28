import { Test } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { BlueprintValidationService } from './blueprint-validation.service';
import { SkillRunnerService } from '../skills/skill-runner.service';
import { SessionStore, type OnboardingSessionState } from './session-store';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { UserService } from '../auth/user.service';
import { AgenticFilesystemService } from '../agentic-filesystem/agentic-filesystem.service';
import { WorkspaceBuilderService } from './workspace-builder.service';
import type { BlueprintDocumentContract } from '@blinksocial/contracts';

function buildValidBlueprint(): BlueprintDocumentContract {
  return {
    clientName: 'Acme',
    deliveredDate: '2026-04-28',
    strategicSummary:
      'A long summary that spans more than a hundred characters to satisfy minLength validation guard. Core idea here.',
    businessObjectives: [
      { objective: 'Grow audience', category: 'Audience Growth', timeHorizon: '90 days', metric: '10k followers' },
      { objective: 'Boost engagement', category: 'Engagement Quality', timeHorizon: '30 days', metric: '5% rate' },
    ],
    brandVoice: {
      positioningStatement: 'For builders who think out loud.',
      contentMission: 'Demystify modern dev workflows.',
      voiceAttributes: [{ attribute: 'Direct', description: 'No fluff.' }],
      doList: ['Be specific'],
      dontList: ['Avoid jargon'],
    },
    targetAudience:
      'Independent fitness coaches building digital practices and looking for repeatable content systems.',
    audienceProfiles: [
      {
        name: 'Solo coach',
        demographics: '30-45, US, urban',
        painPoints: ['Time'],
        channels: ['Instagram'],
        contentHook: 'Show, don\'t tell',
      },
    ],
    competitorLandscape: [],
    contentPillars: [
      { name: 'Education', description: 'Teach', formats: ['Reels'], sharePercent: 50 },
      { name: 'Inspiration', description: 'Motivate', formats: ['Stories'], sharePercent: 50 },
    ],
    channelsAndCadence: [
      { channel: 'Instagram', role: 'discovery', frequency: 'daily', bestTimes: '8am', contentTypes: ['Reels'] },
    ],
    performanceScorecard: [
      { metric: 'Followers', baseline: '1k', thirtyDayTarget: '2k', ninetyDayTarget: '5k' },
      { metric: 'ER', baseline: '1%', thirtyDayTarget: '2%', ninetyDayTarget: '5%' },
      { metric: 'Reach', baseline: '5k', thirtyDayTarget: '10k', ninetyDayTarget: '25k' },
    ],
    quickWins: ['One', 'Two', 'Three'],
  };
}

describe('OnboardingService', () => {
  let service: OnboardingService;
  let sessionStore: SessionStore;
  let skillRunner: { run: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    skillRunner = { run: vi.fn() };

    const module = await Test.createTestingModule({
      providers: [
        OnboardingService,
        SessionStore,
        BlueprintValidationService,
        { provide: SkillRunnerService, useValue: skillRunner },
        {
          provide: WorkspacesService,
          useValue: {
            createInStatus: vi.fn(),
            getSettings: vi.fn(),
          },
        },
        {
          provide: UserService,
          useValue: { addWorkspaceAccess: vi.fn().mockResolvedValue(undefined) },
        },
        {
          provide: AgenticFilesystemService,
          useValue: { isConfigured: () => false, uploadJsonFile: vi.fn(), uploadTextFile: vi.fn() },
        },
        {
          provide: WorkspaceBuilderService,
          useValue: { buildFromBlueprint: vi.fn() },
        },
      ],
    }).compile();

    service = module.get(OnboardingService);
    sessionStore = module.get(SessionStore);
  });

  describe('renderBlueprintMarkdown', () => {
    it('emits Target Audience section between Brand & Voice and Audience Profiles', () => {
      const bp = buildValidBlueprint();
      bp.targetAudience = 'Independent fitness coaches building digital practices and seeking repeatable content systems.';

      // renderBlueprintMarkdown is private — invoke via cast
      const md = (service as unknown as { renderBlueprintMarkdown: (b: BlueprintDocumentContract) => string })
        .renderBlueprintMarkdown(bp);

      const brandIdx = md.indexOf('## Brand & Voice');
      const targetIdx = md.indexOf('## Target Audience');
      const audienceIdx = md.indexOf('## Audience Profiles');

      expect(brandIdx).toBeGreaterThan(-1);
      expect(targetIdx).toBeGreaterThan(brandIdx);
      expect(audienceIdx).toBeGreaterThan(targetIdx);
      expect(md).toContain(bp.targetAudience);
    });

    it('emits exactly one Target Audience heading', () => {
      const bp = buildValidBlueprint();
      const md = (service as unknown as { renderBlueprintMarkdown: (b: BlueprintDocumentContract) => string })
        .renderBlueprintMarkdown(bp);
      const matches = md.match(/^## Target Audience$/gm);
      expect(matches?.length).toBe(1);
    });
  });

  describe('generateBlueprint validation', () => {
    it('throws HttpException 422 when LLM returns blueprint missing targetAudience', async () => {
      // Seed a session with discoveryData
      const created = sessionStore.create('user-1');
      sessionStore.update(created.id, {
        discoveryData: { business: { businessName: 'Acme' } },
      });

      // LLM returns a blueprint *without* targetAudience
      const invalid = buildValidBlueprint() as Partial<BlueprintDocumentContract>;
      delete invalid.targetAudience;
      skillRunner.run.mockResolvedValue({
        content: '',
        parsed: invalid as Record<string, unknown>,
        usage: { inputTokens: 0, outputTokens: 0 },
      });

      await expect(
        service.generateBlueprint(created.id, 'user-1'),
      ).rejects.toMatchObject({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
      });

      // Session should not be marked complete; it's reset to 'active' by the catch
      const after = sessionStore.get(created.id);
      expect(after?.status).toBe('active');
      expect(after?.blueprint).toBeNull();
    });

    it('persists blueprint when validation passes', async () => {
      const created = sessionStore.create('user-1');
      sessionStore.update(created.id, {
        discoveryData: { business: { businessName: 'Acme' } },
      });

      const valid = buildValidBlueprint();
      skillRunner.run.mockResolvedValue({
        content: '',
        parsed: valid as unknown as Record<string, unknown>,
        usage: { inputTokens: 0, outputTokens: 0 },
      });

      const res = await service.generateBlueprint(created.id, 'user-1');
      expect(res.blueprint.targetAudience).toBe(valid.targetAudience);
      expect(res.markdownDocument).toContain('## Target Audience');

      const after = sessionStore.get(created.id) as OnboardingSessionState;
      expect(after.status).toBe('complete');
      expect(after.blueprint?.targetAudience).toBe(valid.targetAudience);
    });
  });
});
