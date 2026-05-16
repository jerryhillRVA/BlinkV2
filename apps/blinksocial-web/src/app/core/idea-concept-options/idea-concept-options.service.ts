import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import type {
  IdeaConceptOptionsRequestContract,
  IdeaConceptOptionsResponseContract,
} from '@blinksocial/contracts';

/**
 * Client-side wrapper for `POST /api/idea-concept-options`. Called from the
 * Idea-detail screen's Generate Concept Options + Regenerate buttons. The
 * backend gates on `ANTHROPIC_API_KEY`; when unset it returns the ported
 * SEEDS table so dev / e2e environments keep working unchanged.
 */
@Injectable({ providedIn: 'root' })
export class IdeaConceptOptionsApiService {
  private readonly http = inject(HttpClient);

  generate(
    request: IdeaConceptOptionsRequestContract,
  ): Observable<IdeaConceptOptionsResponseContract> {
    return this.http
      .post<IdeaConceptOptionsResponseContract>(
        '/api/idea-concept-options',
        request,
      )
      .pipe(catchError((err: HttpErrorResponse) => throwError(() => err)));
  }
}
