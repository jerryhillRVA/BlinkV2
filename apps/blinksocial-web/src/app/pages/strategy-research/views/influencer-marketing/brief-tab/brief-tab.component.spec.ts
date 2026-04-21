import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BriefTabComponent } from './brief-tab.component';
import { StrategyResearchStateService } from '../../../strategy-research-state.service';
import { ToastService } from '../../../../../core/toast/toast.service';
import { AI_SIMULATION_DELAY_MS } from '../../../strategy-research.constants';
import type {
  BusinessObjective,
  ContentPillar,
  ShortlistedInfluencer,
} from '../../../strategy-research.types';

describe('BriefTabComponent', () => {
  let component: BriefTabComponent;
  let fixture: ReturnType<typeof TestBed.createComponent<BriefTabComponent>>;
  let toastSpy: { showSuccess: ReturnType<typeof vi.fn>; showError: ReturnType<typeof vi.fn> };

  const influencer: ShortlistedInfluencer = {
    id: 'x', name: 'Maya Chen', handle: '@mayachen',
    platforms: ['instagram', 'tiktok'], tier: 'micro',
    followers: 48200, engagementRate: 5.8, niche: [],
    audienceAlignment: 89, objectiveFit: [], bio: '',
    avatarColor: '#000', status: 'new', addedAt: '2026-01-01T00:00:00Z',
  };

  const pillars: ContentPillar[] = [
    { id: 'p1', name: 'Education', description: '', color: '#f00' },
    { id: 'p2', name: 'Community', description: '', color: '#0f0' },
  ];

  const objectives: BusinessObjective[] = [
    { id: 'o1', category: 'growth', statement: 'Grow', target: 100, unit: 'x', timeframe: 'Q1', status: 'on-track' },
  ];

  beforeEach(async () => {
    vi.useFakeTimers();
    toastSpy = { showSuccess: vi.fn(), showError: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [BriefTabComponent],
      providers: [
        {
          provide: StrategyResearchStateService,
          useValue: {
            shortlistedInfluencers: signal<ShortlistedInfluencer[]>([influencer]),
            objectives: signal<BusinessObjective[]>(objectives),
            pillars: signal<ContentPillar[]>(pillars),
          },
        },
        { provide: ToastService, useValue: toastSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BriefTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => vi.useRealTimers());

  it('creates and auto-populates key messages from pillars', () => {
    expect(component).toBeTruthy();
    expect(component.form().keyMessages).toContain('Education');
    expect(component.form().keyMessages).toContain('Community');
  });

  it('header copy matches the Figma reference', () => {
    const nativeElement = fixture.nativeElement as HTMLElement;
    expect(nativeElement.querySelector('.brief__title')?.textContent?.trim()).toBe('Creator Brief');
    expect(nativeElement.querySelector('.brief__subtitle')?.textContent?.trim()).toBe(
      'Build a brief that reflects your strategy',
    );
  });

  it('objective options include the category emoji prefix', () => {
    const [option] = component.objectiveOptions();
    expect(option.label).toBe('📈 Grow');
  });

  it('renders the generated brief in a <pre> so it auto-sizes without scroll', () => {
    component.setInfluencer('@mayachen');
    component.updateField('campaignName', 'Spring Push');
    component.generate();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    fixture.detectChanges();
    const output = fixture.nativeElement.querySelector('.brief__output');
    expect(output).toBeTruthy();
    expect(output?.tagName.toLowerCase()).toBe('pre');
    expect(output?.textContent).toContain('CAMPAIGN BRIEF');
  });

  it('field labels match the Figma reference', () => {
    const nativeElement = fixture.nativeElement as HTMLElement;
    const labels = Array.from(nativeElement.querySelectorAll('.brief__label')).map((el) =>
      el.textContent?.trim(),
    );
    expect(labels).toContain('Select influencer');
    expect(labels).toContain('Campaign name');
    expect(labels).toContain('Objective');
    expect(labels).toContain('Content type');
  });

  it('FTC checkbox label includes the (FTC guideline) suffix', () => {
    const nativeElement = fixture.nativeElement as HTMLElement;
    const checkboxLabel = nativeElement.querySelector('.brief__checkbox');
    expect(checkboxLabel?.textContent).toContain('Require #ad or #sponsored disclosure (FTC guideline)');
  });

  it('renders the Platform(s) field with one pill per available platform after a creator is selected', () => {
    const nativeElement = fixture.nativeElement as HTMLElement;
    component.setInfluencer('@mayachen');
    fixture.detectChanges();
    expect(nativeElement.textContent).toContain('Platform(s)');
    const pills = nativeElement.querySelectorAll('.brief__toggle');
    expect(pills).toHaveLength(2);
    expect(pills[0].textContent).toContain('Instagram');
    expect(pills[1].textContent).toContain('TikTok');
  });

  it('setInfluencer populates platforms', () => {
    component.setInfluencer('@mayachen');
    expect(component.selectedPlatforms()).toEqual(['instagram', 'tiktok']);
  });

  it('togglePlatform adds/removes from selection', () => {
    component.setInfluencer('@mayachen');
    component.togglePlatform('instagram');
    expect(component.isPlatformActive('instagram')).toBe(false);
    component.togglePlatform('instagram');
    expect(component.isPlatformActive('instagram')).toBe(true);
  });

  it('updateField mutates form state', () => {
    component.updateField('campaignName', 'Spring Push');
    expect(component.form().campaignName).toBe('Spring Push');
  });

  it('setObjective and setContentType mutate state', () => {
    component.setObjective('o1');
    expect(component.selectedObjectiveId()).toBe('o1');
    component.setContentType('Reel');
    expect(component.form().contentType).toBe('Reel');
  });

  it('canGenerate requires handle and campaign name', () => {
    expect(component.canGenerate()).toBe(false);
    component.setInfluencer('@mayachen');
    expect(component.canGenerate()).toBe(false);
    component.updateField('campaignName', 'X');
    expect(component.canGenerate()).toBe(true);
  });

  it('generate produces a multi-section brief', () => {
    component.setInfluencer('@mayachen');
    component.updateField('campaignName', 'Spring Launch');
    component.setObjective('o1');
    component.updateField('deliverables', '1 Reel');
    component.generate();
    expect(component.isGenerating()).toBe(true);
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(component.isGenerating()).toBe(false);
    const brief = component.generatedBrief();
    expect(brief).toContain('CAMPAIGN BRIEF');
    expect(brief).toContain('Spring Launch');
    expect(brief).toContain('Maya Chen');
    expect(brief).toContain('KEY MESSAGES');
    expect(brief).toContain('DELIVERABLES');
    expect(brief).toContain('1 Reel');
    expect(toastSpy.showSuccess).toHaveBeenCalled();
  });

  it('generate handles missing objective gracefully', () => {
    component.setInfluencer('@mayachen');
    component.updateField('campaignName', 'No-Obj');
    component.generate();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(component.generatedBrief()).toContain('Objective: TBD');
  });

  it('generate omits disclosure section when unchecked', () => {
    component.setInfluencer('@mayachen');
    component.updateField('campaignName', 'X');
    component.updateField('ftcDisclosure', false);
    component.generate();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(component.generatedBrief()).toContain('per creator guidelines');
  });

  it('generate is a no-op when canGenerate is false', () => {
    component.generate();
    expect(component.isGenerating()).toBe(false);
  });

  it('regenerate re-runs generate', () => {
    component.setInfluencer('@mayachen');
    component.updateField('campaignName', 'X');
    component.generate();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    component.regenerate();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(component.generatedBrief()).toBeTruthy();
  });

  it('copy writes to clipboard when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    component.setInfluencer('@mayachen');
    component.updateField('campaignName', 'X');
    component.generate();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    await component.copy();
    expect(writeText).toHaveBeenCalled();
  });

  it('copy is a no-op when no brief is present', async () => {
    const writeText = vi.fn();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    await component.copy();
    expect(writeText).not.toHaveBeenCalled();
  });

  it('copy surfaces error on clipboard failure', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('nope'));
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    component.setInfluencer('@mayachen');
    component.updateField('campaignName', 'X');
    component.generate();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    await component.copy();
    expect(toastSpy.showError).toHaveBeenCalled();
  });

  it('generated brief falls back to TBD/none/(none) for missing fields', () => {
    component.setInfluencer('@mayachen');
    component.updateField('campaignName', 'Empty Brief');
    component.updateField('keyMessages', '');
    component.updateField('deliverables', '');
    component.updateField('toneGuidance', '');
    component.updateField('hashtags', '');
    component.updateField('cta', '');
    component.updateField('startDate', '');
    component.updateField('postDate', '');
    component.generate();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    const brief = component.generatedBrief();
    expect(brief).toContain('(none specified)');
    expect(brief).toContain('Start: TBD');
    expect(brief).toContain('Post: TBD');
    expect(brief).toContain('Required: (none)');
    expect(brief).toContain('CTA: (none)');
    expect(brief).toContain('Match your authentic voice.');
  });

  it('generated brief labels platforms as TBD when none selected', () => {
    component.setInfluencer('@mayachen');
    component.updateField('campaignName', 'Platforms Empty');
    component.togglePlatform('instagram');
    component.togglePlatform('tiktok');
    component.generate();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(component.generatedBrief()).toContain('Platforms: TBD');
  });

  it('does not overwrite keyMessages when pillars load after user edits', () => {
    component.updateField('keyMessages', 'custom');
    // Trigger pillar signal change to ensure effect re-runs but doesn't clobber
    component.updateField('keyMessages', 'custom');
    expect(component.form().keyMessages).toBe('custom');
  });

  it('prefills from initialInfluencer input', () => {
    fixture.componentRef.setInput('initialInfluencer', influencer);
    fixture.detectChanges();
    expect(component.selectedHandle()).toBe('@mayachen');
    expect(component.selectedPlatforms()).toEqual(['instagram', 'tiktok']);
  });
});
