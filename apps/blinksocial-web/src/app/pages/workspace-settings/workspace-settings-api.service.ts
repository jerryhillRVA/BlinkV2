import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WorkspaceSettingsApiService {
  private readonly http = inject(HttpClient);

  getSettings<T>(workspaceId: string, tab: string): Observable<T> {
    return this.http.get<T>(`/api/workspaces/${workspaceId}/settings/${tab}`);
  }

  saveSettings<T>(workspaceId: string, tab: string, data: T): Observable<T> {
    return this.http.put<T>(`/api/workspaces/${workspaceId}/settings/${tab}`, data);
  }
}
