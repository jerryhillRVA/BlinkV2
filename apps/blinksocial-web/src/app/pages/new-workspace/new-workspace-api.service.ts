import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  CreateWorkspaceRequestContract,
  CreateWorkspaceResponseContract,
  WizardStateContract,
} from '@blinksocial/contracts';

@Injectable({ providedIn: 'root' })
export class NewWorkspaceApiService {
  private readonly http = inject(HttpClient);

  createWorkspace(
    request: CreateWorkspaceRequestContract
  ): Observable<CreateWorkspaceResponseContract> {
    return this.http.post<CreateWorkspaceResponseContract>('/api/workspaces', request);
  }

  getWizardState(
    workspaceId: string
  ): Observable<WizardStateContract> {
    return this.http.get<WizardStateContract>(
      `/api/workspaces/${workspaceId}/settings/wizard-state`
    );
  }

  saveWizardState(
    workspaceId: string,
    state: WizardStateContract
  ): Observable<unknown> {
    return this.http.put(
      `/api/workspaces/${workspaceId}/settings/wizard-state`,
      state
    );
  }

  finalizeWorkspace(
    workspaceId: string
  ): Observable<unknown> {
    return this.http.post(
      `/api/workspaces/${workspaceId}/finalize`,
      {}
    );
  }
}
