import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ChannelStrategyComponent } from './channel-strategy.component';
import { AI_SIMULATION_DELAY_MS } from '../../strategy-research.constants';

describe('ChannelStrategyComponent', () => {
  let fixture: ComponentFixture<ChannelStrategyComponent>;
  let component: ChannelStrategyComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ChannelStrategyComponent] });
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

  it('exposes platformLabels and option lists', () => {
    expect(component.platformLabels['instagram']).toBeTruthy();
    expect(component.audienceOptions.length).toBeGreaterThan(0);
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
});
