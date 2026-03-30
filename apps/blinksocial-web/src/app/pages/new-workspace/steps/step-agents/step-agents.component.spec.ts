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

  it('should show message about configuration moved to settings', () => {
    const fixture = TestBed.createComponent(StepAgentsComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.step-subtitle')?.textContent).toContain('Workspace Settings');
  });
});
