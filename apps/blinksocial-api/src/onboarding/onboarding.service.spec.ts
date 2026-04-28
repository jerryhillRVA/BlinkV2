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
import { AttachmentExtractorService } from './attachment-extractor.service';
import type { BlueprintDocumentContract } from '@blinksocial/contracts';
import type { LlmContentBlock, LlmMessage } from '../llm/llm-provider.interface';

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
  let extractor: AttachmentExtractorService;

  beforeEach(async () => {
    skillRunner = { run: vi.fn() };

    const module = await Test.createTestingModule({
      providers: [
        OnboardingService,
        SessionStore,
        BlueprintValidationService,
        AttachmentExtractorService,
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
          useValue: {
            isConfigured: () => false,
            uploadJsonFile: vi.fn(),
            uploadTextFile: vi.fn(),
            uploadBinaryFile: vi.fn(),
            downloadBinaryFile: vi.fn(),
          },
        },
        {
          provide: WorkspaceBuilderService,
          useValue: { buildFromBlueprint: vi.fn() },
        },
      ],
    }).compile();

    service = module.get(OnboardingService);
    sessionStore = module.get(SessionStore);
    extractor = module.get(AttachmentExtractorService);
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

  describe('handleMessage with attachments', () => {
    function turnReply(extra: Record<string, unknown> = {}) {
      return {
        content: '',
        parsed: {
          agentMessage: 'Got it.',
          sectionsUpdated: {},
          sectionsCovered: [],
          readyToGenerate: false,
          currentSection: 'business',
          ...extra,
        },
        usage: { inputTokens: 0, outputTokens: 0 },
      };
    }

    it('passes a content-block array containing a text attachment block to the LLM', async () => {
      const created = sessionStore.create('user-1');
      skillRunner.run.mockResolvedValue(turnReply());

      await service.handleMessage(created.id, 'user-1', 'See attached.', [
        {
          filename: 'notes.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('Hello from a brand brief.', 'utf8'),
          sizeBytes: 25,
        },
      ]);

      const call = skillRunner.run.mock.calls.at(-1)?.[0] as {
        conversationHistory: LlmMessage[];
      };
      const lastMessage = call.conversationHistory.at(-1);
      expect(lastMessage?.role).toBe('user');
      const blocks = lastMessage?.content as LlmContentBlock[];
      expect(Array.isArray(blocks)).toBe(true);
      expect(blocks.find((b) => b.type === 'text' && b.text.includes('Hello from a brand brief'))).toBeTruthy();

      const stored = sessionStore.get(created.id);
      const userMsg = stored?.messages.find((m) => m.role === 'user');
      expect(userMsg?.attachments?.length).toBe(1);
      expect(userMsg?.attachments?.[0].kind).toBe('text');
    });

    it('rejects unsupported file types with BadRequest', async () => {
      const created = sessionStore.create('user-1');
      skillRunner.run.mockResolvedValue(turnReply());
      await expect(
        service.handleMessage(created.id, 'user-1', 'try this', [
          {
            filename: 'evil.exe',
            mimeType: 'application/x-msdownload',
            buffer: Buffer.alloc(8),
            sizeBytes: 8,
          },
        ]),
      ).rejects.toThrow(/unsupported type/i);
      // Session unchanged.
      const stored = sessionStore.get(created.id);
      expect(stored?.messages.length).toBe(0);
    });

    it('rejects legacy .doc with explicit error', async () => {
      const created = sessionStore.create('user-1');
      skillRunner.run.mockResolvedValue(turnReply());
      await expect(
        service.handleMessage(created.id, 'user-1', '', [
          {
            filename: 'old.doc',
            mimeType: 'application/msword',
            buffer: Buffer.alloc(8),
            sizeBytes: 8,
          },
        ]),
      ).rejects.toThrow(/legacy \.doc not supported/i);
    });

    it('still sends a plain string message when no attachments are present', async () => {
      const created = sessionStore.create('user-1');
      skillRunner.run.mockResolvedValue(turnReply());

      await service.handleMessage(created.id, 'user-1', 'just text', []);

      const call = skillRunner.run.mock.calls.at(-1)?.[0] as {
        conversationHistory: LlmMessage[];
      };
      const lastMessage = call.conversationHistory.at(-1);
      expect(typeof lastMessage?.content).toBe('string');
      expect(lastMessage?.content).toBe('just text');
    });

    it('keeps text from a prior turn in subsequent turns (FIFO budget)', async () => {
      const created = sessionStore.create('user-1');
      skillRunner.run.mockResolvedValue(turnReply());

      // Turn 1: upload text
      await service.handleMessage(created.id, 'user-1', 'turn one', [
        {
          filename: 'brief.md',
          mimeType: 'text/markdown',
          buffer: Buffer.from('We are a coral-coloured fitness brand.', 'utf8'),
          sizeBytes: 39,
        },
      ]);

      // Turn 2: no new uploads — prior attachment text must replay.
      skillRunner.run.mockClear();
      skillRunner.run.mockResolvedValue(turnReply());
      await service.handleMessage(created.id, 'user-1', 'follow up', []);

      const call = skillRunner.run.mock.calls.at(-1)?.[0] as {
        conversationHistory: LlmMessage[];
      };
      // Locate the historical user message that originally carried the attachment.
      const historicalUser = call.conversationHistory.find(
        (m) => Array.isArray(m.content) && (m.content as LlmContentBlock[]).some((b) => b.type === 'text' && b.text.includes('coral-coloured')),
      );
      expect(historicalUser).toBeTruthy();
    });

    it('exposes the attached extractor as a dependency (smoke)', () => {
      expect(extractor).toBeInstanceOf(AttachmentExtractorService);
    });
  });
});
