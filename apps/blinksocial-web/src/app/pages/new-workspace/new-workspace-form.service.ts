import { Injectable, computed, signal } from '@angular/core';
import {
  Platform,
  PLATFORM_DISPLAY_OPTIONS,
  PLATFORM_DISPLAY_NAMES,
  displayNameToPlatform,
  type AudienceSegmentContract,
  type ContentPillarContract,
  type SkillConfigContract,
  type CreateWorkspaceRequestContract,
  type BusinessObjectiveContract,
  type BrandPositioningContract,
  type ChannelStrategySettingsContract,
  type ContentMixSettingsContract,
} from '@blinksocial/contracts';
import { CreateWorkspaceRequest } from '@blinksocial/models';
import type { UIBusinessObjective, UIBrandPositioning } from '../../models';
import { UIAudienceSegment, UIContentPillar, UIAgent } from '../../models';

const PILLAR_COLORS = [
  '#d94e33', '#3b82f6', '#10b981', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
];

@Injectable()
export class NewWorkspaceFormService {
  // Step 1 — Strategic Foundation
  readonly workspaceName = signal('');
  readonly purpose = signal('');
  readonly mission = signal('');

  // Step 2 — Business Objectives
  readonly businessObjectives = signal<UIBusinessObjective[]>([
    { id: 1, category: 'growth', statement: '', target: '', unit: '', timeframe: '' },
  ]);

  // Step 3 — Brand & Voice
  readonly brandPositioning = signal<UIBrandPositioning>({
    targetCustomer: '',
    problemSolved: '',
    solution: '',
    differentiator: '',
    positioningStatement: '',
  });
  readonly brandVoice = signal('');
  readonly toneTags = signal<string[]>([]);

  // Step 4 — Audience
  readonly audienceSegments = signal<UIAudienceSegment[]>([
    { id: 1, name: '' },
  ]);

  // Step 5 — Platforms
  readonly enabledPlatforms = signal<Set<string>>(new Set(['YouTube', 'LinkedIn']));
  readonly defaultPlatform = signal('YouTube');
  readonly maxIdeasPerMonth = signal(30);
  readonly contentWarning = signal(false);
  readonly aiDisclaimer = signal(true);

  // Step 6 — Content Strategy
  readonly contentPillars = signal<UIContentPillar[]>([
    {
      id: 1,
      name: 'Industry News',
      themes: 'AI, Software Development, Venture Capital',
      description: 'Timely updates on industry shifts and breaking tech news.',
      audienceSegments: ['Engineers', 'Founders'],
      platforms: ['YouTube', 'LinkedIn'],
      objectiveId: '',
    },
    {
      id: 2,
      name: 'How-To Guides',
      themes: 'Tutorials, Productivity, Automation',
      description: 'Practical tutorials and educational deep-dives.',
      audienceSegments: ['Social Media Managers', 'Engineers'],
      platforms: ['YouTube', 'Instagram'],
      objectiveId: '',
    },
  ]);

  // Step 7 — Agents
  readonly agents = signal<UIAgent[]>([
    {
      id: 1,
      name: 'Reporting Agent',
      role: 'News Aggregator',
      responsibilities:
        'Scan RSS feeds daily, identify emerging trends, and summarize complex tech articles for the engineering team.',
      outputs:
        'Daily news digests, weekly trend reports, and Slack alerts for high-priority news.',
    },
    {
      id: 2,
      name: 'Creative Agent',
      role: 'Content Specialist',
      responsibilities:
        'Write engaging captions, select strategic hashtags, suggest visual imagery, and create social story outlines.',
      outputs:
        'Social media post drafts, creative content concepts, and hashtag strategy documents.',
    },
  ]);

