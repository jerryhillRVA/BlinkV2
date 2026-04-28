import { TestBed } from '@angular/core/testing';
import { StepObjectivesComponent } from './step-objectives.component';
import { NewWorkspaceFormService } from '../../new-workspace-form.service';

describe('StepObjectivesComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<StepObjectivesComponent>>;
  let formService: NewWorkspaceFormService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepObjectivesComponent],
      providers: [NewWorkspaceFormService],
    }).compileComponents();

    formService = TestBed.inject(NewWorkspaceFormService);
    fixture = TestBed.createComponent(StepObjectivesComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render step header', () => {
    const h2 = fixture.nativeElement.querySelector('h2');
    expect(h2?.textContent).toContain('Business Objectives');
  });

  it('should render subtitle with success question', () => {
    const subtitle = fixture.nativeElement.querySelector('.step-subtitle');
    expect(subtitle?.textContent).toContain('What does success look like');
  });

  it('should render callout warning', () => {
    const callout = fixture.nativeElement.querySelector('.callout');
    expect(callout).toBeTruthy();
    expect(callout.textContent).toContain('Set them carefully');
  });

  it('should render one objective card by default', () => {
    const cards = fixture.nativeElement.querySelectorAll('.objective-card');
    expect(cards.length).toBe(1);
  });

  it('should render category buttons', () => {
    const buttons = fixture.nativeElement.querySelectorAll('.category-btn');
    expect(buttons.length).toBe(6);
  });

  it('should render AI Suggest Objectives button', () => {
    const btn = fixture.nativeElement.querySelector('.actions-row app-outline-button .outline-btn');
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('AI Suggest Objectives');
  });

  it('should not show remove button when only one objective', () => {
    const removeBtn = fixture.nativeElement.querySelector('.remove-objective');
    expect(removeBtn).toBeNull();
  });

  it('should show remove button when multiple objectives', () => {
    formService.addObjective();
    fixture.detectChanges();
    const removeBtns = fixture.nativeElement.querySelectorAll('.remove-objective');
    expect(removeBtns.length).toBe(2);
  });

  it('should render metric inputs (target, unit, timeframe)', () => {
    const metrics = fixture.nativeElement.querySelector('.objective-metrics');
    expect(metrics).toBeTruthy();
    const inputs = metrics.querySelectorAll('.field-input');
    expect(inputs.length).toBe(3);
  });

  it('should suggest objectives via AI button', () => {
    vi.useFakeTimers();
    fixture.componentInstance.suggestObjectives();
    expect(fixture.componentInstance.isSuggesting()).toBe(true);

    vi.advanceTimersByTime(1500);
    expect(fixture.componentInstance.isSuggesting()).toBe(false);
    expect(formService.businessObjectives().length).toBe(2);
    expect(formService.businessObjectives()[0].statement).toContain('25,000');
    vi.useRealTimers();
  });

  it('should remove an objective when remove button clicked', () => {
    formService.addObjective();
    fixture.detectChanges();
    const removeBtn = fixture.nativeElement.querySelector('.remove-objective') as HTMLButtonElement;
    removeBtn.click();
    fixture.detectChanges();
    expect(formService.businessObjectives().length).toBe(1);
  });

  it('should update category via category button click', () => {
    const catBtns = fixture.nativeElement.querySelectorAll('.category-btn') as NodeListOf<HTMLButtonElement>;
    catBtns[1].click();
    fixture.detectChanges();
    expect(formService.businessObjectives()[0].category).toBe('revenue');
  });

  it('should update target via input', () => {
    const metricInputs = fixture.nativeElement.querySelectorAll('.objective-metrics .field-input') as NodeListOf<HTMLInputElement>;
    metricInputs[0].value = '5000';
    metricInputs[0].dispatchEvent(new Event('input'));
    expect(formService.businessObjectives()[0].target).toBe('5000');
  });

  it('should update unit via input', () => {
    const metricInputs = fixture.nativeElement.querySelectorAll('.objective-metrics .field-input') as NodeListOf<HTMLInputElement>;
    metricInputs[1].value = 'followers';
    metricInputs[1].dispatchEvent(new Event('input'));
    expect(formService.businessObjectives()[0].unit).toBe('followers');
  });

  it('should update timeframe via input', () => {
    const metricInputs = fixture.nativeElement.querySelectorAll('.objective-metrics .field-input') as NodeListOf<HTMLInputElement>;
    metricInputs[2].value = 'Q4 2026';
    metricInputs[2].dispatchEvent(new Event('input'));
    expect(formService.businessObjectives()[0].timeframe).toBe('Q4 2026');
  });

  it('should reflect the 2–10 range in the subtitle copy', () => {
    const subtitle = fixture.nativeElement.querySelector('.step-subtitle');
    expect(subtitle?.textContent).toContain('Define 2–10 measurable goals');
  });

  it('should render Add Objective button when count is below cap', () => {
    const wrapper = fixture.nativeElement.querySelector('.add-objective-wrapper');
    expect(wrapper).toBeTruthy();
    expect(wrapper.textContent).toContain('Add Objective');
  });

  it('should grow the objective list when Add Objective is clicked', () => {
    expect(formService.businessObjectives().length).toBe(1);
    const addBtn = fixture.nativeElement.querySelector('.add-objective-wrapper .outline-btn') as HTMLButtonElement;
    addBtn.click();
    fixture.detectChanges();
    expect(formService.businessObjectives().length).toBe(2);
  });

  it('should hide Add Objective button when count reaches the cap of 10', () => {
    formService.businessObjectives.set(
      Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        category: 'growth',
        statement: '',
        target: '',
        unit: '',
        timeframe: '',
      }))
    );
    fixture.detectChanges();
    const wrapper = fixture.nativeElement.querySelector('.add-objective-wrapper');
    expect(wrapper).toBeNull();
  });
});
