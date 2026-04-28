import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute, convertToParamMap } from '@angular/router';
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

  function setup(queryParams: Record<string, string> = {}) {
    TestBed.configureTestingModule({
      imports: [NewWorkspaceComponent],
      providers: [
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: ToastService, useValue: { showError: vi.fn(), showSuccess: vi.fn() } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap(queryParams) },
          },
        },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    router = TestBed.inject(Router);
    toastService = TestBed.inject(ToastService);
  }

  beforeEach(async () => {
    setup();
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

  it('should load wizard state when resume query param is present', () => {
    TestBed.resetTestingModule();
    setup({ resume: 'tenant-123' });
    const httpMock = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(NewWorkspaceComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.resumeWorkspaceId()).toBe('tenant-123');

    const req = httpMock.expectOne('/api/workspaces/tenant-123/settings/wizard-state');
    expect(req.request.method).toBe('GET');
    req.flush({
      currentStep: 3,
      completedSteps: [1, 2],
      formData: {
        general: { workspaceName: 'Resumed WS' },
      },
    });
    fixture.detectChanges();

    const formService = fixture.debugElement.injector.get(NewWorkspaceFormService);
    expect(formService.workspaceName()).toBe('Resumed WS');
    expect(fixture.componentInstance.currentStep()).toBe(3);
    httpMock.verify();
  });

  it('should call finalizeWorkspace when resuming and submitting', () => {
    TestBed.resetTestingModule();
    setup({ resume: 'tenant-123' });
    const httpMock = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(NewWorkspaceComponent);
    fixture.detectChanges();

    const wizardReq = httpMock.expectOne('/api/workspaces/tenant-123/settings/wizard-state');
    wizardReq.flush({
      currentStep: 7,
      completedSteps: [1, 2, 3, 4, 5, 6],
      formData: { general: { workspaceName: 'Test' } },
    });
    fixture.detectChanges();

    fixture.componentInstance.currentStep.set(7);
    fixture.detectChanges();

    const nextBtn = fixture.nativeElement.querySelector('.wizard-next') as HTMLButtonElement;
    nextBtn.click();
    fixture.detectChanges();

    // The component now saves wizard state before finalizing
    const saveReq = httpMock.expectOne('/api/workspaces/tenant-123/settings/wizard-state');
    expect(saveReq.request.method).toBe('PUT');
    saveReq.flush({});
    fixture.detectChanges();

    const finalizeReq = httpMock.expectOne('/api/workspaces/tenant-123/finalize');
    expect(finalizeReq.request.method).toBe('POST');
    finalizeReq.flush({});

    httpMock.match('/api/auth/status').forEach((r) =>
      r.flush({ authenticated: true, needsBootstrap: false, user: { id: 'u1', email: 'a@b.com', displayName: 'Test', workspaces: [] } })
    );
    httpMock.match(() => true).forEach((r) => r.flush({}));
  });

  it('should show toast error on wizard state load failure', () => {
    TestBed.resetTestingModule();
    setup({ resume: 'bad-id' });
    const httpMock = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(NewWorkspaceComponent);
    fixture.detectChanges();

    const req = httpMock.expectOne('/api/workspaces/bad-id/settings/wizard-state');
    req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(toastService.showError).toHaveBeenCalledWith('Not found');
    httpMock.verify();
  });

  it('should save wizard state after advancing steps when resuming', () => {
    TestBed.resetTestingModule();
    setup({ resume: 'tenant-123' });
    const httpMock = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(NewWorkspaceComponent);
    fixture.detectChanges();

    const wizardReq = httpMock.expectOne('/api/workspaces/tenant-123/settings/wizard-state');
    wizardReq.flush({
      currentStep: 1,
      completedSteps: [],
      formData: { general: { workspaceName: 'Test WS' } },
    });
    fixture.detectChanges();

    // Advance from step 1 to 2
    fixture.componentInstance.currentStep.set(1);
    fixture.componentInstance.onNext();
    fixture.detectChanges();

    const saveReq = httpMock.expectOne('/api/workspaces/tenant-123/settings/wizard-state');
    expect(saveReq.request.method).toBe('PUT');
    expect(saveReq.request.body.currentStep).toBe(2);
    saveReq.flush({});
    httpMock.verify();
  });

  it('should not save wizard state when not resuming', () => {
    const httpMock = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(NewWorkspaceComponent);
    fixture.detectChanges();
    const formService = fixture.debugElement.injector.get(NewWorkspaceFormService);
    formService.workspaceName.set('Test');
    fixture.componentInstance.onNext();
    // Should only have no wizard-state PUT since no resume
    httpMock.expectNone('/api/workspaces');
  });

  it('should show finalize error toast when finalize fails', () => {
    TestBed.resetTestingModule();
    setup({ resume: 'tenant-err' });
    const httpMock = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(NewWorkspaceComponent);
    fixture.detectChanges();

    const wizardReq = httpMock.expectOne('/api/workspaces/tenant-err/settings/wizard-state');
    wizardReq.flush({ currentStep: 7, completedSteps: [1,2,3,4,5,6], formData: { general: { workspaceName: 'Err' } } });
    fixture.detectChanges();

    fixture.componentInstance.currentStep.set(7);
    fixture.detectChanges();
    fixture.componentInstance.onNext();
    fixture.detectChanges();

    // The component now saves wizard state before finalizing
    const saveReq = httpMock.expectOne('/api/workspaces/tenant-err/settings/wizard-state');
    saveReq.flush({});
    fixture.detectChanges();

    const finalReq = httpMock.expectOne('/api/workspaces/tenant-err/finalize');
    finalReq.flush({ message: 'Finalize failed' }, { status: 500, statusText: 'Error' });
    fixture.detectChanges();

    expect(fixture.componentInstance.isSubmitting()).toBe(false);
    expect(toastService.showError).toHaveBeenCalledWith('Finalize failed');
    httpMock.verify();
  });

  it('should still finalize even when wizard state save fails', () => {
    TestBed.resetTestingModule();
    setup({ resume: 'tenant-save-fail' });
    const httpMock = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(NewWorkspaceComponent);
    fixture.detectChanges();

    const wizardReq = httpMock.expectOne('/api/workspaces/tenant-save-fail/settings/wizard-state');
    wizardReq.flush({ currentStep: 7, completedSteps: [1,2,3,4,5,6], formData: { general: { workspaceName: 'SF' } } });
    fixture.detectChanges();

    fixture.componentInstance.currentStep.set(7);
    fixture.detectChanges();
    fixture.componentInstance.onNext();
    fixture.detectChanges();

    // Save fails
    const saveReq = httpMock.expectOne('/api/workspaces/tenant-save-fail/settings/wizard-state');
    saveReq.flush({}, { status: 500, statusText: 'Error' });
    fixture.detectChanges();

    // But finalize should still be called
    const finalReq = httpMock.expectOne('/api/workspaces/tenant-save-fail/finalize');
    expect(finalReq.request.method).toBe('POST');
    finalReq.flush({});

    httpMock.match('/api/auth/status').forEach((r) =>
      r.flush({ authenticated: true, needsBootstrap: false, user: { id: 'u1', email: 'a@b.com', displayName: 'Test', workspaces: [] } })
    );
    httpMock.match(() => true).forEach((r) => r.flush({}));
  });

  it('should block Next on step 2 with fewer than 2 objectives and surface the toast', () => {
    const fixture = TestBed.createComponent(NewWorkspaceComponent);
    fixture.detectChanges();
    const formService = fixture.debugElement.injector.get(NewWorkspaceFormService);
    formService.workspaceName.set('WS');
    formService.updateObjective(formService.businessObjectives()[0].id, 'statement', 'Just one');
    fixture.componentInstance.currentStep.set(2);
    fixture.detectChanges();

    fixture.componentInstance.onNext();

    expect(toastService.showError).toHaveBeenCalledWith(
      'At least 2 objectives with a statement are required.',
    );
    expect(fixture.componentInstance.currentStep()).toBe(2);
  });
});
