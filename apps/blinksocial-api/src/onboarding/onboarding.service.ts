import {
  Injectable,
  Logger,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SkillRunnerService } from '../skills/skill-runner.service';
import { SessionStore, type OnboardingSessionState } from './session-store';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { UserService } from '../auth/user.service';
import { AgenticFilesystemService } from '../agentic-filesystem/agentic-filesystem.service';
import { BlueprintValidationService } from './blueprint-validation.service';
import {
  AttachmentExtractorService,
  type ExtractedAttachment,
} from './attachment-extractor.service';
import type {
  DiscoverySectionId,
  DiscoverySectionContract,
  CreateSessionResponseContract,
  SendMessageResponseContract,
  GetSessionResponseContract,
  GenerateBlueprintResponseContract,
  BlueprintDocumentContract,
  CreateWorkspaceFromBlueprintResponseContract,
  OnboardingMessageContract,
  OnboardingAttachmentContract,
} from '@blinksocial/contracts';
import type { LlmContentBlock, LlmMessage } from '../llm/llm-provider.interface';
import { WorkspaceBuilderService } from './workspace-builder.service';
import { renderBlueprintMarkdown } from '@blinksocial/core';

const SKILL_ID = 'onboarding-consultant';

/** Per-session ceiling on combined extracted-attachment text fed to the LLM. */
const MAX_EXTRACTED_TEXT_PER_SESSION = 100_000;
/** Maximum number of images carried forward to subsequent turns (FIFO). */
const MAX_IMAGES_CARRIED = 10;
/** Maximum textPreview length stored on the message attachment record. */
const TEXT_PREVIEW_CHARS = 280;
/** AFS namespace where attachment binaries live. */
const ATTACHMENT_NAMESPACE = 'onboarding-attachments';
/** AFS namespace where extracted-text sidecar JSON lives. */
const ATTACHMENT_TEXT_NAMESPACE = 'settings';
const ATTACHMENT_TEXT_PATH_PREFIX = 'onboarding-attachments-text';

interface AgentTurnResponse {
  agentMessage: string;
  sectionsUpdated?: Record<string, Record<string, unknown>>;
  sectionsCovered?: string[];
  readyToGenerate?: boolean;
  /**
   * Set by the LLM when it has just received explicit user confirmation of a
   * proposed revision plan in post-generation chat. Triggers an automatic
   * regeneration on the frontend.
   */
  readyToRevise?: boolean;
  currentSection?: string;
}

/**
 * Additional-context block fed to the LLM during post-generation revision
 * chat. Tells the agent (a) what the current Blueprint looks like, (b) the
 * two-step plan-then-confirm protocol it must follow, (c) how to handle
 * rollback requests, and (d) how to signal confirmation via the
 * `readyToRevise` flag in its JSON response.
 */
const REVISION_MODE_CONTEXT_HEADER = 'MODE: REVISION';
const REVISION_MODE_INSTRUCTIONS = [
  '',
  'You are now in REVISION mode. The Blueprint has already been generated and',
  'is shown to the user alongside this chat. Follow this protocol:',
  '',
  '1. If the user requests a change to the Blueprint, reply with a short prose',
  '   plan describing which sections you will revise and what will change. End',
  '   the message with an explicit confirmation question (e.g. "Shall I apply',
  '   these changes?"). Do NOT set readyToRevise on this turn.',
  '2. Only when the user clearly confirms the most recent plan (e.g. "yes",',
  '   "go ahead", "apply it", "looks good"), set "readyToRevise": true in your',
  '   JSON response and acknowledge briefly ("Regenerating your Blueprint now…").',
  '3. If the user asks to revert to a previous Blueprint, explain that this',
  '   version does not retain prior Blueprints, and offer to re-shape the',
  '   current one toward the previous form. Do NOT set readyToRevise.',
  '4. If the user asks a non-revision question, answer normally without',
  '   proposing a plan and without setting readyToRevise.',
  '',
  'Existing Blueprint (JSON):',
].join('\n');


