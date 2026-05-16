import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withFetch } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { GeneratedIdeasApiService } from './generated-ideas.service';

describe('GeneratedIdeasApiService', () => {
  let service: GeneratedIdeasApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withFetch()),
        provideHttpClientTesting(),
        GeneratedIdeasApiService,
      ],
    });
    service = TestBed.inject(GeneratedIdeasApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('POSTs to /api/generated-ideas with the request body', () => {
    let result: { ideas: unknown[] } | undefined;
    service
      .generate({ workspaceId: 'w1', pillarIds: ['p-1', 'p-2'] })
      .subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/generated-ideas');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      workspaceId: 'w1',
      pillarIds: ['p-1', 'p-2'],
    });
    req.flush({ ideas: [{ id: 'gi-1' }] });
    expect(result?.ideas).toHaveLength(1);
  });

  it('surfaces HTTP errors to subscribers', () => {
    let error: unknown;
    service
      .generate({ workspaceId: 'w1', pillarIds: ['p-1'] })
      .subscribe({ error: (e) => (error = e) });
    const req = httpMock.expectOne('/api/generated-ideas');
    req.flush({ message: 'nope' }, { status: 502, statusText: 'Bad Gateway' });
    expect(error).toBeTruthy();
  });
});
