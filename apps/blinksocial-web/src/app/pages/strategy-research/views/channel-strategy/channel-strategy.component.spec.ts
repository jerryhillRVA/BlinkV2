import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ChannelStrategyComponent } from './channel-strategy.component';
import { StrategyResearchStateService } from '../../strategy-research-state.service';
import { AI_SIMULATION_DELAY_MS } from '../../strategy-research.constants';
import type { ChannelStrategyEntry } from '../../strategy-research.types';

const DEFAULT_CHANNELS: ChannelStrategyEntry[] = [
  { platform: 'instagram', active: true, role: 'Primary engagement and community building', primaryContentTypes: ['Reels', 'Stories', 'Carousels'], toneAdjustment: 'Warm, casual, motivational', postingCadence: '5x/week', primaryAudience: 'Active 40s', primaryGoal: 'Engagement', notes: '' },
  { platform: 'tiktok', active: true, role: 'Reach and trend-driven discovery', primaryContentTypes: ['Shorts', 'Tutorials'], toneAdjustment: 'Fun, energetic, relatable', postingCadence: '4x/week', primaryAudience: 'Active 40s', primaryGoal: 'Awareness', notes: '' },
  { platform: 'youtube', active: true, role: 'Long-form education and authority', primaryContentTypes: ['Long-form', 'Shorts', 'Tutorials'], toneAdjustment: 'Professional, supportive, thorough', postingCadence: '2x/week', primaryAudience: 'Thriving 50s', primaryGoal: 'Authority', notes: '' },
  { platform: 'facebook', active: false, role: '', primaryContentTypes: [], toneAdjustment: '', postingCadence: '', primaryAudience: '', primaryGoal: '', notes: '' },
  { platform: 'linkedin', active: false, role: '', primaryContentTypes: [], toneAdjustment: '', postingCadence: '', primaryAudience: '', primaryGoal: '', notes: '' },
];

