import { TestBed } from '@angular/core/testing';
import { StepAgentsComponent } from './step-agents.component';
import { NewWorkspaceFormService } from '../../new-workspace-form.service';

describe('StepAgentsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepAgentsComponent],
      providers: [NewWorkspaceFormService],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(StepAgentsComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show heading "Agent Personalities"', () => {
    const fixture = TestBed.createComponent(StepAgentsComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('h2')?.textContent).toContain('Agent Personalities');
  });

  it('should show subtitle', () => {
    const fixture = TestBed.createComponent(StepAgentsComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.step-subtitle')?.textContent).toContain('AI team members');
  });

  it('should show "Add Agent" button', () => {
    const fixture = TestBed.createComponent(StepAgentsComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.add-agent')?.textContent).toContain('Add Agent');
  });

  it('should start with 2 pre-filled agent cards', () => {
    const fixture = TestBed.createComponent(StepAgentsComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll('.agent-card').length).toBe(2);
  });

  it('should show numbered agent headers', () => {
    const fixture = TestBed.createComponent(StepAgentsComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const numbers = el.querySelectorAll('.agent-number');
    expect(numbers[0].textContent?.trim()).toBe('1');
    expect(numbers[1].textContent?.trim()).toBe('2');
  });

  it('should add a new agent card when Add Agent is clicked', () => {
    const fixture = TestBed.createComponent(StepAgentsComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    (el.querySelector('.add-agent') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.querySelectorAll('.agent-card').length).toBe(3);
  });

  it('should remove an agent card (only if > 1)', () => {
    const fixture = TestBed.createComponent(StepAgentsComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    (el.querySelector('.remove-agent') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.querySelectorAll('.agent-card').length).toBe(1);
  });

  it('should have name, role, responsibilities, outputs fields per agent', () => {
    const fixture = TestBed.createComponent(StepAgentsComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const card = el.querySelector('.agent-card') as HTMLElement;
    expect(card.querySelector('.agent-name')).toBeTruthy();
    expect(card.querySelector('.agent-role')).toBeTruthy();
    expect(card.querySelector('.agent-responsibilities')).toBeTruthy();
    expect(card.querySelector('.agent-outputs')).toBeTruthy();
  });
});