/** A single inbound attachment as received by the controller. */
export interface IncomingAttachment {
  filename: string;
  mimeType: string;
  buffer: Buffer;
  sizeBytes: number;
}

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    private readonly skillRunner: SkillRunnerService,
    private readonly sessionStore: SessionStore,
    private readonly workspacesService: WorkspacesService,
    private readonly userService: UserService,
    private readonly fs: AgenticFilesystemService,
    private readonly workspaceBuilder: WorkspaceBuilderService,
    private readonly blueprintValidator: BlueprintValidationService,
    private readonly attachmentExtractor: AttachmentExtractorService,
  ) {}

  async createSession(
    userId: string,
    workspaceName: string,
    businessName?: string,
  ): Promise<CreateSessionResponseContract> {
    const session = this.sessionStore.create(userId);

    // Generate the initial greeting BEFORE creating the workspace on AFS.
    // This ensures we don't create orphan workspaces when the LLM call fails.
    const initialUserMessage = businessName
      ? `I'd like to start a discovery session for my business: ${businessName}`
      : `I'd like to start a discovery session for my business.`;

    const context = this.buildStateContext(session, businessName);
    const result = await this.skillRunner.run({
      skillId: SKILL_ID,
      conversationHistory: [
        { role: 'user', content: initialUserMessage },
      ],
      additionalContext: context,
    });

    const turnResponse = this.parseTurnResponse(result.content, result.parsed);

    // LLM succeeded — now create the workspace on AFS
    let workspaceId = '';
    let tenantId = '';
    try {
      const wsResponse = await this.workspacesService.createInStatus(
        workspaceName,
        'onboarding',
      );
      workspaceId = wsResponse.id;
      tenantId = wsResponse.tenantId;

      // Add user as Admin of the new workspace
      await this.userService.addWorkspaceAccess(userId, tenantId, 'Admin');

      this.sessionStore.update(session.id, {
        workspaceId,
        tenantId,
      });
    } catch (error) {
      this.logger.error('Failed to create onboarding workspace on AFS', error);
      // Continue without AFS — the session still works in-memory
    }

    // Save the initial messages
    const now = new Date().toISOString();
    const updatedSession = this.sessionStore.update(session.id, {
      messages: [
        {
          id: randomUUID(),
          role: 'user',
          content: initialUserMessage,
          timestamp: now,
        },
        {
          id: randomUUID(),
          role: 'assistant',
          content: turnResponse.agentMessage,
          timestamp: now,
        },
      ],
      currentSection:
        (turnResponse.currentSection as DiscoverySectionId) || 'business',
    });

    // Persist session to AFS (fire-and-forget)
    this.persistSessionToAfs(updatedSession);

    return {
      sessionId: session.id,
      workspaceId,
      status: 'active',
      initialMessage: turnResponse.agentMessage,
      sections: this.buildSectionsResponse(session),
    };
  }

  async handleMessage(
    sessionId: string,
    userId: string,
    content: string,
    incomingAttachments: IncomingAttachment[] = [],
  ): Promise<SendMessageResponseContract> {
    const session = this.sessionStore.get(sessionId);
    if (!session) {
      throw new BadRequestException('Session not found');
    }
    if (session.userId !== userId) {
      throw new BadRequestException('Session does not belong to this user');
    }
    // Accept messages while the session is gathering discovery data (`active`)
    // and after the Blueprint has been generated (`complete`) — the latter
    // drives the post-generation revision chat (#70). Reject `generating` to
    // avoid racing the LLM, and `abandoned` outright.
    if (session.status !== 'active' && session.status !== 'complete') {
      throw new BadRequestException(
        `Session is ${session.status}, cannot send messages`,
      );
    }
    const isRevisionMode = session.status === 'complete';

    const messageId = randomUUID();
    const now = new Date().toISOString();

    // 1. Process inbound attachments — validate, extract text, persist binary + sidecar.
    const persistedAttachments: OnboardingAttachmentContract[] = [];
    const newlyExtractedThisTurn = new Map<string, ExtractedAttachment>();
    for (const file of incomingAttachments) {
      try {
        this.attachmentExtractor.validate(file.filename, file.mimeType, file.sizeBytes);
        const extracted = await this.attachmentExtractor.extract(
          file.filename,
          file.mimeType,
          file.buffer,
        );
        const attId = randomUUID();
        const fileId = await this.uploadAttachmentBinary(
          session.tenantId,
          messageId,
          attId,
          file,
        );
        await this.uploadAttachmentText(session.tenantId, attId, extracted);
        const record: OnboardingAttachmentContract = {
          id: attId,
          filename: this.sanitizeFilename(file.filename),
          mimeType: file.mimeType,
          sizeBytes: file.sizeBytes,
          fileId,
          kind: extracted.kind,
          textPreview: extracted.text
            ? extracted.text.slice(0, TEXT_PREVIEW_CHARS)
            : undefined,
        };
        persistedAttachments.push(record);
        newlyExtractedThisTurn.set(attId, extracted);
      } catch (err) {
        if (err instanceof BadRequestException) {
          throw err;
        }
        this.logger.error(
          `Failed to process attachment "${file.filename}": ${err instanceof Error ? err.message : String(err)}`,
        );
        throw new BadRequestException(
          `File "${file.filename}" could not be processed.`,
        );
      }
    }

    // 2. Build the new user message and append to history.
    const userMessage: OnboardingMessageContract = {
      id: messageId,
      role: 'user',
      content,
      timestamp: now,
      ...(persistedAttachments.length > 0
        ? { attachments: persistedAttachments }
        : {}),
    };
    const updatedMessages = [...session.messages, userMessage];

    // 3. Assemble LLM conversation, replaying historical attachments as content blocks.
    const conversationHistory = await this.buildConversationHistory(
      session,
      updatedMessages,
      newlyExtractedThisTurn,
    );

    const stateContext = isRevisionMode
      ? this.buildRevisionStateContext(session)
      : this.buildStateContext(session);

    const result = await this.skillRunner.run({
      skillId: SKILL_ID,
      conversationHistory,
      additionalContext: stateContext,
    });

    const turnResponse = this.parseTurnResponse(result.content, result.parsed);

    // 4. Update discovery data — only meaningful during the discovery phase.
    //    In revision mode we never mutate discoveryData / sectionsCovered;
    //    the session has already passed those gates and the LLM's role is
    //    only to plan and apply Blueprint edits.
    const discoveryData = { ...session.discoveryData };
    let sectionsCovered = session.sectionsCovered;
    let readyToGenerate = session.readyToGenerate;

    if (!isRevisionMode) {
      if (turnResponse.sectionsUpdated) {
        for (const [sectionId, data] of Object.entries(
          turnResponse.sectionsUpdated,
        )) {
          discoveryData[sectionId] = {
            ...(discoveryData[sectionId] || {}),
            ...data,
          };
        }
      }

      sectionsCovered = [
        ...new Set([
          ...session.sectionsCovered,
          ...(turnResponse.sectionsCovered || []),
        ]),
      ] as DiscoverySectionId[];

      const allSectionIds: DiscoverySectionId[] = [
        'business',
        'brand_voice',
        'audience',
        'competitors',
        'content',
        'channels',
        'expectations',
      ];
      readyToGenerate =
        turnResponse.readyToGenerate === true &&
        allSectionIds.every((s) => sectionsCovered.includes(s));
    }

    // 5. Save updated state
    const assistantMessage: OnboardingMessageContract = {
      id: randomUUID(),
      role: 'assistant',
      content: turnResponse.agentMessage,
      timestamp: new Date().toISOString(),
    };
    const updatedSession = this.sessionStore.update(sessionId, {
      messages: [...updatedMessages, assistantMessage],
      discoveryData,
      sectionsCovered,
      currentSection:
        (turnResponse.currentSection as DiscoverySectionId) ||
        session.currentSection,
      readyToGenerate,
    });

    this.persistSessionToAfs(updatedSession);

    return {
      agentMessage: turnResponse.agentMessage,
      sections: this.buildSectionsResponse(updatedSession),
      currentSection: updatedSession.currentSection,
      readyToGenerate,
      ...(persistedAttachments.length > 0
        ? { messageAttachments: persistedAttachments }
        : {}),
      ...(isRevisionMode && turnResponse.readyToRevise === true
        ? { readyToRevise: true }
        : {}),
    };
  }

  async getSession(
    sessionId: string,
    userId: string,
  ): Promise<GetSessionResponseContract> {
    const session = this.sessionStore.get(sessionId);
    if (!session) {
      throw new BadRequestException('Session not found');
    }
    if (session.userId !== userId) {
      throw new BadRequestException('Session does not belong to this user');
    }

    return {
      sessionId: session.id,
      status: session.status,
      messages: session.messages,
      sections: this.buildSectionsResponse(session),
      currentSection: session.currentSection,
      readyToGenerate: session.readyToGenerate,
      blueprint: session.blueprint,
    };
  }

  async generateBlueprint(
    sessionId: string,
    userId: string,
  ): Promise<GenerateBlueprintResponseContract> {
    const session = this.sessionStore.get(sessionId);
    if (!session) {
      throw new BadRequestException('Session not found');
    }
    if (session.userId !== userId) {
      throw new BadRequestException('Session does not belong to this user');
    }

    // Detect revision mode: a prior Blueprint exists, so the user is asking us
    // to apply requested changes rather than generate from scratch. Preserves
    // the prior blueprint on failure (#70) so a transient LLM hiccup never
    // boots the user back to discovery.
    const isRevisionMode = session.blueprint !== null;
    const priorBlueprint = session.blueprint;

    this.sessionStore.update(sessionId, { status: 'generating' });

    try {
      // Pull historical attachment text + replay representative images to
      // ensure the Blueprint reflects uploaded materials.
      const attachmentBlocks = await this.buildBlueprintAttachmentBlocks(session);
      const businessName = this.getDiscoveryBusinessName(session);
      if (!businessName) {
        // Legacy/partial sessions: nothing to pin against, fall through to
        // the LLM-supplied clientName. Surface in logs so we can backfill.
        this.logger.warn(
          `blueprint-name-fallback session=${session.id} reason=missing-discovery-businessName`,
        );
      }
      const businessNameDirective = this.buildBusinessNameDirective(businessName);
      const basePromptText = isRevisionMode
        ? this.buildRevisionGenerationPrompt(session)
        : `Generate the Blink Blueprint document based on the following discovery data:\n\n${JSON.stringify(session.discoveryData, null, 2)}\n\nUse the blueprint-template.md instructions to create a comprehensive, tailored content strategy document. Return ONLY valid JSON matching the BlueprintDocumentContract schema.`;
      const promptText = businessNameDirective
        ? `${basePromptText}${businessNameDirective}`
        : basePromptText;

      const userBlocks: LlmContentBlock[] = [
        { type: 'text', text: promptText },
        ...attachmentBlocks,
      ];

      const baseAdditionalContext = isRevisionMode
        ? 'MODE: BLUEPRINT_REVISION\n\nThe user has confirmed a revision plan. Apply ONLY the changes implied by the revision conversation; preserve all unrelated Blueprint sections verbatim. Return a JSON object matching the blueprint schema exactly.'
        : 'MODE: BLUEPRINT_GENERATION\n\nYou are now in blueprint generation mode. Use the discovery data provided AND any uploaded attachment context to generate a complete Blink Blueprint content strategy document. Return a JSON object matching the blueprint schema exactly.';
      const additionalContext = businessNameDirective
        ? `${baseAdditionalContext}${businessNameDirective}`
        : baseAdditionalContext;

      // Run the skill, validate, and retry once on a recoverable miss.
      // Retry budget covers two distinct same-prompt-fixable failures:
      //   - prose drift on businessName (#72), and
      //   - parse / shape miss in the LLM response (#88) — verbose
      //     revision regens are the worst offenders here.
      // Schema and cross-field failures still 422 immediately (no retry).
      const MAX_ATTEMPTS = isRevisionMode || businessName ? 2 : 1;
      let blueprint: BlueprintDocumentContract | undefined;
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const result = await this.skillRunner.run({
          skillId: SKILL_ID,
          conversationHistory: [
            {
              role: 'user',
              content: attachmentBlocks.length > 0 ? userBlocks : userBlocks[0].type === 'text' ? userBlocks[0].text : '',
            },
          ],
          additionalContext,
          // No `maxTokens` cap — Blueprints must never be truncated for
          // verbose brands (#71). The provider applies the model's true
          // ceiling; usage is tracked via `result.usage`.
          temperature: 0.5,
        });

        blueprint = result.parsed as unknown as BlueprintDocumentContract;
        if (!blueprint || !blueprint.strategicSummary) {
          // Parse / shape miss — log a truncated preview of the raw model
          // output so we can diagnose post-hoc, then either retry on the
          // next attempt or throw a structured 422 if the budget is spent.
          const rawPreview = (result.content ?? '').slice(0, 1000);
          this.logger.warn(
            `blueprint-parse-miss session=${sessionId} attempt=${attempt} mode=${
              isRevisionMode ? 'revision' : 'generation'
            } rawPreview=${JSON.stringify(rawPreview)}`,
          );
          if (attempt < MAX_ATTEMPTS) {
            blueprint = undefined;
            continue;
          }
          throw new HttpException(
            {
              message: isRevisionMode
                ? "We couldn't apply that revision — please try rephrasing or try again."
                : "We couldn't generate the blueprint — please try again.",
              errors: [{ code: 'BLUEPRINT_PARSE_FAILED', attempts: attempt }],
            },
            HttpStatus.UNPROCESSABLE_ENTITY,
          );
        }

        // Pin clientName to the user-supplied businessName whenever we have
        // it — the LLM is not permitted to invent a different name. When
        // discovery is empty, preserve historical fallback (LLM value or
        // 'Client').
        if (businessName) {
          blueprint.clientName = businessName;
        } else if (!blueprint.clientName) {
          blueprint.clientName = 'Client';
        }
        // Always set deliveredDate to today — LLM may return stale dates
        blueprint.deliveredDate = new Date().toISOString().slice(0, 10);

        const validation = this.blueprintValidator.validate(blueprint);
        if (!validation.valid) {
          throw new HttpException(
            {
              message: 'Generated blueprint failed schema validation',
              errors: validation.errors,
            },
            HttpStatus.UNPROCESSABLE_ENTITY,
          );
        }

        // Cross-field guard (cannot be expressed in JSON Schema): every
        // content pillar MUST appear as a row in `contentChannelMatrix`,
        // and the row count must equal the pillar count. Without this,
        // the LLM occasionally drops a pillar from the matrix while
        // leaving the rest of the structure schema-valid (#71).
        const matrixError = this.validateContentChannelMatrix(blueprint);
        if (matrixError) {
          throw new HttpException(
            {
              message: 'Generated blueprint failed cross-field validation',
              errors: [matrixError],
            },
            HttpStatus.UNPROCESSABLE_ENTITY,
          );
        }

        if (!businessName) break;

        const drift = this.validateBusinessNameInProse(blueprint, businessName);
        if (!drift) break;

        this.logger.warn(
          `blueprint-name-drift businessName="${businessName}" field="${drift.field}" attempt=${attempt}`,
        );

        if (attempt >= MAX_ATTEMPTS) {
          throw new HttpException(
            {
              message: 'Generated blueprint failed business-name fidelity validation',
              errors: [drift],
            },
            HttpStatus.UNPROCESSABLE_ENTITY,
          );
        }
      }

      if (!blueprint) {
        // Defensive — every loop exit either sets `blueprint` or throws
        // an HttpException above. Surface as a structured 422 rather than
        // a bare Error so a regression here can never become a 500.
        throw new HttpException(
          {
            message: isRevisionMode
              ? "We couldn't apply that revision — please try rephrasing or try again."
              : "We couldn't generate the blueprint — please try again.",
            errors: [{ code: 'BLUEPRINT_PARSE_FAILED', attempts: MAX_ATTEMPTS }],
          },
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }

      const markdownDocument = renderBlueprintMarkdown(blueprint);

      // Stamp completedAt only on the FIRST successful generation, so the
      // post-completion "messages added since generation" slice (used by
      // future revision regenerations) stays anchored to the original
      // moment the Blueprint was finalised.
      const completedAt = session.completedAt ?? new Date().toISOString();
      const updatedSession = this.sessionStore.update(sessionId, {
        status: 'complete',
        blueprint,
        completedAt,
      });

      // Save blueprint.md to AFS and persist session (fire-and-forget)
      if (updatedSession.tenantId && this.fs.isConfigured()) {
        this.fs
          .uploadTextFile(
            updatedSession.tenantId,
            'settings',
            'blueprint.md',
            markdownDocument,
          )
          .catch((err) =>
            this.logger.error('Failed to save blueprint.md to AFS', err),
          );
      }
      this.persistSessionToAfs(updatedSession);

      return { blueprint, markdownDocument };
    } catch (error) {
      // Preserve the prior Blueprint when a revision regen fails so the user
      // keeps what they had. Without this, a transient LLM error during a
      // requested revision would silently destroy the previously-good
      // document and dump them back into discovery.
      if (isRevisionMode) {
        this.sessionStore.update(sessionId, {
          status: 'complete',
          blueprint: priorBlueprint,
        });
      } else {
        this.sessionStore.update(sessionId, { status: 'active' });
      }
      this.logger.error(
        `Blueprint generation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Compose the revision-regeneration LLM prompt: prior Blueprint, the
   * post-completion conversation slice, and the original discovery data
   * for grounding. Only invoked when `session.blueprint` is non-null.
   */
  private buildRevisionGenerationPrompt(
    session: OnboardingSessionState,
  ): string {
    const priorBlueprintJson = JSON.stringify(session.blueprint, null, 2);
    const revisionMessages = this.sliceMessagesAfterCompletion(session);
    const revisionTranscript = revisionMessages.length > 0
      ? revisionMessages
          .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
          .join('\n\n')
      : '(no post-completion messages — apply minimal edits inferred from context)';
    return [
      'Apply the following revision instructions to the existing Blueprint.',
      '',
      'EXISTING BLUEPRINT:',
      priorBlueprintJson,
      '',
      'REVISION CONVERSATION SINCE GENERATION:',
      revisionTranscript,
      '',
      'ORIGINAL DISCOVERY DATA (for grounding — do not duplicate or restate):',
      JSON.stringify(session.discoveryData, null, 2),
      '',
      'Return ONLY valid JSON matching the BlueprintDocumentContract schema.',
      'Preserve all sections that the revision conversation does not touch.',
    ].join('\n');
  }

  /**
   * Return only the messages added after the Blueprint was first generated
   * — i.e. the revision dialogue. Falls back to the empty array when the
   * session has no completion timestamp (defensive: should not happen in
   * the revision path, since `isRevisionMode` requires a stored blueprint).
   */
  private sliceMessagesAfterCompletion(
    session: OnboardingSessionState,
  ): OnboardingMessageContract[] {
    const cutoff = session.completedAt;
    if (!cutoff) return [];
    return session.messages.filter((m) => m.timestamp > cutoff);
  }

  async resumeSession(
    tenantId: string,
    userId: string,
  ): Promise<GetSessionResponseContract> {
    // Check if session is already in memory
    const existing = this.sessionStore.findByTenantId(tenantId);
    if (existing) {
      if (existing.userId !== userId) {
        throw new BadRequestException('Session does not belong to this user');
      }
      return {
        sessionId: existing.id,
        status: existing.status,
        messages: existing.messages,
        sections: this.buildSectionsResponse(existing),
        currentSection: existing.currentSection,
        readyToGenerate: existing.readyToGenerate,
        blueprint: existing.blueprint,
      };
    }

    // Load from AFS via workspace settings
    try {
      const content = await this.workspacesService.getSettings(tenantId, 'onboarding-session');
      if (!content || typeof content !== 'object' || !('id' in (content as Record<string, unknown>))) {
        throw new BadRequestException('No onboarding session found for this workspace');
      }

      const sessionData = content as OnboardingSessionState;
      if (sessionData.userId !== userId) {
        throw new BadRequestException('Session does not belong to this user');
      }

      // Restore into in-memory store
      this.sessionStore.restore(sessionData);

      return {
        sessionId: sessionData.id,
        status: sessionData.status,
        messages: sessionData.messages,
        sections: this.buildSectionsResponse(sessionData),
        currentSection: sessionData.currentSection,
        readyToGenerate: sessionData.readyToGenerate,
        blueprint: sessionData.blueprint,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Failed to resume session for tenant ${tenantId}`, error);
      throw new BadRequestException('Failed to load onboarding session');
    }
  }

  async createWorkspaceFromBlueprint(
    sessionId: string,
    userId: string,
  ): Promise<CreateWorkspaceFromBlueprintResponseContract> {
    const session = this.sessionStore.get(sessionId);
    if (!session) {
      throw new BadRequestException('Session not found');
    }
    if (session.userId !== userId) {
      throw new BadRequestException('Session does not belong to this user');
    }
    if (!session.blueprint) {
      throw new BadRequestException('Session does not have a blueprint yet');
    }

    // Source the workspace name from the user's discovery answer, not from
    // the post-LLM clientName, so a Blueprint-side rename (e.g. an LLM
    // substituting "Hive Fitness" for "Hive Collective") cannot leak into
    // the persisted workspace.
    const workspaceName =
      this.getDiscoveryBusinessName(session) ||
      session.blueprint.clientName ||
      'New Workspace';

    // Pass the existing onboarding tenant ID so the builder reuses it
    // instead of creating a duplicate workspace
    const result = await this.workspaceBuilder.buildFromBlueprint(
      session.blueprint,
      workspaceName,
      userId,
      session.id,
      session.tenantId,
    );

    // Add user as Admin of the new workspace
    await this.userService.addWorkspaceAccess(userId, result.tenantId, 'Admin');

    return result;
  }

  // ---------------------------------------------------------------------------
  // Attachment helpers
  // ---------------------------------------------------------------------------

  /**
   * Sanitize a user-supplied filename for filesystem storage. Strips path
   * separators and control characters; preserves basic readability.
   */
  private sanitizeFilename(name: string): string {
    // eslint-disable-next-line no-control-regex -- intentionally strip control bytes
    return name.replace(/[\\/\x00-\x1f]/g, '_').slice(0, 200);
  }

  private async uploadAttachmentBinary(
    tenantId: string | undefined,
    messageId: string,
    attachmentId: string,
    file: IncomingAttachment,
  ): Promise<string> {
    if (!tenantId || !this.fs.isConfigured()) {
      // No AFS configured — return a synthetic id so the session record is
      // still well-formed; binary won't survive process restart.
      return `local-${attachmentId}`;
    }
    const safeName = `${attachmentId}__${this.sanitizeFilename(file.filename)}`;
    try {
      const result = await this.fs.uploadBinaryFile(
        tenantId,
        ATTACHMENT_NAMESPACE,
        safeName,
        file.mimeType,
        file.buffer,
        [`messageId:${messageId}`],
      );
      return result.file_id;
    } catch (err) {
      this.logger.error(
        `Failed to upload attachment binary "${file.filename}" for tenant ${tenantId}: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw new BadRequestException(
        `Could not store "${file.filename}". Please try again.`,
      );
    }
  }

  private async uploadAttachmentText(
    tenantId: string | undefined,
    attachmentId: string,
    extracted: ExtractedAttachment,
  ): Promise<void> {
    if (!extracted.text || !tenantId || !this.fs.isConfigured()) {
      return;
    }
    try {
      await this.fs.uploadJsonFile(
        tenantId,
        ATTACHMENT_TEXT_NAMESPACE,
        `${ATTACHMENT_TEXT_PATH_PREFIX}-${attachmentId}.json`,
        { text: extracted.text, truncated: extracted.truncated ?? false },
      );
    } catch (err) {
      this.logger.warn(
        `Failed to upload attachment text sidecar for ${attachmentId}: ${err instanceof Error ? err.message : String(err)}`,
      );
      // Non-fatal — chip preview still works from the in-memory copy this turn.
    }
  }

  /**
   * Look up the cached extracted text for a previously-uploaded attachment.
   * Returns `undefined` if AFS is not configured, the sidecar is missing, or
   * the read fails — callers should fall back to the chip's textPreview.
   */
  private async loadAttachmentText(
    tenantId: string | undefined,
    attachmentId: string,
  ): Promise<string | undefined> {
    if (!tenantId || !this.fs.isConfigured()) {
      return undefined;
    }
    try {
      const settings = await this.workspacesService.getSettings(
        tenantId,
        `${ATTACHMENT_TEXT_PATH_PREFIX}-${attachmentId}`,
      );
      if (settings && typeof settings === 'object' && 'text' in settings) {
        return String((settings as { text: unknown }).text ?? '');
      }
    } catch {
      // Settle for textPreview in this case.
    }
    return undefined;
  }

  /**
   * Build the full LLM conversation: text-only history for older messages,
   * with attachment content blocks added to (a) any prior message that had
   * attachments (text/image carry-forward), and (b) the latest user turn
   * where new uploads are still in their full form.
   *
   * Caps applied:
   *  - At most {@link MAX_IMAGES_CARRIED} most-recent images survive.
   *  - Combined extracted text capped at
   *    {@link MAX_EXTRACTED_TEXT_PER_SESSION} chars (FIFO drop oldest).
   *  - PDFs from prior turns downgrade to their extracted text (the doc
   *    block only travels on the turn it was uploaded).
   */
  private async buildConversationHistory(
    session: OnboardingSessionState,
    messages: OnboardingMessageContract[],
    newlyExtractedThisTurn: Map<string, ExtractedAttachment>,
  ): Promise<LlmMessage[]> {
    // First pass: collect all attachments in chronological order.
    type AttachmentEntry = {
      messageIdx: number;
      record: OnboardingAttachmentContract;
      isCurrentTurn: boolean;
    };
    const allAttachments: AttachmentEntry[] = [];
    messages.forEach((msg, idx) => {
      for (const att of msg.attachments ?? []) {
        allAttachments.push({
          messageIdx: idx,
          record: att,
          isCurrentTurn: newlyExtractedThisTurn.has(att.id),
        });
      }
    });

    // Image cap: keep the most-recent N images, drop older ones from the
    // outbound LLM payload (they remain on the session record for the UI).
    const imageEntries = allAttachments.filter((a) => a.record.kind === 'image');
    const droppedImageIds = new Set<string>();
    if (imageEntries.length > MAX_IMAGES_CARRIED) {
      for (const e of imageEntries.slice(0, imageEntries.length - MAX_IMAGES_CARRIED)) {
        droppedImageIds.add(e.record.id);
      }
      this.logger.warn(
        `Dropping ${droppedImageIds.size} oldest image attachment(s) from LLM context (cap=${MAX_IMAGES_CARRIED}).`,
      );
    }

    // Text budget: walk newest → oldest, accumulate until cap.
    const textEntries = allAttachments.filter(
      (a) => a.record.kind === 'pdf' || a.record.kind === 'document' || a.record.kind === 'text',
    );
    let usedTextBudget = 0;
    const truncatedTextIds = new Set<string>();
    const includedTextById = new Map<string, string>();
    for (let i = textEntries.length - 1; i >= 0; i--) {
      const entry = textEntries[i];
      const text = await this.resolveAttachmentText(
        session.tenantId,
        entry.record,
        newlyExtractedThisTurn,
      );
      if (!text) continue;
      const remaining = MAX_EXTRACTED_TEXT_PER_SESSION - usedTextBudget;
      if (remaining <= 0) {
        truncatedTextIds.add(entry.record.id);
        continue;
      }
      const slice = text.length > remaining ? text.slice(0, remaining) : text;
      includedTextById.set(entry.record.id, slice);
      usedTextBudget += slice.length;
      if (slice.length < text.length) {
        truncatedTextIds.add(entry.record.id);
      }
    }
    if (truncatedTextIds.size > 0) {
      this.logger.warn(
        `Truncated ${truncatedTextIds.size} attachment text payload(s) at ${MAX_EXTRACTED_TEXT_PER_SESSION}-char per-session cap.`,
      );
    }

    // Build the per-message LLM payloads.
    const llmMessages: LlmMessage[] = [];
    for (let idx = 0; idx < messages.length; idx++) {
      const msg = messages[idx];
      const role = msg.role;
      const messageAttachments = (msg.attachments ?? []).filter((a) => {
        if (a.kind === 'image') return !droppedImageIds.has(a.id);
        return true;
      });

      if (messageAttachments.length === 0) {
        llmMessages.push({ role, content: msg.content });
        continue;
      }

      const blocks: LlmContentBlock[] = [];
      if (msg.content && msg.content.trim().length > 0) {
        blocks.push({ type: 'text', text: msg.content });
      }
      for (const att of messageAttachments) {
        if (att.kind === 'image') {
          const imgBlock = await this.attachmentImageBlock(
            session.tenantId,
            att,
            newlyExtractedThisTurn,
          );
          if (imgBlock) blocks.push(imgBlock);
        } else if (att.kind === 'pdf') {
          // Doc block only on the turn it was uploaded; later turns degrade
          // to the extracted text included via includedTextById below.
          if (newlyExtractedThisTurn.has(att.id)) {
            const docBlock = await this.attachmentDocumentBlock(
              session.tenantId,
              att,
              newlyExtractedThisTurn,
            );
            if (docBlock) blocks.push(docBlock);
          }
        }
        const includedText = includedTextById.get(att.id);
        if (includedText) {
          blocks.push({
            type: 'text',
            text: `[Attachment: ${att.filename}]\n${includedText}`,
          });
        }
      }

      if (blocks.length === 0) {
        // Fall back to plain string so we never emit an empty content array.
        llmMessages.push({ role, content: msg.content });
      } else {
        llmMessages.push({ role, content: blocks });
      }
    }

    return llmMessages;
  }

  private async resolveAttachmentText(
    tenantId: string | undefined,
    record: OnboardingAttachmentContract,
    newlyExtractedThisTurn: Map<string, ExtractedAttachment>,
  ): Promise<string | undefined> {
    const fresh = newlyExtractedThisTurn.get(record.id);
    if (fresh?.text) return fresh.text;
    const cached = await this.loadAttachmentText(tenantId, record.id);
    if (cached) return cached;
    return record.textPreview;
  }

  private async attachmentImageBlock(
    tenantId: string | undefined,
    record: OnboardingAttachmentContract,
    newlyExtractedThisTurn: Map<string, ExtractedAttachment>,
  ): Promise<LlmContentBlock | null> {
    const buffer = await this.loadAttachmentBinary(
      tenantId,
      record,
      newlyExtractedThisTurn,
    );
    if (!buffer) return null;
    return {
      type: 'image',
      mediaType: record.mimeType || 'image/png',
      base64Data: buffer.toString('base64'),
    };
  }

  private async attachmentDocumentBlock(
    tenantId: string | undefined,
    record: OnboardingAttachmentContract,
    newlyExtractedThisTurn: Map<string, ExtractedAttachment>,
  ): Promise<LlmContentBlock | null> {
    const buffer = await this.loadAttachmentBinary(
      tenantId,
      record,
      newlyExtractedThisTurn,
    );
    if (!buffer) return null;
    return {
      type: 'document',
      mediaType: 'application/pdf',
      base64Data: buffer.toString('base64'),
    };
  }

  private async loadAttachmentBinary(
    tenantId: string | undefined,
    record: OnboardingAttachmentContract,
    newlyExtractedThisTurn: Map<string, ExtractedAttachment>,
  ): Promise<Buffer | null> {
    // No binary kept on the in-memory extraction record — we always re-read
    // from AFS so the stateless path is identical for current + historical.
    if (!tenantId || !this.fs.isConfigured()) {
      // Without AFS we cannot replay binary content on subsequent turns;
      // fall through to text fallback.
      void newlyExtractedThisTurn;
      return null;
    }
    try {
      return await this.fs.downloadBinaryFile(tenantId, record.fileId);
    } catch (err) {
      this.logger.warn(
        `Failed to fetch attachment ${record.id} (${record.filename}) for LLM replay: ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    }
  }

  /**
   * Build content blocks summarising all session attachments for the
   * blueprint-generation prompt: a text manifest + image replays (capped).
   */
  private async buildBlueprintAttachmentBlocks(
    session: OnboardingSessionState,
  ): Promise<LlmContentBlock[]> {
    const records = session.messages.flatMap((m) => m.attachments ?? []);
    if (records.length === 0) return [];

    const manifestLines: string[] = [
      '',
      '## Uploaded reference materials',
      '',
    ];
    for (const r of records) {
      const cached = await this.loadAttachmentText(session.tenantId, r.id);
      const snippet = (cached ?? r.textPreview ?? '').slice(0, 2000);
      manifestLines.push(`### ${r.filename} (${r.kind})`);
      if (snippet) {
        manifestLines.push(snippet);
      } else {
        manifestLines.push('_(binary asset — see image content blocks below)_');
      }
      manifestLines.push('');
    }
    const blocks: LlmContentBlock[] = [
      { type: 'text', text: manifestLines.join('\n') },
    ];

    // Replay up to 10 images.
    const images = records.filter((r) => r.kind === 'image').slice(-MAX_IMAGES_CARRIED);
    for (const img of images) {
      const block = await this.attachmentImageBlock(
        session.tenantId,
        img,
        new Map(),
      );
      if (block) blocks.push(block);
    }
    return blocks;
  }

  // ---------------------------------------------------------------------------
  // Existing helpers (unchanged behaviour)
  // ---------------------------------------------------------------------------

  private persistSessionToAfs(session: OnboardingSessionState): void {
    if (!session.tenantId || !this.fs.isConfigured()) {
      this.logger.debug(
        `Skipping AFS persist: tenantId=${session.tenantId}, configured=${this.fs.isConfigured()}`,
      );
      return;
    }

    this.logger.debug(`Persisting session ${session.id} to AFS tenant ${session.tenantId}`);
    this.fs
      .uploadJsonFile(
        session.tenantId,
        'settings',
        'onboarding-session.json',
        session,
      )
      .then(() => this.logger.debug(`Session ${session.id} persisted to AFS`))
      .catch((err) =>
        this.logger.error(
          `Failed to persist session ${session.id} to AFS: ${err?.message ?? err}`,
          err?.response?.data ?? err?.stack,
        ),
      );
  }

  private buildStateContext(
    session: OnboardingSessionState,
    businessName?: string,
  ): string {
    const lines: string[] = [];
    if (businessName) {
      lines.push(`Business Name: ${businessName}`);
    }
    lines.push(`Sections Covered: ${session.sectionsCovered.join(', ') || 'none'}`);
    lines.push(`Current Section: ${session.currentSection}`);
    lines.push(`Ready to Generate: ${session.readyToGenerate}`);

    if (Object.keys(session.discoveryData).length > 0) {
      lines.push(
        `\nDiscovery Data Gathered:\n${JSON.stringify(session.discoveryData, null, 2)}`,
      );
    }

    return lines.join('\n');
  }

  /**
   * Build the additional-context block fed to the LLM in REVISION mode.
   * Composes the protocol header (plan-then-confirm, rollback handling,
   * `readyToRevise` signalling) with a JSON dump of the current Blueprint
   * so the agent can reason precisely about which sections to change.
   */
  private buildRevisionStateContext(session: OnboardingSessionState): string {
    const blueprintJson = session.blueprint
      ? JSON.stringify(session.blueprint, null, 2)
      : '{}';
    return `${REVISION_MODE_CONTEXT_HEADER}\n${REVISION_MODE_INSTRUCTIONS}\n${blueprintJson}`;
  }

  private parseTurnResponse(
    rawContent: string,
    parsed: Record<string, unknown> | null,
  ): AgentTurnResponse {
    if (parsed && typeof parsed['agentMessage'] === 'string') {
      return parsed as unknown as AgentTurnResponse;
    }

    // Try harder: extract JSON from the raw content (may be wrapped in markdown)
    const jsonPatterns = [
      /```json\s*\n?([\s\S]*?)\n?```/,
      /```\s*\n?([\s\S]*?)\n?```/,
      /(\{[\s\S]*"agentMessage"[\s\S]*\})/,
    ];

    for (const pattern of jsonPatterns) {
      const match = rawContent.match(pattern);
      if (match) {
        try {
          const extracted = JSON.parse(match[1].trim());
          if (extracted && typeof extracted.agentMessage === 'string') {
            this.logger.debug('Extracted JSON from raw LLM response via pattern match');
            return extracted as AgentTurnResponse;
          }
        } catch {
          // Continue to next pattern
        }
      }
    }

    // Final fallback: treat the entire response as the agent message
    this.logger.warn(
      'LLM response was not valid JSON — using raw content as agent message',
    );
    const truncated = rawContent.length > 1500
      ? rawContent.substring(0, 1500) + '\n\n[Response was truncated. Please continue the conversation.]'
      : rawContent;
    return {
      agentMessage: truncated,
      sectionsUpdated: {},
      sectionsCovered: [],
      readyToGenerate: false,
      currentSection: 'business',
    };
  }

  private buildSectionsResponse(
    session: OnboardingSessionState,
  ): DiscoverySectionContract[] {
    const sectionDefs: { id: DiscoverySectionId; name: string }[] = [
      { id: 'business', name: 'Business Overview' },
      { id: 'brand_voice', name: 'Brand & Voice' },
      { id: 'audience', name: 'Audience' },
      { id: 'competitors', name: 'Competitors' },
      { id: 'content', name: 'Content Strategy' },
      { id: 'channels', name: 'Channels & Capacity' },
      { id: 'expectations', name: 'Expectations & Goals' },
    ];

    return sectionDefs.map((s) => ({
      id: s.id,
      name: s.name,
      covered: session.sectionsCovered.includes(s.id),
    }));
  }

  /**
   * Read the user-supplied business name from discovery state. Returns
   * `undefined` when the field is missing, non-string, or whitespace-only —
   * the only signal the LLM-pin / prose-validation path uses to decide
   * whether to enforce business-name fidelity for this session.
   */
  private getDiscoveryBusinessName(
    session: OnboardingSessionState,
  ): string | undefined {
    const raw = session.discoveryData?.['business']?.['businessName'];
    if (typeof raw !== 'string') return undefined;
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  /**
   * Build the verbatim-required businessName instruction appended to both
   * the user prompt and the additionalContext (system prompt). Empty when
   * no businessName is present so legacy sessions are unaffected.
   */
  private buildBusinessNameDirective(businessName: string | undefined): string {
    if (!businessName) return '';
    return [
      '',
      '',
      'BUSINESS NAME PIN (non-negotiable):',
      `The user-supplied business name is exactly "${businessName}". Use this exact`,
      'string — including casing, spacing, and punctuation — for `clientName` and',
      'EVERY prose mention of the company in the Blueprint (Strategic Summary,',
      'Brand & Voice positioning statement, audience profiles, and any other',
      'reference). Do NOT paraphrase, abbreviate, translate, summarize, or',
      'substitute any other name. The Strategic Summary and the Brand & Voice',
      `positioning statement MUST contain the literal string "${businessName}".`,
    ].join('\n');
  }

  /**
   * Verify that the two prose slots called out by ticket #72 reference the
   * user-supplied businessName byte-for-byte. Returns the first failing
   * field as a `{field, message}` pair, or `null` when both slots pass.
   * Case-sensitive by design: the AC requires byte-for-byte fidelity.
   */
  private validateBusinessNameInProse(
    blueprint: BlueprintDocumentContract,
    businessName: string,
  ): { field: string; message: string } | null {
    const summary =
      typeof blueprint.strategicSummary === 'string'
        ? blueprint.strategicSummary
        : '';
    if (!summary.includes(businessName)) {
      return {
        field: '/strategicSummary',
        message: `Strategic Summary must reference the business name "${businessName}" verbatim.`,
      };
    }
    const positioning =
      typeof blueprint.brandVoice?.positioningStatement === 'string'
        ? blueprint.brandVoice.positioningStatement
        : '';
    if (!positioning.includes(businessName)) {
      return {
        field: '/brandVoice/positioningStatement',
        message: `Positioning Statement must reference the business name "${businessName}" verbatim.`,
      };
    }
    return null;
  }

  /**
   * Cross-field guard for `contentChannelMatrix`. JSON Schema can validate
   * the row shape but cannot enforce that every `contentPillars[].name`
   * appears as a `pillar` in the matrix and that the row count matches.
   *
   * Returns `null` when the matrix is consistent with the pillar list, or
   * a `ValidationErrorContract`-shaped object when it isn't (caller wraps
   * it in a 422 HttpException).
   */
  private validateContentChannelMatrix(
    bp: BlueprintDocumentContract,
  ): { field: string; message: string } | null {
    const pillars = bp.contentPillars?.map((p) => p.name) ?? [];
    const rows = bp.contentChannelMatrix?.map((r) => r.pillar) ?? [];
    if (rows.length !== pillars.length) {
      return {
        field: '/contentChannelMatrix',
        message: `Expected ${pillars.length} rows (one per content pillar), received ${rows.length}.`,
      };
    }
    const rowSet = new Set(rows);
    const missing = pillars.filter((p) => !rowSet.has(p));
    if (missing.length > 0) {
      return {
        field: '/contentChannelMatrix',
        message: `Missing rows for pillars: ${missing.join(', ')}.`,
      };
    }
    return null;
  }
}
