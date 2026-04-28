import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SkillRunnerService } from '../skills/skill-runner.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { AgenticFilesystemService } from '../agentic-filesystem/agentic-filesystem.service';
import type {
  BlueprintDocumentContract,
  CreateWorkspaceRequestContract,
  CreateWorkspaceFromBlueprintResponseContract,
} from '@blinksocial/contracts';

const SKILL_ID = 'populate-workspace-wizard';

@Injectable()
export class WorkspaceBuilderService {
  private readonly logger = new Logger(WorkspaceBuilderService.name);

  constructor(
    private readonly skillRunner: SkillRunnerService,
    private readonly workspacesService: WorkspacesService,
    private readonly fs: AgenticFilesystemService,
  ) {}

  async buildFromBlueprint(
    blueprint: BlueprintDocumentContract,
    workspaceName: string,
    userId: string,
    sessionId: string,
    existingTenantId?: string,
  ): Promise<CreateWorkspaceFromBlueprintResponseContract> {
    // 1. Run the populate-workspace-wizard skill
    const result = await this.skillRunner.run({
      skillId: SKILL_ID,
      conversationHistory: [
        {
          role: 'user',
          content: JSON.stringify(blueprint),
        },
      ],
      maxTokens: 8192,
      temperature: 0.3,
    });

    if (!result.parsed) {
      this.logger.error(
        'populate-workspace-wizard skill returned non-JSON response',
      );
      throw new BadRequestException(
        'Failed to map blueprint to workspace configuration',
      );
    }

    const wizardData = this.sanitizeWizardData(
      result.parsed as unknown as CreateWorkspaceRequestContract,
      workspaceName,
    );

    let tenantId: string;
    let wsResponse: { id: string; tenantId: string };

    if (existingTenantId) {
      // Reuse the existing onboarding workspace — transition to 'creating' status
      tenantId = existingTenantId;
      await this.workspacesService.transitionStatus(existingTenantId, 'creating');
      wsResponse = { id: existingTenantId, tenantId: existingTenantId };
    } else {
      // Create a new workspace in 'creating' status
      const response = await this.workspacesService.createInStatus(
        workspaceName,
        'creating',
      );
      tenantId = response.tenantId;
      wsResponse = { id: response.id, tenantId: response.tenantId };
    }

    // 5. Save blueprint.md and wizard-state.json to AFS (fire-and-forget for non-critical)
    if (this.fs.isConfigured()) {
      const markdownContent = this.renderBlueprintMarkdown(blueprint);

      const wizardState = {
        currentStep: 0,
        completedSteps: [],
        formData: wizardData,
        blueprintSessionId: sessionId,
      };

      await Promise.all([
        this.fs
          .uploadTextFile(tenantId, 'settings', 'blueprint.md', markdownContent)
          .catch((err) =>
            this.logger.error('Failed to save blueprint.md', err),
          ),
        this.fs
          .uploadJsonFile(
            tenantId,
            'settings',
            'wizard-state.json',
            wizardState,
          )
          .catch((err) =>
            this.logger.error('Failed to save wizard-state.json', err),
          ),
      ]);
    }

    return {
      workspaceId: wsResponse.id ?? tenantId,
      tenantId,
      wizardData,
    };
  }

