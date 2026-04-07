import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AbAnalyzerComponent } from './ab-analyzer.component';
import { AI_SIMULATION_DELAY_MS } from '../../strategy-research.constants';

describe('AbAnalyzerComponent', () => {
  let component: AbAnalyzerComponent;
  let fixture: ComponentFixture<AbAnalyzerComponent>;

  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [AbAnalyzerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AbAnalyzerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have empty variantA signal', () => {
      expect(component.variantA()).toBe('');
    });

    it('should have empty variantB signal', () => {
      expect(component.variantB()).toBe('');
    });

    it('should not be analyzing', () => {
      expect(component.isAnalyzing()).toBe(false);
    });

    it('should have null analysis', () => {
      expect(component.analysis()).toBeNull();
    });

    it('should have default selectedGoal', () => {
      expect(component.selectedGoal).toBe('Engagement');
    });

    it('should have default selectedPlatform', () => {
      expect(component.selectedPlatform).toBe('instagram');
    });

    it('should have goal options', () => {
      expect(component.goalOptions.length).toBe(5);
      expect(component.goalOptions).toContain('Engagement');
      expect(component.goalOptions).toContain('Conversions');
    });

    it('should have platform options', () => {
      expect(component.platformOptions.length).toBe(5);
      expect(component.platformOptions[0].id).toBe('instagram');
    });

    it('should have score metrics', () => {
      expect(component.scoreMetrics.length).toBe(4);
      expect(component.scoreMetrics[0].key).toBe('hookStrength');
      expect(component.scoreMetrics[0].label).toBe('Hook Strength');
    });
  });

  describe('template rendering', () => {
    it('should render two textareas', () => {
      const textareas = fixture.nativeElement.querySelectorAll('.variant-textarea');
      expect(textareas.length).toBe(2);
    });

    it('should render variant labels', () => {
      const labels = fixture.nativeElement.querySelectorAll('.variant-label');
      expect(labels.length).toBe(2);
      expect(labels[0].textContent).toContain('Variant A');
      expect(labels[1].textContent).toContain('Variant B');
    });

    it('should render goal dropdown with options', () => {
      const selects = fixture.nativeElement.querySelectorAll('select');
      expect(selects.length).toBe(2);
      const goalSelect = selects[0];
      expect(goalSelect.options.length).toBe(5);
    });

    it('should render platform dropdown with options', () => {
      const selects = fixture.nativeElement.querySelectorAll('select');
      const platformSelect = selects[1];
      expect(platformSelect.options.length).toBe(5);
    });

    it('should render analyze button', () => {
      const button = fixture.nativeElement.querySelector('.btn--primary');
      expect(button).toBeTruthy();
      expect(button.textContent).toContain('Analyze with AI');
    });

    it('should disable analyze button when variants are empty', () => {
      const button = fixture.nativeElement.querySelector('.btn--primary');
      expect(button.disabled).toBe(true);
    });

    it('should enable analyze button when both variants have text', () => {
      component.updateVariantA('Some text A');
      component.updateVariantB('Some text B');
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('.btn--primary');
      expect(button.disabled).toBe(false);
    });

    it('should keep button disabled when only variantA has text', () => {
      component.updateVariantA('Some text A');
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('.btn--primary');
      expect(button.disabled).toBe(true);
    });

    it('should keep button disabled when only variantB has text', () => {
      component.updateVariantB('Some text B');
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('.btn--primary');
      expect(button.disabled).toBe(true);
    });

    it('should not show results section initially', () => {
      const results = fixture.nativeElement.querySelector('.results');
      expect(results).toBeFalsy();
    });

    it('should show SVG icon when not analyzing', () => {
      const svg = fixture.nativeElement.querySelector('.btn--primary svg');
      expect(svg).toBeTruthy();
    });

    it('should not show spinner when not analyzing', () => {
      const spinner = fixture.nativeElement.querySelector('.spinner');
      expect(spinner).toBeFalsy();
    });
  });

  describe('updateVariantA()', () => {
    it('should update variantA signal', () => {
      component.updateVariantA('Test A');
      expect(component.variantA()).toBe('Test A');
    });
  });

  describe('updateVariantB()', () => {
    it('should update variantB signal', () => {
      component.updateVariantB('Test B');
      expect(component.variantB()).toBe('Test B');
    });
  });

  describe('analyze()', () => {
    it('should not analyze when variantA is empty', () => {
      component.updateVariantB('Some text');
      component.analyze();
      expect(component.isAnalyzing()).toBe(false);
    });

    it('should not analyze when variantB is empty', () => {
      component.updateVariantA('Some text');
      component.analyze();
      expect(component.isAnalyzing()).toBe(false);
    });

    it('should not analyze when variantA is whitespace only', () => {
      component.updateVariantA('   ');
      component.updateVariantB('Some text');
      component.analyze();
      expect(component.isAnalyzing()).toBe(false);
    });

    it('should not analyze when variantB is whitespace only', () => {
      component.updateVariantA('Some text');
      component.updateVariantB('   ');
      component.analyze();
      expect(component.isAnalyzing()).toBe(false);
    });

    it('should set isAnalyzing to true when both variants have text', () => {
      component.updateVariantA('Text A');
      component.updateVariantB('Text B');
      component.analyze();
      expect(component.isAnalyzing()).toBe(true);
    });

    it('should clear previous analysis when starting new analysis', () => {
      component.updateVariantA('Text A');
      component.updateVariantB('Text B');
      component.analyze();
      expect(component.analysis()).toBeNull();
    });

    it('should show spinner and analyzing text during analysis', () => {
      component.updateVariantA('Text A');
      component.updateVariantB('Text B');
      component.analyze();
      fixture.detectChanges();
      const spinner = fixture.nativeElement.querySelector('.spinner');
      expect(spinner).toBeTruthy();
      const button = fixture.nativeElement.querySelector('.btn--primary');
      expect(button.textContent).toContain('Analyzing...');
      expect(button.disabled).toBe(true);
    });

    it('should set analysis result after timeout', () => {
      component.updateVariantA('Text A');
      component.updateVariantB('Text B');
      component.analyze();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      expect(component.analysis()).not.toBeNull();
      expect(component.isAnalyzing()).toBe(false);
    });

    it('should render results section after analysis completes', () => {
      component.updateVariantA('Text A');
      component.updateVariantB('Text B');
      component.analyze();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();
      const results = fixture.nativeElement.querySelector('.results');
      expect(results).toBeTruthy();
    });

    it('should display winner banner', () => {
      component.updateVariantA('Text A');
      component.updateVariantB('Text B');
      component.analyze();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();
      const winnerVariant = fixture.nativeElement.querySelector('.winner-banner__variant');
      expect(winnerVariant.textContent).toContain('Variant A');
      const confidenceBadge = fixture.nativeElement.querySelector('.confidence-badge');
      expect(confidenceBadge.textContent).toContain('High');
    });

    it('should display verdict text', () => {
      component.updateVariantA('Text A');
      component.updateVariantB('Text B');
      component.analyze();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();
      const verdict = fixture.nativeElement.querySelector('.winner-banner__verdict');
      expect(verdict.textContent).toContain('Variant A leads');
    });

    it('should display strengths and weaknesses for both variants', () => {
      component.updateVariantA('Text A');
      component.updateVariantB('Text B');
      component.analyze();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();
      const swCards = fixture.nativeElement.querySelectorAll('.sw-card');
      expect(swCards.length).toBe(2);
      const strengthLabels = fixture.nativeElement.querySelectorAll('.sw-label--strength');
      expect(strengthLabels.length).toBe(2);
      const weaknessLabels = fixture.nativeElement.querySelectorAll('.sw-label--weakness');
      expect(weaknessLabels.length).toBe(2);
    });

    it('should display strength and weakness items', () => {
      component.updateVariantA('Text A');
      component.updateVariantB('Text B');
      component.analyze();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();
      const listItems = fixture.nativeElement.querySelectorAll('.sw-list li');
      // variantA: 2 strengths + 1 weakness, variantB: 1 strength + 2 weaknesses = 6
      expect(listItems.length).toBe(6);
    });

    it('should display score breakdown', () => {
      component.updateVariantA('Text A');
      component.updateVariantB('Text B');
      component.analyze();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();
      const scoreRows = fixture.nativeElement.querySelectorAll('.score-row');
      expect(scoreRows.length).toBe(4);
    });

    it('should display improved version section', () => {
      component.updateVariantA('Text A');
      component.updateVariantB('Text B');
      component.analyze();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();
      const improvedCard = fixture.nativeElement.querySelector('.improved-card');
      expect(improvedCard).toBeTruthy();
      const improvedText = fixture.nativeElement.querySelector('.improved-card__text');
      expect(improvedText.textContent).toContain('Your strongest decade starts now');
    });
  });

  describe('getBarWidth()', () => {
    it('should return correct percentage for score 8', () => {
      expect(component.getBarWidth(8)).toBe('80%');
    });

    it('should return correct percentage for score 10', () => {
      expect(component.getBarWidth(10)).toBe('100%');
    });

    it('should return correct percentage for score 0', () => {
      expect(component.getBarWidth(0)).toBe('0%');
    });

    it('should return correct percentage for score 5', () => {
      expect(component.getBarWidth(5)).toBe('50%');
    });
  });

  describe('useImprovedVersion()', () => {
    it('should do nothing when analysis is null', () => {
      component.updateVariantA('Original');
      component.useImprovedVersion();
      expect(component.variantA()).toBe('Original');
    });

    it('should set variantA to improved version when analysis exists', () => {
      component.updateVariantA('Text A');
      component.updateVariantB('Text B');
      component.analyze();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      component.useImprovedVersion();
      expect(component.variantA()).toContain('Your strongest decade starts now');
    });

    it('should update the textarea in the DOM after using improved version', () => {
      component.updateVariantA('Text A');
      component.updateVariantB('Text B');
      component.analyze();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();
      const useButton = fixture.nativeElement.querySelector('.improved-card .btn--sm');
      expect(useButton).toBeTruthy();
      useButton.click();
      fixture.detectChanges();
      expect(component.variantA()).toContain('Your strongest decade starts now');
    });
  });

  // --- DOM interactions ---

  describe('DOM interactions', () => {
    it('should render score bar fills with correct widths after analysis', () => {
      component.updateVariantA('Text A');
      component.updateVariantB('Text B');
      component.analyze();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();

      const barFillsA = fixture.nativeElement.querySelectorAll('.bar-fill--a') as NodeListOf<HTMLElement>;
      const barFillsB = fixture.nativeElement.querySelectorAll('.bar-fill--b') as NodeListOf<HTMLElement>;
      expect(barFillsA.length).toBe(4);
      expect(barFillsB.length).toBe(4);
      // hookStrength: a=8 -> 80%, b=5 -> 50%
      expect(barFillsA[0].style.width).toBe('80%');
      expect(barFillsB[0].style.width).toBe('50%');
    });

    it('should display bar values for each score metric', () => {
      component.updateVariantA('Text A');
      component.updateVariantB('Text B');
      component.analyze();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();

      const barValues = fixture.nativeElement.querySelectorAll('.bar-value');
      expect(barValues.length).toBe(8); // 4 metrics * 2 variants
      expect(barValues[0].textContent?.trim()).toBe('8');
      expect(barValues[1].textContent?.trim()).toBe('5');
    });

    it('should display score metric labels', () => {
      component.updateVariantA('Text A');
      component.updateVariantB('Text B');
      component.analyze();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();

      const labels = fixture.nativeElement.querySelectorAll('.score-row__label');
      expect(labels.length).toBe(4);
      expect(labels[0].textContent).toContain('Hook Strength');
      expect(labels[1].textContent).toContain('Clarity');
      expect(labels[2].textContent).toContain('Emotional Resonance');
      expect(labels[3].textContent).toContain('CTA Effectiveness');
    });

    it('should trigger analyze via button click in DOM', () => {
      component.updateVariantA('Text A');
      component.updateVariantB('Text B');
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('.btn--primary') as HTMLButtonElement;
      button.click();
      expect(component.isAnalyzing()).toBe(true);

      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();
      expect(component.analysis()).not.toBeNull();
    });

    it('should render goal options in dropdown', () => {
      const selects = fixture.nativeElement.querySelectorAll('select');
      const goalSelect = selects[0];
      expect(goalSelect.options.length).toBe(5);
      expect(goalSelect.options[0].textContent?.trim()).toBe('Engagement');
    });

    it('should render platform options in dropdown', () => {
      const selects = fixture.nativeElement.querySelectorAll('select');
      const platformSelect = selects[1];
      expect(platformSelect.options.length).toBe(5);
      expect(platformSelect.options[0].textContent?.trim()).toBe('Instagram');
    });

    it('should render strengths list items for variant A', () => {
      component.updateVariantA('Text A');
      component.updateVariantB('Text B');
      component.analyze();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();

      const swCards = fixture.nativeElement.querySelectorAll('.sw-card');
      const variantAStrengths = swCards[0].querySelectorAll('.sw-list li');
      // 2 strengths + 1 weakness = 3 items in variantA card
      expect(variantAStrengths.length).toBe(3);
    });

    it('should render weaknesses list items for variant B', () => {
      component.updateVariantA('Text A');
      component.updateVariantB('Text B');
      component.analyze();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();

      const swCards = fixture.nativeElement.querySelectorAll('.sw-card');
      const variantBItems = swCards[1].querySelectorAll('.sw-list li');
      // 1 strength + 2 weaknesses = 3 items in variantB card
      expect(variantBItems.length).toBe(3);
    });

    it('should display confidence badge text', () => {
      component.updateVariantA('Text A');
      component.updateVariantB('Text B');
      component.analyze();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();

      const badge = fixture.nativeElement.querySelector('.confidence-badge');
      expect(badge.textContent).toContain('High Confidence');
    });

    it('should show SVG icon on button after analysis completes', () => {
      component.updateVariantA('Text A');
      component.updateVariantB('Text B');
      component.analyze();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();

      const svg = fixture.nativeElement.querySelector('.btn--primary svg');
      expect(svg).toBeTruthy();
      const spinner = fixture.nativeElement.querySelector('.spinner');
      expect(spinner).toBeFalsy();
    });

    it('should trigger updateVariantA via textarea ngModelChange in DOM', () => {
      const textareas = fixture.nativeElement.querySelectorAll('.variant-textarea') as NodeListOf<HTMLTextAreaElement>;
      textareas[0].value = 'DOM variant A text';
      textareas[0].dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(component.variantA()).toBe('DOM variant A text');
    });

    it('should trigger updateVariantB via textarea ngModelChange in DOM', () => {
      const textareas = fixture.nativeElement.querySelectorAll('.variant-textarea') as NodeListOf<HTMLTextAreaElement>;
      textareas[1].value = 'DOM variant B text';
      textareas[1].dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(component.variantB()).toBe('DOM variant B text');
    });

    it('should hide spinner and show SVG after analysis completes and re-renders', () => {
      component.updateVariantA('Text A');
      component.updateVariantB('Text B');
      component.analyze();
      fixture.detectChanges();

      // During analysis: spinner visible, SVG hidden
      expect(fixture.nativeElement.querySelector('.spinner')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.btn--primary svg')).toBeFalsy();

      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();

      // After analysis: SVG visible, spinner hidden
      expect(fixture.nativeElement.querySelector('.spinner')).toBeFalsy();
      expect(fixture.nativeElement.querySelector('.btn--primary svg')).toBeTruthy();
    });

    it('should render both *ngFor lists for goal options and platform options', () => {
      const goalOptions = fixture.nativeElement.querySelectorAll('select')[0].querySelectorAll('option');
      const platformOptions = fixture.nativeElement.querySelectorAll('select')[1].querySelectorAll('option');
      expect(goalOptions.length).toBe(5);
      expect(platformOptions.length).toBe(5);
    });

    it('should render *ngFor lists for strengths and weaknesses of both variants', () => {
      component.updateVariantA('Text A');
      component.updateVariantB('Text B');
      component.analyze();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();

      // variantA strengths
      const swCards = fixture.nativeElement.querySelectorAll('.sw-card');
      const aStrengthsList = swCards[0].querySelectorAll('.sw-section')[0].querySelectorAll('li');
      const aWeaknessList = swCards[0].querySelectorAll('.sw-section')[1].querySelectorAll('li');
      expect(aStrengthsList.length).toBe(2);
      expect(aWeaknessList.length).toBe(1);

      // variantB
      const bStrengthsList = swCards[1].querySelectorAll('.sw-section')[0].querySelectorAll('li');
      const bWeaknessList = swCards[1].querySelectorAll('.sw-section')[1].querySelectorAll('li');
      expect(bStrengthsList.length).toBe(1);
      expect(bWeaknessList.length).toBe(2);
    });

    it('should render *ngFor for score metrics with bar fills', () => {
      component.updateVariantA('Text A');
      component.updateVariantB('Text B');
      component.analyze();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();

      const scoreRows = fixture.nativeElement.querySelectorAll('.score-row');
      expect(scoreRows.length).toBe(4);
      scoreRows.forEach((row: Element) => {
        expect(row.querySelectorAll('.bar-fill').length).toBe(2);
        expect(row.querySelectorAll('.bar-value').length).toBe(2);
      });
    });

    it('should change selectedGoal via select dropdown in DOM', () => {
      const selects = fixture.nativeElement.querySelectorAll('select');
      const goalSelect = selects[0] as HTMLSelectElement;
      goalSelect.value = 'Conversions';
      goalSelect.dispatchEvent(new Event('change'));
      fixture.detectChanges();
      expect(component.selectedGoal).toBe('Conversions');
    });

    it('should change selectedPlatform via select dropdown in DOM', () => {
      const selects = fixture.nativeElement.querySelectorAll('select');
      const platformSelect = selects[1] as HTMLSelectElement;
      platformSelect.value = 'linkedin';
      platformSelect.dispatchEvent(new Event('change'));
      fixture.detectChanges();
      expect(component.selectedPlatform).toBe('linkedin');
    });
  });
});
