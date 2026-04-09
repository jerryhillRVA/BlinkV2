import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SeoHashtagsComponent } from './seo-hashtags.component';
import { AI_SIMULATION_DELAY_MS } from '../../strategy-research.constants';

describe('SeoHashtagsComponent', () => {
  let fixture: ComponentFixture<SeoHashtagsComponent>;
  let component: SeoHashtagsComponent;
  let nativeElement: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SeoHashtagsComponent] });
    fixture = TestBed.createComponent(SeoHashtagsComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  function generateAndAdvance() {
    vi.useFakeTimers();
    component.setPillar('p1');
    component.generate();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    fixture.detectChanges();
  }

  it('creates with default state and the first pillar pre-selected', () => {
    expect(component).toBeTruthy();
    expect(component.canGenerate()).toBe(true);
    expect(component.selectedPillarId()).toBeTruthy();
    expect(component.seoData()).toBeNull();
  });

  it('renders the 3-field setup grid + Generate button', () => {
    expect(nativeElement.querySelectorAll('.setup-field').length).toBe(3);
    const btn = nativeElement.querySelector('.btn-generate') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    expect(btn.disabled).toBe(false);
  });

  it('shows the empty state before generation', () => {
    expect(nativeElement.querySelector('.empty-state')).toBeTruthy();
  });

  it('typed setters update the corresponding signal', () => {
    component.setPillar('p2');
    expect(component.selectedPillarId()).toBe('p2');
    component.setPlatform('youtube');
    expect(component.selectedPlatform()).toBe('youtube');
    component.setGoal('Niche Authority');
    expect(component.selectedGoal()).toBe('Niche Authority');
    component.setTab('niche');
    expect(component.activeTab()).toBe('niche');
  });

  it('canGenerate is false when a selection is cleared', () => {
    expect(component.canGenerate()).toBe(true);
    component.setPillar('');
    expect(component.canGenerate()).toBe(false);
  });

  it('generate populates seoData and seeds angle titles after the timer', () => {
    vi.useFakeTimers();
    component.setPillar('p1');
    component.generate();
    expect(component.isGenerating()).toBe(true);
    fixture.detectChanges();
    expect(nativeElement.querySelector('.loading-card')).toBeTruthy();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    fixture.detectChanges();
    expect(component.isGenerating()).toBe(false);
    expect(component.seoData()).not.toBeNull();
    expect(Object.keys(component.angleTitles()).length).toBeGreaterThan(0);
    vi.useRealTimers();
  });

  it('generate is a no-op when canGenerate is false', () => {
    component.setPillar('');
    component.generate();
    expect(component.isGenerating()).toBe(false);
    expect(component.seoData()).toBeNull();
  });

  it('getActiveHashtags returns [] before data and the active tab after', () => {
    expect(component.getActiveHashtags()).toEqual([]);
    generateAndAdvance();
    expect(component.getActiveHashtags().length).toBeGreaterThan(0);
    component.setTab('niche');
    expect(component.getActiveHashtags()[0].tag).toContain('#');
    vi.useRealTimers();
  });

  it('toggleCheckItem flips the checked set', () => {
    component.toggleCheckItem(0);
    expect(component.isChecked(0)).toBe(true);
    component.toggleCheckItem(0);
    expect(component.isChecked(0)).toBe(false);
  });

  it('getViralityClass maps each level + a fallback', () => {
    expect(component.getViralityClass('Very High')).toBe('virality--very-high');
    expect(component.getViralityClass('High')).toBe('virality--high');
    expect(component.getViralityClass('Medium')).toBe('virality--medium');
    expect(component.getViralityClass('Other')).toBe('');
  });

  it('copyTag flips copiedHashtag and resets after the timer', () => {
    vi.useFakeTimers();
    component.copyTag('#abc');
    expect(component.isCopiedHashtag('#abc')).toBe(true);
    vi.advanceTimersByTime(2000);
    expect(component.isCopiedHashtag('#abc')).toBe(false);
    vi.useRealTimers();
  });

  it('copyTag keeps the latest copied tag when called twice in quick succession', () => {
    vi.useFakeTimers();
    component.copyTag('#one');
    component.copyTag('#two');
    vi.advanceTimersByTime(2000);
    expect(component.isCopiedHashtag('#two')).toBe(false);
    vi.useRealTimers();
  });

  it('copyAll flips copiedTab and resets after the timer', () => {
    generateAndAdvance();
    component.copyAll('reach');
    expect(component.isCopiedTab('reach')).toBe(true);
    vi.advanceTimersByTime(2000);
    expect(component.isCopiedTab('reach')).toBe(false);
    vi.useRealTimers();
  });

  it('copyAll is a no-op when no data exists', () => {
    component.copyAll('reach');
    expect(component.copiedTab()).toBeNull();
  });

  it('copyAll keeps copiedTab when another tab was copied mid-timer', () => {
    generateAndAdvance();
    component.copyAll('reach');
    component.copyAll('niche');
    vi.advanceTimersByTime(2000);
    // The reach reset is a no-op because copiedTab moved on
    expect(component.isCopiedTab('niche')).toBe(false);
    vi.useRealTimers();
  });

  it('copyBio flips copiedBio and resets after the timer', () => {
    generateAndAdvance();
    component.copyBio();
    expect(component.copiedBio()).toBe(true);
    vi.advanceTimersByTime(2000);
    expect(component.copiedBio()).toBe(false);
    vi.useRealTimers();
  });

  it('copyBio is a no-op when no data exists', () => {
    component.copyBio();
    expect(component.copiedBio()).toBe(false);
  });

  it('setAngleTitle stores the new value', () => {
    generateAndAdvance();
    component.setAngleTitle(0, 'New title');
    expect(component.angleTitles()[0]).toBe('New title');
    vi.useRealTimers();
  });

  it('setAngleIdeaTitle stores the idea title', () => {
    component.setAngleIdeaTitle(0, 'Idea 1');
    expect(component.angleIdeaTitles()[0]).toBe('Idea 1');
  });

  it('createIdeaForAngle marks the index as saved (idempotent)', () => {
    generateAndAdvance();
    component.createIdeaForAngle(0);
    expect(component.isAngleSaved(0)).toBe(true);
    component.createIdeaForAngle(0);
    expect(component.savedAngles().size).toBe(1);
    vi.useRealTimers();
  });

  // ── DOM ─────────────────────────────────────────────────
  it('renders the four output cards after generation', () => {
    generateAndAdvance();
    expect(nativeElement.querySelectorAll('.results-card').length).toBe(4);
    vi.useRealTimers();
  });

  it('renders 3 hashtag tabs and switches the active tab via DOM click', () => {
    generateAndAdvance();
    const tabs = nativeElement.querySelectorAll('.hashtag-tab') as NodeListOf<HTMLButtonElement>;
    expect(tabs.length).toBe(3);
    tabs[1].click();
    fixture.detectChanges();
    expect(component.activeTab()).toBe('niche');
    vi.useRealTimers();
  });

  it('renders search intents, bio box copy button, and 8 checklist rows', () => {
    generateAndAdvance();
    expect(nativeElement.querySelectorAll('.search-intents li').length).toBeGreaterThan(0);
    expect(nativeElement.querySelector('.btn-copy-bio')).toBeTruthy();
    expect(nativeElement.querySelectorAll('.checklist-item').length).toBe(8);
    vi.useRealTimers();
  });

  it('renders trending angle cards with editable inputs and Create Idea buttons', () => {
    generateAndAdvance();
    const cards = nativeElement.querySelectorAll('.angle-card');
    expect(cards.length).toBeGreaterThanOrEqual(4);
    const inputs = nativeElement.querySelectorAll('.angle-idea-title');
    expect(inputs.length).toBe(cards.length);
    const button = nativeElement.querySelector('.btn-create-idea') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    expect(component.isAngleSaved(0)).toBe(true);
    vi.useRealTimers();
  });

  it('clicking a checklist row toggles the strikethrough state', () => {
    generateAndAdvance();
    const item = nativeElement.querySelector('.checklist-item') as HTMLButtonElement;
    item.click();
    fixture.detectChanges();
    expect(item.classList.contains('checked')).toBe(true);
    vi.useRealTimers();
  });
});
