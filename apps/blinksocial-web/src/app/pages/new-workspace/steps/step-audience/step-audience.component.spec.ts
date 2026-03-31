import { TestBed } from '@angular/core/testing';
import { StepAudienceComponent } from './step-audience.component';
import { NewWorkspaceFormService } from '../../new-workspace-form.service';

describe('StepAudienceComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<StepAudienceComponent>>;
  let formService: NewWorkspaceFormService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepAudienceComponent],
      providers: [NewWorkspaceFormService],
    }).compileComponents();

    formService = TestBed.inject(NewWorkspaceFormService);
    fixture = TestBed.createComponent(StepAudienceComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render Audience Segments header', () => {
    const h2 = fixture.nativeElement.querySelector('h2');
    expect(h2?.textContent).toContain('Audience Segments');
  });

  it('should render callout with info icon', () => {
    const callout = fixture.nativeElement.querySelector('.callout');
    expect(callout).toBeTruthy();
    expect(callout.querySelector('.callout-icon')).toBeTruthy();
    expect(callout.textContent).toContain('Keep this simple');
  });

  it('should render one segment row by default', () => {
    const rows = fixture.nativeElement.querySelectorAll('.segment-row');
    expect(rows.length).toBe(1);
  });

  it('should always show remove button', () => {
    const removeBtn = fixture.nativeElement.querySelector('.remove-segment');
    expect(removeBtn).toBeTruthy();
  });

  it('should add a segment', () => {
    formService.addSegment();
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('.segment-row');
    expect(rows.length).toBe(2);
  });

  it('should not add more than 6 segments', () => {
    for (let i = 0; i < 10; i++) formService.addSegment();
    fixture.detectChanges();
    expect(formService.audienceSegments().length).toBe(6);
  });

  it('should not show Add Segment button when at max', () => {
    for (let i = 0; i < 5; i++) formService.addSegment();
    fixture.detectChanges();
    const addBtn = fixture.nativeElement.querySelector('.add-segment');
    expect(addBtn).toBeNull();
  });

  it('should update segment name via input', () => {
    const input = fixture.nativeElement.querySelector('.segment-input') as HTMLInputElement;
    input.value = 'Startup founders';
    input.dispatchEvent(new Event('input'));
    expect(formService.audienceSegments()[0].name).toBe('Startup founders');
  });

  it('should remove a segment via remove button', () => {
    formService.addSegment();
    fixture.detectChanges();
    const removeBtn = fixture.nativeElement.querySelector('.remove-segment') as HTMLButtonElement;
    removeBtn.click();
    fixture.detectChanges();
    expect(formService.audienceSegments().length).toBe(1);
  });

  it('should render Add Segment button with plus icon', () => {
    const addBtn = fixture.nativeElement.querySelector('app-outline-button .outline-btn');
    expect(addBtn).toBeTruthy();
    expect(addBtn.textContent).toContain('Add Segment');
  });
});
