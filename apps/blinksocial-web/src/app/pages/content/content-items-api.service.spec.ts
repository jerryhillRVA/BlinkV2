import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ContentItemsApiService } from './content-items-api.service';

describe('ContentItemsApiService', () => {
  let service: ContentItemsApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ContentItemsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('GET index', () => {
    service.getIndex('ws-1').subscribe();
    const req = httpMock.expectOne('/api/workspaces/ws-1/content-items/index');
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], totalCount: 0, lastUpdated: '' });
  });

  it('GET archive-index', () => {
    service.getArchiveIndex('ws-1').subscribe();
    const req = httpMock.expectOne(
      '/api/workspaces/ws-1/content-items/archive-index',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], totalCount: 0, lastUpdated: '' });
  });

  it('GET single item', () => {
    service.getItem('ws-1', 'c-1').subscribe();
    const req = httpMock.expectOne('/api/workspaces/ws-1/content-items/c-1');
    expect(req.request.method).toBe('GET');
    req.flush({ id: 'c-1' });
  });

  it('POST create', () => {
    service
      .createItem('ws-1', {
        stage: 'idea',
        status: 'draft',
        title: 'X',
      })
      .subscribe();
    const req = httpMock.expectOne('/api/workspaces/ws-1/content-items');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toMatchObject({ title: 'X' });
    req.flush({ id: 'c-new' });
  });

  it('PUT update', () => {
    service.updateItem('ws-1', 'c-1', { title: 'Y' }).subscribe();
    const req = httpMock.expectOne('/api/workspaces/ws-1/content-items/c-1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ title: 'Y' });
    req.flush({ id: 'c-1' });
  });

  it('POST archive', () => {
    service.archiveItem('ws-1', 'c-1').subscribe();
    const req = httpMock.expectOne(
      '/api/workspaces/ws-1/content-items/c-1/archive',
    );
    expect(req.request.method).toBe('POST');
    req.flush({ id: 'c-1', archived: true });
  });

  it('POST unarchive', () => {
    service.unarchiveItem('ws-1', 'c-1').subscribe();
    const req = httpMock.expectOne(
      '/api/workspaces/ws-1/content-items/c-1/unarchive',
    );
    expect(req.request.method).toBe('POST');
    req.flush({ id: 'c-1', archived: false });
  });

  it('DELETE item', () => {
    service.deleteItem('ws-1', 'c-1').subscribe();
    const req = httpMock.expectOne('/api/workspaces/ws-1/content-items/c-1');
    expect(req.request.method).toBe('DELETE');
    req.flush({ deleted: true, id: 'c-1' });
  });
});
