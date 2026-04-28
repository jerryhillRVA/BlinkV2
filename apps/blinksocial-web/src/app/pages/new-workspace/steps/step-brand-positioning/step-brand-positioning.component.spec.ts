import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { StepBrandPositioningComponent } from './step-brand-positioning.component';
import { NewWorkspaceFormService } from '../../new-workspace-form.service';
import { ToastService } from '../../../../core/toast/toast.service';

describe('StepBrandPositioningComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<StepBrandPositioningComponent>>;
  let formService: NewWorkspaceFormService;
  let httpMock: HttpTestingController;
  let toast: { showError: ReturnType<typeof vi.fn>; showSuccess: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    toast = { showError: vi.fn(), showSuccess: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [StepBrandPositioningComponent],
      providers: [
        NewWorkspaceFormService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimations(),
        { provide: ToastService, useValue: toast },
      ],
    }).compileComponents();

    formService = TestBed.inject(NewWorkspaceFormService);
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(StepBrandPositioningComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
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

  it('should not generate or trigger HTTP when all four positioning fields are empty', () => {
    fixture.componentInstance.generatePositioningStatement();
    expect(fixture.componentInstance.isGenerating()).toBe(false);
    httpMock.expectNone('/api/wizard-ai/positioning-statement');
  });

  it('posts the four positioning fields plus workspace context and applies the response', () => {
    formService.workspaceName.set('My WS');
    formService.purpose.set('A purpose');
    formService.updateBrandPositioning('targetCustomer', 'Devs');
    formService.updateBrandPositioning('solution', 'Fast tools');

    fixture.componentInstance.generatePositioningStatement();
    expect(fixture.componentInstance.isGenerating()).toBe(true);

    const req = httpMock.expectOne('/api/wizard-ai/positioning-statement');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toMatchObject({
      targetCustomer: 'Devs',
      solution: 'Fast tools',
      workspaceName: 'My WS',
      purpose: 'A purpose',
    });
    expect(req.request.body.problemSolved).toBeUndefined();
    expect(req.request.body.differentiator).toBeUndefined();

    req.flush({ positioningStatement: 'A coherent statement.' });

    expect(formService.brandPositioning().positioningStatement).toBe('A coherent statement.');
    expect(fixture.componentInstance.isGenerating()).toBe(false);
  });

  it('shows a toast and resets loading on backend error, preserving existing statement', () => {
    formService.updateBrandPositioning('positioningStatement', 'Existing');
    formService.updateBrandPositioning('targetCustomer', 'Devs');

    fixture.componentInstance.generatePositioningStatement();
    const req = httpMock.expectOne('/api/wizard-ai/positioning-statement');
    req.flush(
      { message: 'Server exploded' },
      { status: 500, statusText: 'Server Error' },
    );

    expect(toast.showError).toHaveBeenCalledWith('Server exploded');
    expect(fixture.componentInstance.isGenerating()).toBe(false);
    expect(formService.brandPositioning().positioningStatement).toBe('Existing');
  });

  it('falls back to default error message when error body has no message', () => {
    formService.updateBrandPositioning('targetCustomer', 'Devs');

    fixture.componentInstance.generatePositioningStatement();
    const req = httpMock.expectOne('/api/wizard-ai/positioning-statement');
    req.flush(null, { status: 500, statusText: 'Server Error' });

    expect(toast.showError).toHaveBeenCalled();
    const arg = (toast.showError.mock.calls[0]?.[0] as string) ?? '';
    expect(arg.length).toBeGreaterThan(0);
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
    inputs[1].value = 'need better tools';
    inputs[1].dispatchEvent(new Event('input'));
    expect(formService.brandPositioning().problemSolved).toBe('need better tools');
    inputs[2].value = 'our platform';
    inputs[2].dispatchEvent(new Event('input'));
    expect(formService.brandPositioning().solution).toBe('our platform');
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

  it('shows positioning statement textarea after successful generation', () => {
    formService.updateBrandPositioning('targetCustomer', 'Devs');
    fixture.componentInstance.generatePositioningStatement();
    const req = httpMock.expectOne('/api/wizard-ai/positioning-statement');
    req.flush({ positioningStatement: 'A statement.' });
    fixture.detectChanges();
    const textareas = fixture.nativeElement.querySelectorAll('.field-textarea');
    expect(textareas.length).toBe(2);
  });

  it('clicks generate button via template and triggers HTTP', () => {
    formService.updateBrandPositioning('targetCustomer', 'Devs');
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('app-outline-button .outline-btn') as HTMLButtonElement;
    btn.click();
    expect(fixture.componentInstance.isGenerating()).toBe(true);
    const req = httpMock.expectOne('/api/wizard-ai/positioning-statement');
    req.flush({ positioningStatement: 'X' });
  });
});
