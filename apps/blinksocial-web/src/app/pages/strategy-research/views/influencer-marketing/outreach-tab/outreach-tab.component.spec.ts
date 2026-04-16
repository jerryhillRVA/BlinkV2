import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OutreachTabComponent } from './outreach-tab.component';
import { StrategyResearchStateService } from '../../../strategy-research-state.service';
import { ToastService } from '../../../../../core/toast/toast.service';
import { AI_SIMULATION_DELAY_MS } from '../../../strategy-research.constants';
import type {
  BrandVoiceData,
  BusinessObjective,
  ShortlistedInfluencer,
} from '../../../strategy-research.types';

describe('OutreachTabComponent', () => {
  let component: OutreachTabComponent;
  let fixture: ReturnType<typeof TestBed.createComponent<OutreachTabComponent>>;
  let shortlistSignal: ReturnType<typeof signal<ShortlistedInfluencer[]>>;
  let toastSpy: { showSuccess: ReturnType<typeof vi.fn>; showError: ReturnType<typeof vi.fn> };

  const influencer: ShortlistedInfluencer = {
    id: 'x', name: 'Maya Chen', handle: '@mayachen',
    platforms: ['instagram', 'tiktok'], tier: 'micro',
    followers: 48200, engagementRate: 5.8, niche: [],
    audienceAlignment: 89, objectiveFit: [], bio: '',
    avatarColor: '#000', status: 'new', addedAt: '2026-01-01T00:00:00Z',
  };

  const objectives: BusinessObjective[] = [
    { id: 'o1', category: 'growth', statement: 'Grow Instagram', target: 100, unit: 'x', timeframe: 'Q1', status: 'on-track' },
  ];

  const brandVoice: BrandVoiceData = {
    missionStatement: 'empowering creators to grow',
    voiceAttributes: [], toneByContext: [], platformToneAdjustments: [],
    vocabulary: { preferred: [], avoid: [] },
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    shortlistSignal = signal<ShortlistedInfluencer[]>([influencer]);
    toastSpy = { showSuccess: vi.fn(), showError: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [OutreachTabComponent],
      providers: [
        {
          provide: StrategyResearchStateService,
          useValue: {
            shortlistedInfluencers: shortlistSignal,
            objectives: signal<BusinessObjective[]>(objectives),
            brandVoice: signal<BrandVoiceData>(brandVoice),
          },
        },
        { provide: ToastService, useValue: toastSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OutreachTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => vi.useRealTimers());

  it('creates', () => expect(component).toBeTruthy());

  it('populates influencer and objective dropdown options', () => {
    expect(component.influencerOptions()).toHaveLength(1);
    expect(component.objectiveOptions()).toHaveLength(1);
  });

  it('objective options include the category emoji prefix', () => {
    const [option] = component.objectiveOptions();
    expect(option.label).toBe('📈 Grow Instagram');
  });

  it('setInfluencer selects handle and defaults platform', () => {
    component.setInfluencer('@mayachen');
    expect(component.selectedHandle()).toBe('@mayachen');
    expect(component.selectedPlatform()).toBe('instagram');
  });

  it('setPlatform updates platform', () => {
    component.setInfluencer('@mayachen');
    component.setPlatform('tiktok');
    expect(component.selectedPlatform()).toBe('tiktok');
  });

  it('setFormat updates format', () => {
    component.setFormat('email');
    expect(component.format()).toBe('email');
  });

  it('does not render the "Reach out on" platform field until an influencer is selected', () => {
    const nativeElement = fixture.nativeElement as HTMLElement;
    expect(nativeElement.textContent).not.toContain('Reach out on');
    component.setInfluencer('@mayachen');
    fixture.detectChanges();
    expect(nativeElement.textContent).toContain('Reach out on');
    const pills = nativeElement.querySelectorAll('.outreach__platform-toggle');
    expect(pills).toHaveLength(2); // Maya is on Instagram + TikTok
    expect(pills[0].textContent).toContain('Instagram');
    expect(pills[1].textContent).toContain('TikTok');
  });

  it('header copy matches the Figma reference', () => {
    const nativeElement = fixture.nativeElement as HTMLElement;
    expect(nativeElement.querySelector('.outreach__title')?.textContent?.trim()).toBe('Draft Outreach');
    expect(nativeElement.querySelector('.outreach__subtitle')?.textContent?.trim()).toBe(
      'AI-drafted using your brand voice and objectives',
    );
  });

  it('field labels match the Figma reference', () => {
    const nativeElement = fixture.nativeElement as HTMLElement;
    const labels = Array.from(nativeElement.querySelectorAll('.outreach__label')).map((el) =>
      el.textContent?.trim(),
    );
    expect(labels).toContain('Select influencer');
    expect(labels).toContain('Objective this supports');
    expect(labels).toContain('Message format');
  });

  it('shows the empty hint copy when no creator is shortlisted', () => {
    shortlistSignal.set([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Shortlist a creator first in Discovery.');
  });

  it('setObjective updates selected objective', () => {
    component.setObjective('o1');
    expect(component.selectedObjectiveId()).toBe('o1');
  });

  it('canGenerate requires handle and platform', () => {
    expect(component.canGenerate()).toBe(false);
    component.setInfluencer('@mayachen');
    expect(component.canGenerate()).toBe(true);
  });

  it('generate produces a DM-format message after delay', () => {
    component.setInfluencer('@mayachen');
    component.setObjective('o1');
    component.setFormat('dm');
    component.generate();
    expect(component.isGenerating()).toBe(true);
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(component.isGenerating()).toBe(false);
    const msg = component.generatedMessage();
    expect(msg).toContain('Maya');
    expect(msg).toContain('empowering creators to grow');
    expect(toastSpy.showSuccess).toHaveBeenCalled();
  });

  it('generate produces an email-format message with subject line', () => {
    component.setInfluencer('@mayachen');
    component.setFormat('email');
    component.generate();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(component.generatedMessage()).toContain('Subject:');
  });

  it('generate falls back to default mission when brand voice is empty', async () => {
    const emptyVoice: BrandVoiceData = { missionStatement: '', voiceAttributes: [], toneByContext: [], platformToneAdjustments: [], vocabulary: { preferred: [], avoid: [] } };
    TestBed.resetTestingModule();
    const shortlistSignal2 = signal<ShortlistedInfluencer[]>([influencer]);
    await TestBed.configureTestingModule({
      imports: [OutreachTabComponent],
      providers: [
        {
          provide: StrategyResearchStateService,
          useValue: {
            shortlistedInfluencers: shortlistSignal2,
            objectives: signal<BusinessObjective[]>([]),
            brandVoice: signal<BrandVoiceData>(emptyVoice),
          },
        },
        { provide: ToastService, useValue: toastSpy },
      ],
    }).compileComponents();
    const f = TestBed.createComponent(OutreachTabComponent);
    f.detectChanges();
    f.componentInstance.setInfluencer('@mayachen');
    f.componentInstance.generate();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(f.componentInstance.generatedMessage()).toContain('building meaningful connections');
  });

  it('regenerate re-runs generate', () => {
    component.setInfluencer('@mayachen');
    component.generate();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    const first = component.generatedMessage();
    component.regenerate();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(component.generatedMessage()).toBeTruthy();
    expect(typeof first).toBe('string');
  });

  it('updateMessage mutates the generated message signal', () => {
    component.updateMessage('edited');
    expect(component.generatedMessage()).toBe('edited');
  });

  it('copy writes to clipboard via navigator when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    component.updateMessage('hello');
    await component.copy();
    expect(writeText).toHaveBeenCalledWith('hello');
    expect(toastSpy.showSuccess).toHaveBeenCalledWith('Copied to clipboard');
  });

  it('copy is a no-op when no message is present', async () => {
    const writeText = vi.fn();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    await component.copy();
    expect(writeText).not.toHaveBeenCalled();
  });

  it('copy surfaces error when clipboard write fails', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('no'));
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    component.updateMessage('x');
    await component.copy();
    expect(toastSpy.showError).toHaveBeenCalled();
  });

  it('generate is a no-op when canGenerate is false', () => {
    component.generate();
    expect(component.isGenerating()).toBe(false);
  });

  it('setInfluencer with unknown handle leaves platform unchanged', () => {
    component.setPlatform('instagram');
    component.setInfluencer('@ghost');
    expect(component.selectedPlatform()).toBe('instagram');
  });

  it('setInfluencer keeps existing platform when still available', () => {
    component.setInfluencer('@mayachen');
    component.setPlatform('tiktok');
    component.setInfluencer('@mayachen');
    expect(component.selectedPlatform()).toBe('tiktok');
  });

  it('email format generates subject line with influencer name', () => {
    component.setInfluencer('@mayachen');
    component.setFormat('email');
    component.generate();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(component.generatedMessage()).toContain('Subject: Partnership idea with Maya Chen');
  });

  it('DM message omits objective line when no objective selected', () => {
    component.setInfluencer('@mayachen');
    component.setFormat('dm');
    component.generate();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    const msg = component.generatedMessage();
    expect(msg).toContain('Maya');
    expect(msg).not.toContain('undefined');
  });

  it('canGenerate returns false while generation is in flight', () => {
    component.setInfluencer('@mayachen');
    component.generate();
    expect(component.canGenerate()).toBe(false);
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
  });

  it('prefills handle and platform from initialInfluencer input', () => {
    fixture.componentRef.setInput('initialInfluencer', influencer);
    fixture.detectChanges();
    expect(component.selectedHandle()).toBe('@mayachen');
    expect(component.selectedPlatform()).toBe('instagram');
  });
});
