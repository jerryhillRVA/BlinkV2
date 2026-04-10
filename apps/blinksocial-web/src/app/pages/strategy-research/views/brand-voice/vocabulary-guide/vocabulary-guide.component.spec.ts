import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { VocabularyGuideComponent } from './vocabulary-guide.component';
import { ToastService } from '../../../../../core/toast/toast.service';
import { StrategyResearchStateService } from '../../../strategy-research-state.service';

describe('VocabularyGuideComponent', () => {
  let component: VocabularyGuideComponent;
  let fixture: ReturnType<typeof TestBed.createComponent<VocabularyGuideComponent>>;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    const mockBrandVoice = signal({
      missionStatement: '',
      voiceAttributes: [],
      toneByContext: [],
      platformToneAdjustments: [],
      vocabulary: { preferred: [] as string[], avoid: [] as string[] },
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
      imports: [VocabularyGuideComponent],
      providers: [
        { provide: ToastService, useValue: { showSuccess: vi.fn(), showError: vi.fn() } },
        { provide: StrategyResearchStateService, useValue: mockStateService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VocabularyGuideComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default signal values', () => {
    expect(component.vocabulary()).toEqual({ preferred: [], avoid: [] });
    expect(component.newPreferredWord()).toBe('');
    expect(component.newAvoidWord()).toBe('');
  });

  it('should render vocabulary columns', () => {
    expect(nativeElement.querySelector('.vocab-columns')).toBeTruthy();
    expect(nativeElement.querySelector('.preferred-column')).toBeTruthy();
    expect(nativeElement.querySelector('.avoid-column')).toBeTruthy();
  });

  it('should add a preferred word', () => {
    component.newPreferredWord.set('wellness');
    component.addPreferredWord();
    expect(component.vocabulary().preferred).toContain('wellness');
    expect(component.newPreferredWord()).toBe('');
  });

  it('should not add empty preferred word', () => {
    component.newPreferredWord.set('   ');
    component.addPreferredWord();
    expect(component.vocabulary().preferred.length).toBe(0);
  });

  it('should remove a preferred word', () => {
    component.newPreferredWord.set('wellness');
    component.addPreferredWord();
    component.removePreferredWord('wellness');
    expect(component.vocabulary().preferred).not.toContain('wellness');
  });

  it('should add an avoid word', () => {
    component.newAvoidWord.set('anti-aging');
    component.addAvoidWord();
    expect(component.vocabulary().avoid).toContain('anti-aging');
    expect(component.newAvoidWord()).toBe('');
  });

  it('should not add empty avoid word', () => {
    component.newAvoidWord.set('   ');
    component.addAvoidWord();
    expect(component.vocabulary().avoid.length).toBe(0);
  });

  it('should remove an avoid word', () => {
    component.newAvoidWord.set('anti-aging');
    component.addAvoidWord();
    component.removeAvoidWord('anti-aging');
    expect(component.vocabulary().avoid).not.toContain('anti-aging');
  });

  it('should generate vocabulary with mock data', () => {
    component.generateVocabulary();
    expect(component.vocabulary().preferred).toContain('perimenopause');
    expect(component.vocabulary().avoid).toContain('anti-aging');
  });

  it('should deduplicate when generating', () => {
    component.newPreferredWord.set('perimenopause');
    component.addPreferredWord();
    component.generateVocabulary();
    const count = component.vocabulary().preferred.filter(w => w === 'perimenopause').length;
    expect(count).toBe(1);
  });

  it('should render chips after generating', () => {
    component.generateVocabulary();
    fixture.detectChanges();
    expect(nativeElement.querySelectorAll('.chip-preferred').length).toBeGreaterThan(0);
    expect(nativeElement.querySelectorAll('.chip-avoid').length).toBeGreaterThan(0);
  });
});
