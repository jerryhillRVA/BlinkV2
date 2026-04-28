import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { StepObjectivesComponent } from './step-objectives.component';
import { NewWorkspaceFormService, MAX_OBJECTIVES } from '../../new-workspace-form.service';
import { ToastService } from '../../../../core/toast/toast.service';
import type { BusinessObjectiveContract } from '@blinksocial/contracts';

function makeSuggestion(
  partial: Partial<BusinessObjectiveContract>,
  i = 0,
): BusinessObjectiveContract {
  return {
    id: `ai-${i}`,
    category: 'growth',
    statement: `Suggestion ${i}`,
    target: 0,
    unit: '',
    timeframe: '',
    status: 'on-track',
    ...partial,
  };
}

describe('StepObjectivesComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<StepObjectivesComponent>>;
  let formService: NewWorkspaceFormService;
  let httpMock: HttpTestingController;
  let toast: { showError: ReturnType<typeof vi.fn>; showSuccess: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    toast = { showError: vi.fn(), showSuccess: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [StepObjectivesComponent],
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
    fixture = TestBed.createComponent(StepObjectivesComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
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

  it('appends suggestions without overwriting a manual goal', () => {
    formService.workspaceName.set('TC5 WS');
    const seedId = formService.businessObjectives()[0].id;
    formService.updateObjective(seedId, 'statement', 'Manual user goal');

    fixture.componentInstance.suggestObjectives();
    const req = httpMock.expectOne('/api/wizard-ai/business-objectives');
    expect(req.request.body).toMatchObject({
      workspaceName: 'TC5 WS',
      existingObjectives: [{ statement: 'Manual user goal', category: 'growth' }],
    });
    req.flush({
      suggestions: [
        makeSuggestion({ statement: 'Hit 5% engagement', category: 'engagement' }, 0),
        makeSuggestion({ statement: 'Reach 50k subs', category: 'awareness' }, 1),
      ],
    });

    const list = formService.businessObjectives();
    expect(list).toHaveLength(3);
    expect(list[0].statement).toBe('Manual user goal');
    expect(list.map((o) => o.statement)).toContain('Hit 5% engagement');
    expect(fixture.componentInstance.isSuggesting()).toBe(false);
  });

  it('drops the empty placeholder when merging suggestions from a fresh wizard', () => {
    formService.workspaceName.set('TC6 WS');
    fixture.componentInstance.suggestObjectives();
    const req = httpMock.expectOne('/api/wizard-ai/business-objectives');
    expect(req.request.body.existingObjectives).toBeUndefined();

    req.flush({
      suggestions: [
        makeSuggestion({ statement: 'Goal A' }, 0),
        makeSuggestion({ statement: 'Goal B' }, 1),
      ],
    });

    expect(formService.businessObjectives()).toHaveLength(2);
    expect(formService.businessObjectives().every((o) => o.statement.length > 0)).toBe(true);
  });

  it('skips dupes case-insensitively', () => {
    formService.workspaceName.set('WS');
    formService.updateObjective(
      formService.businessObjectives()[0].id,
      'statement',
      'Grow audience',
    );

    fixture.componentInstance.suggestObjectives();
    const req = httpMock.expectOne('/api/wizard-ai/business-objectives');
    req.flush({
      suggestions: [
        makeSuggestion({ statement: 'GROW AUDIENCE' }, 0),
        makeSuggestion({ statement: 'New unique goal' }, 1),
      ],
    });

    const list = formService.businessObjectives();
    expect(list).toHaveLength(2);
    expect(list[0].statement).toBe('Grow audience');
    expect(list[1].statement).toBe('New unique goal');
  });

  it('caps the merged list at MAX_OBJECTIVES, dropping suggestions first', () => {
    formService.workspaceName.set('WS');
    // Seed MAX_OBJECTIVES - 1 non-empty manual entries; fresh state has 1.
    const seedCount = MAX_OBJECTIVES - 1;
    const seedStatements = Array.from({ length: seedCount }, (_, i) => `seed-${i + 1}`);
    formService.updateObjective(
      formService.businessObjectives()[0].id,
      'statement',
      seedStatements[0],
    );
    for (let i = 1; i < seedCount; i++) {
      formService.addObjective();
      formService.updateObjective(
        formService.businessObjectives()[i].id,
        'statement',
        seedStatements[i],
      );
    }
    expect(formService.businessObjectives()).toHaveLength(seedCount);

    fixture.componentInstance.suggestObjectives();
    const req = httpMock.expectOne('/api/wizard-ai/business-objectives');
    req.flush({
      suggestions: [
        makeSuggestion({ statement: 'sug-1' }, 0),
        makeSuggestion({ statement: 'sug-2' }, 1),
        makeSuggestion({ statement: 'sug-3' }, 2),
      ],
    });

    const list = formService.businessObjectives();
    expect(list).toHaveLength(MAX_OBJECTIVES);
    expect(list.slice(0, seedCount).map((o) => o.statement)).toEqual(seedStatements);
    // Only one suggestion fits — the rest drop because suggestions go last.
    expect(list[seedCount].statement).toBe('sug-1');
  });

  it('toasts and preserves the list on backend error', () => {
    formService.workspaceName.set('WS');
    formService.updateObjective(
      formService.businessObjectives()[0].id,
      'statement',
      'Manual goal',
    );

    fixture.componentInstance.suggestObjectives();
    const req = httpMock.expectOne('/api/wizard-ai/business-objectives');
    req.flush(
      { message: 'LLM unavailable' },
      { status: 500, statusText: 'Server Error' },
    );

    expect(toast.showError).toHaveBeenCalledWith('LLM unavailable');
    expect(fixture.componentInstance.isSuggesting()).toBe(false);
    const list = formService.businessObjectives();
    expect(list).toHaveLength(1);
    expect(list[0].statement).toBe('Manual goal');
  });

  it('suppresses Nest generic 5xx envelope and shows the friendly fallback', () => {
    formService.workspaceName.set('WS');

    fixture.componentInstance.suggestObjectives();
    const req = httpMock.expectOne('/api/wizard-ai/business-objectives');
    req.flush(
      { statusCode: 500, message: 'Internal server error' },
      { status: 500, statusText: 'Internal Server Error' },
    );

    expect(toast.showError).toHaveBeenCalledWith('Could not suggest objectives.');
  });

  it('passes audienceSegments when present', () => {
    formService.workspaceName.set('WS');
    formService.audienceSegments.set([
      { id: 1, name: 'Founders' },
      { id: 2, name: '' },
    ]);

    fixture.componentInstance.suggestObjectives();
    const req = httpMock.expectOne('/api/wizard-ai/business-objectives');
    expect(req.request.body.audienceSegments).toEqual([{ name: 'Founders' }]);
    req.flush({ suggestions: [] });
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
