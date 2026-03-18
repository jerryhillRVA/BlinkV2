import { TestBed } from '@angular/core/testing';
import { StepReviewComponent } from './step-review.component';
import { NewWorkspaceFormService } from '../../new-workspace-form.service';

describe('StepReviewComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepReviewComponent],
      providers: [NewWorkspaceFormService],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(StepReviewComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show checkmark icon', () => {
    const fixture = TestBed.createComponent(StepReviewComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.review-checkmark svg')).toBeTruthy();
  });

  it('should show "All Set!" heading', () => {
    const fixture = TestBed.createComponent(StepReviewComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('h2')?.textContent).toContain('All Set!');
  });

  it('should show description text', () => {
    const fixture = TestBed.createComponent(StepReviewComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.review-description')?.textContent).toContain('configured');
  });

  it('should show summary box', () => {
    const fixture = TestBed.createComponent(StepReviewComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.review-summary')).toBeTruthy();
  });

  it('should show summary stats (workspace, pillars, platforms, agents)', () => {
    const fixture = TestBed.createComponent(StepReviewComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const rows = el.querySelectorAll('.summary-row');
    expect(rows.length).toBe(4);
  });

  it('should show pulsing background ring on checkmark', () => {
    const fixture = TestBed.createComponent(StepReviewComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.checkmark-pulse')).toBeTruthy();
  });

  it('should show "Untitled Workspace" when workspace name is empty', () => {
    const fixture = TestBed.createComponent(StepReviewComponent);
    const formService = TestBed.inject(NewWorkspaceFormService);
    formService.workspaceName.set('');
    fixture.detectChanges();
    expect(fixture.componentInstance.workspaceName).toBe('Untitled Workspace');
  });

  it('should show "None" when no platforms are enabled', () => {
    const fixture = TestBed.createComponent(StepReviewComponent);
    const formService = TestBed.inject(NewWorkspaceFormService);
    formService.enabledPlatforms.set(new Set());
    fixture.detectChanges();
    expect(fixture.componentInstance.enabledPlatformNames).toBe('None');
  });

  it('should show workspace name when set', () => {
    const fixture = TestBed.createComponent(StepReviewComponent);
    const formService = TestBed.inject(NewWorkspaceFormService);
    formService.workspaceName.set('My Workspace');
    fixture.detectChanges();
    expect(fixture.componentInstance.workspaceName).toBe('My Workspace');
  });
});
