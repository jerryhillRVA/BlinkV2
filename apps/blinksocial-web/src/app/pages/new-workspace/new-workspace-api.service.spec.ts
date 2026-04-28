import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { NewWorkspaceApiService } from './new-workspace-api.service';
import type { CreateWorkspaceRequestContract } from '@blinksocial/contracts';

describe('NewWorkspaceApiService', () => {
  let service: NewWorkspaceApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(NewWorkspaceApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should POST to /api/workspaces', () => {
    const request: CreateWorkspaceRequestContract = {
      general: { workspaceName: 'Test' },
      platforms: {
        globalRules: { maxIdeasPerMonth: 10 },
        platforms: [],
      },
      brandVoice: {},
      contentPillars: [],
      audienceSegments: [],
      skills: { skills: [] },
    };

    service.createWorkspace(request).subscribe((res) => {
      expect(res.workspaceName).toBe('Test');
    });

    const req = httpMock.expectOne('/api/workspaces');
    expect(req.request.method).toBe('POST');
    req.flush({ id: '123', workspaceName: 'Test', status: 'active', createdAt: '2026-01-01' });
  });

  it('should GET wizard state', () => {
    service.getWizardState('ws-123').subscribe((res) => {
      expect(res.currentStep).toBe(2);
    });

    const req = httpMock.expectOne('/api/workspaces/ws-123/settings/wizard-state');
    expect(req.request.method).toBe('GET');
    req.flush({ currentStep: 2, completedSteps: [1], formData: {} });
  });

  it('should PUT wizard state', () => {
    const state = { currentStep: 3, completedSteps: [1, 2], formData: {} };
    service.saveWizardState('ws-123', state).subscribe();

    const req = httpMock.expectOne('/api/workspaces/ws-123/settings/wizard-state');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.currentStep).toBe(3);
    req.flush({});
  });

  it('should POST finalize workspace', () => {
    service.finalizeWorkspace('ws-123').subscribe();

    const req = httpMock.expectOne('/api/workspaces/ws-123/finalize');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('should POST positioning-statement to wizard-ai endpoint', () => {
    let result: { positioningStatement: string } | undefined;
    service
      .generatePositioningStatement({ targetCustomer: 'Devs' })
      .subscribe((res) => (result = res));

    const req = httpMock.expectOne('/api/wizard-ai/positioning-statement');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ targetCustomer: 'Devs' });
    req.flush({ positioningStatement: 'Hi' });
    expect(result?.positioningStatement).toBe('Hi');
  });

  it('should POST business-objectives to wizard-ai endpoint', () => {
    let result: { suggestions: unknown[] } | undefined;
    service
      .suggestBusinessObjectives({ workspaceName: 'WS' })
      .subscribe((res) => (result = res));

    const req = httpMock.expectOne('/api/wizard-ai/business-objectives');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ workspaceName: 'WS' });
    req.flush({ suggestions: [] });
    expect(result?.suggestions).toEqual([]);
  });
});
