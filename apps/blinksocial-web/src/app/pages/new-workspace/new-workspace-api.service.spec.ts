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
        globalRules: { defaultPlatform: 'youtube' as never, maxIdeasPerMonth: 10 },
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
});
