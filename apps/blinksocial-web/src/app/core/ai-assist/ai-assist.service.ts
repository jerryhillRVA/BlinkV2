import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import type {
  AiAssistRequestContract,
  AiAssistResponseContract,
} from '@blinksocial/contracts';

/**
 * Single client-side entrypoint for every AI Assist button across the
 * content editor. The backend gates on `ANTHROPIC_API_KEY`; when it's
 * unset the same endpoint returns ported stub copy so dev / e2e
 * environments keep working without any code branching.
 */
@Injectable({ providedIn: 'root' })
export class AiAssistApiService {
  private readonly http = inject(HttpClient);

  assist(
    request: AiAssistRequestContract,
  ): Observable<AiAssistResponseContract> {
    return this.http
      .post<AiAssistResponseContract>('/api/ai-assist', request)
      .pipe(catchError((err: HttpErrorResponse) => throwError(() => err)));
  }
}
