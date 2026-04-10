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

  getNamespaceEntities<T>(workspaceId: string, namespace: string): Observable<T[]> {
    return this.http.get<T[]>(`/api/workspaces/${workspaceId}/${namespace}`);
  }

  saveNamespaceEntities<T>(workspaceId: string, namespace: string, data: T[]): Observable<T[]> {
    return this.http.put<T[]>(`/api/workspaces/${workspaceId}/${namespace}`, data);
  }

  getNamespaceAggregate<T>(workspaceId: string, path: string): Observable<T> {
    return this.http.get<T>(`/api/workspaces/${workspaceId}/${path}`);
  }

  saveNamespaceAggregate<T>(workspaceId: string, path: string, data: T): Observable<T> {
    return this.http.put<T>(`/api/workspaces/${workspaceId}/${path}`, data);
  }
}