  readonly formData = computed<CreateWorkspaceRequest>(() => {
    const defaultPlatformEnum =
      displayNameToPlatform(this.defaultPlatform()) ?? Platform.YouTube;

    const enabledPlatformsList = Array.from(this.enabledPlatforms());
    const platformConfigs = enabledPlatformsList.map((displayName) => ({
      platformId: displayNameToPlatform(displayName) ?? Platform.Tbd,
      enabled: true,
    }));

    const segments: AudienceSegmentContract[] = this.audienceSegments().map((s, i) => ({
      id: `seg-${i + 1}`,
      name: s.name || `Segment ${i + 1}`,
      description: '',
      demographics: s.demographics,
    }));

    const pillars: ContentPillarContract[] = this.contentPillars().map((p, i) => {
      const platformEnums = p.platforms
        .map((name) => displayNameToPlatform(name))
        .filter((v): v is Platform => v !== undefined);
      const weight = platformEnums.length > 0 ? 1 / platformEnums.length : 0;
      const platformDistribution: Record<string, number> = {};
      for (const pe of platformEnums) {
        platformDistribution[pe] = weight;
      }

      return {
        id: `pillar-${i + 1}`,
        name: p.name,
        description: p.description,
        color: PILLAR_COLORS[i % PILLAR_COLORS.length],
        themes: p.themes.split(',').map((t) => t.trim()).filter(Boolean),
        audienceSegmentIds: p.audienceSegments
          .map(segName => {
            const idx = this.audienceSegments().findIndex(s => s.name === segName);
            return idx >= 0 ? `seg-${idx + 1}` : undefined;
          })
          .filter((id): id is string => id !== undefined),
        platformDistribution,
        objectiveIds: p.objectiveId ? [p.objectiveId] : undefined,
      };
    });

    const objectives: BusinessObjectiveContract[] = this.businessObjectives()
      .filter((o) => o.statement.trim())
      .map((o, i) => ({
        id: `obj-${i + 1}`,
        category: (o.category || 'growth') as BusinessObjectiveContract['category'],
        statement: o.statement,
        target: Number(o.target) || 0,
        unit: o.unit,
        timeframe: o.timeframe,
        status: 'on-track' as const,
      }));

    const positioning: BrandPositioningContract = {
      targetCustomer: this.brandPositioning().targetCustomer || undefined,
      problemSolved: this.brandPositioning().problemSolved || undefined,
      solution: this.brandPositioning().solution || undefined,
      differentiator: this.brandPositioning().differentiator || undefined,
      positioningStatement: this.brandPositioning().positioningStatement || undefined,
    };

    const tags = this.toneTags();

    const skills: SkillConfigContract[] = this.agents().map((a, i) => ({
      id: `skill-config-${i + 1}`,
      skillId: a.name.toLowerCase().replace(/\s+/g, '-') || `agent-${i + 1}`,
      name: a.name,
      role: a.role,
      responsibilities: a.responsibilities
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
      expectedOutputs: a.outputs
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
    }));

    // Scaffold channel-strategy entries from enabled platforms (Rec 1)
    const channelEntries = enabledPlatformsList
      .map((displayName) => displayNameToPlatform(displayName))
      .filter((v): v is Platform => v !== undefined && v !== Platform.Tbd)
      .map((platform) => ({
        platform,
        active: true,
        role: '',
        primaryContentTypes: [] as string[],
        toneAdjustment: '',
        postingCadence: '',
        primaryAudience: segments[0]?.name ?? '',
        primaryGoal: '',
        notes: '',
      }));
    const channelStrategy: ChannelStrategySettingsContract = { channels: channelEntries };

    // Default content mix categories (Rec 2)
    const contentMix: ContentMixSettingsContract = {
      targets: [
        { category: 'educational', label: 'Educational', targetPercent: 30, color: '#4F46E5', description: 'Informative content that teaches and builds authority' },
        { category: 'entertaining', label: 'Entertaining', targetPercent: 25, color: '#F59E0B', description: 'Engaging content that captures attention and builds affinity' },
        { category: 'community', label: 'Community', targetPercent: 25, color: '#10B981', description: 'Content that fosters connection and conversation' },
        { category: 'promotional', label: 'Promotional', targetPercent: 10, color: '#EF4444', description: 'Content that drives conversions and sales' },
        { category: 'trending', label: 'Trending', targetPercent: 10, color: '#8B5CF6', description: 'Timely content that leverages current trends and events' },
      ],
    };

    return new CreateWorkspaceRequest({
      general: {
        workspaceName: this.workspaceName(),
        purpose: this.purpose() || undefined,
        mission: this.mission() || undefined,
      },
      platforms: {
        globalRules: {
          defaultPlatform: defaultPlatformEnum,
          maxIdeasPerMonth: this.maxIdeasPerMonth(),
          contentWarningToggle: this.contentWarning(),
          aiDisclaimerToggle: this.aiDisclaimer(),
        },
        platforms: platformConfigs,
      },
      brandVoice: {
        brandVoiceDescription: this.brandVoice() || undefined,
        toneGuidelines: this.brandVoice()
          ? this.brandVoice().split(',').map((t) => t.trim()).filter(Boolean)
          : undefined,
        toneTags: tags.length > 0 ? tags : undefined,
      },
      contentPillars: pillars,
      audienceSegments: segments,
      skills: skills.length > 0 ? { skills } : undefined,
      businessObjectives: objectives.length > 0 ? objectives : undefined,
      brandPositioning: positioning,
      channelStrategy,
      contentMix,
    });
  });