  private sanitizeWizardData(
    raw: Record<string, unknown>,
    workspaceName: string,
  ): CreateWorkspaceRequestContract {
    const data = raw as Partial<CreateWorkspaceRequestContract> & Record<string, unknown>;

    // Ensure general section exists with workspace name
    if (!data.general || typeof data.general !== 'object') {
      data.general = { workspaceName } as CreateWorkspaceRequestContract['general'];
    } else {
      (data.general as Record<string, unknown>).workspaceName = workspaceName;
    }

    // Fix platforms: ensure platformId exists on each platform, filter out 'tbd'
    if (data.platforms?.platforms && Array.isArray(data.platforms.platforms)) {
      data.platforms.platforms = data.platforms.platforms
        .map((p: Record<string, unknown>) => ({
          platformId: p.platformId || p.id || p.platform || 'tbd',
          enabled: p.enabled !== false,
          ...(p.postingSchedule ? { postingSchedule: p.postingSchedule } : {}),
        }))
        .filter((p) => p.platformId !== 'tbd') as CreateWorkspaceRequestContract['platforms']['platforms'];
    }

    // Fix globalRules defaults and cap maxIdeasPerMonth
    if (data.platforms?.globalRules) {
      const gr = data.platforms.globalRules as Record<string, unknown>;
      if (gr.contentWarningToggle == null) gr.contentWarningToggle = false;
      if (gr.aiDisclaimerToggle == null) gr.aiDisclaimerToggle = true;
      // Cap maxIdeasPerMonth at a reasonable value (the LLM sometimes sums
      // all individual channel frequencies instead of respecting user capacity)
      if (typeof gr.maxIdeasPerMonth === 'number' && gr.maxIdeasPerMonth > 50) {
        gr.maxIdeasPerMonth = 30;
      }
    }

    // Fix skills: ensure it's { skills: [...] } not just an array (skills is optional)
    if (Array.isArray(data.skills)) {
      data.skills = { skills: data.skills } as CreateWorkspaceRequestContract['skills'];
    } else if (data.skills && !(data.skills as Record<string, unknown>).skills) {
      data.skills = undefined;
    }

    // Defensive truncation for brandVoiceDescription — schema cap is 2000 chars
    // (libs/blinksocial-contracts/src/lib/schemas/workspaces/brand-voice.schema.json).
    // The skill prompt asks for ~800 chars, but LLMs occasionally overrun.
    if (data.brandVoice && typeof (data.brandVoice as Record<string, unknown>).brandVoiceDescription === 'string') {
      const bv = data.brandVoice as Record<string, unknown>;
      const desc = bv.brandVoiceDescription as string;
      if (desc.length > 2000) {
        bv.brandVoiceDescription = desc.substring(0, 1999) + '\u2026';
      }
    }

    // Truncate content pillar descriptions to 500 chars and ensure targetPlatforms
    if (data.contentPillars && Array.isArray(data.contentPillars)) {
      data.contentPillars = data.contentPillars.map((p) => {
        const pillar = { ...p } as Record<string, unknown>;
        if (typeof pillar.description === 'string') {
          pillar.description = (pillar.description as string).substring(0, 500);
        }
        // If platformDistribution exists but targetPlatforms doesn't, derive it
        if (!pillar.targetPlatforms && pillar.platformDistribution) {
          pillar.targetPlatforms = Object.keys(
            pillar.platformDistribution as Record<string, number>,
          );
        }
        return pillar;
      }) as CreateWorkspaceRequestContract['contentPillars'];
    }

    // Ensure audience segments is an array, use name for description
    if (!Array.isArray(data.audienceSegments)) {
      data.audienceSegments = [];
    }
    data.audienceSegments = data.audienceSegments.map((seg) => {
      const s = { ...seg } as Record<string, unknown>;
      // If description looks like a content hook (starts with "Content that..."),
      // preserve it as a secondary field but keep the original description intact
      if (
        typeof s.description === 'string' &&
        typeof s.name === 'string' &&
        /^content\s+that\b/i.test(s.description)
      ) {
        s.contentHook = s.description;
      }
      return s;
    }) as CreateWorkspaceRequestContract['audienceSegments'];

    // Ensure channelStrategy is populated — fall back to platforms list if LLM didn't produce it
    if (!data.channelStrategy || !data.channelStrategy.channels?.length) {
      const enabledPlatforms = (data.platforms?.platforms ?? [])
        .filter((p) => p.enabled !== false && p.platformId !== 'tbd')
        .map((p) => p.platformId);
      data.channelStrategy = {
        channels: enabledPlatforms.map((platform) => ({
          platform,
          active: true,
          role: '',
          primaryContentTypes: [],
          toneAdjustment: '',
          postingCadence: '',
          primaryAudience: data.audienceSegments?.[0]?.name ?? '',
          primaryGoal: '',
          notes: '',
        })),
      };
    }

    // Ensure contentMix is populated with default 5-category distribution
    if (!data.contentMix || !((data.contentMix as Record<string, unknown>).targets as unknown[])?.length) {
      data.contentMix = {
        targets: [
          { category: 'educational', label: 'Educational', targetPercent: 30, color: '#4F46E5', description: 'Informative content that teaches and builds authority' },
          { category: 'entertaining', label: 'Entertaining', targetPercent: 25, color: '#F59E0B', description: 'Engaging content that captures attention and builds affinity' },
          { category: 'community', label: 'Community', targetPercent: 25, color: '#10B981', description: 'Content that fosters connection and conversation' },
          { category: 'promotional', label: 'Promotional', targetPercent: 10, color: '#EF4444', description: 'Content that drives conversions and sales' },
          { category: 'trending', label: 'Trending', targetPercent: 10, color: '#8B5CF6', description: 'Timely content that leverages current trends and events' },
        ],
      };
    }

    return data as CreateWorkspaceRequestContract;
  }

  private renderBlueprintMarkdown(bp: BlueprintDocumentContract): string {
    const lines: string[] = [];

    lines.push(`# THE BLINK BLUEPRINT`);
    lines.push('');
    lines.push(`**Prepared for:** ${bp.clientName}`);
    lines.push(`**Delivered:** ${bp.deliveredDate}`);
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## Strategic Summary');
    lines.push('');
    lines.push(bp.strategicSummary);
    lines.push('');

    if (bp.brandVoice) {
      lines.push('## Brand & Voice');
      lines.push('');
      lines.push(`> ${bp.brandVoice.positioningStatement}`);
      lines.push('');
      lines.push(`**Content Mission:** ${bp.brandVoice.contentMission}`);
      lines.push('');
    }

    if (bp.contentPillars?.length) {
      lines.push('## Content Pillars');
      lines.push('');
      for (const pillar of bp.contentPillars) {
        lines.push(`### ${pillar.name} (${pillar.sharePercent}%)`);
        lines.push(pillar.description);
        lines.push('');
      }
    }

    if (bp.channelsAndCadence?.length) {
      lines.push('## Channels & Cadence');
      lines.push('');
      for (const ch of bp.channelsAndCadence) {
        lines.push(`- **${ch.channel}** — ${ch.frequency} — ${ch.role}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }
}
