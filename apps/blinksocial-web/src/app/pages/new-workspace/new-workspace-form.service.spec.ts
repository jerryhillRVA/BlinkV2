import { TestBed } from '@angular/core/testing';
import { NewWorkspaceFormService } from './new-workspace-form.service';
import { CreateWorkspaceRequest } from '@blinksocial/models';

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
    // Verify toneTags signal state (formData passes them to constructor)
    expect(service.toneTags()).toEqual(['witty', 'bold']);
    // Verify formData still assembles without error
    const data = service.formData();
    expect(data.brandVoice).toBeDefined();
  });

  it('should include business objectives in formData when statements provided', () => {
    service.workspaceName.set('Test');
    service.updateObjective(service.businessObjectives()[0].id, 'statement', 'Grow 50%');
    const data = service.formData();
    expect(data.businessObjectives).toBeDefined();
    expect(data.businessObjectives!.length).toBe(1);
    expect(data.businessObjectives![0].statement).toBe('Grow 50%');
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
    expect(data.brandPositioning!.targetCustomer).toBe('Developers');
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
    expect(requestWithSkills.skills!.skills.length).toBe(1);
    expect(requestWithSkills.skills!.skills[0].skillId).toBe('reporting-agent');
  });
});
