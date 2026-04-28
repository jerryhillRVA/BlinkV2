import { Test } from '@nestjs/testing';
import { WorkspaceBuilderService } from './workspace-builder.service';
import { SkillRunnerService } from '../skills/skill-runner.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { AgenticFilesystemService } from '../agentic-filesystem/agentic-filesystem.service';
import type {
  BlueprintDocumentContract,
  CreateWorkspaceRequestContract,
} from '@blinksocial/contracts';

function buildValidBlueprint(): BlueprintDocumentContract {
  return {
    clientName: 'Acme',
    deliveredDate: '2026-04-28',
    strategicSummary:
      'A long summary that spans more than a hundred characters to satisfy minLength validation guards. Core idea is here.',
    businessObjectives: [],
    brandVoice: {
      positioningStatement: 'For builders who think out loud.',
      contentMission: 'Demystify modern dev workflows.',
      voiceAttributes: [{ attribute: 'Direct', description: 'No fluff.' }],
      doList: ['Be specific'],
      dontList: ['Avoid jargon'],
    },
    targetAudience:
      'Independent builders looking for repeatable systems.',
    audienceProfiles: [],
    competitorLandscape: [],
    contentPillars: [],
    channelsAndCadence: [],
    performanceScorecard: [],
    quickWins: [],
  };
}

function buildSkillResponse(
  brandVoiceDescription: string | undefined,
): { content: string; parsed: Record<string, unknown>; usage: { inputTokens: number; outputTokens: number } } {
  const wizard: Partial<CreateWorkspaceRequestContract> = {
    general: {
      workspaceName: 'Acme',
    } as CreateWorkspaceRequestContract['general'],
    brandVoice:
      brandVoiceDescription === undefined
        ? {}
        : { brandVoiceDescription },
    audienceSegments: [],
    contentPillars: [],
    platforms: {
      globalRules: { defaultPlatform: 'instagram', maxIdeasPerMonth: 12 },
      platforms: [],
    } as CreateWorkspaceRequestContract['platforms'],
  };
  return {
    content: JSON.stringify(wizard),
    parsed: wizard as unknown as Record<string, unknown>,
    usage: { inputTokens: 0, outputTokens: 0 },
  };
}

describe('WorkspaceBuilderService', () => {
  let service: WorkspaceBuilderService;
  let skillRunner: { run: ReturnType<typeof vi.fn> };
  let workspaces: {
    createInStatus: ReturnType<typeof vi.fn>;
    transitionStatus: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    skillRunner = { run: vi.fn() };
    workspaces = {
      createInStatus: vi.fn().mockResolvedValue({ id: 'ws-1', tenantId: 'tnt-1' }),
      transitionStatus: vi.fn().mockResolvedValue(undefined),
    };

    const module = await Test.createTestingModule({
      providers: [
        WorkspaceBuilderService,
        { provide: SkillRunnerService, useValue: skillRunner },
        { provide: WorkspacesService, useValue: workspaces },
        {
          provide: AgenticFilesystemService,
          useValue: { isConfigured: () => false, uploadJsonFile: vi.fn(), uploadTextFile: vi.fn() },
        },
      ],
    }).compile();

    service = module.get(WorkspaceBuilderService);
  });

  describe('brandVoiceDescription length guard', () => {
    it('truncates a brandVoiceDescription longer than 2000 chars to 1997 + ellipsis', async () => {
      const oversized = 'a'.repeat(2500);
      skillRunner.run.mockResolvedValue(buildSkillResponse(oversized));

      const result = await service.buildFromBlueprint(
        buildValidBlueprint(),
        'Acme',
        'user-1',
        'session-1',
      );

      const desc = result.wizardData.brandVoice?.brandVoiceDescription ?? '';
      expect(desc.length).toBe(2000);
      expect(desc.endsWith('\u2026')).toBe(true);
      expect(desc.substring(0, 1999)).toBe('a'.repeat(1999));
    });

    it('leaves a brandVoiceDescription <= 2000 chars unchanged', async () => {
      const synthesized =
        'For builders who think out loud, our content demystifies modern dev workflows ' +
        'with a Direct voice — no fluff. We speak to specifics and avoid jargon.';
      skillRunner.run.mockResolvedValue(buildSkillResponse(synthesized));

      const result = await service.buildFromBlueprint(
        buildValidBlueprint(),
        'Acme',
        'user-1',
        'session-1',
      );

      expect(result.wizardData.brandVoice?.brandVoiceDescription).toBe(synthesized);
    });

    it('does not inject a value when brandVoiceDescription is missing', async () => {
      skillRunner.run.mockResolvedValue(buildSkillResponse(undefined));

      const result = await service.buildFromBlueprint(
        buildValidBlueprint(),
        'Acme',
        'user-1',
        'session-1',
      );

      expect(result.wizardData.brandVoice?.brandVoiceDescription).toBeUndefined();
    });
  });
});
