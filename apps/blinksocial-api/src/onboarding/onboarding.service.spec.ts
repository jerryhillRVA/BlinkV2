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
import { buildSampleBlueprint } from '@blinksocial/core';
import type { LlmContentBlock, LlmMessage } from '../llm/llm-provider.interface';

/**
 * Returns a structurally-complete `BlueprintDocumentContract` that
 * satisfies `blueprint.schema.json` end-to-end. Sourced from the shared
 * `@blinksocial/core` fixture so this spec, the web spec, and the shared
 * serializer's own tests cannot drift on schema changes.
 */
function buildValidBlueprint(): BlueprintDocumentContract {
  return buildSampleBlueprint();
}

describe('OnboardingService', () => {
  let service: OnboardingService;
  let sessionStore: SessionStore;
  let skillRunner: { run: ReturnType<typeof vi.fn> };
  let extractor: AttachmentExtractorService;
  let blueprintValidator: BlueprintValidationService;

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
    blueprintValidator = module.get(BlueprintValidationService);
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

    it.each([
      'strategyInPlainEnglish',
      'strategicDecisions',
      'objectivesShapeContent',
      'differentiationMatrix',
      'differentiationSummary',
      'contentChannelMatrix',
      'reviewCadence',
    ] as const)(
      'throws 422 when LLM returns blueprint missing required #71 subsection field "%s"',
      async (field) => {
        const created = sessionStore.create('user-1');
        sessionStore.update(created.id, {
          discoveryData: { business: { businessName: 'Acme' } },
        });

        const invalid = buildValidBlueprint() as Record<string, unknown>;
        delete invalid[field];
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
      },
    );

    it('throws 422 with cross-field error when contentChannelMatrix omits a pillar', async () => {
      const created = sessionStore.create('user-1');
      sessionStore.update(created.id, {
        discoveryData: { business: { businessName: 'Acme' } },
      });

      const invalid = buildValidBlueprint();
      // Drop the row covering "Inspiration" — JSON Schema cannot catch this.
      invalid.contentChannelMatrix = invalid.contentChannelMatrix.filter(
        (r) => r.pillar !== 'Inspiration',
      );
      skillRunner.run.mockResolvedValue({
        content: '',
        parsed: invalid as unknown as Record<string, unknown>,
        usage: { inputTokens: 0, outputTokens: 0 },
      });

      await expect(
        service.generateBlueprint(created.id, 'user-1'),
      ).rejects.toMatchObject({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        response: expect.objectContaining({
          message: expect.stringMatching(/cross-field/i),
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: '/contentChannelMatrix',
            }),
          ]),
        }),
      });
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
      // New #71 subsection headings flow through the shared serializer.
      expect(res.markdownDocument).toContain('### The Strategy in Plain English');
      expect(res.markdownDocument).toContain('### Differentiation Matrix');
      expect(res.markdownDocument).toContain('#### Journey Map');
      expect(res.markdownDocument).toContain('#### Content Ideas Bank');

      const after = sessionStore.get(created.id) as OnboardingSessionState;
      expect(after.status).toBe('complete');
      expect(after.blueprint?.targetAudience).toBe(valid.targetAudience);
    });

    it('forces structured output via the `submit_blueprint` tool whose inputSchema is the Blueprint JSON Schema', async () => {
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

      await service.generateBlueprint(created.id, 'user-1');

      const call = skillRunner.run.mock.calls.at(-1)?.[0] as {
        tool?: { name: string; description?: string; inputSchema: Record<string, unknown> };
      };
      expect(call.tool).toBeDefined();
      expect(call.tool?.name).toBe('submit_blueprint');
      // Reuses the AJV-compiled schema — same shape the validator below enforces.
      expect(call.tool?.inputSchema).toBe(blueprintValidator.getSchema());
      // Sanity-check key required fields are present.
      expect((call.tool?.inputSchema as { required: string[] }).required).toEqual(
        expect.arrayContaining(['clientName', 'strategicSummary', 'contentChannelMatrix']),
      );
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

  // ---------------------------------------------------------------------------
  // Post-generation revision flow (#70)
  // ---------------------------------------------------------------------------

  describe('handleMessage in revision mode', () => {
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

    function seedCompletedSession(): OnboardingSessionState {
      const created = sessionStore.create('user-1');
      return sessionStore.update(created.id, {
        status: 'complete',
        blueprint: buildValidBlueprint(),
        completedAt: '2026-04-28T00:00:00.000Z',
      });
    }

    it('accepts messages while session.status is "complete"', async () => {
      const session = seedCompletedSession();
      skillRunner.run.mockResolvedValue(turnReply());

      await expect(
        service.handleMessage(session.id, 'user-1', 'Make the summary tighter', []),
      ).resolves.toBeTruthy();

      const stored = sessionStore.get(session.id);
      // User + assistant appended to the existing (post-generation) message log.
      expect(stored?.messages.at(-1)?.role).toBe('assistant');
      expect(stored?.messages.find((m) => m.content === 'Make the summary tighter')).toBeTruthy();
    });

    it('passes MODE: REVISION + existing blueprint JSON in additionalContext when complete', async () => {
      const session = seedCompletedSession();
      skillRunner.run.mockResolvedValue(turnReply());

      await service.handleMessage(session.id, 'user-1', 'Tweak voice attributes', []);

      const call = skillRunner.run.mock.calls.at(-1)?.[0] as {
        additionalContext: string;
      };
      expect(call.additionalContext).toContain('MODE: REVISION');
      // Blueprint JSON dump should be embedded so the LLM can reason about
      // which sections to revise.
      expect(call.additionalContext).toContain('"clientName": "Acme"');
      expect(call.additionalContext).toContain('"strategicSummary"');
    });

    it('still rejects messages when status is "generating"', async () => {
      const created = sessionStore.create('user-1');
      sessionStore.update(created.id, { status: 'generating' });
      await expect(
        service.handleMessage(created.id, 'user-1', 'hi', []),
      ).rejects.toThrow(/cannot send messages/i);
    });

    it('still rejects messages when status is "abandoned"', async () => {
      const created = sessionStore.create('user-1');
      sessionStore.update(created.id, { status: 'abandoned' });
      await expect(
        service.handleMessage(created.id, 'user-1', 'hi', []),
      ).rejects.toThrow(/cannot send messages/i);
    });

    it('propagates readyToRevise: true from the LLM into SendMessageResponseContract', async () => {
      const session = seedCompletedSession();
      skillRunner.run.mockResolvedValue(
        turnReply({ readyToRevise: true, agentMessage: 'Regenerating now…' }),
      );

      const res = await service.handleMessage(
        session.id,
        'user-1',
        'yes go ahead',
        [],
      );

      expect(res.readyToRevise).toBe(true);
    });

    it('does NOT echo readyToRevise when in active (discovery) mode', async () => {
      const created = sessionStore.create('user-1');
      // Even if the LLM mistakenly emits readyToRevise mid-discovery, the
      // service must not surface it: the flag is only meaningful after
      // generation has completed.
      skillRunner.run.mockResolvedValue(turnReply({ readyToRevise: true }));

      const res = await service.handleMessage(created.id, 'user-1', 'hi', []);
      expect(res.readyToRevise).toBeUndefined();
    });

    it('does NOT mutate discoveryData / sectionsCovered in revision mode', async () => {
      const session = seedCompletedSession();
      sessionStore.update(session.id, {
        discoveryData: { business: { businessName: 'Acme' } },
        sectionsCovered: ['business', 'brand_voice'],
      });
      // LLM erroneously claims to cover a new section — must be ignored.
      skillRunner.run.mockResolvedValue(
        turnReply({ sectionsCovered: ['audience'], sectionsUpdated: { audience: { fake: true } } }),
      );

      await service.handleMessage(session.id, 'user-1', 'edit summary', []);

      const stored = sessionStore.get(session.id);
      expect(stored?.sectionsCovered).toEqual(['business', 'brand_voice']);
      expect(stored?.discoveryData).toEqual({ business: { businessName: 'Acme' } });
    });
  });

  describe('generateBlueprint revision branch', () => {
    function seedCompletedSession(): OnboardingSessionState {
      const created = sessionStore.create('user-1');
      sessionStore.update(created.id, {
        discoveryData: { business: { businessName: 'Acme' } },
      });
      return sessionStore.update(created.id, {
        status: 'complete',
        blueprint: buildValidBlueprint(),
        completedAt: '2026-04-28T00:00:00.000Z',
        messages: [
          { id: 'u1', role: 'user', content: 'tighten the summary', timestamp: '2026-04-28T01:00:00.000Z' },
          { id: 'a1', role: 'assistant', content: 'Plan: I will trim the strategic summary…', timestamp: '2026-04-28T01:00:30.000Z' },
          { id: 'u2', role: 'user', content: 'yes go ahead', timestamp: '2026-04-28T01:01:00.000Z' },
          { id: 'a2', role: 'assistant', content: 'Regenerating now…', timestamp: '2026-04-28T01:01:30.000Z' },
        ],
      });
    }

    it('uses MODE: BLUEPRINT_REVISION and includes prior blueprint + post-completion messages in the prompt', async () => {
      const session = seedCompletedSession();
      const valid = buildValidBlueprint();
      valid.strategicSummary =
        'Acme: a brand-new tightened summary that still spans more than one hundred characters to satisfy the validator schema.';
      skillRunner.run.mockResolvedValue({
        content: '',
        parsed: valid as unknown as Record<string, unknown>,
        usage: { inputTokens: 0, outputTokens: 0 },
      });

      const res = await service.generateBlueprint(session.id, 'user-1');

      const call = skillRunner.run.mock.calls.at(-1)?.[0] as {
        additionalContext: string;
        conversationHistory: LlmMessage[];
      };
      expect(call.additionalContext).toContain('MODE: BLUEPRINT_REVISION');
      const userBlocks = call.conversationHistory[0].content as
        | string
        | LlmContentBlock[];
      const promptText =
        typeof userBlocks === 'string'
          ? userBlocks
          : (userBlocks.find((b) => b.type === 'text') as { text: string }).text;
      expect(promptText).toContain('EXISTING BLUEPRINT');
      expect(promptText).toContain('REVISION CONVERSATION SINCE GENERATION');
      // Slice should include only post-completion messages.
      expect(promptText).toContain('tighten the summary');
      expect(promptText).toContain('yes go ahead');
      // Prior blueprint embedded.
      expect(promptText).toContain('"strategicSummary"');

      // Returned blueprint reflects the new generation.
      expect(res.blueprint.strategicSummary).toContain('tightened summary');
    });

    it('preserves prior blueprint and resets status to "complete" when revision regen fails', async () => {
      const session = seedCompletedSession();
      const priorSummary = session.blueprint?.strategicSummary;
      skillRunner.run.mockRejectedValue(new Error('LLM exploded'));

      await expect(
        service.generateBlueprint(session.id, 'user-1'),
      ).rejects.toThrow(/LLM exploded/);

      const after = sessionStore.get(session.id);
      expect(after?.status).toBe('complete');
      expect(after?.blueprint?.strategicSummary).toBe(priorSummary);
    });

    it('first-time generation behaviour unchanged — uses BLUEPRINT_GENERATION mode and resets to "active" on failure', async () => {
      const created = sessionStore.create('user-1');
      sessionStore.update(created.id, {
        discoveryData: { business: { businessName: 'Acme' } },
      });
      // session.blueprint is null → generation mode
      skillRunner.run.mockRejectedValue(new Error('boom'));

      await expect(
        service.generateBlueprint(created.id, 'user-1'),
      ).rejects.toThrow(/boom/);

      const after = sessionStore.get(created.id);
      expect(after?.status).toBe('active');
      expect(after?.blueprint).toBeNull();

      // And on success the additionalContext is BLUEPRINT_GENERATION (not REVISION).
      const valid = buildValidBlueprint();
      skillRunner.run.mockResolvedValue({
        content: '',
        parsed: valid as unknown as Record<string, unknown>,
        usage: { inputTokens: 0, outputTokens: 0 },
      });
      await service.generateBlueprint(created.id, 'user-1');
      const call = skillRunner.run.mock.calls.at(-1)?.[0] as {
        additionalContext: string;
      };
      expect(call.additionalContext).toContain('MODE: BLUEPRINT_GENERATION');
      expect(call.additionalContext).not.toContain('MODE: BLUEPRINT_REVISION');
    });

    // ------------------------------------------------------------------
    // Ticket #72 — businessName fidelity in Blueprint generation
    // ------------------------------------------------------------------
    describe('businessName fidelity (#72)', () => {
      function blueprintWithBusinessName(name: string): BlueprintDocumentContract {
        const bp = buildValidBlueprint();
        // Pretend the LLM correctly references the businessName in the
        // two prose slots ticket #72 polices.
        bp.strategicSummary = `${name} is positioned to serve a long-form audience that satisfies the minLength validation guard for testing.`;
        bp.brandVoice.positioningStatement = `${name} stands for craft and clarity.`;
        return bp;
      }

      it('TC-U1: pins clientName to discovery businessName even when LLM returns a different name', async () => {
        const created = sessionStore.create('user-1');
        sessionStore.update(created.id, {
          discoveryData: { business: { businessName: 'Hive Collective' } },
        });

        // LLM hallucinates a different clientName but mentions the right
        // name in prose — no retry needed.
        const drifted = blueprintWithBusinessName('Hive Collective');
        drifted.clientName = 'Hive Fitness';
        skillRunner.run.mockResolvedValue({
          content: '',
          parsed: drifted as unknown as Record<string, unknown>,
          usage: { inputTokens: 0, outputTokens: 0 },
        });

        const res = await service.generateBlueprint(created.id, 'user-1');
        expect(res.blueprint.clientName).toBe('Hive Collective');
        expect(skillRunner.run).toHaveBeenCalledTimes(1);

        const after = sessionStore.get(created.id);
        expect(after?.blueprint?.clientName).toBe('Hive Collective');
      });

      it('TC-U2: retries once when strategicSummary omits businessName, succeeds on second attempt', async () => {
        const created = sessionStore.create('user-1');
        sessionStore.update(created.id, {
          discoveryData: { business: { businessName: 'Hive Collective' } },
        });

        const driftedSummary = blueprintWithBusinessName('Hive Collective');
        // First attempt: strategicSummary references the wrong name.
        driftedSummary.strategicSummary =
          'Hive Fitness is the long-form summary that exceeds one hundred characters to satisfy the minLength validation guard.';
        const cleanRetry = blueprintWithBusinessName('Hive Collective');

        skillRunner.run
          .mockResolvedValueOnce({
            content: '',
            parsed: driftedSummary as unknown as Record<string, unknown>,
            usage: { inputTokens: 0, outputTokens: 0 },
          })
          .mockResolvedValueOnce({
            content: '',
            parsed: cleanRetry as unknown as Record<string, unknown>,
            usage: { inputTokens: 0, outputTokens: 0 },
          });

        const warnSpy = vi.spyOn(service['logger'], 'warn');

        const res = await service.generateBlueprint(created.id, 'user-1');
        expect(skillRunner.run).toHaveBeenCalledTimes(2);
        expect(res.blueprint.strategicSummary).toContain('Hive Collective');
        expect(res.blueprint.clientName).toBe('Hive Collective');
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('blueprint-name-drift'),
        );
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('/strategicSummary'),
        );

        const after = sessionStore.get(created.id);
        expect(after?.status).toBe('complete');
        expect(after?.blueprint?.strategicSummary).toContain('Hive Collective');
      });

      it('TC-U3: throws 422 when both attempts drift, names the offending field, and resets session to active', async () => {
        const created = sessionStore.create('user-1');
        sessionStore.update(created.id, {
          discoveryData: { business: { businessName: 'Hive Collective' } },
        });

        const drift = blueprintWithBusinessName('Hive Collective');
        // Drift on positioningStatement — a different slot than TC-U2 to
        // confirm the validator surfaces whichever field fails first.
        drift.brandVoice.positioningStatement =
          'Hive Fitness stands for craft and clarity.';
        skillRunner.run.mockResolvedValue({
          content: '',
          parsed: drift as unknown as Record<string, unknown>,
          usage: { inputTokens: 0, outputTokens: 0 },
        });

        await expect(
          service.generateBlueprint(created.id, 'user-1'),
        ).rejects.toMatchObject({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          response: expect.objectContaining({
            message: expect.stringMatching(/business-name fidelity/i),
            errors: expect.arrayContaining([
              expect.objectContaining({
                field: '/brandVoice/positioningStatement',
              }),
            ]),
          }),
        });

        expect(skillRunner.run).toHaveBeenCalledTimes(2);

        const after = sessionStore.get(created.id);
        expect(after?.status).toBe('active');
        expect(after?.blueprint).toBeNull();
      });

      it('TC-U4: skips businessName override and prose check when discovery businessName is empty', async () => {
        const created = sessionStore.create('user-1');
        // No businessName — legacy/partial discovery.
        sessionStore.update(created.id, {
          discoveryData: { business: {} },
        });

        const llmBlueprint = buildValidBlueprint();
        llmBlueprint.clientName = 'Some Name';
        skillRunner.run.mockResolvedValue({
          content: '',
          parsed: llmBlueprint as unknown as Record<string, unknown>,
          usage: { inputTokens: 0, outputTokens: 0 },
        });

        const warnSpy = vi.spyOn(service['logger'], 'warn');

        const res = await service.generateBlueprint(created.id, 'user-1');
        expect(res.blueprint.clientName).toBe('Some Name');
        expect(skillRunner.run).toHaveBeenCalledTimes(1);
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('blueprint-name-fallback'),
        );
      });
    });

    // ------------------------------------------------------------------
    // Ticket #88 — parse / shape miss handling
    //
    // When the LLM returns un-parseable content (or parsed content missing
    // the required `strategicSummary`), the service used to throw a bare
    // `Error` that surfaced to the user as HTTP 500. It now logs a warn
    // with a truncated raw preview and either retries (revision mode or
    // first-time-with-businessName) or throws a structured 422 with a
    // user-facing message and `BLUEPRINT_PARSE_FAILED` error code.
    // ------------------------------------------------------------------
    describe('parse-miss handling (#88)', () => {
      it('TC-U1: revision mode — null parse on attempt 1, valid on attempt 2 → resolves and calls runner twice', async () => {
        const session = seedCompletedSession();
        const valid = buildValidBlueprint();
        valid.strategicSummary =
          'Acme: a freshly-applied revision summary that exceeds one hundred characters to satisfy the validator schema.';
        skillRunner.run
          .mockResolvedValueOnce({
            content: 'not json',
            parsed: null,
            usage: { inputTokens: 0, outputTokens: 0 },
          })
          .mockResolvedValueOnce({
            content: '',
            parsed: valid as unknown as Record<string, unknown>,
            usage: { inputTokens: 0, outputTokens: 0 },
          });

        const res = await service.generateBlueprint(session.id, 'user-1');
        expect(res.blueprint.strategicSummary).toContain('freshly-applied');
        expect(skillRunner.run).toHaveBeenCalledTimes(2);
      });

      it('TC-U2: revision mode — missing strategicSummary on attempt 1, valid on attempt 2 → resolves', async () => {
        const session = seedCompletedSession();
        const partial = buildValidBlueprint() as Partial<BlueprintDocumentContract>;
        delete partial.strategicSummary;
        const valid = buildValidBlueprint();
        valid.strategicSummary =
          'Acme: a freshly-applied revision summary that exceeds one hundred characters to satisfy the validator schema.';
        skillRunner.run
          .mockResolvedValueOnce({
            content: '{"clientName":"Acme"}',
            parsed: partial as Record<string, unknown>,
            usage: { inputTokens: 0, outputTokens: 0 },
          })
          .mockResolvedValueOnce({
            content: '',
            parsed: valid as unknown as Record<string, unknown>,
            usage: { inputTokens: 0, outputTokens: 0 },
          });

        const res = await service.generateBlueprint(session.id, 'user-1');
        expect(res.blueprint.strategicSummary).toContain('freshly-applied');
        expect(skillRunner.run).toHaveBeenCalledTimes(2);
      });

      it('TC-U3: revision mode — both attempts return null → 422 with BLUEPRINT_PARSE_FAILED, prior blueprint preserved', async () => {
        const session = seedCompletedSession();
        const priorSummary = session.blueprint?.strategicSummary;
        skillRunner.run.mockResolvedValue({
          content: 'still not json',
          parsed: null,
          usage: { inputTokens: 0, outputTokens: 0 },
        });

        await expect(
          service.generateBlueprint(session.id, 'user-1'),
        ).rejects.toMatchObject({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          response: expect.objectContaining({
            message: expect.stringMatching(/couldn't apply that revision/i),
            errors: expect.arrayContaining([
              expect.objectContaining({
                code: 'BLUEPRINT_PARSE_FAILED',
                attempts: 2,
              }),
            ]),
          }),
        });

        expect(skillRunner.run).toHaveBeenCalledTimes(2);

        const after = sessionStore.get(session.id);
        expect(after?.status).toBe('complete');
        expect(after?.blueprint?.strategicSummary).toBe(priorSummary);
      });

      it('TC-U4: revision mode — both attempts missing strategicSummary → 422, prior blueprint preserved', async () => {
        const session = seedCompletedSession();
        const priorSummary = session.blueprint?.strategicSummary;
        const partial = buildValidBlueprint() as Partial<BlueprintDocumentContract>;
        delete partial.strategicSummary;
        skillRunner.run.mockResolvedValue({
          content: '{"clientName":"Acme"}',
          parsed: partial as Record<string, unknown>,
          usage: { inputTokens: 0, outputTokens: 0 },
        });

        await expect(
          service.generateBlueprint(session.id, 'user-1'),
        ).rejects.toMatchObject({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          response: expect.objectContaining({
            message: expect.stringMatching(/couldn't apply that revision/i),
            errors: expect.arrayContaining([
              expect.objectContaining({
                code: 'BLUEPRINT_PARSE_FAILED',
                attempts: 2,
              }),
            ]),
          }),
        });

        const after = sessionStore.get(session.id);
        expect(after?.status).toBe('complete');
        expect(after?.blueprint?.strategicSummary).toBe(priorSummary);
      });

      it('TC-U5: first-time generation with businessName — null parse on attempt 1, valid on attempt 2 → resolves', async () => {
        const created = sessionStore.create('user-1');
        sessionStore.update(created.id, {
          discoveryData: { business: { businessName: 'Acme' } },
        });
        const valid = buildValidBlueprint();
        skillRunner.run
          .mockResolvedValueOnce({
            content: 'not json',
            parsed: null,
            usage: { inputTokens: 0, outputTokens: 0 },
          })
          .mockResolvedValueOnce({
            content: '',
            parsed: valid as unknown as Record<string, unknown>,
            usage: { inputTokens: 0, outputTokens: 0 },
          });

        const res = await service.generateBlueprint(created.id, 'user-1');
        expect(res.blueprint).toBeDefined();
        expect(skillRunner.run).toHaveBeenCalledTimes(2);
      });

      it('TC-U6: first-time generation without businessName — single attempt, parse miss → immediate 422 with attempts:1', async () => {
        const created = sessionStore.create('user-1');
        sessionStore.update(created.id, {
          discoveryData: { business: {} },
        });
        skillRunner.run.mockResolvedValue({
          content: 'not json',
          parsed: null,
          usage: { inputTokens: 0, outputTokens: 0 },
        });

        await expect(
          service.generateBlueprint(created.id, 'user-1'),
        ).rejects.toMatchObject({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          response: expect.objectContaining({
            message: expect.stringMatching(/couldn't generate the blueprint/i),
            errors: expect.arrayContaining([
              expect.objectContaining({
                code: 'BLUEPRINT_PARSE_FAILED',
                attempts: 1,
              }),
            ]),
          }),
        });
        expect(skillRunner.run).toHaveBeenCalledTimes(1);

        const after = sessionStore.get(created.id);
        // First-time gen failure — session reverts to 'active', no blueprint.
        expect(after?.status).toBe('active');
        expect(after?.blueprint).toBeNull();
      });

      it('TC-U7: parse miss logs a warn with truncated raw preview', async () => {
        const session = seedCompletedSession();
        const valid = buildValidBlueprint();
        valid.strategicSummary =
          'Acme: a freshly-applied revision summary that exceeds one hundred characters to satisfy the validator schema.';
        const longGarbage = 'x'.repeat(2000);
        skillRunner.run
          .mockResolvedValueOnce({
            content: longGarbage,
            parsed: null,
            usage: { inputTokens: 0, outputTokens: 0 },
          })
          .mockResolvedValueOnce({
            content: '',
            parsed: valid as unknown as Record<string, unknown>,
            usage: { inputTokens: 0, outputTokens: 0 },
          });

        const warnSpy = vi.spyOn(service['logger'], 'warn');
        await service.generateBlueprint(session.id, 'user-1');

        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('blueprint-parse-miss'),
        );
        // Truncation cap is 1000 chars — the warn message should not contain
        // the full 2000-char garbage string. We assert by checking that the
        // length is bounded (header + JSON-encoded 1000-char preview).
        const warnArgs = warnSpy.mock.calls.map((c) => String(c[0]));
        const found = warnArgs.find((s) => s.includes('blueprint-parse-miss'));
        expect(found).toBeDefined();
        expect(found!.length).toBeLessThan(1500);
        expect(found).toContain('mode=revision');
      });
    });

    it('stamps completedAt on first successful generation and preserves it across revisions', async () => {
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

      await service.generateBlueprint(created.id, 'user-1');
      const afterFirst = sessionStore.get(created.id);
      const firstCompletedAt = afterFirst?.completedAt;
      expect(firstCompletedAt).toBeTruthy();

      // Add a revision message so the slice has content, then regenerate.
      sessionStore.update(created.id, {
        messages: [
          ...(afterFirst?.messages ?? []),
          { id: 'u', role: 'user', content: 'tweak', timestamp: new Date().toISOString() },
        ],
      });

      const valid2 = buildValidBlueprint();
      valid2.strategicSummary =
        'Acme summary spanning well past the one-hundred-character minLength enforced by the validator service for tests.';
      skillRunner.run.mockResolvedValue({
        content: '',
        parsed: valid2 as unknown as Record<string, unknown>,
        usage: { inputTokens: 0, outputTokens: 0 },
      });
      await service.generateBlueprint(created.id, 'user-1');

      const afterSecond = sessionStore.get(created.id);
      expect(afterSecond?.completedAt).toBe(firstCompletedAt);
    });
  });

  // ---------------------------------------------------------------------
  // Ticket #89 — parseTurnResponse fallback no longer leaks JSON envelopes
  // ---------------------------------------------------------------------
  describe('parseTurnResponse fallback (#89)', () => {
    /** Reach the private method via bracket access. */
    function callParse(rawContent: string, parsed: Record<string, unknown> | null) {
      const fn = (
        service as unknown as {
          parseTurnResponse: (
            r: string,
            p: Record<string, unknown> | null,
          ) => { agentMessage: string };
        }
      ).parseTurnResponse.bind(service);
      return fn(rawContent, parsed);
    }

    it('returns the parsed object unchanged when the LLM provided clean JSON (regression)', () => {
      const result = callParse('', { agentMessage: 'all good', readyToGenerate: false });
      expect(result.agentMessage).toBe('all good');
    });

    it('extracts JSON wrapped in a ```json fence', () => {
      const wrapped = '```json\n{"agentMessage":"hello from a fenced block"}\n```';
      const result = callParse(wrapped, null);
      expect(result.agentMessage).toBe('hello from a fenced block');
    });

    it('recovers a partial agentMessage from a truncated JSON envelope', () => {
      // Stream cut mid-string: opening brace + key + value with escaped newlines
      // and an embedded escaped quote, but no closing quote / brace.
      const truncated =
        '{"agentMessage": "Hello\\n\\nworld with an \\"escaped\\" quote and more text';
      const result = callParse(truncated, null);

      expect(result.agentMessage).toContain('Hello');
      expect(result.agentMessage).toContain('world with an "escaped" quote');
      // Decoded newlines, not the literal `\n` escape sequence
      expect(result.agentMessage).toContain('\n\n');
      expect(result.agentMessage).not.toContain('\\n');
      // No envelope debris
      expect(result.agentMessage).not.toContain('{"agentMessage"');
      // Truncation footer appended
      expect(result.agentMessage).toContain(
        '[Response was truncated. Please continue the conversation.]',
      );
    });

    it('strips a nested {"agentMessage" substring if the model echoed its own envelope', () => {
      // Pathological case: model writes its own envelope inside its own message.
      const nested =
        '{"agentMessage": "Here is your reply.\\n\\nDebug: {"agentMessage": "ignored';
      const result = callParse(nested, null);
      expect(result.agentMessage).toContain('Here is your reply.');
      expect(result.agentMessage).not.toContain('{"agentMessage"');
    });

    it('falls back to the canned friendly message when no agentMessage can be recovered', () => {
      const garbage = '!! garbage stream {{{ no key here at all';
      const result = callParse(garbage, null);
      expect(result.agentMessage).toBe(
        'Sorry — my response was cut off before I could finish. Could you ask me to continue?',
      );
      expect(result.agentMessage).not.toContain('{');
      expect(result.agentMessage).not.toContain('agentMessage');
    });

    it('falls back to the canned friendly message when only an empty agentMessage was found', () => {
      const emptyMessage = '{"agentMessage": "';
      const result = callParse(emptyMessage, null);
      // Empty / whitespace-only recovery is treated as no-recovery so the user
      // sees the canned apology rather than just the truncation footer alone.
      expect(result.agentMessage).toBe(
        'Sorry — my response was cut off before I could finish. Could you ask me to continue?',
      );
    });
  });

  // ---------------------------------------------------------------------
  // Ticket #72 — wizard pre-fill sources from discovery, not Blueprint
  // ---------------------------------------------------------------------
  describe('createWorkspaceFromBlueprint workspaceName seeding (#72)', () => {
    let workspaceBuilder: { buildFromBlueprint: ReturnType<typeof vi.fn> };

    beforeEach(() => {
      // The module-level WorkspaceBuilderService is created with a vi.fn()
      // — recover it so we can assert call args from these tests.
      workspaceBuilder = (service as unknown as {
        workspaceBuilder: typeof workspaceBuilder;
      }).workspaceBuilder;
      workspaceBuilder.buildFromBlueprint.mockResolvedValue({
        workspaceId: 'ws-new',
        tenantId: 'tnt-new',
        wizardData: { general: { workspaceName: 'placeholder' } },
      });
    });

    it('TC-U5: passes discovery businessName as workspaceName even when blueprint.clientName drifted', async () => {
      const created = sessionStore.create('user-1');
      const drifted = buildValidBlueprint();
      drifted.clientName = 'Drift Name';
      sessionStore.update(created.id, {
        discoveryData: { business: { businessName: 'Hive Collective' } },
        status: 'complete',
        blueprint: drifted,
      });

      await service.createWorkspaceFromBlueprint(created.id, 'user-1');

      expect(workspaceBuilder.buildFromBlueprint).toHaveBeenCalledWith(
        drifted,
        'Hive Collective',
        'user-1',
        created.id,
        undefined,
      );
    });

    it('TC-U6: falls back to blueprint.clientName when discovery businessName is empty', async () => {
      const created = sessionStore.create('user-1');
      const bp = buildValidBlueprint();
      bp.clientName = 'Acme';
      sessionStore.update(created.id, {
        discoveryData: { business: {} },
        status: 'complete',
        blueprint: bp,
      });

      await service.createWorkspaceFromBlueprint(created.id, 'user-1');

      expect(workspaceBuilder.buildFromBlueprint).toHaveBeenCalledWith(
        bp,
        'Acme',
        'user-1',
        created.id,
        undefined,
      );
    });
  });
});
