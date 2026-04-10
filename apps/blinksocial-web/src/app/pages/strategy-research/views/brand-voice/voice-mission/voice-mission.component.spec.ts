import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { VoiceMissionComponent } from './voice-mission.component';
import { ToastService } from '../../../../../core/toast/toast.service';
import { StrategyResearchStateService } from '../../../strategy-research-state.service';
import type { BrandVoiceData } from '../../../strategy-research.types';

const DEFAULT_BRAND_VOICE: BrandVoiceData = {
  missionStatement: '',
  voiceAttributes: [],
  toneByContext: [],
  platformToneAdjustments: [],
  vocabulary: { preferred: [], avoid: [] },
};

describe('VoiceMissionComponent', () => {
  let component: VoiceMissionComponent;
  let fixture: ReturnType<typeof TestBed.createComponent<VoiceMissionComponent>>;
  let nativeElement: HTMLElement;
  let toastSpy: { showSuccess: ReturnType<typeof vi.fn>; showError: ReturnType<typeof vi.fn> };
  let mockBrandVoice: ReturnType<typeof signal<BrandVoiceData>>;
  let mockStateService: Record<string, unknown>;

  beforeEach(async () => {
    vi.useFakeTimers();
    toastSpy = { showSuccess: vi.fn(), showError: vi.fn() };
    mockBrandVoice = signal<BrandVoiceData>({ ...DEFAULT_BRAND_VOICE });
    mockStateService = {
      brandVoice: mockBrandVoice,
      saveBrandVoice: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [VoiceMissionComponent],
      providers: [
        { provide: ToastService, useValue: toastSpy },
        { provide: StrategyResearchStateService, useValue: mockStateService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VoiceMissionComponent);
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

  it('should render mission textarea', () => {
    expect(nativeElement.querySelector('.mission-textarea')).toBeTruthy();
  });

  it('should update mission statement', () => {
    component.updateMission('Test mission');
    expect(component.missionStatement()).toBe('Test mission');
  });

  it('should draft mission with AI', () => {
    component.draftMission();
    expect(component.isDrafting()).toBe(true);

    vi.advanceTimersByTime(2500);
    expect(component.isDrafting()).toBe(false);
    expect(component.missionStatement()).toContain('Empower women over 40');
  });

  it('should show spinner while drafting', () => {
    component.draftMission();
    fixture.detectChanges();

    const btn = nativeElement.querySelector('.btn-ai') as HTMLButtonElement;
    expect(btn.textContent).toContain('Drafting...');
    expect(btn.disabled).toBe(true);
    expect(nativeElement.querySelector('.spinner')).toBeTruthy();

    vi.advanceTimersByTime(2500);
    fixture.detectChanges();

    expect(btn.textContent).toContain('Draft Mission');
    expect(btn.disabled).toBe(false);
  });

  it('should save mission and show toast', () => {
    mockBrandVoice.update(bv => ({ ...bv, missionStatement: 'Our mission' }));
    component.saveMission();
    expect(toastSpy.showSuccess).toHaveBeenCalledWith('Mission statement saved');
  });

  it('should not save empty mission', () => {
    mockBrandVoice.update(bv => ({ ...bv, missionStatement: '   ' }));
    component.saveMission();
    expect(toastSpy.showSuccess).not.toHaveBeenCalled();
  });

  it('should show AI Draft SVG icon when not drafting', () => {
    const btn = nativeElement.querySelector('.btn-ai');
    expect(btn?.querySelector('.btn-icon')).toBeTruthy();
    expect(btn?.querySelector('.spinner')).toBeFalsy();
  });

  it('should update mission via textarea input', () => {
    const textarea = nativeElement.querySelector('.mission-textarea') as HTMLTextAreaElement;
    textarea.value = 'New mission value';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.missionStatement()).toBe('New mission value');
  });

  it('should clean up timer on destroy', () => {
    component.draftMission();
    expect(component.isDrafting()).toBe(true);
    fixture.destroy();
    vi.advanceTimersByTime(2500);
    // No error thrown - timer was cleaned up
  });
});
