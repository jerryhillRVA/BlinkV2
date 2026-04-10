import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ToneContextComponent } from './tone-context.component';
import { ToastService } from '../../../../../core/toast/toast.service';
import { StrategyResearchStateService } from '../../../strategy-research-state.service';
import type { BrandVoiceData } from '../../../strategy-research.types';

describe('ToneContextComponent', () => {
  let component: ToneContextComponent;
  let fixture: ReturnType<typeof TestBed.createComponent<ToneContextComponent>>;
  let nativeElement: HTMLElement;

  const mockBrandVoice = signal<BrandVoiceData>({
    missionStatement: '',
    voiceAttributes: [],
    toneByContext: [],
    platformToneAdjustments: [],
    vocabulary: { preferred: [], avoid: [] },
  });

  const mockStateService = {
    brandVoice: mockBrandVoice,
    objectives: signal([]).asReadonly(),
    pillars: signal([]).asReadonly(),
    segments: signal([]).asReadonly(),
    channelStrategy: signal([]).asReadonly(),
    contentMix: signal([]).asReadonly(),
    researchSources: signal([]).asReadonly(),
    competitorInsights: signal([]).asReadonly(),
    audienceInsights: signal([]).asReadonly(),
    loading: signal(false).asReadonly(),
    saving: signal(false).asReadonly(),
    workspaceId: signal('test-workspace'),
    isDirty: signal(false),
    saveBrandVoice: vi.fn(),
    saveObjectives: vi.fn(),
    savePillars: vi.fn(),
    saveSegments: vi.fn(),
    saveChannelStrategy: vi.fn(),
    saveContentMix: vi.fn(),
    saveResearchSources: vi.fn(),
    saveCompetitorInsights: vi.fn(),
    saveAudienceInsights: vi.fn(),
    loadAll: vi.fn(),
  };

  beforeEach(async () => {
    // Reset brandVoice with mock tone contexts (matching MOCK_TONE_CONTEXTS in the component)
    mockBrandVoice.set({
      missionStatement: '',
      voiceAttributes: [],
      toneByContext: [
        { id: 'tc1', context: 'Educational', tone: 'Clear, authoritative, relatable', example: 'Example 1' },
        { id: 'tc2', context: 'Motivational', tone: 'Energetic, affirming, forward-looking', example: 'Example 2' },
        { id: 'tc3', context: 'Community', tone: 'Warm, conversational, curious', example: 'Example 3' },
        { id: 'tc4', context: 'Promotional', tone: 'Honest and benefit-led — never pushy', example: 'Example 4' },
      ],
      platformToneAdjustments: [],
      vocabulary: { preferred: [], avoid: [] },
    });

    mockStateService.saveBrandVoice.mockClear();

    await TestBed.configureTestingModule({
      imports: [ToneContextComponent],
      providers: [
        { provide: ToastService, useValue: { showSuccess: vi.fn(), showError: vi.fn() } },
        { provide: StrategyResearchStateService, useValue: mockStateService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ToneContextComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with mock tone contexts', () => {
    expect(component.toneContexts().length).toBe(4);
    expect(component.toneContexts()[0].context).toBe('Educational');
  });

  it('should show empty state when no tone contexts', () => {
    mockBrandVoice.update(bv => ({ ...bv, toneByContext: [] }));
    fixture.detectChanges();
    expect(nativeElement.querySelector('.empty-state-box')?.textContent).toContain('No tone contexts defined');
    expect(nativeElement.querySelector('.tone-table')).toBeFalsy();
  });

  it('should render tone table with initial data', () => {
    fixture.detectChanges();
    expect(nativeElement.querySelector('.tone-table')).toBeTruthy();
    expect(nativeElement.querySelectorAll('.tone-table tbody tr').length).toBe(4);
  });

  it('should start adding a new tone', () => {
    component.startAdd();
    expect(component.editingId()).toBeTruthy();
    expect(component.editTone().context).toBe('');
  });

  it('isEditingNew returns true when adding a new tone', () => {
    component.startAdd();
    expect(component.isEditingNew()).toBe(true);
  });

  it('isEditingNew returns false when editing an existing tone', () => {
    component.startEdit(component.toneContexts()[0]);
    expect(component.isEditingNew()).toBe(false);
  });

  it('isEditingNew returns false when not editing', () => {
    expect(component.isEditingNew()).toBe(false);
  });

  it('should save a new tone and persist', () => {
    mockBrandVoice.update(bv => ({ ...bv, toneByContext: [] }));
    component.startAdd();
    component.editTone.set({
      id: component.editingId()!,
      context: 'Educational',
      tone: 'Clear',
      example: 'Example text',
    });
    component.save();
    expect(component.toneContexts().length).toBe(1);
    expect(component.editingId()).toBeNull();
    expect(mockStateService.saveBrandVoice).toHaveBeenCalled();
  });

  it('should not save with empty context', () => {
    mockBrandVoice.update(bv => ({ ...bv, toneByContext: [] }));
    component.startAdd();
    component.editTone.set({ id: component.editingId()!, context: '   ', tone: 'Tone', example: '' });
    component.save();
    expect(component.toneContexts().length).toBe(0);
  });

  it('should edit an existing tone', () => {
    component.startEdit(component.toneContexts()[0]);
    component.updateField('context', 'Updated');
    component.save();
    expect(component.toneContexts()[0].context).toBe('Updated');
  });

  it('should cancel editing', () => {
    component.startAdd();
    component.cancelEdit();
    expect(component.editingId()).toBeNull();
  });

  it('should remove a tone and persist', () => {
    const initialLength = component.toneContexts().length;
    component.remove(component.toneContexts()[0].id);
    expect(component.toneContexts().length).toBe(initialLength - 1);
    expect(mockStateService.saveBrandVoice).toHaveBeenCalled();
  });

  it('should update edit tone fields', () => {
    component.updateField('context', 'New Context');
    expect(component.editTone().context).toBe('New Context');
    component.updateField('tone', 'New Tone');
    expect(component.editTone().tone).toBe('New Tone');
  });

  it('should re-populate tone contexts via generateToneContexts() and persist', () => {
    mockBrandVoice.update(bv => ({ ...bv, toneByContext: [] }));
    component.generateToneContexts();
    expect(component.toneContexts().length).toBeGreaterThan(0);
    expect(mockStateService.saveBrandVoice).toHaveBeenCalled();
  });
});
