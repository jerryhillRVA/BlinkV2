import { TestBed } from '@angular/core/testing';
import { StepPlatformConfigComponent } from './step-platform-config.component';
import { NewWorkspaceFormService } from '../../new-workspace-form.service';

describe('StepPlatformConfigComponent', () => {
  let formService: NewWorkspaceFormService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepPlatformConfigComponent],
      providers: [NewWorkspaceFormService],
    }).compileComponents();
    formService = TestBed.inject(NewWorkspaceFormService);
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(StepPlatformConfigComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show heading "Platform Configuration"', () => {
    const fixture = TestBed.createComponent(StepPlatformConfigComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('h2')?.textContent).toContain('Platform Configuration');
  });

  it('should show subtitle', () => {
    const fixture = TestBed.createComponent(StepPlatformConfigComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.step-subtitle')?.textContent).toContain('global rules');
  });

  it('should have Global Rules card', () => {
    const fixture = TestBed.createComponent(StepPlatformConfigComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.global-rules')).toBeTruthy();
  });

  it('should have Default Platform select', () => {
    const fixture = TestBed.createComponent(StepPlatformConfigComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('#default-platform')).toBeTruthy();
  });

  it('should have Max Ideas input', () => {
    const fixture = TestBed.createComponent(StepPlatformConfigComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('#max-ideas')).toBeTruthy();
  });

  it('should have Content Warning toggle', () => {
    const fixture = TestBed.createComponent(StepPlatformConfigComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.toggle-content-warning')).toBeTruthy();
  });

  it('should have AI Disclaimer toggle', () => {
    const fixture = TestBed.createComponent(StepPlatformConfigComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.toggle-ai-disclaimer')).toBeTruthy();
  });

  it('should list 7 platforms', () => {
    const fixture = TestBed.createComponent(StepPlatformConfigComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const items = el.querySelectorAll('.platform-item');
    expect(items.length).toBe(7);
  });

  it('should have enable/disable toggle on each platform', () => {
    const fixture = TestBed.createComponent(StepPlatformConfigComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const toggles = el.querySelectorAll('.platform-toggle');
    expect(toggles.length).toBe(7);
  });

  it('should show ACTIVE badge for enabled platforms', () => {
    const fixture = TestBed.createComponent(StepPlatformConfigComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const activeBadges = el.querySelectorAll('.badge-active');
    expect(activeBadges.length).toBe(2);
  });

  it('should toggle platform when toggle is clicked', () => {
    const fixture = TestBed.createComponent(StepPlatformConfigComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;

    const toggles = el.querySelectorAll('.platform-toggle');
    (toggles[2] as HTMLElement).click();
    fixture.detectChanges();

    const activeBadges = el.querySelectorAll('.badge-active');
    expect(activeBadges.length).toBe(3);
  });

  it('should toggle content warning when clicked', () => {
    expect(formService.contentWarning()).toBe(false);
    formService.toggleContentWarning();
    expect(formService.contentWarning()).toBe(true);
  });

  it('should toggle AI disclaimer when clicked', () => {
    expect(formService.aiDisclaimer()).toBe(true);
    formService.toggleAiDisclaimer();
    expect(formService.aiDisclaimer()).toBe(false);
  });

  it('should disable a platform when toggled off', () => {
    expect(formService.isEnabled('YouTube')).toBe(true);
    formService.togglePlatform('YouTube');
    expect(formService.isEnabled('YouTube')).toBe(false);
  });

  it('should have expandable platform details', () => {
    const fixture = TestBed.createComponent(StepPlatformConfigComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const details = el.querySelectorAll('.platform-details');
    expect(details.length).toBe(7);
  });
});
