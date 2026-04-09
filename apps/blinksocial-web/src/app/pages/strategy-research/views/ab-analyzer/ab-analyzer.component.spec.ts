import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AbAnalyzerComponent } from './ab-analyzer.component';
import { AI_SIMULATION_DELAY_MS } from '../../strategy-research.constants';

describe('AbAnalyzerComponent', () => {
  let fixture: ComponentFixture<AbAnalyzerComponent>;
  let component: AbAnalyzerComponent;
  let nativeElement: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [AbAnalyzerComponent] });
    fixture = TestBed.createComponent(AbAnalyzerComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  function fillAndAnalyze() {
    vi.useFakeTimers();
    component.updateVariantA('Variant A copy');
    component.updateVariantB('Variant B copy');
    component.analyze();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    fixture.detectChanges();
  }

  it('creates with default state', () => {
    expect(component).toBeTruthy();
    expect(component.variantA()).toBe('');
    expect(component.variantB()).toBe('');
    expect(component.analysis()).toBeNull();
    expect(component.canAnalyze()).toBe(false);
  });

  it('renders both variant blocks and the disabled analyze button initially', () => {
    expect(nativeElement.querySelectorAll('.variant-block').length).toBe(2);
    expect(nativeElement.querySelector('.variant-badge--a')).toBeTruthy();
    expect(nativeElement.querySelector('.variant-badge--b')).toBeTruthy();
    const btn = nativeElement.querySelector('.btn-analyze') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    expect(btn.disabled).toBe(true);
  });

  it('shows the empty state before any analysis', () => {
    expect(nativeElement.querySelector('.empty-state')).toBeTruthy();
  });

  it('updateVariant / clearVariant mutate the right signal', () => {
    component.updateVariantA('hello');
    expect(component.variantA()).toBe('hello');
    component.clearVariantA();
    expect(component.variantA()).toBe('');
    component.updateVariantB('world');
    expect(component.variantB()).toBe('world');
    component.clearVariantB();
    expect(component.variantB()).toBe('');
  });

  it('formatChars uses thousands separators', () => {
    expect(component.formatChars('a'.repeat(2500))).toBe('2,500');
  });

  it('canAnalyze flips to true once both variants have non-blank text', () => {
    component.updateVariantA('one');
    expect(component.canAnalyze()).toBe(false);
    component.updateVariantB('two');
    expect(component.canAnalyze()).toBe(true);
  });

  it('setGoal / setPlatform update signals', () => {
    component.setGoal('Maximize Comments');
    expect(component.selectedGoal()).toBe('Maximize Comments');
    component.setPlatform('youtube');
    expect(component.selectedPlatform()).toBe('youtube');
  });

  it('analyze early-returns when either variant is blank', () => {
    component.analyze();
    expect(component.isAnalyzing()).toBe(false);
    component.updateVariantA('only A');
    component.analyze();
    expect(component.isAnalyzing()).toBe(false);
  });

  it('analyze populates the result after the timer and toggles loading state', () => {
    vi.useFakeTimers();
    component.updateVariantA('a');
    component.updateVariantB('b');
    component.analyze();
    expect(component.isAnalyzing()).toBe(true);
    fixture.detectChanges();
    expect(nativeElement.querySelector('.loading-card')).toBeTruthy();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    fixture.detectChanges();
    expect(component.isAnalyzing()).toBe(false);
    expect(component.analysis()).not.toBeNull();
    expect(nativeElement.querySelector('.winner-banner')).toBeTruthy();
    expect(nativeElement.querySelector('.sw-card')).toBeTruthy();
    expect(nativeElement.querySelector('.score-card')).toBeTruthy();
    expect(nativeElement.querySelector('.improved-card')).toBeTruthy();
    vi.useRealTimers();
  });

  it('confidenceClass maps every level', () => {
    expect(component.confidenceClass('High')).toBe('confidence--high');
    expect(component.confidenceClass('Medium')).toBe('confidence--medium');
    expect(component.confidenceClass('Low')).toBe('confidence--low');
  });

  it('winnerCircleClass + scoreBarClass reflect the active winner', () => {
    fillAndAnalyze();
    expect(component.winnerCircleClass('A')).toBe('circle--variant-a');
    expect(component.winnerCircleClass('B')).toBe('circle--inactive');
    expect(component.scoreBarClass('a')).toBe('score-bar--winner-a');
    expect(component.scoreBarClass('b')).toBe('score-bar--loser-b');
    vi.useRealTimers();
  });

  it('winnerCircleClass / scoreBarClass handle a B-side winner', () => {
    fillAndAnalyze();
    component.analysis.update(r => r ? { ...r, winner: 'B' } : r);
    expect(component.winnerCircleClass('A')).toBe('circle--inactive');
    expect(component.winnerCircleClass('B')).toBe('circle--variant-b');
    expect(component.scoreBarClass('a')).toBe('score-bar--loser-a');
    expect(component.scoreBarClass('b')).toBe('score-bar--winner-b');
    vi.useRealTimers();
  });

  it('scoreFor returns the correct numeric value or 0 fallback', () => {
    expect(component.scoreFor('hookStrength', 'a')).toBe(0);
    fillAndAnalyze();
    expect(component.scoreFor('hookStrength', 'a')).toBeGreaterThan(0);
    expect(component.scoreFor('clarity', 'b')).toBeGreaterThan(0);
    vi.useRealTimers();
  });

  it('barWidth converts a 0-10 score to a percentage string', () => {
    expect(component.barWidth(0)).toBe('0%');
    expect(component.barWidth(5)).toBe('50%');
    expect(component.barWidth(10)).toBe('100%');
  });

  it('copyImproved sets copiedImproved then resets after the timer', () => {
    fillAndAnalyze();
    component.copyImproved();
    expect(component.copiedImproved()).toBe(true);
    vi.advanceTimersByTime(2000);
    expect(component.copiedImproved()).toBe(false);
    vi.useRealTimers();
  });

  it('copyImproved is a no-op when no analysis exists', () => {
    component.copyImproved();
    expect(component.copiedImproved()).toBe(false);
  });

  it('useImprovedVersion writes the improved string back into variantA', () => {
    fillAndAnalyze();
    const improved = component.analysis()!.improvedVersion;
    component.useImprovedVersion();
    expect(component.variantA()).toBe(improved);
    vi.useRealTimers();
  });

  it('useImprovedVersion is a no-op when no analysis exists', () => {
    component.useImprovedVersion();
    expect(component.variantA()).toBe('');
  });

  it('clear buttons render only when the variant has content', () => {
    expect(nativeElement.querySelectorAll('.btn-clear').length).toBe(0);
    component.updateVariantA('hi');
    fixture.detectChanges();
    expect(nativeElement.querySelectorAll('.btn-clear').length).toBe(1);
  });

  it('renders char counters for both variants', () => {
    const counters = nativeElement.querySelectorAll('.char-counter');
    expect(counters.length).toBe(2);
    expect(counters[0].textContent).toContain('0 chars');
  });

  it('renders all 4 score rows after analysis', () => {
    fillAndAnalyze();
    // 1 header row + 4 metric rows
    expect(nativeElement.querySelectorAll('.score-row').length).toBe(5);
    vi.useRealTimers();
  });

  it('saveAsIdea errors on blank title and saves with a real title', () => {
    fillAndAnalyze();
    component.setIdeaTitle('');
    component.saveAsIdea();
    expect(component.ideaTitleError()).toBe(true);
    expect(component.ideaSaved()).toBe(false);
    component.setIdeaTitle('My idea');
    expect(component.ideaTitleError()).toBe(false);
    component.saveAsIdea();
    expect(component.ideaSaved()).toBe(true);
    // Idempotent once saved
    component.saveAsIdea();
    expect(component.ideaSaved()).toBe(true);
    vi.useRealTimers();
  });

  it('renders the Save as Idea section after analysis with title input + create button', () => {
    fillAndAnalyze();
    expect(nativeElement.querySelector('.save-as-idea')).toBeTruthy();
    expect(nativeElement.querySelector('.save-as-idea__input')).toBeTruthy();
    const btn = nativeElement.querySelector('.btn-save-idea') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('Create Idea');
    vi.useRealTimers();
  });

  it('analyze() resets the saved-idea state', () => {
    fillAndAnalyze();
    component.setIdeaTitle('Title');
    component.saveAsIdea();
    expect(component.ideaSaved()).toBe(true);
    component.analyze();
    expect(component.ideaSaved()).toBe(false);
    expect(component.ideaTitle()).toBe('');
    expect(component.ideaTitleError()).toBe(false);
    vi.useRealTimers();
  });
});
