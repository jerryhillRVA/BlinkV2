import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import type {
  ConceptDraftBoundsContract,
  ConceptDraftContract,
  ConceptDraftRequestContract,
  ConceptDraftResponseContract,
  ConceptDraftSnapshotContract,
} from '@blinksocial/contracts';

/**
 * Client-side wrapper for `POST /api/concept-draft`. Called from the
 * Create Concept drawer's "Generate with AI" button. The backend gates on
 * `ANTHROPIC_API_KEY`; when unset it returns deterministic stub values
 * built from the (now server-side) ported lookup tables, so dev / e2e
 * environments keep working unchanged.
 *
 * The optional `bounds` argument carries the form's
 * `DESCRIPTION_MAX_CHARS` / `HOOK_MAX_CHARS` validators down to the
 * skill so the LLM's output fits the field without the user having to
 * manually trim before clicking Save.
 */
@Injectable({ providedIn: 'root' })
export class ConceptDraftApiService {
  private readonly http = inject(HttpClient);

  generate(
    workspaceId: string,
    snapshot: ConceptDraftSnapshotContract,
    bounds?: ConceptDraftBoundsContract,
  ): Observable<ConceptDraftContract> {
    const body: ConceptDraftRequestContract = bounds
      ? { workspaceId, draft: snapshot, bounds }
      : { workspaceId, draft: snapshot };
    return this.http
      .post<ConceptDraftResponseContract>('/api/concept-draft', body, {
        withCredentials: true,
      })
      .pipe(
        map((res) => res.draft),
        catchError((err: HttpErrorResponse) => throwError(() => err)),
      );
  }
}
