import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { ListWorkspacesResponseContract } from '@blinksocial/contracts';

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly http = inject(HttpClient);

  listWorkspaces(): Observable<ListWorkspacesResponseContract> {
    return this.http.get<ListWorkspacesResponseContract>('/api/workspaces');
  }
}