  // Validation
  stepValidation(step: number): { valid: true } | { valid: false; error: string } {
    switch (step) {
      case 1: {
        const name = this.workspaceName().trim();
        if (!name) {
          return { valid: false, error: 'Workspace Name is required.' };
        }
        if (name.length > 100) {
          return { valid: false, error: 'Workspace Name must be 100 characters or fewer.' };
        }
        return { valid: true };
      }
      case 2: {
        const hasStatement = this.businessObjectives().some((o) => o.statement.trim());
        if (!hasStatement) {
          return { valid: false, error: 'At least one objective with a statement is required.' };
        }
        return { valid: true };
      }
      case 4: {
        const hasName = this.audienceSegments().some((s) => s.name.trim());
        if (!hasName) {
          return { valid: false, error: 'At least one audience segment with a name is required.' };
        }
        return { valid: true };
      }
      default:
        return { valid: true };
    }
  }

  // Step 2 helpers — Business Objectives
  addObjective(): void {
    if (this.businessObjectives().length >= 4) return;
    this.businessObjectives.update((objs) => [
      ...objs,
      { id: Date.now(), category: 'growth', statement: '', target: '', unit: '', timeframe: '' },
    ]);
  }

  removeObjective(id: number): void {
    if (this.businessObjectives().length > 1) {
      this.businessObjectives.update((objs) => objs.filter((o) => o.id !== id));
    }
  }

  updateObjective(id: number, field: keyof UIBusinessObjective, value: string): void {
    this.businessObjectives.update((objs) =>
      objs.map((o) => (o.id === id ? { ...o, [field]: value } : o))
    );
  }

  // Step 3 helpers — Brand Positioning & Voice
  updateBrandPositioning(field: keyof UIBrandPositioning, value: string): void {
    this.brandPositioning.update((bp) => ({ ...bp, [field]: value }));
  }

