import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { VoiceAttributesComponent } from './voice-attributes.component';
import { ToastService } from '../../../../../core/toast/toast.service';
import { StrategyResearchStateService } from '../../../strategy-research-state.service';
import type { BrandVoiceData } from '../../../strategy-research.types';

describe('VoiceAttributesComponent', () => {
  let component: VoiceAttributesComponent;
  let fixture: ReturnType<typeof TestBed.createComponent<VoiceAttributesComponent>>;
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
    vi.useFakeTimers();

    // Reset brandVoice with mock voice attributes (matching MOCK_VOICE_ATTRIBUTES in the component)
    mockBrandVoice.set({
      missionStatement: '',
      voiceAttributes: [
        { id: 'va1', label: 'Empowering', description: 'We lift women up, never talk down to them.', doExample: 'You have everything it takes.', dontExample: 'You need to fix yourself.' },
        { id: 'va2', label: 'Knowledgeable but Accessible', description: 'Expert-backed but never jargon-heavy.', doExample: 'Estrogen affects your muscle recovery.', dontExample: 'HRT-mediated myofibrillar protein synthesis rates indicate...' },
        { id: 'va3', label: 'Warm & Inclusive', description: 'Every woman in her 40s belongs here.', doExample: 'This is your space.', dontExample: 'For women who are already committed to fitness.' },
        { id: 'va4', label: 'Honest & Real', description: 'No toxic positivity, no impossible standards.', doExample: 'Some days perimenopause wins.', dontExample: 'Every day is an opportunity to crush it!' },
      ],
      toneByContext: [],
      platformToneAdjustments: [],
      vocabulary: { preferred: [], avoid: [] },
    });

    mockStateService.saveBrandVoice.mockClear();

    await TestBed.configureTestingModule({
      imports: [VoiceAttributesComponent],
      providers: [
        { provide: ToastService, useValue: { showSuccess: vi.fn(), showError: vi.fn() } },
        { provide: StrategyResearchStateService, useValue: mockStateService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VoiceAttributesComponent);
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

  it('should initialize with mock attributes', () => {
    expect(component.attributes().length).toBe(4);
    expect(component.attributes()[0].label).toBe('Empowering');
  });

  it('should generate additional attributes with AI and persist', () => {
    mockBrandVoice.update(bv => ({ ...bv, voiceAttributes: [] }));
    component.generateAttributes();
    expect(component.isGenerating()).toBe(true);
    vi.advanceTimersByTime(2500);
    expect(component.isGenerating()).toBe(false);
    expect(component.attributes().length).toBe(4);
    expect(component.attributes()[0].label).toBe('Empowering');
    expect(mockStateService.saveBrandVoice).toHaveBeenCalled();
  });

  it('should start adding a new attribute', () => {
    component.startAdd();
    expect(component.editingId()).toBeTruthy();
    expect(component.editAttribute().label).toBe('');
  });

  it('isEditingNew returns true when adding a new attribute', () => {
    component.startAdd();
    expect(component.isEditingNew()).toBe(true);
  });

  it('isEditingNew returns false when editing an existing attribute', () => {
    component.startEdit(component.attributes()[0]);
    expect(component.isEditingNew()).toBe(false);
  });

  it('isEditingNew returns false when not editing', () => {
    expect(component.isEditingNew()).toBe(false);
  });

  it('should show edit form when editing', () => {
    component.startAdd();
    fixture.detectChanges();
    expect(nativeElement.querySelector('.attribute-edit-card')).toBeTruthy();
  });

  it('should save a new attribute and persist', () => {
    mockBrandVoice.update(bv => ({ ...bv, voiceAttributes: [] }));
    component.startAdd();
    component.editAttribute.set({
      id: component.editingId()!,
      label: 'Test Attr',
      description: 'Desc',
      doExample: 'Do this',
      dontExample: 'Not this',
    });
    component.save();
    expect(component.attributes().length).toBe(1);
    expect(component.attributes()[0].label).toBe('Test Attr');
    expect(component.editingId()).toBeNull();
    expect(mockStateService.saveBrandVoice).toHaveBeenCalled();
  });

  it('should not save attribute with empty label', () => {
    mockBrandVoice.update(bv => ({ ...bv, voiceAttributes: [] }));
    component.startAdd();
    component.editAttribute.set({
      id: component.editingId()!,
      label: '   ',
      description: 'Desc',
      doExample: '',
      dontExample: '',
    });
    component.save();
    expect(component.attributes().length).toBe(0);
  });

  it('should edit an existing attribute', () => {
    mockBrandVoice.update(bv => ({ ...bv, voiceAttributes: [] }));
    component.startAdd();
    component.editAttribute.set({
      id: component.editingId()!,
      label: 'Original',
      description: 'Orig desc',
      doExample: '',
      dontExample: '',
    });
    component.save();

    const attr = component.attributes()[0];
    component.startEdit(attr);
    expect(component.editingId()).toBe(attr.id);
    component.updateField('label', 'Updated');
    component.save();
    expect(component.attributes()[0].label).toBe('Updated');
    expect(component.attributes().length).toBe(1);
  });

  it('should cancel editing', () => {
    component.startAdd();
    component.cancelEdit();
    expect(component.editingId()).toBeNull();
  });

  it('should remove an attribute and persist', () => {
    mockBrandVoice.update(bv => ({ ...bv, voiceAttributes: [] }));
    component.startAdd();
    component.editAttribute.set({
      id: component.editingId()!,
      label: 'Remove Me',
      description: '',
      doExample: '',
      dontExample: '',
    });
    component.save();
    mockStateService.saveBrandVoice.mockClear();
    component.remove(component.attributes()[0].id);
    expect(component.attributes().length).toBe(0);
    expect(mockStateService.saveBrandVoice).toHaveBeenCalled();
  });

  it('should render attribute cards', () => {
    fixture.detectChanges();
    const cards = nativeElement.querySelectorAll('.attribute-card');
    expect(cards.length).toBe(4);
    expect(cards[0].querySelector('.attribute-label')?.textContent?.trim()).toBe('Empowering');
  });

  it('should update field', () => {
    component.updateField('label', 'New Label');
    expect(component.editAttribute().label).toBe('New Label');
  });

  it('should clean up timer on destroy', () => {
    component.generateAttributes();
    fixture.destroy();
    vi.advanceTimersByTime(2500);
  });
});
