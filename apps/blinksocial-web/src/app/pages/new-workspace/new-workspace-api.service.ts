import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  CreateWorkspaceRequestContract,
  CreateWorkspaceResponseContract,
} from '@blinksocial/contracts';

@Injectable({ providedIn: 'root' })
export class NewWorkspaceApiService {
  private readonly http = inject(HttpClient);

  createWorkspace(
    request: CreateWorkspaceRequestContract
  ): Observable<CreateWorkspaceResponseContract> {
    return this.http.post<CreateWorkspaceResponseContract>('/api/workspaces', request);
  }
}
