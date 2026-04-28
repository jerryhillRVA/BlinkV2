import { TestBed } from '@angular/core/testing';
import { Platform, type BusinessObjectiveContract } from '@blinksocial/contracts';
import { NewWorkspaceFormService, MAX_OBJECTIVES } from './new-workspace-form.service';
import { CreateWorkspaceRequest } from '@blinksocial/models';

function suggestion(
  partial: Partial<BusinessObjectiveContract>,
  i = 0,
): BusinessObjectiveContract {
  return {
    id: `ai-${i}`,
    category: 'growth',
    statement: `S${i}`,
    target: 0,
    unit: '',
    timeframe: '',
    status: 'on-track',
    ...partial,
  };
}

describe('NewWorkspaceFormService', () => {
  let service: NewWorkspaceFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NewWorkspaceFormService],
    });
    service = TestBed.inject(NewWorkspaceFormService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  // --- Audience Segments ---

  it('should have default audience segment with name field', () => {
    expect(service.audienceSegments().length).toBe(1);
    expect(service.audienceSegments()[0]).toEqual({ id: 1, name: '' });
  });

  it('should add and remove segments', () => {
    service.addSegment();
    expect(service.audienceSegments().length).toBe(2);
    const id = service.audienceSegments()[1].id;
    service.removeSegment(id);
    expect(service.audienceSegments().length).toBe(1);
  });

  it('should not remove last segment', () => {
    service.removeSegment(service.audienceSegments()[0].id);
    expect(service.audienceSegments().length).toBe(1);
  });

  it('should update segment name', () => {
    const segId = service.audienceSegments()[0].id;
    service.updateSegmentName(segId, 'Tech professionals');
    expect(service.audienceSegments()[0].name).toBe('Tech professionals');
  });

  it('should handle updateSegmentName with non-matching id', () => {
    service.updateSegmentName(9999, 'No match');
    expect(service.audienceSegments()[0].name).toBe('');
  });

  // --- Business Objectives ---

  it('should have 1 default business objective', () => {
    expect(service.businessObjectives().length).toBe(1);
    expect(service.businessObjectives()[0].category).toBe('growth');
    expect(service.businessObjectives()[0].statement).toBe('');
  });

  it('should add and remove objectives', () => {
    service.addObjective();
    expect(service.businessObjectives().length).toBe(2);
    const id = service.businessObjectives()[1].id;
    service.removeObjective(id);
    expect(service.businessObjectives().length).toBe(1);
  });

  it('should not remove last objective', () => {
    service.removeObjective(service.businessObjectives()[0].id);
    expect(service.businessObjectives().length).toBe(1);
  });

  it('should update objective fields', () => {
    const id = service.businessObjectives()[0].id;
    service.updateObjective(id, 'statement', 'Grow audience by 50%');
    expect(service.businessObjectives()[0].statement).toBe('Grow audience by 50%');
    service.updateObjective(id, 'category', 'engagement');
    expect(service.businessObjectives()[0].category).toBe('engagement');
  });

  // --- Brand Positioning ---

  it('should have default brand positioning with empty strings', () => {
    const bp = service.brandPositioning();
    expect(bp.targetCustomer).toBe('');
    expect(bp.problemSolved).toBe('');
    expect(bp.solution).toBe('');
    expect(bp.differentiator).toBe('');
    expect(bp.positioningStatement).toBe('');
  });

  it('should update brand positioning fields', () => {
    service.updateBrandPositioning('targetCustomer', 'Developers');
    expect(service.brandPositioning().targetCustomer).toBe('Developers');
  });

  // --- Tone Tags ---

  it('should have default empty tone tags', () => {
    expect(service.toneTags()).toEqual([]);
  });

  it('should toggle tone tags', () => {
    service.toggleToneTag('professional');
    expect(service.toneTags()).toContain('professional');
    expect(service.isToneTagSelected('professional')).toBe(true);
    service.toggleToneTag('professional');
    expect(service.toneTags()).not.toContain('professional');
    expect(service.isToneTagSelected('professional')).toBe(false);
  });

  // --- Platforms ---

  it('should have default enabled platforms', () => {
    expect(service.enabledPlatforms().has('YouTube')).toBe(true);
    expect(service.enabledPlatforms().has('LinkedIn')).toBe(true);
  });

  it('should toggle platforms', () => {
    service.togglePlatform('YouTube');
    expect(service.isEnabled('YouTube')).toBe(false);
    service.togglePlatform('YouTube');
    expect(service.isEnabled('YouTube')).toBe(true);
  });

  it('should toggle content warning and AI disclaimer', () => {
    expect(service.contentWarning()).toBe(false);
    service.toggleContentWarning();
    expect(service.contentWarning()).toBe(true);
    expect(service.aiDisclaimer()).toBe(true);
    service.toggleAiDisclaimer();
    expect(service.aiDisclaimer()).toBe(false);
  });

  // --- Content Pillars ---

  it('should have 2 default pillars', () => {
    expect(service.contentPillars().length).toBe(2);
  });

  it('should add and remove pillars', () => {
    service.addPillar();
    expect(service.contentPillars().length).toBe(3);
    const id = service.contentPillars()[2].id;
    service.removePillar(id);
    expect(service.contentPillars().length).toBe(2);
  });

  it('should not remove last pillar', () => {
    service.removePillar(service.contentPillars()[0].id);
    expect(service.contentPillars().length).toBe(1);
    service.removePillar(service.contentPillars()[0].id);
    expect(service.contentPillars().length).toBe(1);
  });

  it('should toggle audience on pillar', () => {
    const pillarId = service.contentPillars()[0].id;
    service.toggleAudience(pillarId, 'Executives');
    expect(service.contentPillars()[0].audienceSegments).toContain('Executives');
    service.toggleAudience(pillarId, 'Executives');
    expect(service.contentPillars()[0].audienceSegments).not.toContain('Executives');
  });

  it('should toggle platform on pillar', () => {
    const pillarId = service.contentPillars()[0].id;
    service.togglePillarPlatform(pillarId, 'Instagram');
    expect(service.contentPillars()[0].platforms).toContain('Instagram');
    service.togglePillarPlatform(pillarId, 'Instagram');
    expect(service.contentPillars()[0].platforms).not.toContain('Instagram');
  });

  it('should update pillar name', () => {
    const pillarId = service.contentPillars()[0].id;
    service.updatePillarName(pillarId, 'Updated Name');
    expect(service.contentPillars()[0].name).toBe('Updated Name');
  });

  it('should update pillar themes', () => {
    const pillarId = service.contentPillars()[0].id;
    service.updatePillarThemes(pillarId, 'New, Themes');
    expect(service.contentPillars()[0].themes).toBe('New, Themes');
  });

  it('should update pillar description', () => {
    const pillarId = service.contentPillars()[0].id;
    service.updatePillarDescription(pillarId, 'New description');
    expect(service.contentPillars()[0].description).toBe('New description');
  });

  it('should update pillar objective', () => {
    const pillarId = service.contentPillars()[0].id;
    service.updatePillarObjective(pillarId, 'obj-1');
    expect(service.contentPillars()[0].objectiveId).toBe('obj-1');
  });

  it('should handle update methods on non-matching pillar ids', () => {
    const original = service.contentPillars()[0].name;
    service.updatePillarName(9999, 'No match');
    expect(service.contentPillars()[0].name).toBe(original);
  });

  // --- Agents ---

  it('should have 2 default agents', () => {
    expect(service.agents().length).toBe(2);
  });

  it('should add and remove agents', () => {
    service.addAgent();
    expect(service.agents().length).toBe(3);
    const id = service.agents()[2].id;
    service.removeAgent(id);
    expect(service.agents().length).toBe(2);
  });

  it('should not remove last agent', () => {
    service.removeAgent(service.agents()[0].id);
    expect(service.agents().length).toBe(1);
    service.removeAgent(service.agents()[0].id);
    expect(service.agents().length).toBe(1);
  });

  it('should update agent name', () => {
    const agentId = service.agents()[0].id;
    service.updateAgentName(agentId, 'New Agent');
    expect(service.agents()[0].name).toBe('New Agent');
  });

  it('should update agent role', () => {
    const agentId = service.agents()[0].id;
    service.updateAgentRole(agentId, 'New Role');
    expect(service.agents()[0].role).toBe('New Role');
  });

  it('should update agent responsibilities', () => {
    const agentId = service.agents()[0].id;
    service.updateAgentResponsibilities(agentId, 'New responsibilities');
    expect(service.agents()[0].responsibilities).toBe('New responsibilities');
  });

  it('should update agent outputs', () => {
    const agentId = service.agents()[0].id;
    service.updateAgentOutputs(agentId, 'New outputs');
    expect(service.agents()[0].outputs).toBe('New outputs');
  });

  it('should handle update methods on non-matching agent ids', () => {
    const original = service.agents()[0].name;
    service.updateAgentName(9999, 'No match');
    expect(service.agents()[0].name).toBe(original);
  });

  // --- formData ---

  it('should assemble formData with workspaceName', () => {
    service.workspaceName.set('My Workspace');
    const data = service.formData();
    expect(data.general.workspaceName).toBe('My Workspace');
    expect(data.platforms.globalRules.defaultPlatform).toBe('youtube');
    expect(data.platforms.globalRules.maxIdeasPerMonth).toBe(30);
    expect(data.contentPillars.length).toBe(2);
    expect(data.audienceSegments.length).toBe(1);
  });

  it('should map pillar platforms to equal-weight distribution', () => {
    service.workspaceName.set('Test');
    const data = service.formData();
    const pillar = data.contentPillars[0];
    expect(pillar.platformDistribution).toBeDefined();
    const weights = Object.values(pillar.platformDistribution as Record<string, number>);
    expect(weights.every((w) => w === 0.5)).toBe(true);
  });

  it('should assign colors to content pillars', () => {
    service.workspaceName.set('Test');
    const data = service.formData();
    expect(data.contentPillars[0].color).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('should generate skillId from agent name', () => {
    service.workspaceName.set('Test');
    const data = service.formData();
    expect(data.skills?.skills[0].skillId).toBe('reporting-agent');
  });

  it('should map brand voice to tone guidelines', () => {
    service.workspaceName.set('Test');
    service.brandVoice.set('professional, bold, casual');
    const data = service.formData();
    expect(data.brandVoice.brandVoiceDescription).toBe('professional, bold, casual');
    expect(data.brandVoice.toneGuidelines).toEqual(['professional', 'bold', 'casual']);
  });

  it('should pass tone tags through to formData brandVoice input', () => {
    service.workspaceName.set('Test');
    service.toggleToneTag('witty');
    service.toggleToneTag('bold');
    expect(service.toneTags()).toEqual(['witty', 'bold']);
    const data = service.formData();
    expect(data.brandVoice).toBeDefined();
  });

  it('should include business objectives in formData when statements provided', () => {
    service.workspaceName.set('Test');
    service.updateObjective(service.businessObjectives()[0].id, 'statement', 'Grow 50%');
    const data = service.formData();
    expect(data.businessObjectives).toBeDefined();
    expect(data.businessObjectives?.length).toBe(1);
    expect(data.businessObjectives?.[0].statement).toBe('Grow 50%');
  });

  it('should omit business objectives from formData when no statements', () => {
    service.workspaceName.set('Test');
    const data = service.formData();
    expect(data.businessObjectives).toBeUndefined();
  });

  it('should include brand positioning in formData', () => {
    service.workspaceName.set('Test');
    service.updateBrandPositioning('targetCustomer', 'Developers');
    const data = service.formData();
    expect(data.brandPositioning).toBeDefined();
    expect(data.brandPositioning?.targetCustomer).toBe('Developers');
  });

  it('should set purpose and mission to undefined when empty', () => {
    service.workspaceName.set('Test');
    service.purpose.set('');
    service.mission.set('');
    service.brandVoice.set('');
    const data = service.formData();
    expect(data.general.purpose).toBeUndefined();
    expect(data.general.mission).toBeUndefined();
    expect(data.brandVoice.brandVoiceDescription).toBeUndefined();
    expect(data.brandVoice.toneGuidelines).toBeUndefined();
  });

  it('should set purpose and mission when non-empty', () => {
    service.workspaceName.set('Test');
    service.purpose.set('A purpose');
    service.mission.set('A mission');
    const data = service.formData();
    expect(data.general.purpose).toBe('A purpose');
    expect(data.general.mission).toBe('A mission');
  });

  it('should handle pillar with no platforms (zero weight)', () => {
    service.workspaceName.set('Test');
    service.contentPillars.set([{
      id: 1, name: 'Solo', themes: '', description: 'Desc',
      audienceSegments: [], platforms: [], objectiveId: '',
    }]);
    const data = service.formData();
    expect(Object.keys(data.contentPillars[0].platformDistribution as Record<string, number>)).toHaveLength(0);
  });

  it('should use fallback name for segment with empty name', () => {
    service.workspaceName.set('Test');
    service.audienceSegments.set([{ id: 1, name: '' }]);
    const data = service.formData();
    expect(data.audienceSegments[0].name).toBe('Segment 1');
  });

  it('should use name for segment with filled name', () => {
    service.workspaceName.set('Test');
    service.audienceSegments.set([{ id: 1, name: 'Engineers' }]);
    const data = service.formData();
    expect(data.audienceSegments[0].name).toBe('Engineers');
  });

  it('should set segment description to empty string (not copy name)', () => {
    service.workspaceName.set('Test');
    service.audienceSegments.set([{ id: 1, name: 'Engineers' }]);
    const data = service.formData();
    expect(data.audienceSegments[0].description).toBe('');
  });

  it('should include channelStrategy with scaffold entries from enabled platforms', () => {
    service.workspaceName.set('Test');
    service.enabledPlatforms.set(new Set(['YouTube', 'Instagram']));
    const data = service.formData();
    expect(data.channelStrategy).toBeDefined();
    expect(data.channelStrategy!.channels.length).toBe(2);
    expect(data.channelStrategy!.channels[0].active).toBe(true);
    expect(data.channelStrategy!.channels[0].role).toBe('');
    expect(data.channelStrategy!.channels[0].primaryContentTypes).toEqual([]);
  });

  it('should include contentMix with 5 default categories totaling 100%', () => {
    service.workspaceName.set('Test');
    const data = service.formData();
    expect(data.contentMix).toBeDefined();
    expect(data.contentMix!.targets.length).toBe(5);
    const total = data.contentMix!.targets.reduce((sum, t) => sum + t.targetPercent, 0);
    expect(total).toBe(100);
    expect(data.contentMix!.targets[0].category).toBe('educational');
  });

  it('should map audienceSegmentIds by segment name position in main list', () => {
    service.workspaceName.set('Test');
    service.audienceSegments.set([
      { id: 1, name: 'Founders' },
      { id: 2, name: 'Engineers' },
    ]);
    service.contentPillars.set([{
      id: 1, name: 'P1', themes: '', description: 'D',
      audienceSegments: ['Engineers'], platforms: [], objectiveId: '',
    }]);
    const data = service.formData();
    expect(data.contentPillars[0].audienceSegmentIds).toEqual(['seg-2']);
  });

  it('should use fallback skillId when agent name is empty', () => {
    service.workspaceName.set('Test');
    service.agents.set([{ id: 1, name: '', role: 'Test', responsibilities: '', outputs: '' }]);
    const data = service.formData();
    expect(data.skills?.skills[0].skillId).toBe('agent-1');
  });

  it('should fall back to Platform.Tbd for unknown display name in enabled platforms', () => {
    service.workspaceName.set('Test');
    service.enabledPlatforms.set(new Set(['Unknown Platform']));
    const data = service.formData();
    expect(data.platforms.platforms[0].platformId).toBe('tbd');
  });

  it('should filter empty themes from pillar', () => {
    service.workspaceName.set('Test');
    service.contentPillars.set([{
      id: 1, name: 'Test', themes: ',,,', description: 'Desc',
      audienceSegments: [], platforms: [], objectiveId: '',
    }]);
    const data = service.formData();
    expect(data.contentPillars[0].themes).toEqual([]);
  });

  // --- populateFromWizardData ---

  describe('populateFromWizardData', () => {
    it('should populate workspace name from general', () => {
      service.populateFromWizardData({ general: { workspaceName: 'My WS' } });
      expect(service.workspaceName()).toBe('My WS');
    });

    it('should populate purpose and mission', () => {
      service.populateFromWizardData({
        general: { workspaceName: 'Test', purpose: 'A purpose', mission: 'A mission' },
      });
      expect(service.purpose()).toBe('A purpose');
      expect(service.mission()).toBe('A mission');
    });

    it('should populate brand voice', () => {
      service.populateFromWizardData({
        brandVoice: { brandVoiceDescription: 'professional, bold' },
      });
      expect(service.brandVoice()).toBe('professional, bold');
    });

    it('should populate tone tags', () => {
      service.populateFromWizardData({
        brandVoice: { toneTags: ['witty', 'bold', 'casual'] },
      });
      expect(service.toneTags()).toEqual(['witty', 'bold', 'casual']);
    });

    it('should populate business objectives', () => {
      service.populateFromWizardData({
        businessObjectives: [
          { id: 'obj-1', category: 'growth', statement: 'Grow 50%', target: 50, unit: '%', timeframe: 'Q1', status: 'on-track' },
        ],
      });
      expect(service.businessObjectives().length).toBe(1);
      expect(service.businessObjectives()[0].statement).toBe('Grow 50%');
      expect(service.businessObjectives()[0].target).toBe('50');
    });

    it('should populate brand positioning', () => {
      service.populateFromWizardData({
        brandPositioning: {
          targetCustomer: 'Developers',
          problemSolved: 'Slow builds',
          solution: 'Fast CI',
          differentiator: 'Speed',
          positioningStatement: 'The fastest CI for devs',
        },
      });
      expect(service.brandPositioning().targetCustomer).toBe('Developers');
      expect(service.brandPositioning().positioningStatement).toBe('The fastest CI for devs');
    });

    it('should populate audience segments with name and demographics', () => {
      service.populateFromWizardData({
        audienceSegments: [
          { id: 'seg-1', name: 'Engineers', description: 'Software engineers', demographics: '25-34' },
          { id: 'seg-2', name: 'Founders', description: 'Startup founders', demographics: '30-45' },
        ],
      });
      expect(service.audienceSegments().length).toBe(2);
      expect(service.audienceSegments()[0].name).toBe('Engineers');
      expect(service.audienceSegments()[0].demographics).toBe('25-34');
      expect(service.audienceSegments()[1].name).toBe('Founders');
      expect(service.audienceSegments()[1].demographics).toBe('30-45');
    });

    it('should populate enabled platforms from platform IDs', () => {
      service.populateFromWizardData({
        platforms: {
          platforms: [
            { platformId: Platform.YouTube, enabled: true },
            { platformId: Platform.Instagram, enabled: true },
          ],
          globalRules: { defaultPlatform: Platform.YouTube, maxIdeasPerMonth: 20 },
        },
      });
      expect(service.enabledPlatforms().has('YouTube')).toBe(true);
      expect(service.enabledPlatforms().has('Instagram')).toBe(true);
      expect(service.defaultPlatform()).toBe('YouTube');
      expect(service.maxIdeasPerMonth()).toBe(20);
    });

    it('should populate content pillars with themes as comma-join and objectiveId', () => {
      service.populateFromWizardData({
        contentPillars: [
          {
            id: 'p-1',
            name: 'News',
            description: 'Industry news',
            color: '#d94e33',
            themes: ['AI', 'Tech', 'Startups'],
            audienceSegmentIds: ['seg-1'],
            platformDistribution: { youtube: 0.5, linkedin: 0.5 },
            objectiveIds: ['obj-1'],
          },
        ],
      });
      expect(service.contentPillars().length).toBe(1);
      expect(service.contentPillars()[0].name).toBe('News');
      expect(service.contentPillars()[0].themes).toBe('AI, Tech, Startups');
      expect(service.contentPillars()[0].platforms).toContain('YouTube');
      expect(service.contentPillars()[0].platforms).toContain('LinkedIn');
      expect(service.contentPillars()[0].objectiveId).toBe('obj-1');
    });

    it('should populate agents from skills', () => {
      service.populateFromWizardData({
        skills: {
          skills: [
            {
              id: 'sk-1',
              skillId: 'reporter',
              name: 'Reporter',
              role: 'Journalist',
              responsibilities: ['Research', 'Write articles'],
              expectedOutputs: ['Daily digest', 'Weekly report'],
            },
          ],
        },
      });
      expect(service.agents().length).toBe(1);
      expect(service.agents()[0].name).toBe('Reporter');
      expect(service.agents()[0].responsibilities).toBe('Research\nWrite articles');
      expect(service.agents()[0].outputs).toBe('Daily digest\nWeekly report');
    });

    it('should handle empty formData gracefully', () => {
      service.populateFromWizardData({});
      expect(service.workspaceName()).toBe('');
      expect(service.audienceSegments().length).toBe(1);
    });

    it('should handle unknown platform IDs gracefully', () => {
      service.populateFromWizardData({
        platforms: {
          platforms: [
            { platformId: 'unknown-platform' as never, enabled: true },
          ],
          globalRules: { defaultPlatform: 'unknown-platform' as never, maxIdeasPerMonth: 5 },
        },
      });
      expect(service.enabledPlatforms().has('unknown-platform')).toBe(true);
      expect(service.defaultPlatform()).toBe('unknown-platform');
    });

    it('should filter out disabled platforms', () => {
      service.populateFromWizardData({
        platforms: {
          platforms: [
            { platformId: Platform.YouTube, enabled: true },
            { platformId: Platform.Instagram, enabled: false },
          ],
          globalRules: { defaultPlatform: Platform.YouTube, maxIdeasPerMonth: 10 },
        },
      });
      expect(service.enabledPlatforms().has('YouTube')).toBe(true);
      expect(service.enabledPlatforms().has('Instagram')).toBe(false);
    });

    it('should handle pillar with empty themes array', () => {
      service.populateFromWizardData({
        contentPillars: [
          {
            id: 'p-1', name: 'Empty', description: 'No themes', color: '#000',
            themes: [], audienceSegmentIds: [], platformDistribution: {},
          },
        ],
      });
      expect(service.contentPillars()[0].themes).toBe('');
      expect(service.contentPillars()[0].platforms).toEqual([]);
    });

    it('should use targetPlatforms when platformDistribution is empty', () => {
      service.populateFromWizardData({
        contentPillars: [
          {
            id: 'p1', name: 'Tips', description: 'desc', color: '#fff',
            themes: ['a'], targetPlatforms: ['youtube', 'linkedin'],
          },
        ],
      });
      expect(service.contentPillars()[0].platforms).toEqual(['YouTube', 'LinkedIn']);
    });

    it('should default to empty platforms when both platformDistribution and targetPlatforms are absent', () => {
      service.populateFromWizardData({
        contentPillars: [
          { id: 'p1', name: 'Tips', description: 'desc', color: '#fff', themes: ['a'] },
        ],
      });
      expect(service.contentPillars()[0].platforms).toEqual([]);
    });

    it('should populate content warning and AI disclaimer toggles', () => {
      service.populateFromWizardData({
        platforms: {
          platforms: [],
          globalRules: {
            defaultPlatform: Platform.YouTube,
            maxIdeasPerMonth: 10,
            contentWarningToggle: true,
            aiDisclaimerToggle: false,
          },
        },
      });
      expect(service.contentWarning()).toBe(true);
      expect(service.aiDisclaimer()).toBe(false);
    });

    it('should default objectiveId to empty string when objectiveIds absent', () => {
      service.populateFromWizardData({
        contentPillars: [
          {
            id: 'p-1', name: 'News', description: 'desc', color: '#000',
            themes: ['a'], audienceSegmentIds: [], platformDistribution: {},
          },
        ],
      });
      expect(service.contentPillars()[0].objectiveId).toBe('');
    });
  });

  // --- Step Validation (7 steps) ---

  describe('stepValidation', () => {
    it('should return error for step 1 when workspace name is empty', () => {
      service.workspaceName.set('');
      const result = service.stepValidation(1);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toContain('Workspace Name');
      }
    });

    it('should return error for step 1 when workspace name is whitespace only', () => {
      service.workspaceName.set('   ');
      const result = service.stepValidation(1);
      expect(result.valid).toBe(false);
    });

    it('should return error for step 1 when workspace name exceeds 100 characters', () => {
      service.workspaceName.set('a'.repeat(101));
      const result = service.stepValidation(1);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toContain('100');
      }
    });

    it('should return valid for step 1 when workspace name is provided', () => {
      service.workspaceName.set('My Workspace');
      const result = service.stepValidation(1);
      expect(result.valid).toBe(true);
    });

    it('should return error for step 2 when no objective has a statement', () => {
      const result = service.stepValidation(2);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toContain('objective');
      }
    });

    it('should return valid for step 2 when at least one objective has a statement', () => {
      service.updateObjective(service.businessObjectives()[0].id, 'statement', 'Grow audience');
      const result = service.stepValidation(2);
      expect(result.valid).toBe(true);
    });

    it('should return valid for step 3 (brand, no required fields)', () => {
      expect(service.stepValidation(3).valid).toBe(true);
    });

    it('should return error for step 4 when no segment has a name', () => {
      const result = service.stepValidation(4);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toContain('segment');
      }
    });

    it('should return valid for step 4 when at least one segment has a name', () => {
      service.updateSegmentName(service.audienceSegments()[0].id, 'Developers');
      const result = service.stepValidation(4);
      expect(result.valid).toBe(true);
    });

    it('should return valid for steps 5-6 (no required fields)', () => {
      expect(service.stepValidation(5).valid).toBe(true);
      expect(service.stepValidation(6).valid).toBe(true);
    });

    it('should return valid for step 7 (review step, no own validation)', () => {
      expect(service.stepValidation(7).valid).toBe(true);
    });
  });

  // --- CreateWorkspaceRequest with skills (model coverage) ---

  it('should construct CreateWorkspaceRequest with optional skills', () => {
    service.workspaceName.set('Test');
    const baseData = service.formData();
    const requestWithSkills = new CreateWorkspaceRequest({
      ...baseData,
      skills: {
        skills: [
          {
            id: 'sk-1',
            skillId: 'reporting-agent',
            name: 'Reporting Agent',
            role: 'Reporter',
          },
        ],
      },
    });
    expect(requestWithSkills.skills).toBeDefined();
    expect(requestWithSkills.skills?.skills.length).toBe(1);
    expect(requestWithSkills.skills?.skills[0].skillId).toBe('reporting-agent');
  });

  // Direct CreateWorkspaceRequest model coverage — exercises the absent-field
  // branches (skills/businessObjectives/brandPositioning/channelStrategy/
  // contentMix all optional) so the model class hits both sides of each `if`.
  it('constructs CreateWorkspaceRequest without any optional fields', () => {
    service.workspaceName.set('Test');
    const baseData = service.formData();
    const req = new CreateWorkspaceRequest({
      general: baseData.general,
      platforms: baseData.platforms,
      brandVoice: baseData.brandVoice,
      contentPillars: baseData.contentPillars,
      audienceSegments: baseData.audienceSegments,
    });
    expect(req.skills).toBeUndefined();
    expect(req.businessObjectives).toBeUndefined();
    expect(req.brandPositioning).toBeUndefined();
    expect(req.channelStrategy).toBeUndefined();
    expect(req.contentMix).toBeUndefined();
  });

  it('constructs CreateWorkspaceRequest with every optional field present', () => {
    service.workspaceName.set('Test');
    const baseData = service.formData();
    const req = new CreateWorkspaceRequest({
      ...baseData,
      skills: {
        skills: [{ id: 'sk-1', skillId: 'editor', name: 'Editor', role: 'editor' }],
      },
      businessObjectives: [
        { id: 'bo-1', category: 'growth', statement: 'Grow', target: 100, unit: 'followers', timeframe: 'Q1', status: 'on-track' },
      ],
      brandPositioning: {
        targetCustomer: 'Devs',
        problemSolved: 'Slow builds',
        solution: 'Fast builds',
        differentiator: 'Faster than X',
        positioningStatement: 'For devs who hate waiting.',
      },
      channelStrategy: { channels: [] },
      contentMix: { targets: [] },
    });
    expect(req.skills).toBeDefined();
    expect(req.businessObjectives?.length).toBe(1);
    expect(req.brandPositioning).toBeDefined();
    expect(req.channelStrategy).toBeDefined();
    expect(req.contentMix).toBeDefined();
  });

  // --- AUDIENCES computed (dynamic from audienceSegments) ---

  it('should return audience segment names for AUDIENCES when segments have names', () => {
    service.audienceSegments.set([
      { id: 1, name: 'Engineers' },
      { id: 2, name: 'Designers' },
    ]);
    expect(service.AUDIENCES()).toEqual(['Engineers', 'Designers']);
  });

  it('should return empty array for AUDIENCES when segments have no names', () => {
    service.audienceSegments.set([{ id: 1, name: '' }]);
    expect(service.AUDIENCES()).toEqual([]);
  });

  it('should return empty array for AUDIENCES when no segments', () => {
    service.audienceSegments.set([]);
    expect(service.AUDIENCES()).toEqual([]);
  });

  // --- addObjective/removeObjective boundary tests ---

  it('should not add objective beyond MAX_OBJECTIVES', () => {
    expect(MAX_OBJECTIVES).toBe(4);
    // Start with default 1, add until cap
    while (service.businessObjectives().length < MAX_OBJECTIVES) {
      service.addObjective();
    }
    expect(service.businessObjectives().length).toBe(MAX_OBJECTIVES);
    service.addObjective(); // Should be a no-op
    expect(service.businessObjectives().length).toBe(MAX_OBJECTIVES);
  });

  // --- mergeObjectiveSuggestions ---

  describe('mergeObjectiveSuggestions', () => {
    it('drops the empty placeholder and appends suggestions', () => {
      service.mergeObjectiveSuggestions([
        suggestion({ statement: 'A' }, 0),
        suggestion({ statement: 'B' }, 1),
      ]);
      const list = service.businessObjectives();
      expect(list).toHaveLength(2);
      expect(list.map((o) => o.statement)).toEqual(['A', 'B']);
      expect(list.every((o) => typeof o.id === 'number')).toBe(true);
    });

    it('preserves a non-empty existing entry and appends', () => {
      service.updateObjective(
        service.businessObjectives()[0].id,
        'statement',
        'Manual',
      );
      service.mergeObjectiveSuggestions([
        suggestion({ statement: 'AI 1' }, 0),
      ]);
      const list = service.businessObjectives();
      expect(list).toHaveLength(2);
      expect(list[0].statement).toBe('Manual');
      expect(list[1].statement).toBe('AI 1');
    });

    it('skips dupes case-insensitively against existing', () => {
      service.updateObjective(
        service.businessObjectives()[0].id,
        'statement',
        'Grow audience',
      );
      service.mergeObjectiveSuggestions([
        suggestion({ statement: 'GROW AUDIENCE' }, 0),
        suggestion({ statement: 'New goal' }, 1),
      ]);
      const list = service.businessObjectives();
      expect(list).toHaveLength(2);
      expect(list[1].statement).toBe('New goal');
    });

    it('skips dupes within a single batch of suggestions', () => {
      service.mergeObjectiveSuggestions([
        suggestion({ statement: 'Same goal' }, 0),
        suggestion({ statement: ' SAME GOAL ' }, 1),
        suggestion({ statement: 'Different' }, 2),
      ]);
      const list = service.businessObjectives();
      expect(list).toHaveLength(2);
      expect(list.map((o) => o.statement)).toEqual(['Same goal', 'Different']);
    });

    it('skips suggestions whose statement is empty', () => {
      service.mergeObjectiveSuggestions([
        suggestion({ statement: '   ' }, 0),
        suggestion({ statement: 'Real one' }, 1),
      ]);
      // empty placeholder replaced by single real one
      expect(service.businessObjectives()).toHaveLength(1);
      expect(service.businessObjectives()[0].statement).toBe('Real one');
    });

    it('caps at MAX_OBJECTIVES with suggestions dropping first', () => {
      // Seed MAX_OBJECTIVES - 1 manual entries (3) — fresh state has 1, add 2.
      service.updateObjective(service.businessObjectives()[0].id, 'statement', 'A');
      service.addObjective();
      service.updateObjective(service.businessObjectives()[1].id, 'statement', 'B');
      service.addObjective();
      service.updateObjective(service.businessObjectives()[2].id, 'statement', 'C');

      service.mergeObjectiveSuggestions([
        suggestion({ statement: 'D' }, 0),
        suggestion({ statement: 'E' }, 1),
        suggestion({ statement: 'F' }, 2),
      ]);

      const list = service.businessObjectives();
      expect(list).toHaveLength(MAX_OBJECTIVES);
      expect(list.slice(0, 3).map((o) => o.statement)).toEqual(['A', 'B', 'C']);
      expect(list[3].statement).toBe('D');
    });

    it('restores an empty placeholder when nothing valid exists after merge', () => {
      service.mergeObjectiveSuggestions([]); // empty + no suggestions
      const list = service.businessObjectives();
      expect(list).toHaveLength(1);
      expect(list[0].statement).toBe('');
    });

    it('coerces suggestion target number to string and copies all fields', () => {
      service.mergeObjectiveSuggestions([
        suggestion(
          { statement: 'X', target: 1500, unit: 'subs', timeframe: 'Q1', category: 'engagement' },
          0,
        ),
      ]);
      const merged = service.businessObjectives()[0];
      expect(merged.statement).toBe('X');
      expect(merged.target).toBe('1500');
      expect(merged.unit).toBe('subs');
      expect(merged.timeframe).toBe('Q1');
      expect(merged.category).toBe('engagement');
    });

    it('assigns unique ids across rapid sequential merges', () => {
      service.mergeObjectiveSuggestions([
        suggestion({ statement: 'A' }, 0),
        suggestion({ statement: 'B' }, 1),
      ]);
      const ids = service.businessObjectives().map((o) => o.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  it('should not remove the last objective', () => {
    // Remove all but one
    const ids = service.businessObjectives().map(o => o.id);
    service.removeObjective(ids[0]);
    expect(service.businessObjectives().length).toBe(1);
    service.removeObjective(service.businessObjectives()[0].id); // Should be a no-op
    expect(service.businessObjectives().length).toBe(1);
  });

  it('should update a specific objective field', () => {
    const id = service.businessObjectives()[0].id;
    service.updateObjective(id, 'statement', 'Grow followers');
    expect(service.businessObjectives().find(o => o.id === id)?.statement).toBe('Grow followers');
  });

  it('should filter out blank segment names from AUDIENCES', () => {
    service.audienceSegments.set([
      { id: 1, name: 'Valid' },
      { id: 2, name: '  ' },
      { id: 3, name: 'Also Valid' },
    ]);
    expect(service.AUDIENCES()).toEqual(['Valid', 'Also Valid']);
  });

  // --- Signal initializer coverage ---

  it('should have default signal values on creation', () => {
    const fresh = new NewWorkspaceFormService();
    expect(fresh.workspaceName()).toBe('');
    expect(fresh.brandVoice()).toBe('');
    expect(fresh.toneTags()).toEqual([]);
    expect(fresh.contentWarning()).toBe(false);
    expect(fresh.aiDisclaimer()).toBe(true);
    expect(fresh.defaultPlatform()).toBe('YouTube');
    expect(fresh.maxIdeasPerMonth()).toBe(30);
  });
});
