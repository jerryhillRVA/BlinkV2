import { Injectable, inject, signal, computed } from '@angular/core';
import { forkJoin, catchError, of, Observable, map, tap, shareReplay } from 'rxjs';
import { WorkspaceSettingsApiService } from '../workspace-settings/workspace-settings-api.service';
import { ContentItemsApiService } from './content-items-api.service';
import { MockDataService } from '../../core/mock-data/mock-data.service';
import type {
  ContentItemContract,
  ContentItemsIndexEntryContract,
  ContentItemsIndexContract,
  ContentItemsArchiveIndexContract,
  CreateContentItemRequestContract,
  UpdateContentItemRequestContract,
  ContentPillarContract,
  AudienceSegmentContract,
  BrandVoiceSettingsContract,
  BusinessObjectiveContract,
} from '@blinksocial/contracts';
import type {
  ContentItem,
  ContentPillar,
  AudienceSegment,
  ContentStatus,
  ContentStage,
  ContentView,
} from './content.types';
import { getMockDataForWorkspace } from './content.mock-data';

function indexEntryToItem(entry: ContentItemsIndexEntryContract): ContentItem {
  return {
    id: entry.id,
    stage: entry.stage,
    status: entry.status,
    title: entry.title,
    description: '',
    pillarIds: entry.pillarIds ?? [],
    segmentIds: entry.segmentIds ?? [],
    platform: entry.platform ?? undefined,
    contentType: entry.contentType ?? undefined,
    owner: entry.owner ?? undefined,
    parentIdeaId: entry.parentIdeaId ?? undefined,
    parentConceptId: entry.parentConceptId ?? undefined,
    scheduledDate: entry.scheduledDate ?? undefined,
    archived: entry.archived ?? false,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

function itemToIndexEntry(
  item: ContentItem,
): ContentItemsIndexEntryContract {
  return {
    id: item.id,
    stage: item.stage,
    status: item.status,
    title: item.title,
    platform: item.platform ?? null,
    contentType: item.contentType ?? null,
    pillarIds: item.pillarIds ?? [],
    segmentIds: item.segmentIds ?? [],
    owner: item.owner ?? null,
    parentIdeaId: item.parentIdeaId ?? null,
    parentConceptId: item.parentConceptId ?? null,
    scheduledDate: item.scheduledDate ?? null,
    archived: item.archived ?? false,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

@Injectable()
export class ContentStateService {
  private readonly api = inject(WorkspaceSettingsApiService);
  private readonly itemsApi = inject(ContentItemsApiService);
  private readonly mockData = inject(MockDataService);

  readonly workspaceId = signal('');
  readonly loading = signal(false);
  readonly saving = signal(false);

  readonly indexEntries = signal<ContentItemsIndexEntryContract[]>([]);
  readonly archiveIndexEntries = signal<ContentItemsIndexEntryContract[]>([]);
  private readonly fullItemCacheSignal = signal<Record<string, ContentItem>>({});
  private archiveLoaded = false;

  readonly pillars = signal<ContentPillar[]>([]);
  readonly segments = signal<AudienceSegment[]>([]);
  readonly businessObjectives = signal<BusinessObjectiveContract[]>([]);

  /** Unified view merging lean rows + full cached items (full wins). */
  readonly items = computed<ContentItem[]>(() => {
    const cache = this.fullItemCacheSignal();
    const merged: ContentItem[] = [];
    const seen = new Set<string>();
    for (const entry of this.indexEntries()) {
      const full = cache[entry.id];
      merged.push(full ?? indexEntryToItem(entry));
      seen.add(entry.id);
    }
    for (const entry of this.archiveIndexEntries()) {
      if (seen.has(entry.id)) continue;
      const full = cache[entry.id];
      merged.push(full ?? indexEntryToItem(entry));
      seen.add(entry.id);
    }
    // Surface any cache-only items that aren't in either index yet (optimistic creates)
    for (const id of Object.keys(cache)) {
      if (!seen.has(id)) merged.push(cache[id]);
    }
    return merged;
  });

  /** Active items — backed by the primary index only. */
  readonly activeItems = computed<ContentItem[]>(() => {
    const cache = this.fullItemCacheSignal();
    return this.indexEntries().map(
      (entry) => cache[entry.id] ?? indexEntryToItem(entry),
    );
  });

  /** Archived items — backed by the archive index only. */
  readonly archivedItems = computed<ContentItem[]>(() => {
    const cache = this.fullItemCacheSignal();
    return this.archiveIndexEntries().map(
      (entry) => cache[entry.id] ?? indexEntryToItem(entry),
    );
  });

  readonly stepCounts = computed<Record<ContentView, number>>(() => {
    const all = this.items();
    return {
      overview: all.length,
      strategy: 0,
      production: all.filter(
        (i) =>
          i.status === 'in-progress' ||
          (i.stage === 'concept' && i.status === 'draft'),
      ).length,
      review:
        all.filter((i) => i.status === 'review').length +
        all.filter((i) => i.status === 'scheduled').length,
      performance: all.filter((i) => i.status === 'published').length,
    };
  });

  loadAll(workspaceId: string): void {
    this.workspaceId.set(workspaceId);
    this.loading.set(true);
    this.archiveLoaded = false;

    forkJoin({
      index: this.itemsApi.getIndex(workspaceId).pipe(
        catchError(() => of<ContentItemsIndexContract | null>(null)),
      ),
      brandVoice: this.api
        .getSettings<
          BrandVoiceSettingsContract & {
            contentPillars?: ContentPillarContract[];
            audienceSegments?: AudienceSegmentContract[];
          }
        >(workspaceId, 'brand-voice')
        .pipe(catchError(() => of(null))),
      objectives: this.api
        .getSettings<BusinessObjectiveContract[]>(workspaceId, 'business-objectives')
        .pipe(catchError(() => of<BusinessObjectiveContract[]>([]))),
    }).subscribe({
      next: (data) => {
        const mock = getMockDataForWorkspace(workspaceId);

        if (data.index === null) {
          // Call failed — graceful fallback to mock data for a visible UI.
          const activeMocks = mock.items.filter((i) => !i.archived);
          const archivedMocks = mock.items.filter((i) => !!i.archived);
          this.indexEntries.set(activeMocks.map(itemToIndexEntry));
          this.archiveIndexEntries.set(archivedMocks.map(itemToIndexEntry));
          this.fullItemCacheSignal.set(
            Object.fromEntries(mock.items.map((i) => [i.id, i])),
          );
        } else {
          // Trust the API. Backend delegates to MockDataService for
          // hive-collective / booze-kills when AGENTIC_FS_URL is unset;
          // empty response = legitimately empty for configured workspaces.
          this.indexEntries.set(data.index.items);
          this.archiveIndexEntries.set([]);
          if (data.index.items.length > 0) {
            this.mockData.markReal('content-items');
          }
        }

        // Pillars and segments come from brand-voice if the API returned them.
        // Only fall back to mock when brand-voice returned nothing (e.g., AFS
        // unreachable for a configured workspace).
        const apiPillars = data.brandVoice?.contentPillars ?? [];
        this.pillars.set(
          apiPillars.length > 0
            ? apiPillars.map((p) => ({
                id: p.id,
                name: p.name,
                description: p.description,
                color: p.color,
              }))
            : mock.pillars,
        );

        const apiSegments = data.brandVoice?.audienceSegments ?? [];
        this.segments.set(
          apiSegments.length > 0
            ? apiSegments.map((s) => ({
                id: s.id,
                name: s.name,
                description: s.description ?? '',
              }))
            : mock.segments,
        );

        this.businessObjectives.set(data.objectives ?? []);

        this.loading.set(false);
      },
      error: () => {
        const mock = getMockDataForWorkspace(workspaceId);
        const activeMocks = mock.items.filter((i) => !i.archived);
        const archivedMocks = mock.items.filter((i) => !!i.archived);
        this.indexEntries.set(activeMocks.map(itemToIndexEntry));
        this.archiveIndexEntries.set(archivedMocks.map(itemToIndexEntry));
        this.fullItemCacheSignal.set(
          Object.fromEntries(mock.items.map((i) => [i.id, i])),
        );
        this.pillars.set(mock.pillars);
        this.segments.set(mock.segments);
        this.businessObjectives.set([]);
        this.loading.set(false);
      },
    });
  }

  loadArchiveIndex(): void {
    if (this.archiveLoaded) return;
    const workspaceId = this.workspaceId();
    if (!workspaceId) return;
    this.itemsApi
      .getArchiveIndex(workspaceId)
      .pipe(
        catchError(() =>
          of<ContentItemsArchiveIndexContract>({
            items: [],
            totalCount: 0,
            lastUpdated: '',
          }),
        ),
      )
      .subscribe((data) => {
        this.archiveIndexEntries.set(data.items);
        this.archiveLoaded = true;
      });
  }

  loadFullItem(itemId: string): void {
    const workspaceId = this.workspaceId();
    if (!workspaceId || !itemId) return;
    if (this.fullItemCacheSignal()[itemId]) return;
    this.itemsApi
      .getItem(workspaceId, itemId)
      .pipe(catchError(() => of(null)))
      .subscribe((item) => {
        if (!item) return;
        this.cacheFullItem(item);
      });
  }

  saveItem(item: ContentItem): Observable<ContentItem> {
    const workspaceId = this.workspaceId();
    const existing =
      this.indexEntries().find((r) => r.id === item.id) ||
      this.archiveIndexEntries().find((r) => r.id === item.id) ||
      this.fullItemCacheSignal()[item.id];

    const source$ = existing
      ? this.itemsApi
          .updateItem(workspaceId, item.id, stripUneditable(item))
          .pipe(catchError(() => of(item)))
      : this.itemsApi
          .createItem(workspaceId, {
            ...(stripUneditable(item) as CreateContentItemRequestContract),
            stage: item.stage,
            status: item.status,
            title: item.title,
          })
          .pipe(catchError(() => of(item)));

    return this.share(source$.pipe(tap((saved) => this.applySavedItem(saved))));
  }

  deleteItem(id: string): Observable<{ deleted: true; id: string }> {
    const workspaceId = this.workspaceId();
    const source$ = this.itemsApi.deleteItem(workspaceId, id).pipe(
      catchError(() => of({ deleted: true as const, id })),
      tap(() => {
        this.indexEntries.update((rows) => rows.filter((r) => r.id !== id));
        this.archiveIndexEntries.update((rows) =>
          rows.filter((r) => r.id !== id),
        );
        this.fullItemCacheSignal.update((cache) => {
          const { [id]: _removed, ...rest } = cache;
          return rest;
        });
      }),
    );
    return this.share(source$);
  }

  updateStatus(id: string, status: ContentStatus): Observable<ContentItem> {
    const workspaceId = this.workspaceId();
    const source$ = this.itemsApi
      .updateItem(workspaceId, id, { status })
      .pipe(
        catchError(() => {
          const base =
            this.fullItemCacheSignal()[id] ??
            this.findIndexEntry(id);
          if (!base) return of<ContentItem | null>(null);
          return of({
            ...(base as ContentItem),
            status,
            updatedAt: new Date().toISOString(),
          } as ContentItem);
        }),
        map((saved) => saved as ContentItem),
        tap((saved) => saved && this.applySavedItem(saved)),
      );
    return this.share(source$);
  }

  advanceStage(id: string): Observable<ContentItem> {
    const workspaceId = this.workspaceId();
    const current =
      this.fullItemCacheSignal()[id] ?? this.findIndexEntry(id);
    const curStage = (current as ContentItem | null)?.stage;
    const nextStage: ContentStage | null =
      curStage === 'idea'
        ? 'concept'
        : curStage === 'concept'
          ? 'post'
          : null;
    if (!nextStage || !current) return of(current as ContentItem);
    const source$ = this.itemsApi
      .updateItem(workspaceId, id, { stage: nextStage })
      .pipe(
        catchError(() =>
          of({
            ...(current as ContentItem),
            stage: nextStage,
            updatedAt: new Date().toISOString(),
          } as ContentItem),
        ),
        tap((saved) => this.applySavedItem(saved)),
      );
    return this.share(source$);
  }

  archive(id: string): Observable<ContentItem> {
    const workspaceId = this.workspaceId();
    const source$ = this.itemsApi.archiveItem(workspaceId, id).pipe(
      catchError(() => {
        const base =
          this.fullItemCacheSignal()[id] ??
          this.findIndexEntry(id);
        return of({
          ...((base as ContentItem | null) ?? ({ id } as ContentItem)),
          archived: true,
          updatedAt: new Date().toISOString(),
        } as ContentItem);
      }),
      tap((saved) => this.moveRowBetweenIndexes(saved, true)),
      tap((saved) => this.cacheFullItem(saved)),
    );
    return this.share(source$);
  }

  unarchive(id: string): Observable<ContentItem> {
    const workspaceId = this.workspaceId();
    const source$ = this.itemsApi.unarchiveItem(workspaceId, id).pipe(
      catchError(() => {
        const base =
          this.fullItemCacheSignal()[id] ??
          this.findIndexEntry(id);
        return of({
          ...((base as ContentItem | null) ?? ({ id } as ContentItem)),
          archived: false,
          updatedAt: new Date().toISOString(),
        } as ContentItem);
      }),
      tap((saved) => this.moveRowBetweenIndexes(saved, false)),
      tap((saved) => this.cacheFullItem(saved)),
    );
    return this.share(source$);
  }

  // --- Internal helpers ---

  /**
   * Test convenience: seed the materialized item list. Populates the full-item
   * cache so `items()` returns exactly the given list. Intended for specs that
   * need to pre-load the state without going through the API.
   */
  setItems(items: ContentItem[]): void {
    this.fullItemCacheSignal.set(
      Object.fromEntries(items.map((i) => [i.id, i])),
    );
    this.indexEntries.set([]);
    this.archiveIndexEntries.set([]);
  }

  /**
   * Kick off the request eagerly and return a shared replayable observable so
   * callers who subscribe later still receive the result. Callers who don't
   * subscribe still trigger the side effect (fire-and-forget works).
   */
  private share<T>(source$: Observable<T>): Observable<T> {
    const shared$ = source$.pipe(shareReplay({ bufferSize: 1, refCount: false }));
    shared$.subscribe({ error: () => { /* swallow — already handled via catchError */ } });
    return shared$;
  }

  private applySavedItem(item: ContentItem): void {
    this.cacheFullItem(item);
    const row = itemToIndexEntry(item);
    if (item.archived) {
      this.indexEntries.update((rows) => rows.filter((r) => r.id !== item.id));
      this.archiveIndexEntries.update((rows) => upsertRow(rows, row));
    } else {
      this.archiveIndexEntries.update((rows) =>
        rows.filter((r) => r.id !== item.id),
      );
      this.indexEntries.update((rows) => upsertRow(rows, row));
    }
  }

  private cacheFullItem(item: ContentItem): void {
    this.fullItemCacheSignal.update((cache) => ({ ...cache, [item.id]: item }));
  }

  private findIndexEntry(id: string): ContentItem | null {
    const row =
      this.indexEntries().find((r) => r.id === id) ||
      this.archiveIndexEntries().find((r) => r.id === id);
    return row ? indexEntryToItem(row) : null;
  }

  private moveRowBetweenIndexes(item: ContentItem, toArchive: boolean): void {
    const row = itemToIndexEntry(item);
    if (toArchive) {
      this.indexEntries.update((rows) => rows.filter((r) => r.id !== item.id));
      this.archiveIndexEntries.update((rows) => upsertRow(rows, row));
    } else {
      this.archiveIndexEntries.update((rows) =>
        rows.filter((r) => r.id !== item.id),
      );
      this.indexEntries.update((rows) => upsertRow(rows, row));
    }
  }
}

function stripUneditable(
  item: ContentItem,
): UpdateContentItemRequestContract {
  const { id: _id, createdAt: _c, ...rest } = item as ContentItemContract;
  return rest as UpdateContentItemRequestContract;
}

function upsertRow(
  rows: ContentItemsIndexEntryContract[],
  row: ContentItemsIndexEntryContract,
): ContentItemsIndexEntryContract[] {
  const i = rows.findIndex((r) => r.id === row.id);
  if (i === -1) return [row, ...rows];
  const next = [...rows];
  next[i] = row;
  return next;
}
