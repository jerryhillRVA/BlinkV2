import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withFetch } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import type { ConceptDraftSnapshotContract } from '@blinksocial/contracts';
import { ConceptDraftApiService } from './concept-draft-api.service';

const SNAPSHOT: ConceptDraftSnapshotContract = {
  title: 'Why teams need rituals',
  objective: 'engagement',
  pillarIds: [],
  segmentIds: [],
};

describe('ConceptDraftApiService', () => {
  let service: ConceptDraftApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withFetch()),
        provideHttpClientTesting(),
        ConceptDraftApiService,
      ],
    });
    service = TestBed.inject(ConceptDraftApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('POSTs to /api/concept-draft with the workspaceId + draft envelope', () => {
    let result:
      | { description: string; hook: string; cta: unknown; pillarIdFallback: string | null; segmentIdsFallback: string[] }
      | undefined;
    service.generate('w1', SNAPSHOT).subscribe((d) => (result = d));

    const req = httpMock.expectOne('/api/concept-draft');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ workspaceId: 'w1', draft: SNAPSHOT });
    expect(req.request.withCredentials).toBe(true);

    req.flush({
      draft: {
        description: 'desc',
        hook: 'hook',
        cta: null,
        pillarIdFallback: null,
        segmentIdsFallback: [],
      },
    });

    expect(result?.description).toBe('desc');
    expect(result?.hook).toBe('hook');
  });

  it('unwraps the draft envelope on success', () => {
    let result: { cta: unknown } | undefined;
    service.generate('w1', SNAPSHOT).subscribe((d) => (result = d));
    httpMock.expectOne('/api/concept-draft').flush({
      draft: {
        description: 'd',
        hook: 'h',
        cta: { type: 'comment', text: 'go' },
        pillarIdFallback: 'p-1',
        segmentIdsFallback: ['s-1'],
      },
    });
    expect(result?.cta).toEqual({ type: 'comment', text: 'go' });
  });

  it('surfaces HTTP errors to subscribers', () => {
    let error: unknown;
    service.generate('w1', SNAPSHOT).subscribe({ error: (e) => (error = e) });
    const req = httpMock.expectOne('/api/concept-draft');
    req.flush({ message: 'nope' }, { status: 502, statusText: 'Bad Gateway' });
    expect(error).toBeTruthy();
  });

  it('includes bounds in the request body when provided', () => {
    service.generate('w1', SNAPSHOT, { descriptionMax: 400, hookMax: 120 }).subscribe();
    const req = httpMock.expectOne('/api/concept-draft');
    expect(req.request.body).toEqual({
      workspaceId: 'w1',
      draft: SNAPSHOT,
      bounds: { descriptionMax: 400, hookMax: 120 },
    });
    req.flush({ draft: { description: 'd', hook: 'h', cta: null, pillarIdFallback: null, segmentIdsFallback: [] } });
  });

  it('omits bounds from the request body when not provided', () => {
    service.generate('w1', SNAPSHOT).subscribe();
    const req = httpMock.expectOne('/api/concept-draft');
    expect(req.request.body).toEqual({ workspaceId: 'w1', draft: SNAPSHOT });
    req.flush({ draft: { description: 'd', hook: 'h', cta: null, pillarIdFallback: null, segmentIdsFallback: [] } });
  });
});
