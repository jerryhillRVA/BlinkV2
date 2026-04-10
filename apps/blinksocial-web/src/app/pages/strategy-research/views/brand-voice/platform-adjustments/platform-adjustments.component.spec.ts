import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PlatformAdjustmentsComponent } from './platform-adjustments.component';
import { ToastService } from '../../../../../core/toast/toast.service';
import { StrategyResearchStateService } from '../../../strategy-research-state.service';

describe('PlatformAdjustmentsComponent', () => {
  let component: PlatformAdjustmentsComponent;
  let fixture: ReturnType<typeof TestBed.createComponent<PlatformAdjustmentsComponent>>;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    vi.useFakeTimers();
    const mockBrandVoice = signal({
      missionStatement: '',
      voiceAttributes: [],
      toneByContext: [],
      platformToneAdjustments: [],
      vocabulary: { preferred: [], avoid: [] },
    });
    const mockStateService = {
      brandVoice: mockBrandVoice,
      objectives: signal([]),
      pillars: signal([]),
      segments: signal([]),
      channelStrategy: signal([]),
      contentMix: signal([]),
      researchSources: signal([]),
      competitorInsights: signal([]),
      audienceInsights: signal([]),
      loading: signal(false),
      saving: signal(false),
      workspaceId: signal('test-workspace'),
      saveBrandVoice: vi.fn(),
      loadAll: vi.fn(),
      isDirty: signal(false),
    };
    await TestBed.configureTestingModule({
      imports: [PlatformAdjustmentsComponent],
      providers: [
        { provide: ToastService, useValue: { showSuccess: vi.fn(), showError: vi.fn() } },
        { provide: StrategyResearchStateService, useValue: mockStateService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PlatformAdjustmentsComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render 5 platform rows', () => {
    expect(nativeElement.querySelectorAll('.platform-row').length).toBe(5);
  });

  it('should render 5 platform inputs', () => {
    expect(nativeElement.querySelectorAll('.platform-input').length).toBe(5);
  });

  it('should update platform adjustment', () => {
    component.updateAdjustment('instagram', 'Be warm and visual');
    const ig = component.adjustments().find(p => p.platform === 'instagram');
    expect(ig?.adjustment).toBe('Be warm and visual');
  });

  it('should suggest platform tone with AI', () => {
    component.suggestTone('instagram');
    expect(component.suggestingPlatform()).toBe('instagram');
    vi.advanceTimersByTime(2500);
    expect(component.suggestingPlatform()).toBeNull();
    const ig = component.adjustments().find(p => p.platform === 'instagram');
    expect(ig?.adjustment).toContain('Warm, visual storytelling');
  });

  it('should suggest for different platforms', () => {
    component.suggestTone('tiktok');
    vi.advanceTimersByTime(2500);
    expect(component.adjustments().find(p => p.platform === 'tiktok')?.adjustment).toContain('Fast-paced');

    component.suggestTone('youtube');
    vi.advanceTimersByTime(2500);
    expect(component.adjustments().find(p => p.platform === 'youtube')?.adjustment).toContain('Thorough');
  });

  it('should show spinner for suggested platform', () => {
    component.suggestTone('instagram');
    fixture.detectChanges();
    const rows = nativeElement.querySelectorAll('.platform-row');
    expect(rows[0].querySelector('.spinner')).toBeTruthy();
    expect(rows[0].textContent).toContain('Suggesting...');
    vi.advanceTimersByTime(2500);
  });

  it('should render platform labels', () => {
    expect(component.platformLabels['instagram']).toBe('Instagram');
    expect(component.platformLabels['tiktok']).toBe('TikTok');
    expect(component.platformLabels['youtube']).toBe('YouTube');
    expect(component.platformLabels['facebook']).toBe('Facebook');
    expect(component.platformLabels['linkedin']).toBe('LinkedIn');
  });

  it('should show only active platforms when channelStrategy has active entries', () => {
    const mockState = TestBed.inject(StrategyResearchStateService);
    (mockState.channelStrategy as ReturnType<typeof signal>).set([
      { platform: 'instagram', active: true, role: '', primaryContentTypes: [], toneAdjustment: '', postingCadence: '', primaryAudience: '', primaryGoal: '', notes: '' },
      { platform: 'tiktok', active: false, role: '', primaryContentTypes: [], toneAdjustment: '', postingCadence: '', primaryAudience: '', primaryGoal: '', notes: '' },
      { platform: 'youtube', active: true, role: '', primaryContentTypes: [], toneAdjustment: '', postingCadence: '', primaryAudience: '', primaryGoal: '', notes: '' },
    ]);
    fixture.detectChanges();
    expect(component.activePlatforms().length).toBe(2);
    expect(component.activePlatforms()).toContain('instagram');
    expect(component.activePlatforms()).toContain('youtube');
    expect(component.activePlatforms()).not.toContain('tiktok');
    expect(component.adjustments().length).toBe(2);
  });

  it('should fall back to all platforms when channelStrategy is empty', () => {
    const mockState = TestBed.inject(StrategyResearchStateService);
    (mockState.channelStrategy as ReturnType<typeof signal>).set([]);
    fixture.detectChanges();
    expect(component.activePlatforms().length).toBe(5);
  });

  it('should persist via saveAdjustments on blur', () => {
    const mockState = TestBed.inject(StrategyResearchStateService);
    component.updateAdjustment('instagram', 'Be warm and visual');
    component.saveAdjustments();
    expect(mockState.saveBrandVoice).toHaveBeenCalled();
  });

  it('should clean up timer on destroy', () => {
    component.suggestTone('instagram');
    fixture.destroy();
    vi.advanceTimersByTime(2500);
  });
});
