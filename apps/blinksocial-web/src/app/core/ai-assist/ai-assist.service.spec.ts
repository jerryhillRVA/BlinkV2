import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withFetch } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { AiAssistApiService } from './ai-assist.service';

describe('AiAssistApiService', () => {
  let service: AiAssistApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withFetch()),
        provideHttpClientTesting(),
        AiAssistApiService,
      ],
    });
    service = TestBed.inject(AiAssistApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('POSTs to /api/ai-assist with the request body and returns the response', () => {
    let result: { values: string[] } | undefined;
    service
      .assist({
        scope: 'content-item',
        workspaceId: 'w1',
        refId: 'c-1',
        field: 'concept-description',
      })
      .subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/ai-assist');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      scope: 'content-item',
      workspaceId: 'w1',
      refId: 'c-1',
      field: 'concept-description',
    });
    req.flush({ values: ['ok'] });
    expect(result).toEqual({ values: ['ok'] });
  });

  it('surfaces HTTP errors to subscribers', () => {
    let error: unknown;
    service
      .assist({
        scope: 'content-item',
        workspaceId: 'w1',
        refId: 'c-1',
        field: 'concept-description',
      })
      .subscribe({ error: (e) => (error = e) });
    const req = httpMock.expectOne('/api/ai-assist');
    req.flush({ message: 'nope' }, { status: 502, statusText: 'Bad Gateway' });
    expect(error).toBeTruthy();
  });
});
