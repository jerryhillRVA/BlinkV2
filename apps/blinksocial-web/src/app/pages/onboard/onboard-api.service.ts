import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  CreateSessionRequestContract,
  CreateSessionResponseContract,
  SendMessageResponseContract,
  GetSessionResponseContract,
  GenerateBlueprintResponseContract,
  CreateWorkspaceFromBlueprintResponseContract,
} from '@blinksocial/contracts';

@Injectable({ providedIn: 'root' })
export class OnboardApiService {
  private readonly http = inject(HttpClient);

  createSession(
    data?: CreateSessionRequestContract,
  ): Observable<CreateSessionResponseContract> {
    return this.http.post<CreateSessionResponseContract>(
      '/api/onboarding/sessions',
      data ?? {},
    );
  }

  /**
   * Send a chat turn. When `files?.length > 0`, the request is encoded as
   * `multipart/form-data` (browser sets the Content-Type + boundary
   * automatically when we hand HttpClient a `FormData` body); otherwise the
   * existing JSON path is used so older callers and tests stay green.
   */
  sendMessage(
    sessionId: string,
    content: string,
    files?: File[],
  ): Observable<SendMessageResponseContract> {
    const url = `/api/onboarding/sessions/${sessionId}/messages`;
    if (files && files.length > 0) {
      const formData = new FormData();
      formData.append('content', content);
      for (const file of files) {
        formData.append('files', file, file.name);
      }
      return this.http.post<SendMessageResponseContract>(url, formData);
    }
    return this.http.post<SendMessageResponseContract>(url, { content });
  }

  getSession(sessionId: string): Observable<GetSessionResponseContract> {
    return this.http.get<GetSessionResponseContract>(
      `/api/onboarding/sessions/${sessionId}`,
    );
  }

  generateBlueprint(
    sessionId: string,
  ): Observable<GenerateBlueprintResponseContract> {
    return this.http.post<GenerateBlueprintResponseContract>(
      `/api/onboarding/sessions/${sessionId}/generate`,
      {},
    );
  }

  createWorkspaceFromBlueprint(
    sessionId: string,
  ): Observable<CreateWorkspaceFromBlueprintResponseContract> {
    return this.http.post<CreateWorkspaceFromBlueprintResponseContract>(
      `/api/onboarding/sessions/${sessionId}/create-workspace`,
      {},
    );
  }

  resumeSession(
    tenantId: string,
  ): Observable<GetSessionResponseContract> {
    return this.http.get<GetSessionResponseContract>(
      `/api/onboarding/sessions/by-workspace/${tenantId}`,
    );
  }
}