describe('ChannelStrategyComponent', () => {
  let fixture: ComponentFixture<ChannelStrategyComponent>;
  let component: ChannelStrategyComponent;

  beforeEach(() => {
    const mockStateService = {
      channelStrategy: signal<ChannelStrategyEntry[]>([...DEFAULT_CHANNELS.map(c => ({ ...c }))]),
      pillars: signal([]),
      segments: signal([]),
      objectives: signal([]),
      audienceInsights: signal([]),
      saveChannelStrategy: vi.fn(),
      savePillars: vi.fn(),
      saveSegments: vi.fn(),
      saveAudienceInsights: vi.fn(),
    };
    TestBed.configureTestingModule({
      imports: [ChannelStrategyComponent],
      providers: [{ provide: StrategyResearchStateService, useValue: mockStateService }],
    });
    fixture = TestBed.createComponent(ChannelStrategyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create with five channel platforms', () => {
    expect(component).toBeTruthy();
    expect(component.channels().length).toBe(5);
  });

  it('isExpanded reports default expanded platforms', () => {
    expect(component.isExpanded('instagram')).toBe(true);
    expect(component.isExpanded('linkedin')).toBe(false);
  });

  it('toggleExpand flips expansion state', () => {
    component.toggleExpand('linkedin');
    expect(component.isExpanded('linkedin')).toBe(true);
    component.toggleExpand('linkedin');
    expect(component.isExpanded('linkedin')).toBe(false);
  });

  it('toggleActive flips channel active flag', () => {
    const before = component.getChannel('facebook').active;
    component.toggleActive('facebook');
    expect(component.getChannel('facebook').active).toBe(!before);
  });

  it('updateChannel patches a single field', () => {
    component.updateChannel('instagram', 'role', 'New role');
    expect(component.getChannel('instagram').role).toBe('New role');
  });

  it('isContentTypeActive reflects primaryContentTypes', () => {
    const ig = component.getChannel('instagram');
    const existing = ig.primaryContentTypes[0];
    expect(component.isContentTypeActive(ig, existing)).toBe(true);
    expect(component.isContentTypeActive(ig, 'NotInList')).toBe(false);
  });

  it('toggleContentType adds and removes a content type', () => {
    component.toggleContentType('instagram', 'NewType');
    expect(component.getChannel('instagram').primaryContentTypes).toContain('NewType');
    component.toggleContentType('instagram', 'NewType');
    expect(component.getChannel('instagram').primaryContentTypes).not.toContain('NewType');
  });

  it('contentTypesFor returns platform-specific options', () => {
    expect(component.contentTypesFor('instagram').length).toBeGreaterThan(0);
    expect(component.contentTypesFor('linkedin').length).toBeGreaterThan(0);
    expect(component.contentTypesFor('instagram')).not.toEqual(component.contentTypesFor('linkedin'));
  });

  it('aiGenerate fills the channel after timer', () => {
    vi.useFakeTimers();
    component.aiGenerate('facebook');
    expect(component.generatingPlatform()).toBe('facebook');
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(component.generatingPlatform()).toBeNull();
    const fb = component.getChannel('facebook');
    expect(fb.active).toBe(true);
    expect(fb.role).toContain('AI-generated role for Facebook');
    expect(fb.primaryContentTypes.length).toBeGreaterThan(0);
    vi.useRealTimers();
  });

  it('aiGenerateAll activates and seeds every channel', () => {
    vi.useFakeTimers();
    component.aiGenerateAll();
    expect(component.generatingAll()).toBe(true);
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(component.generatingAll()).toBe(false);
    for (const c of component.channels()) {
      expect(c.active).toBe(true);
      expect(c.role).toBeTruthy();
      expect(c.primaryAudience).toBeTruthy();
      expect(c.primaryGoal).toBeTruthy();
    }
    vi.useRealTimers();
  });

  it('exposes platformLabels, platformIcons, and option lists', () => {
    expect(component.platformLabels['instagram']).toBeTruthy();
    expect(component.platformIcons['instagram']).toBeTruthy();
    expect(component.audienceOptions().length).toBeGreaterThan(0);
    expect(component.goalOptions.length).toBeGreaterThan(0);
  });

  it('renders header and per-platform cards', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.page-header-title')?.textContent).toContain('Channel Strategy');
    expect(el.querySelectorAll('.platform-card').length).toBe(5);
    expect(el.querySelector('.btn-generate-all')).toBeTruthy();
  });

  it('AI Generate All button click invokes aiGenerateAll', () => {
    vi.useFakeTimers();
    const btn = (fixture.nativeElement as HTMLElement).querySelector('.btn-generate-all') as HTMLButtonElement;
    btn.click();
    expect(component.generatingAll()).toBe(true);
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    vi.useRealTimers();
  });

  it('renders all platform cards with form fields when expanded', () => {
    // Expand every platform and activate every channel so all template branches render
    for (const c of component.channels()) {
      if (!component.isExpanded(c.platform)) component.toggleExpand(c.platform);
      if (!c.active) component.toggleActive(c.platform);
    }
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.platform-content').length).toBe(5);
    expect(el.querySelectorAll('.form-input').length).toBeGreaterThan(0);
    expect(el.querySelectorAll('.chip-toggle').length).toBeGreaterThan(0);
    expect(el.querySelectorAll('.btn-ai-generate').length).toBe(5);
  });

  it('clicking platform title toggles expansion', () => {
    const title = (fixture.nativeElement as HTMLElement).querySelector('.platform-title') as HTMLButtonElement;
    const before = component.isExpanded('instagram');
    title.click();
    expect(component.isExpanded('instagram')).toBe(!before);
  });

  // --- Platform Picker / Initialization ---

  it('showPlatformPicker is false when channels exist', () => {
    expect(component.showPlatformPicker()).toBe(false);
  });

  it('showPlatformPicker is true when channels are empty', () => {
    component.channels.set([]);
    expect(component.showPlatformPicker()).toBe(true);
  });

  it('renders platform picker UI when channels are empty', () => {
    component.channels.set([]);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.empty-state-box')).toBeTruthy();
    expect(el.querySelector('.platform-picker-chips')).toBeTruthy();
  });

  it('toggleNewPlatform adds and removes platforms from selection', () => {
    expect(component.isNewPlatformSelected('linkedin')).toBe(false);
    component.toggleNewPlatform('linkedin');
    expect(component.isNewPlatformSelected('linkedin')).toBe(true);
    component.toggleNewPlatform('linkedin');
    expect(component.isNewPlatformSelected('linkedin')).toBe(false);
  });

  it('initializeChannels creates entries for selected platforms and saves', () => {
    component.channels.set([]);
    component.selectedNewPlatforms.set(new Set(['instagram', 'youtube']));
    component.initializeChannels();
    expect(component.channels().length).toBe(2);
    expect(component.channels()[0].platform).toBe('instagram');
    expect(component.channels()[1].platform).toBe('youtube');
    expect(component.channels()[0].active).toBe(true);
  });

  it('initializeChannels does nothing when no platforms selected', () => {
    component.channels.set([]);
    component.selectedNewPlatforms.set(new Set());
    component.initializeChannels();
    expect(component.channels().length).toBe(0);
  });

  it('audienceOptions returns segment names when segments exist', () => {
    const mockState = TestBed.inject(StrategyResearchStateService);
    (mockState.segments as ReturnType<typeof signal>).set([
      { id: 'seg-1', name: 'Engineers', description: '' },
      { id: 'seg-2', name: 'Founders', description: '' },
    ]);
    const options = component.audienceOptions();
    expect(options.length).toBe(2);
    expect(options[0].label).toBe('Engineers');
    expect(options[1].label).toBe('Founders');
  });
});
