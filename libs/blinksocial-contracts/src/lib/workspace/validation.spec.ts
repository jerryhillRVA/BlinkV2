import { validateCreateWorkspaceRequest } from './validation.js';
import type { CreateWorkspaceRequestContract } from './create-workspace-request.js';

function buildValidRequest(): CreateWorkspaceRequestContract {
  return {
    general: {
      workspaceName: 'Test Workspace',
    },
    platforms: {
      globalRules: {
        defaultPlatform: 'youtube' as never,
        maxIdeasPerMonth: 30,
        contentWarningToggle: false,
        aiDisclaimerToggle: true,
      },
      platforms: [
        { platformId: 'youtube' as never, enabled: true },
        { platformId: 'linkedin' as never, enabled: true },
      ],
    },
    brandVoice: {
      brandVoiceDescription: 'Professional and informative',
      toneGuidelines: ['professional'],
    },
    contentPillars: [
      {
        id: 'pillar-1',
        name: 'Industry News',
        description: 'Latest industry updates',
        color: '#d94e33',
        themes: ['AI', 'Tech'],
        audienceSegmentIds: ['seg-1'],
        platformDistribution: { youtube: 0.5, linkedin: 0.5 },
      },
    ],
    audienceSegments: [
      {
        id: 'seg-1',
        name: 'Engineers',
        description: 'Software engineers aged 25-34',
        demographics: '25-34',
      },
    ],
    skills: {
      skills: [
        {
          id: 'skill-config-1',
          skillId: 'reporting-agent',
          name: 'Reporting Agent',
          role: 'News Aggregator',
          responsibilities: ['Scan RSS feeds'],
          expectedOutputs: ['Daily digests'],
        },
      ],
    },
  };
}

describe('validateCreateWorkspaceRequest', () => {
  it('should pass for a valid complete request', () => {
    const result = validateCreateWorkspaceRequest(buildValidRequest());
    expect(result.valid).toBe(true);
  });

  it('should fail when workspaceName is missing', () => {
    const req = buildValidRequest();
    delete (req.general as Record<string, unknown>)['workspaceName'];
    const result = validateCreateWorkspaceRequest(req);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(
        (e) => e.message.includes('workspaceName') || e.field.includes('general')
      )).toBe(true);
    }
  });

  it('should fail when workspaceName exceeds 100 characters', () => {
    const req = buildValidRequest();
    req.general.workspaceName = 'a'.repeat(101);
    const result = validateCreateWorkspaceRequest(req);
    expect(result.valid).toBe(false);
  });

  it('should fail when maxIdeasPerMonth is less than 1', () => {
    const req = buildValidRequest();
    req.platforms.globalRules.maxIdeasPerMonth = 0;
    const result = validateCreateWorkspaceRequest(req);
    expect(result.valid).toBe(false);
  });

  it('should fail when content pillar has invalid hex color', () => {
    const req = buildValidRequest();
    req.contentPillars[0].color = 'not-a-color';
    const result = validateCreateWorkspaceRequest(req);
    expect(result.valid).toBe(false);
  });

  it('should fail when an unknown platform ID is used', () => {
    const req = buildValidRequest();
    (req.platforms.platforms[0] as Record<string, unknown>)['platformId'] = 'myspace';
    const result = validateCreateWorkspaceRequest(req);
    expect(result.valid).toBe(false);
  });

  it('should pass when businessObjectives has 10 items (the cap)', () => {
    const req = buildValidRequest();
    req.businessObjectives = Array.from({ length: 10 }, (_, i) => ({
      id: `obj-${i + 1}`,
      category: 'growth',
      statement: `Goal ${i + 1}`,
      target: 100,
      unit: 'x',
      timeframe: 'Q1 2027',
      status: 'on-track',
    }));
    const result = validateCreateWorkspaceRequest(req);
    expect(result.valid).toBe(true);
  });

  it('should fail when businessObjectives exceeds 10 items', () => {
    const req = buildValidRequest();
    req.businessObjectives = Array.from({ length: 11 }, (_, i) => ({
      id: `obj-${i + 1}`,
      category: 'growth',
      statement: `Goal ${i + 1}`,
      target: 100,
      unit: 'x',
      timeframe: 'Q1 2027',
      status: 'on-track',
    }));
    const result = validateCreateWorkspaceRequest(req);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.field.includes('businessObjectives'))).toBe(true);
    }
  });

  it('should pass for a minimal valid request with empty arrays', () => {
    const req: CreateWorkspaceRequestContract = {
      general: { workspaceName: 'Minimal' },
      platforms: {
        globalRules: {
          defaultPlatform: 'youtube' as never,
          maxIdeasPerMonth: 1,
        },
        platforms: [],
      },
      brandVoice: {},
      contentPillars: [],
      audienceSegments: [],
      skills: { skills: [] },
    };
    const result = validateCreateWorkspaceRequest(req);
    expect(result.valid).toBe(true);
  });
});
