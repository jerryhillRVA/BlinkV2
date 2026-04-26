import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CalendarApiService } from './calendar-api.service';
import type { CalendarResponseContract } from '@blinksocial/contracts';

describe('CalendarApiService', () => {
  let service: CalendarApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CalendarApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('GETs /api/calendar/:workspaceId and returns typed response', () => {
    const body: CalendarResponseContract = {
      workspaceId: 'hive-collective',
      referenceDate: '2026-05-01T00:00:00.000Z',
      items: [],
      milestones: [],
    };
    let received: CalendarResponseContract | null = null;
    service.getCalendar('hive-collective').subscribe((r) => (received = r));
    const req = httpMock.expectOne('/api/calendar/hive-collective');
    expect(req.request.method).toBe('GET');
    req.flush(body);
    expect(received).toEqual(body);
  });

  it('URL-encodes the workspace id', () => {
    service.getCalendar('weird id/2').subscribe();
    httpMock.expectOne('/api/calendar/weird%20id%2F2').flush({
      workspaceId: 'weird id/2',
      referenceDate: '2026-05-01T00:00:00.000Z',
      items: [],
      milestones: [],
    });
  });
});
