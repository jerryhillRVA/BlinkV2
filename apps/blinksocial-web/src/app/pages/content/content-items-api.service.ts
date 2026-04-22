import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  ContentItemContract,
  ContentItemsIndexContract,
  ContentItemsArchiveIndexContract,
  CreateContentItemRequestContract,
  UpdateContentItemRequestContract,
} from '@blinksocial/contracts';

@Injectable({ providedIn: 'root' })
export class ContentItemsApiService {
  private readonly http = inject(HttpClient);

  getIndex(workspaceId: string): Observable<ContentItemsIndexContract> {
    return this.http.get<ContentItemsIndexContract>(
      `/api/workspaces/${workspaceId}/content-items/index`,
    );
  }

  getArchiveIndex(
    workspaceId: string,
  ): Observable<ContentItemsArchiveIndexContract> {
    return this.http.get<ContentItemsArchiveIndexContract>(
      `/api/workspaces/${workspaceId}/content-items/archive-index`,
    );
  }

  getItem(
    workspaceId: string,
    itemId: string,
  ): Observable<ContentItemContract> {
    return this.http.get<ContentItemContract>(
      `/api/workspaces/${workspaceId}/content-items/${itemId}`,
    );
  }

  createItem(
    workspaceId: string,
    payload: CreateContentItemRequestContract,
  ): Observable<ContentItemContract> {
    return this.http.post<ContentItemContract>(
      `/api/workspaces/${workspaceId}/content-items`,
      payload,
    );
  }

  updateItem(
    workspaceId: string,
    itemId: string,
    patch: UpdateContentItemRequestContract,
  ): Observable<ContentItemContract> {
    return this.http.put<ContentItemContract>(
      `/api/workspaces/${workspaceId}/content-items/${itemId}`,
      patch,
    );
  }

  archiveItem(
    workspaceId: string,
    itemId: string,
  ): Observable<ContentItemContract> {
    return this.http.post<ContentItemContract>(
      `/api/workspaces/${workspaceId}/content-items/${itemId}/archive`,
      {},
    );
  }

  unarchiveItem(
    workspaceId: string,
    itemId: string,
  ): Observable<ContentItemContract> {
    return this.http.post<ContentItemContract>(
      `/api/workspaces/${workspaceId}/content-items/${itemId}/unarchive`,
      {},
    );
  }

  deleteItem(
    workspaceId: string,
    itemId: string,
  ): Observable<{ deleted: true; id: string }> {
    return this.http.delete<{ deleted: true; id: string }>(
      `/api/workspaces/${workspaceId}/content-items/${itemId}`,
    );
  }
}
