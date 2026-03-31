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

  it('should show heading "Strategic Foundation"', () => {
    const fixture = TestBed.createComponent(StepWorkspaceBasicsComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('h2')?.textContent).toContain('Strategic Foundation');
  });

  it('should show subtitle', () => {
    const fixture = TestBed.createComponent(StepWorkspaceBasicsComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.step-subtitle')?.textContent).toContain('purpose and mission');
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

  it('should have label icons (SVGs) for each field', () => {
    const fixture = TestBed.createComponent(StepWorkspaceBasicsComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const labels = el.querySelectorAll('.field-label svg');
    expect(labels.length).toBeGreaterThanOrEqual(3);
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
});
