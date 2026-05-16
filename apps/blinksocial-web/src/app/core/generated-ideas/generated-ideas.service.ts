import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import type {
  GenerateIdeasRequestContract,
  GenerateIdeasResponseContract,
} from '@blinksocial/contracts';

/**
 * Client-side wrapper for `POST /api/generated-ideas`. Called from the
 * Create-Idea drawer's Generate Ideas button. The backend gates on
 * `ANTHROPIC_API_KEY`; when unset it returns server-owned stub seeds so
 * dev / e2e environments keep working unchanged.
 */
@Injectable({ providedIn: 'root' })
export class GeneratedIdeasApiService {
  private readonly http = inject(HttpClient);

  generate(
    request: GenerateIdeasRequestContract,
  ): Observable<GenerateIdeasResponseContract> {
    return this.http
      .post<GenerateIdeasResponseContract>('/api/generated-ideas', request)
      .pipe(catchError((err: HttpErrorResponse) => throwError(() => err)));
  }
}
