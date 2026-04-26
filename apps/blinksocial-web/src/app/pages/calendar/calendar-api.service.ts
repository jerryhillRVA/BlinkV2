import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { CalendarResponseContract } from '@blinksocial/contracts';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CalendarApiService {
  private readonly http = inject(HttpClient);

  getCalendar(workspaceId: string): Observable<CalendarResponseContract> {
    return this.http.get<CalendarResponseContract>(
      `/api/calendar/${encodeURIComponent(workspaceId)}`,
    );
  }
}
