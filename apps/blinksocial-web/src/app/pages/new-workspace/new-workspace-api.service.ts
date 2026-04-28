import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  CreateWorkspaceRequestContract,
  CreateWorkspaceResponseContract,
  WizardStateContract,
  GeneratePositioningStatementRequestContract,
  GeneratePositioningStatementResponseContract,
  SuggestBusinessObjectivesRequestContract,
  SuggestBusinessObjectivesResponseContract,
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

  generatePositioningStatement(
    request: GeneratePositioningStatementRequestContract
  ): Observable<GeneratePositioningStatementResponseContract> {
    return this.http.post<GeneratePositioningStatementResponseContract>(
      '/api/wizard-ai/positioning-statement',
      request
    );
  }

  suggestBusinessObjectives(
    request: SuggestBusinessObjectivesRequestContract
  ): Observable<SuggestBusinessObjectivesResponseContract> {
    return this.http.post<SuggestBusinessObjectivesResponseContract>(
      '/api/wizard-ai/business-objectives',
      request
    );
  }
}