  toggleToneTag(tag: string): void {
    this.toneTags.update((tags) =>
      tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]
    );
  }

  isToneTagSelected(tag: string): boolean {
    return this.toneTags().includes(tag);
  }

  // Step 4 helpers — Audience Segments
  addSegment(): void {
    if (this.audienceSegments().length >= 6) return;
    this.audienceSegments.update((s) => [
      ...s,
      { id: Date.now(), name: '' },
    ]);
  }

  removeSegment(id: number): void {
    if (this.audienceSegments().length > 1) {
      this.audienceSegments.update((s) => s.filter((seg) => seg.id !== id));
    }
  }

  updateSegmentName(segmentId: number, name: string): void {
    this.audienceSegments.update((segs) =>
      segs.map((s) => (s.id === segmentId ? { ...s, name } : s))
    );
  }

  // Step 5 helpers — Platforms
  isEnabled(platform: string): boolean {
    return this.enabledPlatforms().has(platform);
  }

  togglePlatform(platform: string): void {
    this.enabledPlatforms.update((set) => {
      const next = new Set(set);
      if (next.has(platform)) {
        next.delete(platform);
      } else {
        next.add(platform);
      }
      return next;
    });
  }

  toggleContentWarning(): void {
    this.contentWarning.update((v) => !v);
  }

  toggleAiDisclaimer(): void {
    this.aiDisclaimer.update((v) => !v);
  }

  // Step 6 helpers — Content Strategy
  readonly AUDIENCES = computed(() => {
    const segments = this.audienceSegments();
    const names = segments.map((s) => s.name).filter((n) => n.trim());
    return names.length > 0 ? names : [];
  });

  readonly PLATFORMS = PLATFORM_DISPLAY_OPTIONS;

  addPillar(): void {
    this.contentPillars.update((p) => [
      ...p,
      {
        id: Date.now(),
        name: '',
        themes: '',
        description: '',
        audienceSegments: [],
        platforms: [],
        objectiveId: '',
      },
    ]);
  }

  removePillar(id: number): void {
    if (this.contentPillars().length > 1) {
      this.contentPillars.update((p) => p.filter((x) => x.id !== id));
    }
  }

  toggleAudience(pillarId: number, segment: string): void {
    this.contentPillars.update((pillars) =>
      pillars.map((p) => {
        if (p.id !== pillarId) return p;
        const segs = p.audienceSegments.includes(segment)
          ? p.audienceSegments.filter((s) => s !== segment)
          : [...p.audienceSegments, segment];
        return { ...p, audienceSegments: segs };
      })
    );
  }

  togglePillarPlatform(pillarId: number, platform: string): void {
    this.contentPillars.update((pillars) =>
      pillars.map((p) => {
        if (p.id !== pillarId) return p;
        const plats = p.platforms.includes(platform)
          ? p.platforms.filter((s) => s !== platform)
          : [...p.platforms, platform];
        return { ...p, platforms: plats };
      })
    );
  }

  updatePillarObjective(pillarId: number, objectiveId: string): void {
    this.contentPillars.update((pillars) =>
      pillars.map((p) => (p.id === pillarId ? { ...p, objectiveId } : p))
    );
  }

  isAudienceSelected(pillar: UIContentPillar, segment: string): boolean {
    return pillar.audienceSegments.includes(segment);
  }

  isPlatformSelected(pillar: UIContentPillar, platform: string): boolean {
    return pillar.platforms.includes(platform);
  }

  updatePillarName(pillarId: number, name: string): void {
    this.contentPillars.update((ps) =>
      ps.map((p) => (p.id === pillarId ? { ...p, name } : p))
    );
  }

  updatePillarThemes(pillarId: number, themes: string): void {
    this.contentPillars.update((ps) =>
      ps.map((p) => (p.id === pillarId ? { ...p, themes } : p))
    );
  }

  updatePillarDescription(pillarId: number, description: string): void {
    this.contentPillars.update((ps) =>
      ps.map((p) => (p.id === pillarId ? { ...p, description } : p))
    );
  }

  // Step 7 helpers — Agents
  addAgent(): void {
    this.agents.update((a) => [
      ...a,
      { id: Date.now(), name: '', role: '', responsibilities: '', outputs: '' },
    ]);
  }

  removeAgent(id: number): void {
    if (this.agents().length > 1) {
      this.agents.update((a) => a.filter((x) => x.id !== id));
    }
  }

  updateAgentName(agentId: number, name: string): void {
    this.agents.update((as) =>
      as.map((a) => (a.id === agentId ? { ...a, name } : a))
    );
  }

  updateAgentRole(agentId: number, role: string): void {
    this.agents.update((as) =>
      as.map((a) => (a.id === agentId ? { ...a, role } : a))
    );
  }

  updateAgentResponsibilities(agentId: number, responsibilities: string): void {
    this.agents.update((as) =>
      as.map((a) => (a.id === agentId ? { ...a, responsibilities } : a))
    );
  }

  updateAgentOutputs(agentId: number, outputs: string): void {
    this.agents.update((as) =>
      as.map((a) => (a.id === agentId ? { ...a, outputs } : a))
    );
  }

  /** Maps a Platform enum value to its display name (e.g., 'youtube' -> 'YouTube'). */
  private platformToDisplayName(platformId: string): string {
    const displayName = PLATFORM_DISPLAY_NAMES[platformId as Platform];
    return displayName ?? platformId;
  }

  /** Populates all form signals from a CreateWorkspaceRequestContract (e.g., from wizard state resume). */
  populateFromWizardData(formData: Partial<CreateWorkspaceRequestContract>): void {
    // Step 1: General
    if (formData.general?.workspaceName) {
      this.workspaceName.set(formData.general.workspaceName);
    }
    if (formData.general?.purpose) {
      this.purpose.set(formData.general.purpose);
    }
    if (formData.general?.mission) {
      this.mission.set(formData.general.mission);
    }

    // Brand voice
    if (formData.brandVoice?.brandVoiceDescription) {
      this.brandVoice.set(formData.brandVoice.brandVoiceDescription);
    }
    if (formData.brandVoice?.toneTags && formData.brandVoice.toneTags.length > 0) {
      this.toneTags.set(formData.brandVoice.toneTags);
    }

    // Business objectives
    if (formData.businessObjectives && formData.businessObjectives.length > 0) {
      this.businessObjectives.set(
        formData.businessObjectives.map((o, i) => ({
          id: i + 1,
          category: o.category ?? 'growth',
          statement: o.statement ?? '',
          target: String(o.target ?? ''),
          unit: o.unit ?? '',
          timeframe: o.timeframe ?? '',
        }))
      );
    }

    // Brand positioning
    if (formData.brandPositioning) {
      this.brandPositioning.set({
        targetCustomer: formData.brandPositioning.targetCustomer ?? '',
        problemSolved: formData.brandPositioning.problemSolved ?? '',
        solution: formData.brandPositioning.solution ?? '',
        differentiator: formData.brandPositioning.differentiator ?? '',
        positioningStatement: formData.brandPositioning.positioningStatement ?? '',
      });
    }

    // Audience segments
    if (formData.audienceSegments && formData.audienceSegments.length > 0) {
      this.audienceSegments.set(
        formData.audienceSegments.map((seg, i) => ({
          id: i + 1,
          name: seg.name ?? '',
          demographics: seg.demographics,
        }))
      );
    }

    // Platforms
    if (formData.platforms?.platforms && formData.platforms.platforms.length > 0) {
      const displayNames = new Set(
        formData.platforms.platforms
          .filter((p) => p.enabled !== false)
          .map((p) => this.platformToDisplayName(p.platformId))
      );
      this.enabledPlatforms.set(displayNames);
    }

    if (formData.platforms?.globalRules?.defaultPlatform) {
      this.defaultPlatform.set(
        this.platformToDisplayName(formData.platforms.globalRules.defaultPlatform)
      );
    }

    if (formData.platforms?.globalRules?.maxIdeasPerMonth != null) {
      this.maxIdeasPerMonth.set(formData.platforms.globalRules.maxIdeasPerMonth);
    }

    if (formData.platforms?.globalRules?.contentWarningToggle != null) {
      this.contentWarning.set(formData.platforms.globalRules.contentWarningToggle);
    }

    if (formData.platforms?.globalRules?.aiDisclaimerToggle != null) {
      this.aiDisclaimer.set(formData.platforms.globalRules.aiDisclaimerToggle);
    }

    // Content Pillars
    if (formData.contentPillars && formData.contentPillars.length > 0) {
      this.contentPillars.set(
        formData.contentPillars.map((p, i) => {
          // Resolve platforms from platformDistribution or targetPlatforms
          let platformDisplayNames: string[];
          const distKeys = Object.keys(p.platformDistribution ?? {});
          if (distKeys.length > 0) {
            platformDisplayNames = distKeys.map(
              (pid) => this.platformToDisplayName(pid)
            );
          } else if (p.targetPlatforms && p.targetPlatforms.length > 0) {
            platformDisplayNames = p.targetPlatforms.map(
              (pid) => this.platformToDisplayName(pid)
            );
          } else {
            platformDisplayNames = [];
          }

          return {
            id: i + 1,
            name: p.name ?? '',
            themes: (p.themes ?? []).join(', '),
            description: p.description ?? '',
            audienceSegments: p.audienceSegmentIds ?? [],
            platforms: platformDisplayNames,
            objectiveId: p.objectiveIds?.[0] ?? '',
          };
        })
      );
    }

    // Agents / Skills
    if (formData.skills?.skills && formData.skills.skills.length > 0) {
      this.agents.set(
        formData.skills.skills.map((s, i) => ({
          id: i + 1,
          name: s.name ?? '',
          role: s.role ?? '',
          responsibilities: (s.responsibilities ?? []).join('\n'),
          outputs: (s.expectedOutputs ?? []).join('\n'),
        }))
      );
    }
  }
}
