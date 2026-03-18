import { TestBed } from '@angular/core/testing';
import { StepIndicatorComponent, WizardStep } from './step-indicator.component';

const STEPS: WizardStep[] = [
  { id: 1, title: 'Workspace' },
  { id: 2, title: 'Platforms' },
  { id: 3, title: 'Content' },
  { id: 4, title: 'Agents' },
  { id: 5, title: 'Review' },
];

describe('StepIndicatorComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepIndicatorComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(StepIndicatorComponent);
    fixture.componentRef.setInput('steps', STEPS);
    fixture.componentRef.setInput('currentStep', 1);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render 5 step circles', () => {
    const fixture = TestBed.createComponent(StepIndicatorComponent);
    fixture.componentRef.setInput('steps', STEPS);
    fixture.componentRef.setInput('currentStep', 1);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const circles = el.querySelectorAll('.step-circle');
    expect(circles.length).toBe(5);
  });

  it('should show checkmark SVG on completed steps', () => {
    const fixture = TestBed.createComponent(StepIndicatorComponent);
    fixture.componentRef.setInput('steps', STEPS);
    fixture.componentRef.setInput('currentStep', 3);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const completed = el.querySelectorAll('.step-completed');
    expect(completed.length).toBe(2);
    expect(completed[0].querySelector('svg')).toBeTruthy();
  });

  it('should show active styling on current step', () => {
    const fixture = TestBed.createComponent(StepIndicatorComponent);
    fixture.componentRef.setInput('steps', STEPS);
    fixture.componentRef.setInput('currentStep', 2);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const active = el.querySelectorAll('.step-active');
    expect(active.length).toBe(1);
    expect(active[0].textContent?.trim()).toBe('2');
  });

  it('should show inactive styling on future steps', () => {
    const fixture = TestBed.createComponent(StepIndicatorComponent);
    fixture.componentRef.setInput('steps', STEPS);
    fixture.componentRef.setInput('currentStep', 1);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const inactive = el.querySelectorAll('.step-inactive');
    expect(inactive.length).toBe(4);
  });

  it('should render progress lines between steps', () => {
    const fixture = TestBed.createComponent(StepIndicatorComponent);
    fixture.componentRef.setInput('steps', STEPS);
    fixture.componentRef.setInput('currentStep', 1);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const lines = el.querySelectorAll('.step-line');
    expect(lines.length).toBe(4);
  });

  it('should fill progress lines for completed steps', () => {
    const fixture = TestBed.createComponent(StepIndicatorComponent);
    fixture.componentRef.setInput('steps', STEPS);
    fixture.componentRef.setInput('currentStep', 3);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const filled = el.querySelectorAll('.step-line-filled');
    expect(filled.length).toBe(2);
  });

  it('should display step labels below circles', () => {
    const fixture = TestBed.createComponent(StepIndicatorComponent);
    fixture.componentRef.setInput('steps', STEPS);
    fixture.componentRef.setInput('currentStep', 1);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const labels = el.querySelectorAll('.step-label');
    expect(labels.length).toBe(5);
    expect(labels[0].textContent?.trim()).toBe('Workspace');
    expect(labels[4].textContent?.trim()).toBe('Review');
  });
});
