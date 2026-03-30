import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { NewWorkspaceComponent } from './new-workspace.component';
import { ToastService } from '../../core/toast/toast.service';
import { NewWorkspaceFormService } from './new-workspace-form.service';

describe('NewWorkspaceComponent', () => {
  let router: Router;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewWorkspaceComponent],
      providers: [
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: ToastService, useValue: { showError: vi.fn(), showSuccess: vi.fn() } },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
    toastService = TestBed.inject(ToastService);
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(NewWorkspaceComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show Back to Home button', () => {
    const fixture = TestBed.createComponent(NewWorkspaceComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const backBtn = el.querySelector('.back-home');
    expect(backBtn).toBeTruthy();
    expect(backBtn?.textContent).toContain('Back to Home');
  });

  it('should show page header with title and subtitle', () => {
    const fixture = TestBed.createComponent(NewWorkspaceComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.page-title')?.textContent).toContain('Setup Your Workspace');
    expect(el.querySelector('.page-subtitle')).toBeTruthy();
  });

  it('should show page header icon', () => {
    const fixture = TestBed.createComponent(NewWorkspaceComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.page-header-icon svg')).toBeTruthy();
  });

  it('should render step indicator with 7 steps', () => {
    const fixture = TestBed.createComponent(NewWorkspaceComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const circles = el.querySelectorAll('.step-circle');
    expect(circles.length).toBe(7);
  });

  it('should show wizard card container', () => {
    const fixture = TestBed.createComponent(NewWorkspaceComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.wizard-card')).toBeTruthy();
  });

  it('should disable Back button on step 1', () => {
    const fixture = TestBed.createComponent(NewWorkspaceComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const backBtn = el.querySelector('.wizard-back') as HTMLButtonElement;
    expect(backBtn.disabled).toBe(true);
  });

  it('should show "Next" on steps 1-6', () => {
    const fixture = TestBed.createComponent(NewWorkspaceComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const nextBtn = el.querySelector('.wizard-next');
    expect(nextBtn?.textContent).toContain('Next');
  });

  it('should show "Finish" on step 7', () => {
    const fixture = TestBed.createComponent(NewWorkspaceComponent);
    fixture.componentInstance.currentStep.set(7);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const nextBtn = el.querySelector('.wizard-next');
    expect(nextBtn?.textContent).toContain('Finish');
    expect(nextBtn?.textContent).not.toContain('Finish & Launch');
  });

  it('should enable Back button on step 7', () => {
    const fixture = TestBed.createComponent(NewWorkspaceComponent);
    fixture.componentInstance.currentStep.set(7);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const backBtn = el.querySelector('.wizard-back') as HTMLButtonElement;
    expect(backBtn.disabled).toBe(false);
  });

  it('should go back from step 7 to step 6', () => {
    const fixture = TestBed.createComponent(NewWorkspaceComponent);
    fixture.componentInstance.currentStep.set(7);
    fixture.detectChanges();
    const backBtn = fixture.nativeElement.querySelector('.wizard-back') as HTMLButtonElement;
    backBtn.click();
    expect(fixture.componentInstance.currentStep()).toBe(6);
  });

  it('should advance step when Next is clicked with valid data', () => {
    const fixture = TestBed.createComponent(NewWorkspaceComponent);
    fixture.detectChanges();
    const formService = fixture.debugElement.injector.get(NewWorkspaceFormService);
    formService.workspaceName.set('Test Workspace');
    const el: HTMLElement = fixture.nativeElement;
    const nextBtn = el.querySelector('.wizard-next') as HTMLButtonElement;
    nextBtn.click();
    expect(fixture.componentInstance.currentStep()).toBe(2);
  });

  it('should go back when Back is clicked', () => {
    const fixture = TestBed.createComponent(NewWorkspaceComponent);
    fixture.componentInstance.currentStep.set(3);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const backBtn = el.querySelector('.wizard-back') as HTMLButtonElement;
    backBtn.click();
    expect(fixture.componentInstance.currentStep()).toBe(2);
  });

  it('should navigate to / when Back to Home is clicked', () => {
    const fixture = TestBed.createComponent(NewWorkspaceComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const backBtn = el.querySelector('.back-home') as HTMLButtonElement;
    backBtn.click();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should call API and navigate on successful submit', async () => {
    const fixture = TestBed.createComponent(NewWorkspaceComponent);
    const httpMock = TestBed.inject(HttpTestingController);
    fixture.componentInstance.currentStep.set(7);
    fixture.detectChanges();

    const nextBtn = fixture.nativeElement.querySelector('.wizard-next') as HTMLButtonElement;
    nextBtn.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.isSubmitting()).toBe(true);

    const req = httpMock.expectOne('/api/workspaces');
    expect(req.request.method).toBe('POST');
    req.flush({ id: '123', tenantId: 'test', workspaceName: 'Test', status: 'active', createdAt: '2026-01-01' });

    // Flush the auth status refresh that happens after workspace creation
    // Use a microtask flush to allow the .then() chain to execute
    await new Promise((r) => setTimeout(r, 0));
    httpMock.match('/api/auth/status').forEach((r) =>
      r.flush({ authenticated: true, needsBootstrap: false, user: { id: 'u1', email: 'a@b.com', displayName: 'Test', workspaces: [] } })
    );
    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();

    expect(fixture.componentInstance.isSubmitting()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/']);
    // Flush any remaining requests
    httpMock.match(() => true).forEach((r) => r.flush({}));
  });

  it('should show toast error on failed submit', () => {
    const fixture = TestBed.createComponent(NewWorkspaceComponent);
    const httpMock = TestBed.inject(HttpTestingController);
    fixture.componentInstance.currentStep.set(7);
    fixture.detectChanges();

    const nextBtn = fixture.nativeElement.querySelector('.wizard-next') as HTMLButtonElement;
    nextBtn.click();
    fixture.detectChanges();

    const req = httpMock.expectOne('/api/workspaces');
    req.flush({ message: 'Validation failed' }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();

    expect(fixture.componentInstance.isSubmitting()).toBe(false);
    expect(toastService.showError).toHaveBeenCalledWith('Validation failed');
    httpMock.verify();
  });

  it('should show fallback toast error when error has no message', () => {
    const fixture = TestBed.createComponent(NewWorkspaceComponent);
    const httpMock = TestBed.inject(HttpTestingController);
    fixture.componentInstance.currentStep.set(7);
    fixture.detectChanges();

    const nextBtn = fixture.nativeElement.querySelector('.wizard-next') as HTMLButtonElement;
    nextBtn.click();
    fixture.detectChanges();

    const req = httpMock.expectOne('/api/workspaces');
    req.flush(null, { status: 500, statusText: 'Internal Server Error' });
    fixture.detectChanges();

    expect(toastService.showError).toHaveBeenCalledWith('Failed to create workspace. Please try again.');
    httpMock.verify();
  });

  it('should not advance from step 1 when workspace name is empty', () => {
    const fixture = TestBed.createComponent(NewWorkspaceComponent);
    fixture.detectChanges();
    const nextBtn = fixture.nativeElement.querySelector('.wizard-next') as HTMLButtonElement;
    nextBtn.click();
    expect(fixture.componentInstance.currentStep()).toBe(1);
    expect(toastService.showError).toHaveBeenCalled();
  });

  it('should advance from step 1 when workspace name is valid', () => {
    const fixture = TestBed.createComponent(NewWorkspaceComponent);
    fixture.detectChanges();
    const formService = fixture.debugElement.injector.get(NewWorkspaceFormService);
    formService.workspaceName.set('Valid Name');
    const nextBtn = fixture.nativeElement.querySelector('.wizard-next') as HTMLButtonElement;
    nextBtn.click();
    expect(fixture.componentInstance.currentStep()).toBe(2);
  });

  it('should show "Submitting..." text when submitting', () => {
    const fixture = TestBed.createComponent(NewWorkspaceComponent);
    fixture.componentInstance.currentStep.set(7);
    fixture.detectChanges();

    const nextBtn = fixture.nativeElement.querySelector('.wizard-next') as HTMLButtonElement;
    nextBtn.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.isSubmitting()).toBe(true);
    expect(nextBtn.textContent?.trim()).toContain('Submitting...');
  });
});
