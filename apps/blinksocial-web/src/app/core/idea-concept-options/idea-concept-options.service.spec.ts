import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withFetch } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { IdeaConceptOptionsApiService } from './idea-concept-options.service';

describe('IdeaConceptOptionsApiService', () => {
  let service: IdeaConceptOptionsApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withFetch()),
        provideHttpClientTesting(),
        IdeaConceptOptionsApiService,
      ],
    });
    service = TestBed.inject(IdeaConceptOptionsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('POSTs to /api/idea-concept-options with the request body', () => {
    let result: { options: unknown[] } | undefined;
    service
      .generate({ workspaceId: 'w1', refId: 'i-1' })
      .subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/idea-concept-options');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ workspaceId: 'w1', refId: 'i-1' });
    req.flush({ options: [{ id: 'opt-1' }] });
    expect(result?.options).toHaveLength(1);
  });

  it('surfaces HTTP errors to subscribers', () => {
    let error: unknown;
    service
      .generate({ workspaceId: 'w1', refId: 'i-1' })
      .subscribe({ error: (e) => (error = e) });
    const req = httpMock.expectOne('/api/idea-concept-options');
    req.flush({ message: 'nope' }, { status: 502, statusText: 'Bad Gateway' });
    expect(error).toBeTruthy();
  });
});
