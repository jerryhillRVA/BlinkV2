import { TestBed } from '@angular/core/testing';
import { StepWorkspaceBasicsComponent } from './step-workspace-basics.component';
import { NewWorkspaceFormService } from '../../new-workspace-form.service';

describe('StepWorkspaceBasicsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepWorkspaceBasicsComponent],
      providers: [NewWorkspaceFormService],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(StepWorkspaceBasicsComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show heading "Workspace Identity"', () => {
    const fixture = TestBed.createComponent(StepWorkspaceBasicsComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('h2')?.textContent).toContain('Workspace Identity');
  });

  it('should show subtitle', () => {
    const fixture = TestBed.createComponent(StepWorkspaceBasicsComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.step-subtitle')?.textContent).toContain('core purpose');
  });

  it('should have Workspace Name input field', () => {
    const fixture = TestBed.createComponent(StepWorkspaceBasicsComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('#workspace-name')).toBeTruthy();
  });

  it('should have Workspace Purpose textarea', () => {
    const fixture = TestBed.createComponent(StepWorkspaceBasicsComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('#workspace-purpose')).toBeTruthy();
  });

  it('should have Mission textarea', () => {
    const fixture = TestBed.createComponent(StepWorkspaceBasicsComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('#mission')).toBeTruthy();
  });

  it('should have Brand Voice textarea', () => {
    const fixture = TestBed.createComponent(StepWorkspaceBasicsComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('#brand-voice')).toBeTruthy();
  });

  it('should have Audience Segment Targets section', () => {
    const fixture = TestBed.createComponent(StepWorkspaceBasicsComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.audience-section')).toBeTruthy();
  });

  it('should start with 1 audience segment', () => {
    const fixture = TestBed.createComponent(StepWorkspaceBasicsComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll('.segment-row').length).toBe(1);
  });

  it('should add a new segment when Add Segment is clicked', () => {
    const fixture = TestBed.createComponent(StepWorkspaceBasicsComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const addBtn = el.querySelector('.add-segment') as HTMLButtonElement;
    addBtn.click();
    fixture.detectChanges();
    expect(el.querySelectorAll('.segment-row').length).toBe(2);
  });

  it('should remove a segment when remove is clicked (only if > 1)', () => {
    const fixture = TestBed.createComponent(StepWorkspaceBasicsComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;

    // Add a second segment first
    (el.querySelector('.add-segment') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.querySelectorAll('.segment-row').length).toBe(2);

    // Remove one
    (el.querySelector('.remove-segment') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.querySelectorAll('.segment-row').length).toBe(1);
  });

  it('should not show remove button when only 1 segment exists', () => {
    const fixture = TestBed.createComponent(StepWorkspaceBasicsComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.remove-segment')).toBeFalsy();
  });

  it('should have label icons (SVGs) for each field', () => {
    const fixture = TestBed.createComponent(StepWorkspaceBasicsComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const labels = el.querySelectorAll('.field-label svg');
    expect(labels.length).toBeGreaterThanOrEqual(5);
  });

  it('should update form service when workspace name is typed', () => {
    const fixture = TestBed.createComponent(StepWorkspaceBasicsComponent);
    const formService = TestBed.inject(NewWorkspaceFormService);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('#workspace-name') as HTMLInputElement;
    input.value = 'My Workspace';
    input.dispatchEvent(new Event('input'));
    expect(formService.workspaceName()).toBe('My Workspace');
  });

  it('should update form service when purpose is typed', () => {
    const fixture = TestBed.createComponent(StepWorkspaceBasicsComponent);
    const formService = TestBed.inject(NewWorkspaceFormService);
    fixture.detectChanges();
    const textarea = fixture.nativeElement.querySelector('#workspace-purpose') as HTMLTextAreaElement;
    textarea.value = 'Test purpose';
    textarea.dispatchEvent(new Event('input'));
    expect(formService.purpose()).toBe('Test purpose');
  });

  it('should update form service when mission is typed', () => {
    const fixture = TestBed.createComponent(StepWorkspaceBasicsComponent);
    const formService = TestBed.inject(NewWorkspaceFormService);
    fixture.detectChanges();
    const textarea = fixture.nativeElement.querySelector('#mission') as HTMLTextAreaElement;
    textarea.value = 'Test mission';
    textarea.dispatchEvent(new Event('input'));
    expect(formService.mission()).toBe('Test mission');
  });

  it('should update form service when brand voice is typed', () => {
    const fixture = TestBed.createComponent(StepWorkspaceBasicsComponent);
    const formService = TestBed.inject(NewWorkspaceFormService);
    fixture.detectChanges();
    const textarea = fixture.nativeElement.querySelector('#brand-voice') as HTMLTextAreaElement;
    textarea.value = 'professional';
    textarea.dispatchEvent(new Event('input'));
    expect(formService.brandVoice()).toBe('professional');
  });

  it('should update segment description via input event', () => {
    const fixture = TestBed.createComponent(StepWorkspaceBasicsComponent);
    const formService = TestBed.inject(NewWorkspaceFormService);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('.segment-input') as HTMLInputElement;
    input.value = 'Tech workers';
    input.dispatchEvent(new Event('input'));
    expect(formService.audienceSegments()[0].description).toBe('Tech workers');
  });

  it('should update segment age range via change event', () => {
    const fixture = TestBed.createComponent(StepWorkspaceBasicsComponent);
    const formService = TestBed.inject(NewWorkspaceFormService);
    fixture.detectChanges();
    const select = fixture.nativeElement.querySelector('.field-select') as HTMLSelectElement;
    select.value = '35-44';
    select.dispatchEvent(new Event('change'));
    expect(formService.audienceSegments()[0].ageRange).toBe('35-44');
  });
});
