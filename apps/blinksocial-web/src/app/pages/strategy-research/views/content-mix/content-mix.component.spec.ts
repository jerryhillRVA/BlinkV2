import { TestBed } from '@angular/core/testing';
import { ContentMixComponent } from './content-mix.component';
import { AI_SIMULATION_DELAY_MS } from '../../strategy-research.constants';

describe('ContentMixComponent', () => {
  let component: ContentMixComponent;
  let fixture: ReturnType<typeof TestBed.createComponent<ContentMixComponent>>;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [ContentMixComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ContentMixComponent);
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

  // --- Rendering ---

  it('should render two mix cards (target and comparison)', () => {
    const cards = nativeElement.querySelectorAll('.mix-card');
    expect(cards.length).toBe(2);
    expect(cards[0].textContent).toContain('Target Content Mix');
    expect(cards[1].textContent).toContain('Actual vs Target');
  });

  it('should render section header', () => {
    expect(nativeElement.querySelector('.section-header h2')?.textContent).toContain('Content Mix');
  });

  it('should show 5 category rows', () => {
    const categories = nativeElement.querySelectorAll('.category-row');
    expect(categories.length).toBe(5);
  });

  it('should show 5 comparison rows', () => {
    const comparisons = nativeElement.querySelectorAll('.comparison-row');
    expect(comparisons.length).toBe(5);
  });

  it('should render range inputs for each category', () => {
    const ranges = nativeElement.querySelectorAll('.range-input');
    expect(ranges.length).toBe(5);
  });

  it('should render reset and AI suggest buttons', () => {
    const resetBtn = nativeElement.querySelector('.btn-reset');
    const aiBtn = nativeElement.querySelector('.btn-ai');
    expect(resetBtn).toBeTruthy();
    expect(resetBtn?.textContent).toContain('Reset');
    expect(aiBtn).toBeTruthy();
    expect(aiBtn?.textContent).toContain('AI Suggest');
  });

  it('should render category labels and descriptions', () => {
    const labels = nativeElement.querySelectorAll('.category-label');
    const descs = nativeElement.querySelectorAll('.category-desc');
    expect(labels.length).toBe(5);
    expect(descs.length).toBe(5);
    expect(labels[0].textContent).toContain('Educational');
  });

  it('should render percent displays', () => {
    const percents = nativeElement.querySelectorAll('.percent-display');
    expect(percents.length).toBe(5);
    expect(percents[0].textContent).toContain('35%');
  });

  // --- Initial state ---

  it('should have a total of 100% by default', () => {
    expect(component.total()).toBe(100);
    expect(component.isValid()).toBe(true);
  });

  it('should have 5 mix entries with correct defaults', () => {
    expect(component.mix().length).toBe(5);
    const categories = component.mix().map(m => m.category);
    expect(categories).toEqual(['educational', 'entertaining', 'community', 'promotional', 'trending']);
  });

  it('should not show invalid warning by default', () => {
    expect(nativeElement.querySelector('.warning')).toBeFalsy();
    expect(nativeElement.querySelector('.total-indicator.invalid')).toBeFalsy();
  });

  // --- Total indicator ---

  it('should show total percentage', () => {
    const total = nativeElement.querySelector('.total-indicator');
    expect(total?.textContent).toContain('100%');
  });

  // --- updateTarget ---

  it('should update target percent for a category', () => {
    component.updateTarget('educational', 40);
    const edu = component.mix().find(m => m.category === 'educational')!;
    expect(edu.targetPercent).toBe(40);
  });

  it('should update total when target changes', () => {
    component.updateTarget('educational', 50);
    expect(component.total()).toBe(115); // 50 + 25 + 20 + 15 + 5
  });

  // --- isValid ---

  it('should detect invalid total when not 100', () => {
    component.updateTarget('educational', 50);
    expect(component.isValid()).toBe(false);
  });

  it('should show warning when total is not 100', () => {
    component.updateTarget('educational', 50);
    fixture.detectChanges();

    const warning = nativeElement.querySelector('.warning');
    expect(warning).toBeTruthy();
    expect(warning?.textContent).toContain('must equal 100%');
    expect(nativeElement.querySelector('.total-indicator.invalid')).toBeTruthy();
  });

  it('should become valid again when total returns to 100', () => {
    component.updateTarget('educational', 50);
    expect(component.isValid()).toBe(false);

    component.updateTarget('educational', 35);
    expect(component.isValid()).toBe(true);
  });

  // --- reset ---

  it('should reset to default values', () => {
    component.updateTarget('educational', 50);
    component.updateTarget('entertaining', 10);
    component.reset();

    const edu = component.mix().find(m => m.category === 'educational')!;
    const ent = component.mix().find(m => m.category === 'entertaining')!;
    expect(edu.targetPercent).toBe(35);
    expect(ent.targetPercent).toBe(25);
    expect(component.total()).toBe(100);
    expect(component.isValid()).toBe(true);
  });

  // --- aiSuggest ---

  it('should run AI suggest (timer-based)', () => {
    component.aiSuggest();
    expect(component.isSuggesting()).toBe(true);

    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(component.isSuggesting()).toBe(false);
  });

  it('should update mix values after AI suggest', () => {
    component.aiSuggest();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);

    const edu = component.mix().find(m => m.category === 'educational')!;
    expect(edu.targetPercent).toBe(30);
    const trending = component.mix().find(m => m.category === 'trending')!;
    expect(trending.targetPercent).toBe(10);
    expect(component.total()).toBe(100);
    expect(component.isValid()).toBe(true);
  });

  it('should show spinner during AI suggestion', () => {
    component.aiSuggest();
    fixture.detectChanges();

    const btn = nativeElement.querySelector('.btn-ai') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.textContent).toContain('Suggesting...');
    expect(btn.querySelector('.spinner')).toBeTruthy();

    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    fixture.detectChanges();

    expect(btn.disabled).toBe(false);
    expect(btn.textContent).toContain('AI Suggest');
  });

  // --- Comparison rendering ---

  it('should render target and actual bars', () => {
    const targetBars = nativeElement.querySelectorAll('.target-bar');
    const actualBars = nativeElement.querySelectorAll('.actual-bar');
    expect(targetBars.length).toBe(5);
    expect(actualBars.length).toBe(5);
  });

  it('should render bar labels (Target and Actual)', () => {
    const barLabels = nativeElement.querySelectorAll('.bar-label');
    expect(barLabels.length).toBe(10); // 5 Target + 5 Actual
  });

  it('should render bar values', () => {
    const barValues = nativeElement.querySelectorAll('.bar-value');
    expect(barValues.length).toBe(10);
  });

  // --- Color display ---

  it('should render category color indicators', () => {
    const colorDots = nativeElement.querySelectorAll('.category-color');
    expect(colorDots.length).toBe(10); // 5 in target + 5 in comparison
  });

  // --- DOM interactions for template function coverage ---

  it('should update target via range input ngModelChange in DOM', () => {
    const rangeInputs = nativeElement.querySelectorAll('.range-input') as NodeListOf<HTMLInputElement>;
    rangeInputs[0].value = '40';
    rangeInputs[0].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.mix().find(m => m.category === 'educational')!.targetPercent).toBe(40);
  });

  it('should trigger reset via Reset button click in DOM', () => {
    component.updateTarget('educational', 50);
    fixture.detectChanges();

    const resetBtn = nativeElement.querySelector('.btn-reset') as HTMLButtonElement;
    resetBtn.click();
    fixture.detectChanges();

    expect(component.mix().find(m => m.category === 'educational')!.targetPercent).toBe(35);
    expect(component.total()).toBe(100);
  });

  it('should trigger aiSuggest via AI Suggest button click in DOM', () => {
    const aiBtn = nativeElement.querySelector('.btn-ai') as HTMLButtonElement;
    aiBtn.click();
    expect(component.isSuggesting()).toBe(true);
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    fixture.detectChanges();
    expect(component.isSuggesting()).toBe(false);
  });

  it('should show warning element when total is not 100 in DOM', () => {
    component.updateTarget('educational', 50);
    fixture.detectChanges();

    expect(nativeElement.querySelector('.warning')).toBeTruthy();
    expect(nativeElement.querySelector('.total-indicator.invalid')).toBeTruthy();
  });

  it('should hide warning when total returns to 100 in DOM', () => {
    component.updateTarget('educational', 50);
    fixture.detectChanges();
    expect(nativeElement.querySelector('.warning')).toBeTruthy();

    component.updateTarget('educational', 35);
    fixture.detectChanges();
    expect(nativeElement.querySelector('.warning')).toBeFalsy();
  });
});
