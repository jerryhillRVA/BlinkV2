import { TestBed } from '@angular/core/testing';
import { StepBrandPositioningComponent } from './step-brand-positioning.component';
import { NewWorkspaceFormService } from '../../new-workspace-form.service';

describe('StepBrandPositioningComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<StepBrandPositioningComponent>>;
  let formService: NewWorkspaceFormService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepBrandPositioningComponent],
      providers: [NewWorkspaceFormService],
    }).compileComponents();

    formService = TestBed.inject(NewWorkspaceFormService);
    fixture = TestBed.createComponent(StepBrandPositioningComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render Brand & Voice header', () => {
    const h2 = fixture.nativeElement.querySelector('h2');
    expect(h2?.textContent).toContain('Brand');
    expect(h2?.textContent).toContain('Voice');
  });

  it('should render Brand Positioning section with 4 inputs', () => {
    const grid = fixture.nativeElement.querySelector('.positioning-fields');
    expect(grid).toBeTruthy();
    const inputs = grid.querySelectorAll('.field-input');
    expect(inputs.length).toBe(4);
  });

  it('should render AI Generate Statement button', () => {
    const btn = fixture.nativeElement.querySelector('app-outline-button .outline-btn');
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('Generate Positioning Statement');
  });

  it('should not show positioning statement textarea by default', () => {
    const textareas = fixture.nativeElement.querySelectorAll('.field-textarea');
    // Only the brand voice textarea should be present
    expect(textareas.length).toBe(1);
  });

  it('should render 8 tone tag buttons', () => {
    const tags = fixture.nativeElement.querySelectorAll('.tone-tag');
    expect(tags.length).toBe(8);
  });

  it('should toggle tone tag selection', () => {
    formService.toggleToneTag('Bold');
    fixture.detectChanges();
    const selected = fixture.nativeElement.querySelectorAll('.tone-selected');
    expect(selected.length).toBe(1);
    expect(selected[0].textContent).toContain('Bold');
  });

  it('should render brand voice textarea', () => {
    const textarea = fixture.nativeElement.querySelector('.field-textarea');
    expect(textarea).toBeTruthy();
  });

  it('should not generate statement when all fields empty', () => {
    fixture.componentInstance.generatePositioningStatement();
    expect(fixture.componentInstance.isGenerating()).toBe(false);
  });

  it('should generate positioning statement when fields populated', () => {
    vi.useFakeTimers();
    formService.updateBrandPositioning('targetCustomer', 'Developers');
    formService.updateBrandPositioning('problemSolved', 'lack tooling');
    formService.updateBrandPositioning('solution', 'our platform');
    formService.updateBrandPositioning('differentiator', 'AI-powered');

    fixture.componentInstance.generatePositioningStatement();
    expect(fixture.componentInstance.isGenerating()).toBe(true);

    vi.advanceTimersByTime(1500);
    expect(fixture.componentInstance.isGenerating()).toBe(false);
    expect(formService.brandPositioning().positioningStatement).toContain('Developers');
    vi.useRealTimers();
  });

  it('should update brand positioning field via input', () => {
    const inputs = fixture.nativeElement.querySelectorAll('.positioning-fields .field-input');
    if (inputs.length > 0) {
      inputs[0].value = 'Tech startups';
      inputs[0].dispatchEvent(new Event('input'));
      expect(formService.brandPositioning().targetCustomer).toBe('Tech startups');
    }
  });

  it('should toggle tone tag via button click', () => {
    const tagBtn = fixture.nativeElement.querySelector('.tone-tag') as HTMLButtonElement;
    tagBtn.click();
    fixture.detectChanges();
    expect(formService.toneTags().length).toBe(1);
  });

  it('should update all brand positioning fields via template inputs', () => {
    const inputs = fixture.nativeElement.querySelectorAll('.positioning-fields .field-input') as NodeListOf<HTMLInputElement>;
    // Problem (index 1)
    inputs[1].value = 'need better tools';
    inputs[1].dispatchEvent(new Event('input'));
    expect(formService.brandPositioning().problemSolved).toBe('need better tools');
    // Solution (index 2)
    inputs[2].value = 'our platform';
    inputs[2].dispatchEvent(new Event('input'));
    expect(formService.brandPositioning().solution).toBe('our platform');
    // Differentiator (index 3)
    inputs[3].value = 'AI-first';
    inputs[3].dispatchEvent(new Event('input'));
    expect(formService.brandPositioning().differentiator).toBe('AI-first');
  });

  it('should update brand voice via textarea', () => {
    const textarea = fixture.nativeElement.querySelector('.field-textarea') as HTMLTextAreaElement;
    textarea.value = 'bold and confident';
    textarea.dispatchEvent(new Event('input'));
    expect(formService.brandVoice()).toBe('bold and confident');
  });

  it('should show positioning statement textarea after generation', () => {
    vi.useFakeTimers();
    formService.updateBrandPositioning('targetCustomer', 'Devs');
    fixture.componentInstance.generatePositioningStatement();
    vi.advanceTimersByTime(1500);
    vi.useRealTimers();
    fixture.detectChanges();
    const textareas = fixture.nativeElement.querySelectorAll('.field-textarea');
    expect(textareas.length).toBe(2);
  });

  it('should click generate button via template', () => {
    formService.updateBrandPositioning('targetCustomer', 'Devs');
    fixture.detectChanges();
    vi.useFakeTimers();
    const btn = fixture.nativeElement.querySelector('app-outline-button .outline-btn') as HTMLButtonElement;
    btn.click();
    expect(fixture.componentInstance.isGenerating()).toBe(true);
    vi.advanceTimersByTime(1500);
    vi.useRealTimers();
  });
});
