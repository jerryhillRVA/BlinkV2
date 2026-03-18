import { TestBed } from '@angular/core/testing';
import { NewWorkspaceFormService } from './new-workspace-form.service';

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

  it('should have default audience segment', () => {
    expect(service.audienceSegments().length).toBe(1);
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

  it('should assemble formData with workspaceName', () => {
    service.workspaceName.set('My Workspace');
    const data = service.formData();
    expect(data.general.workspaceName).toBe('My Workspace');
    expect(data.platforms.globalRules.defaultPlatform).toBe('youtube');
    expect(data.platforms.globalRules.maxIdeasPerMonth).toBe(30);
    expect(data.contentPillars.length).toBe(2);
    expect(data.audienceSegments.length).toBe(1);
    expect(data.skills.skills.length).toBe(2);
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
    expect(data.skills.skills[0].skillId).toBe('reporting-agent');
  });

  it('should map brand voice to tone guidelines', () => {
    service.workspaceName.set('Test');
    service.brandVoice.set('professional, bold, casual');
    const data = service.formData();
    expect(data.brandVoice.brandVoiceDescription).toBe('professional, bold, casual');
    expect(data.brandVoice.toneGuidelines).toEqual(['professional', 'bold', 'casual']);
  });

  it('should update segment description', () => {
    const segId = service.audienceSegments()[0].id;
    service.updateSegmentDescription(segId, 'Tech professionals');
    expect(service.audienceSegments()[0].description).toBe('Tech professionals');
  });

  it('should update segment age range', () => {
    const segId = service.audienceSegments()[0].id;
    service.updateSegmentAgeRange(segId, '35-44');
    expect(service.audienceSegments()[0].ageRange).toBe('35-44');
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

  it('should not remove last agent', () => {
    service.removeAgent(service.agents()[0].id);
    expect(service.agents().length).toBe(1);
    service.removeAgent(service.agents()[0].id);
    expect(service.agents().length).toBe(1);
  });

  it('should not remove last pillar', () => {
    service.removePillar(service.contentPillars()[0].id);
    expect(service.contentPillars().length).toBe(1);
    service.removePillar(service.contentPillars()[0].id);
    expect(service.contentPillars().length).toBe(1);
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
      audienceSegments: [], platforms: [],
    }]);
    const data = service.formData();
    expect(Object.keys(data.contentPillars[0].platformDistribution as Record<string, number>)).toHaveLength(0);
  });

  it('should use fallback name for segment with empty description', () => {
    service.workspaceName.set('Test');
    service.audienceSegments.set([{ id: 1, description: '', ageRange: '25-34' }]);
    const data = service.formData();
    expect(data.audienceSegments[0].name).toBe('Segment 1');
  });

  it('should use description as name for segment with filled description', () => {
    service.workspaceName.set('Test');
    service.audienceSegments.set([{ id: 1, description: 'Engineers', ageRange: '25-34' }]);
    const data = service.formData();
    expect(data.audienceSegments[0].name).toBe('Engineers');
  });

  it('should use fallback skillId when agent name is empty', () => {
    service.workspaceName.set('Test');
    service.agents.set([{ id: 1, name: '', role: 'Test', responsibilities: '', outputs: '' }]);
    const data = service.formData();
    expect(data.skills.skills[0].skillId).toBe('agent-1');
  });

  it('should handle updateSegmentDescription with non-matching id', () => {
    service.updateSegmentDescription(9999, 'No match');
    expect(service.audienceSegments()[0].description).toBe('');
  });

  it('should handle updateSegmentAgeRange with non-matching id', () => {
    service.updateSegmentAgeRange(9999, '45-54');
    expect(service.audienceSegments()[0].ageRange).toBe('25-34');
  });

  it('should handle update methods on non-matching pillar ids', () => {
    const original = service.contentPillars()[0].name;
    service.updatePillarName(9999, 'No match');
    expect(service.contentPillars()[0].name).toBe(original);
  });

  it('should handle update methods on non-matching agent ids', () => {
    const original = service.agents()[0].name;
    service.updateAgentName(9999, 'No match');
    expect(service.agents()[0].name).toBe(original);
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
      audienceSegments: [], platforms: [],
    }]);
    const data = service.formData();
    expect(data.contentPillars[0].themes).toEqual([]);
  });
});
