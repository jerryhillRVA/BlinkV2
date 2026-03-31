import { TestBed } from '@angular/core/testing';
import { StepContentStrategyComponent } from './step-content-strategy.component';
import { NewWorkspaceFormService } from '../../new-workspace-form.service';

describe('StepContentStrategyComponent', () => {
  let formService: NewWorkspaceFormService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepContentStrategyComponent],
      providers: [NewWorkspaceFormService],
    }).compileComponents();
    formService = TestBed.inject(NewWorkspaceFormService);
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(StepContentStrategyComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show heading "Content Strategy"', () => {
    const fixture = TestBed.createComponent(StepContentStrategyComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('h2')?.textContent).toContain('Content Strategy');
  });

  it('should show subtitle', () => {
    const fixture = TestBed.createComponent(StepContentStrategyComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.step-subtitle')?.textContent).toContain('content pillars');
  });

  it('should show "Add Pillar" button', () => {
    const fixture = TestBed.createComponent(StepContentStrategyComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('app-outline-button .outline-btn')?.textContent).toContain('Add Pillar');
  });

  it('should start with 2 pre-filled pillar cards', () => {
    const fixture = TestBed.createComponent(StepContentStrategyComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll('.pillar-card').length).toBe(2);
  });

  it('should show numbered pillar headers', () => {
    const fixture = TestBed.createComponent(StepContentStrategyComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const numbers = el.querySelectorAll('.pillar-number');
    expect(numbers[0].textContent?.trim()).toBe('1');
    expect(numbers[1].textContent?.trim()).toBe('2');
  });

  it('should add a new pillar card when Add Pillar is clicked', () => {
    const fixture = TestBed.createComponent(StepContentStrategyComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    (el.querySelector('app-outline-button .outline-btn') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.querySelectorAll('.pillar-card').length).toBe(3);
  });

  it('should remove a pillar card (only if > 1)', () => {
    const fixture = TestBed.createComponent(StepContentStrategyComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    (el.querySelector('.remove-pillar') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.querySelectorAll('.pillar-card').length).toBe(1);
  });

  it('should have name, themes, description fields per pillar', () => {
    const fixture = TestBed.createComponent(StepContentStrategyComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const card = el.querySelector('.pillar-card') as HTMLElement;
    expect(card.querySelector('.pillar-name')).toBeTruthy();
    expect(card.querySelector('.pillar-themes')).toBeTruthy();
    expect(card.querySelector('.pillar-description')).toBeTruthy();
  });

  it('should have audience multi-select buttons', () => {
    const fixture = TestBed.createComponent(StepContentStrategyComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const audienceBtns = el.querySelectorAll('.audience-pill');
    expect(audienceBtns.length).toBeGreaterThan(0);
  });

  it('should have platform multi-select buttons', () => {
    const fixture = TestBed.createComponent(StepContentStrategyComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const platformBtns = el.querySelectorAll('.platform-pill');
    expect(platformBtns.length).toBeGreaterThan(0);
  });

  it('should toggle audience selection state on click', () => {
    const fixture = TestBed.createComponent(StepContentStrategyComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const pill = el.querySelector('.audience-pill') as HTMLButtonElement;
    const wasSelected = pill.classList.contains('pill-selected');
    pill.click();
    fixture.detectChanges();
    expect(pill.classList.contains('pill-selected')).toBe(!wasSelected);
  });

  it('should toggle platform selection state on click', () => {
    const fixture = TestBed.createComponent(StepContentStrategyComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const pill = el.querySelector('.platform-pill') as HTMLButtonElement;
    const wasSelected = pill.classList.contains('pill-selected');
    pill.click();
    fixture.detectChanges();
    expect(pill.classList.contains('pill-selected')).toBe(!wasSelected);
  });

  it('should not remove last pillar', () => {
    formService.removePillar(formService.contentPillars()[0].id);
    expect(formService.contentPillars().length).toBe(1);
    formService.removePillar(formService.contentPillars()[0].id);
    expect(formService.contentPillars().length).toBe(1);
  });
});
