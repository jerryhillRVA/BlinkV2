import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SkillRunnerService } from '../skills/skill-runner.service';
import { SessionStore, type OnboardingSessionState } from './session-store';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { UserService } from '../auth/user.service';
import { AgenticFilesystemService } from '../agentic-filesystem/agentic-filesystem.service';
import type {
  DiscoverySectionId,
  DiscoverySectionContract,
  DISCOVERY_SECTIONS,
  DISCOVERY_SECTION_IDS,
  CreateSessionResponseContract,
  SendMessageResponseContract,
  GetSessionResponseContract,
  GenerateBlueprintResponseContract,
  BlueprintDocumentContract,
  CreateWorkspaceFromBlueprintResponseContract,
} from '@blinksocial/contracts';
import { WorkspaceBuilderService } from './workspace-builder.service';

const SKILL_ID = 'onboarding-consultant';

interface AgentTurnResponse {
  agentMessage: string;
  sectionsUpdated?: Record<string, Record<string, unknown>>;
  sectionsCovered?: string[];
  readyToGenerate?: boolean;
  currentSection?: string;
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
        { role: 'user', content: initialUserMessage, timestamp: now },
        {
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
  ): Promise<SendMessageResponseContract> {
    const session = this.sessionStore.get(sessionId);
    if (!session) {
      throw new BadRequestException('Session not found');
    }
    if (session.userId !== userId) {
      throw new BadRequestException('Session does not belong to this user');
    }
    if (session.status !== 'active') {
      throw new BadRequestException(
        `Session is ${session.status}, cannot send messages`,
      );
    }

    const now = new Date().toISOString();
    const updatedMessages = [
      ...session.messages,
      { role: 'user' as const, content, timestamp: now },
    ];

    // Build conversation history for the LLM
    const conversationHistory = updatedMessages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const stateContext = this.buildStateContext(session);

    const result = await this.skillRunner.run({
      skillId: SKILL_ID,
      conversationHistory,
      additionalContext: stateContext,
    });

    const turnResponse = this.parseTurnResponse(result.content, result.parsed);

    // Update discovery data
    const discoveryData = { ...session.discoveryData };
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

    // Update sections covered (only grows, never shrinks)
    const sectionsCovered = [
      ...new Set([
        ...session.sectionsCovered,
        ...(turnResponse.sectionsCovered || []),
      ]),
    ] as DiscoverySectionId[];

    // Validate readyToGenerate — all 7 sections must be covered
    const allSectionIds: DiscoverySectionId[] = [
      'business',
      'brand_voice',
      'audience',
      'competitors',
      'content',
      'channels',
      'expectations',
    ];
    const readyToGenerate =
      turnResponse.readyToGenerate === true &&
      allSectionIds.every((s) => sectionsCovered.includes(s));

    // Save updated state
    const updatedSession = this.sessionStore.update(sessionId, {
      messages: [
        ...updatedMessages,
        {
          role: 'assistant',
          content: turnResponse.agentMessage,
          timestamp: new Date().toISOString(),
        },
      ],
      discoveryData,
      sectionsCovered,
      currentSection:
        (turnResponse.currentSection as DiscoverySectionId) ||
        session.currentSection,
      readyToGenerate,
    });

    // Persist session to AFS (fire-and-forget)
    this.persistSessionToAfs(updatedSession);

    return {
      agentMessage: turnResponse.agentMessage,
      sections: this.buildSectionsResponse(updatedSession),
      currentSection: updatedSession.currentSection,
      readyToGenerate,
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

    this.sessionStore.update(sessionId, { status: 'generating' });

    try {
      const result = await this.skillRunner.run({
        skillId: SKILL_ID,
        conversationHistory: [
          {
            role: 'user',
            content: `Generate the Blink Blueprint document based on the following discovery data:\n\n${JSON.stringify(session.discoveryData, null, 2)}\n\nUse the blueprint-template.md instructions to create a comprehensive, tailored content strategy document. Return ONLY valid JSON matching the BlueprintDocumentContract schema.`,
          },
        ],
        additionalContext:
          'MODE: BLUEPRINT_GENERATION\n\nYou are now in blueprint generation mode. Use the discovery data provided to generate a complete Blink Blueprint content strategy document. Return a JSON object matching the blueprint schema exactly.',
        maxTokens: 8192,
        temperature: 0.5,
      });

      const blueprint = result.parsed as unknown as BlueprintDocumentContract;
      if (!blueprint || !blueprint.strategicSummary) {
        throw new Error('Blueprint generation returned invalid data');
      }

      // Set defaults if missing
      if (!blueprint.clientName) {
        blueprint.clientName =
          (session.discoveryData['business']?.['businessName'] as string) ||
          'Client';
      }
      // Always set deliveredDate to today — LLM may return stale dates
      blueprint.deliveredDate = new Date().toISOString().slice(0, 10);

      const markdownDocument = this.renderBlueprintMarkdown(blueprint);

      const updatedSession = this.sessionStore.update(sessionId, {
        status: 'complete',
        blueprint,
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
      this.sessionStore.update(sessionId, { status: 'active' });
      this.logger.error(
        `Blueprint generation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
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

    const workspaceName =
      session.blueprint.clientName || 'New Workspace';

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

  private renderBlueprintMarkdown(
    bp: BlueprintDocumentContract,
  ): string {
    const lines: string[] = [];

    lines.push(`# THE BLINK BLUEPRINT`);
    lines.push('');
    lines.push(`**Prepared for:** ${bp.clientName}`);
    lines.push(`**Delivered:** ${bp.deliveredDate}`);
    lines.push('');
    lines.push('---');
    lines.push('');

    // Strategic Summary
    lines.push('## Strategic Summary');
    lines.push('');
    lines.push(bp.strategicSummary);
    lines.push('');

    // Business Objectives
    lines.push('## Business Objectives');
    lines.push('');
    for (const obj of bp.businessObjectives) {
      lines.push(
        `- **${obj.objective}** (${obj.category}) — ${obj.timeHorizon} — *${obj.metric}*`,
      );
    }
    lines.push('');

    // Brand & Voice
    lines.push('## Brand & Voice');
    lines.push('');
    lines.push(`> ${bp.brandVoice.positioningStatement}`);
    lines.push('');
    lines.push(`**Content Mission:** ${bp.brandVoice.contentMission}`);
    lines.push('');
    lines.push('### Voice Attributes');
    lines.push('');
    for (const attr of bp.brandVoice.voiceAttributes) {
      lines.push(`- **${attr.attribute}:** ${attr.description}`);
    }
    lines.push('');
    lines.push('### Do');
    for (const item of bp.brandVoice.doList) {
      lines.push(`- ${item}`);
    }
    lines.push('');
    lines.push("### Don't");
    for (const item of bp.brandVoice.dontList) {
      lines.push(`- ${item}`);
    }
    lines.push('');

    // Audience
    lines.push('## Audience Profiles');
    lines.push('');
    for (const aud of bp.audienceProfiles) {
      lines.push(`### ${aud.name}`);
      lines.push(`**Demographics:** ${aud.demographics}`);
      lines.push(`**Pain Points:** ${aud.painPoints.join(', ')}`);
      lines.push(`**Channels:** ${aud.channels.join(', ')}`);
      lines.push(`**Content Hook:** ${aud.contentHook}`);
      lines.push('');
    }

    // Competitors
    lines.push('## Competitor Landscape');
    lines.push('');
    for (const comp of bp.competitorLandscape) {
      lines.push(`### ${comp.name}`);
      lines.push(`**Platforms:** ${comp.platforms.join(', ')}`);
      lines.push(
        `**Strengths:** ${comp.strengths.join('; ')}`,
      );
      lines.push(`**Gaps:** ${comp.gaps.join('; ')}`);
      lines.push(`**Relevancy:** ${comp.relevancy}`);
      lines.push('');
    }

    // Content Pillars
    lines.push('## Content Pillars');
    lines.push('');
    for (const pillar of bp.contentPillars) {
      lines.push(
        `### ${pillar.name} (${pillar.sharePercent}%)`,
      );
      lines.push(pillar.description);
      lines.push(`**Formats:** ${pillar.formats.join(', ')}`);
      lines.push('');
    }

    // Channels & Cadence
    lines.push('## Channels & Cadence');
    lines.push('');
    for (const ch of bp.channelsAndCadence) {
      lines.push(`### ${ch.channel} — ${ch.role}`);
      lines.push(`**Frequency:** ${ch.frequency}`);
      lines.push(`**Best Times:** ${ch.bestTimes}`);
      lines.push(
        `**Content Types:** ${ch.contentTypes.join(', ')}`,
      );
      lines.push('');
    }

    // Performance Scorecard
    lines.push('## Performance Scorecard');
    lines.push('');
    lines.push(
      '| Metric | Baseline | 30-Day Target | 90-Day Target |',
    );
    lines.push('|--------|----------|---------------|---------------|');
    for (const m of bp.performanceScorecard) {
      lines.push(
        `| ${m.metric} | ${m.baseline} | ${m.thirtyDayTarget} | ${m.ninetyDayTarget} |`,
      );
    }
    lines.push('');

    // Quick Wins
    lines.push('## First 30 Days — Quick Wins');
    lines.push('');
    bp.quickWins.forEach((win, i) => {
      lines.push(`${i + 1}. ${win}`);
    });
    lines.push('');

    return lines.join('\n');
  }
}
