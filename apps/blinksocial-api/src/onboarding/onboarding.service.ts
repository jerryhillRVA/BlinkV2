import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SkillRunnerService } from '../skills/skill-runner.service';
import { SessionStore, type OnboardingSessionState } from './session-store';
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
} from '@blinksocial/contracts';

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
  ) {}

  async createSession(
    userId: string,
    businessName?: string,
  ): Promise<CreateSessionResponseContract> {
    const session = this.sessionStore.create(userId);

    // Generate the initial greeting
    const context = this.buildStateContext(session, businessName);
    const result = await this.skillRunner.run({
      skillId: SKILL_ID,
      conversationHistory: [
        {
          role: 'user',
          content: businessName
            ? `I'd like to start a discovery session for my business: ${businessName}`
            : `I'd like to start a discovery session for my business.`,
        },
      ],
      additionalContext: context,
    });

    const turnResponse = this.parseTurnResponse(result.content, result.parsed);

    // Save the initial messages
    const now = new Date().toISOString();
    this.sessionStore.update(session.id, {
      messages: [
        {
          role: 'user',
          content: businessName
            ? `I'd like to start a discovery session for my business: ${businessName}`
            : `I'd like to start a discovery session for my business.`,
          timestamp: now,
        },
        {
          role: 'assistant',
          content: turnResponse.agentMessage,
          timestamp: now,
        },
      ],
      currentSection:
        (turnResponse.currentSection as DiscoverySectionId) || 'business',
    });

    return {
      sessionId: session.id,
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
      if (!blueprint.deliveredDate) {
        blueprint.deliveredDate = new Date().toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        });
      }

      const markdownDocument = this.renderBlueprintMarkdown(blueprint);

      this.sessionStore.update(sessionId, {
        status: 'complete',
        blueprint,
      });

      return { blueprint, markdownDocument };
    } catch (error) {
      this.sessionStore.update(sessionId, { status: 'active' });
      this.logger.error(
        `Blueprint generation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
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

    // Fallback: treat the entire response as the agent message
    this.logger.warn(
      'LLM response was not valid JSON — using raw content as agent message',
    );
    return {
      agentMessage: rawContent,
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
