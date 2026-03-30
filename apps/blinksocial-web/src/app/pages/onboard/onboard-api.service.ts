import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  CreateSessionRequestContract,
  CreateSessionResponseContract,
  SendMessageResponseContract,
  GetSessionResponseContract,
  GenerateBlueprintResponseContract,
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

  sendMessage(
    sessionId: string,
    content: string,
  ): Observable<SendMessageResponseContract> {
    return this.http.post<SendMessageResponseContract>(
      `/api/onboarding/sessions/${sessionId}/messages`,
      { content },
    );
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
}
