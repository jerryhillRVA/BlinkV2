import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DashboardApiService } from './dashboard-api.service';

describe('DashboardApiService', () => {
  let service: DashboardApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        DashboardApiService,
      ],
    });
    service = TestBed.inject(DashboardApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should GET /api/workspaces', () => {
    const mockResponse = {
      workspaces: [
        { id: 'test', name: 'Test', color: '#000', status: 'active', createdAt: '2026-01-01T00:00:00Z' },
      ],
    };

    service.listWorkspaces().subscribe((result) => {
      expect(result.workspaces).toHaveLength(1);
      expect(result.workspaces[0].name).toBe('Test');
    });

    const req = httpMock.expectOne('/api/workspaces');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});
