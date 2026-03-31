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
} from '@blinksocial/contracts';
import { CreateWorkspaceRequest } from '@blinksocial/models';
import { UIAudienceSegment, UIContentPillar, UIAgent } from '../../models';

const PILLAR_COLORS = [
  '#d94e33', '#3b82f6', '#10b981', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
];

@Injectable()
export class NewWorkspaceFormService {
  // Step 1
  readonly workspaceName = signal('');
  readonly purpose = signal('');
  readonly mission = signal('');
  readonly brandVoice = signal('');
  readonly audienceSegments = signal<UIAudienceSegment[]>([
    { id: 1, description: '', ageRange: '25-34' },
  ]);

  // Step 2
  readonly enabledPlatforms = signal<Set<string>>(new Set(['YouTube', 'LinkedIn']));
  readonly defaultPlatform = signal('YouTube');
  readonly maxIdeasPerMonth = signal(30);
  readonly contentWarning = signal(false);
  readonly aiDisclaimer = signal(true);

  // Step 3
  readonly contentPillars = signal<UIContentPillar[]>([
    {
      id: 1,
      name: 'Industry News',
      themes: 'AI, Software Development, Venture Capital',
      description: 'Timely updates on industry shifts and breaking tech news.',
      audienceSegments: ['Engineers', 'Founders'],
      platforms: ['YouTube', 'LinkedIn'],
    },
    {
      id: 2,
      name: 'How-To Guides',
      themes: 'Tutorials, Productivity, Automation',
      description: 'Practical tutorials and educational deep-dives.',
      audienceSegments: ['Social Media Managers', 'Engineers'],
      platforms: ['YouTube', 'Instagram'],
    },
  ]);

  // Step 4
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
      name: s.description || `Segment ${i + 1}`,
      description: s.description || `Segment ${i + 1}`,
      demographics: s.ageRange,
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
        audienceSegmentIds: p.audienceSegments.map(
          (_, si) => `seg-${si + 1}`
        ),
        platformDistribution,
      };
    });

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
      },
      contentPillars: pillars,
      audienceSegments: segments,
      skills: { skills },
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
      default:
        return { valid: true };
    }
  }

  // Step 1 helpers
  addSegment(): void {
    this.audienceSegments.update((s) => [
      ...s,
      { id: Date.now(), description: '', ageRange: '25-34' },
    ]);
  }

  removeSegment(id: number): void {
    if (this.audienceSegments().length > 1) {
      this.audienceSegments.update((s) => s.filter((seg) => seg.id !== id));
    }
  }

  // Step 2 helpers
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

  // Step 3 helpers
  readonly AUDIENCES = [
    'Engineers', 'Founders', 'Social Media Managers',
    'Tech Enthusiasts', 'Executives',
  ];

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

  isAudienceSelected(pillar: UIContentPillar, segment: string): boolean {
    return pillar.audienceSegments.includes(segment);
  }

  isPlatformSelected(pillar: UIContentPillar, platform: string): boolean {
    return pillar.platforms.includes(platform);
  }

  // Step 4 helpers
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

  // Field update helpers for template bindings
  updateSegmentDescription(segmentId: number, description: string): void {
    this.audienceSegments.update((segs) =>
      segs.map((s) => (s.id === segmentId ? { ...s, description } : s))
    );
  }

  updateSegmentAgeRange(segmentId: number, ageRange: string): void {
    this.audienceSegments.update((segs) =>
      segs.map((s) => (s.id === segmentId ? { ...s, ageRange } : s))
    );
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

    // Audience segments
    if (formData.audienceSegments && formData.audienceSegments.length > 0) {
      this.audienceSegments.set(
        formData.audienceSegments.map((seg, i) => ({
          id: i + 1,
          description: seg.description ?? seg.name ?? '',
          ageRange: seg.demographics ?? '25-34',
        }))
      );
    }

    // Step 2: Platforms
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

    // Step 3: Content Pillars
    if (formData.contentPillars && formData.contentPillars.length > 0) {
      this.contentPillars.set(
        formData.contentPillars.map((p, i) => ({
          id: i + 1,
          name: p.name ?? '',
          themes: (p.themes ?? []).join(', '),
          description: p.description ?? '',
          audienceSegments: p.audienceSegmentIds ?? [],
          platforms: Object.keys(p.platformDistribution ?? {}).map(
            (pid) => this.platformToDisplayName(pid)
          ),
        }))
      );
    }

    // Step 4: Agents / Skills
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
