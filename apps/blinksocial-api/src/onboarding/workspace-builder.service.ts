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

    // Create workspace in 'creating' status — use minimal creation to avoid schema errors
    // The full wizard data is stored in wizard-state.json for the wizard to use
    const wsResponse = await this.workspacesService.createInStatus(
      workspaceName,
      'creating',
    );

    const tenantId = wsResponse.tenantId;

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
      workspaceId: wsResponse.id,
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

    // Fix platforms: ensure platformId exists on each platform
    if (data.platforms?.platforms && Array.isArray(data.platforms.platforms)) {
      data.platforms.platforms = data.platforms.platforms.map((p: Record<string, unknown>) => ({
        platformId: p.platformId || p.id || p.platform || 'tbd',
        enabled: p.enabled !== false,
        ...(p.postingSchedule ? { postingSchedule: p.postingSchedule } : {}),
      })) as CreateWorkspaceRequestContract['platforms']['platforms'];
    }

    // Fix skills: ensure it's { skills: [...] } not just an array
    if (Array.isArray(data.skills)) {
      data.skills = { skills: data.skills } as CreateWorkspaceRequestContract['skills'];
    } else if (data.skills && !(data.skills as Record<string, unknown>).skills) {
      data.skills = { skills: [] } as CreateWorkspaceRequestContract['skills'];
    }

    // Truncate content pillar descriptions to 500 chars
    if (data.contentPillars && Array.isArray(data.contentPillars)) {
      data.contentPillars = data.contentPillars.map((p) => ({
        ...p,
        description: typeof p.description === 'string'
          ? p.description.substring(0, 500)
          : p.description,
      }));
    }

    // Ensure audience segments is an array
    if (!Array.isArray(data.audienceSegments)) {
      data.audienceSegments = [];
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
