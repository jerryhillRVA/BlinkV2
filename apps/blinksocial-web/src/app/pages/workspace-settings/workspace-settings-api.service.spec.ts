import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { WorkspaceSettingsApiService } from './workspace-settings-api.service';

describe('WorkspaceSettingsApiService', () => {
  let service: WorkspaceSettingsApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(WorkspaceSettingsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should GET settings for a workspace tab', () => {
    service.getSettings('hive-collective', 'general').subscribe((res) => {
      expect(res).toEqual({ workspaceName: 'Hive Collective' });
    });

    const req = httpMock.expectOne('/api/workspaces/hive-collective/settings/general');
    expect(req.request.method).toBe('GET');
    req.flush({ workspaceName: 'Hive Collective' });
  });

  it('should PUT settings for a workspace tab', () => {
    const data = { workspaceName: 'Updated' };
    service.saveSettings('hive-collective', 'general', data).subscribe((res) => {
      expect(res).toEqual(data);
    });

    const req = httpMock.expectOne('/api/workspaces/hive-collective/settings/general');
    expect(req.request.method).toBe('PUT');
    req.flush(data);
  });

  it('should GET namespace entities', () => {
    service.getNamespaceEntities('hive-collective', 'research-sources').subscribe((res) => {
      expect(res).toEqual([{ id: 'rs-1' }]);
    });

    const req = httpMock.expectOne('/api/workspaces/hive-collective/research-sources');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 'rs-1' }]);
  });

  it('should PUT namespace entities', () => {
    const data = [{ id: 'rs-1' }];
    service.saveNamespaceEntities('hive-collective', 'research-sources', data).subscribe((res) => {
      expect(res).toEqual(data);
    });

    const req = httpMock.expectOne('/api/workspaces/hive-collective/research-sources');
    expect(req.request.method).toBe('PUT');
    req.flush(data);
  });

  it('should GET namespace aggregate', () => {
    service.getNamespaceAggregate('hive-collective', 'content-mix').subscribe((res) => {
      expect(res).toEqual({ targets: [] });
    });

    const req = httpMock.expectOne('/api/workspaces/hive-collective/content-mix');
    expect(req.request.method).toBe('GET');
    req.flush({ targets: [] });
  });

  it('should PUT namespace aggregate', () => {
    const data = { targets: [{ category: 'educational', targetPercent: 30 }] };
    service.saveNamespaceAggregate('hive-collective', 'content-mix', data).subscribe((res) => {
      expect(res).toEqual(data);
    });

    const req = httpMock.expectOne('/api/workspaces/hive-collective/content-mix');
    expect(req.request.method).toBe('PUT');
    req.flush(data);
  });
});
