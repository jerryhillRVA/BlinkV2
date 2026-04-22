# Content MVP — Functional Design

## 1. Context

The `/workspace/:id/content` page currently renders from client-side mock data in `apps/blinksocial-web/src/app/pages/content/content.mock-data.ts`. The state service (`content-state.service.ts`) calls a generic namespace-entities endpoint that fetches full item files, and all mutations (`saveItem`, `updateStatus`, `advanceStage`, archive) are local-only — nothing is persisted.

This MVP wires the content page to live data on the AgenticFilesystem (AFS) at `http://localhost:8000`, adds full CRUD for ideas/concepts/posts backed by a lean index manifest, and implements an archive-index pattern so "Show Archived" remains fast as the workspace grows. Every field visible in the UI must be verified persisted at its correct JSON path on AFS. Existing mock behavior (with `AGENTIC_FS_URL` unset) must continue to work end-to-end for `hive-collective` and `booze-kills`.

**Non-goals for MVP.** Skill execution (LLM-backed drafting/discovery); calendar auto-creation on schedule; bulk operations; ETag/version concurrency control; server-side search/filter; deep inline editing of every nested production field beyond what the current modal and detail pages already support.

## 2. Architectural Alignment

This design extends the established patterns in the architecture docs:

- **`docs/data-model-design.md` §3** — namespace layout per workspace. `content-items/` is one of the per-tenant namespaces.
- **`docs/data-model-design.md` §4** — content pipeline lineage. Idea → Concept(s) → Post(s) all live in the same `content-items` namespace, discriminated by the `stage` field. FKs are `parentIdeaId` (concept → idea) and `parentConceptId` (post → concept). A concept declares a `targetPlatforms[]` array of `{platform, contentType, postId}` tuples that represent the posts it will produce.
- **`docs/data-model-design.md` §7** — index document pattern. Each namespace that backs a list view maintains a lightweight `_index.json` with only the fields needed for deterministic filtering, sorting, and list display. Full docs are fetched on-demand. Target scale: ~10K items before sharding or SQLite graduation.
- **`docs/blinksocial-hybrid-architecture.md`** — skill routing and context assembly. Referenced here for future wiring; this MVP is deterministic (UI → API → AFS) with no skill calls.

## 3. Storage Layout

Inside each tenant's `content-items/` namespace on AFS:

```
{tenant}/
└── namespace: content-items
    ├── _content-items-index.json           # primary manifest: ACTIVE items only
    ├── _content-items-archive-index.json   # secondary manifest: archived items only
    └── {itemId}.json                       # full doc, one per item (active or archived)
```

- The individual item file **never moves** on archive. It remains at `{itemId}.json` and receives `archived: true`.
- The archive index is a performance optimization so "Show Archived" does not require scanning/filtering the primary index client-side.
- `totalCount` and `lastUpdated` on both index manifests are recomputed on every index write.
- First mutation on a fresh tenant creates the `content-items/` namespace (AFS auto-creates on first `uploadJsonFile`).

**Item id format.** `c-${crypto.randomUUID()}`. Server-generated on create. The UI must not send an id on POST.

## 4. Schema Updates

Under `storage_reference/schemas/workspace/`:

- **`content-item.schema.json`** — add optional `archived: { "type": "boolean", "default": false }` to `properties`. Do NOT add to `required`. Items predating this field must continue to validate.
- **`content-items-index.schema.json`** — add optional `archived: { "type": ["boolean", "null"] }` to each row's `properties`.
- **NEW `content-items-archive-index.schema.json`** — identical row shape to `content-items-index.schema.json`. Distinct `$id` and `title`. Each row's `archived` is constrained to `true`. Wrapper shape: `{ items, totalCount, lastUpdated }`.

Sample data alignment under `storage_reference/data/hive-collective/content-items/`:

- Rename `_index.json` → `_content-items-index.json`.
- Add a sibling `_content-items-archive-index.json` with `{ "items": [], "totalCount": 0, "lastUpdated": "<iso>" }`.
- Grep the repo for any stale references to `_index.json` under `content-items/` and update.

## 5. Contracts (`libs/blinksocial-contracts/src/lib/workspace/`)

- **`content-item.ts`** — `ContentItemContract.archived?: boolean` is already present. No further edit required. Confirm nested production types match the latest schema when touched.
- **NEW `content-items-index.ts`** — exports:
  - `ContentItemsIndexEntryContract` — `{ id; stage; status; title; platform?; contentType?; pillarIds; segmentIds; owner?; parentIdeaId?; parentConceptId?; scheduledDate?; archived?; createdAt; updatedAt }`.
  - `ContentItemsIndexContract` — `{ items: ContentItemsIndexEntryContract[]; totalCount: number; lastUpdated: string }`.
  - `ContentItemsArchiveIndexContract` — same wrapper; row-level invariant `archived: true`.
  - Request contracts: `CreateIdeaRequestContract`, `CreateConceptRequestContract`, `CreatePostRequestContract`, `UpdateContentItemRequestContract`, `ArchiveContentItemRequestContract` (`{ archived: boolean }` — same payload for archive and unarchive paths).
- Update `libs/blinksocial-contracts/src/lib/workspace/index.ts` barrel.

## 6. Models (`libs/blinksocial-models/src/lib/workspace/`)

- **NEW `content-item.model.ts`** — class `ContentItem` mirroring `ContentItemContract`, with convenience constructor `new ContentItem(partial)`.
- **NEW `content-items-index.model.ts`** — classes `ContentItemsIndexEntry`, `ContentItemsIndex`, `ContentItemsArchiveIndex`.
- Update `libs/blinksocial-models/src/lib/workspace/index.ts` barrel.

## 7. Backend (`apps/blinksocial-api/`)

### 7.1 New module

Create `apps/blinksocial-api/src/content-items/`:

- `content-items.module.ts` — imports `AgenticFilesystemModule`; provides `ContentItemsService`; registers `ContentItemsController`. Uses `@Optional()` `MOCK_DATA_SERVICE` injection token matching the pattern in `WorkspacesModule`.
- `content-items.controller.ts` — `@Controller('api/workspaces')` with explicit sub-routes (matches existing `WorkspacesController` style).
- `content-items.service.ts` — CRUD + dual-index bookkeeping.

Register `ContentItemsModule` in `apps/blinksocial-api/src/app/app.module.ts` before `AngularSsrModule` (which must remain last — it's the catch-all).

**Remove** the currently-used generic `GET /:id/content-items` namespace-entity fallthrough on `WorkspacesController` so the new controller owns the route. The old code path still exists for other namespaces and is not affected.

### 7.2 Endpoints

| Method | Path | Handler | Response |
|--------|------|---------|----------|
| GET | `/api/workspaces/:id/content-items/index` | `getIndex` | `ContentItemsIndexContract` |
| GET | `/api/workspaces/:id/content-items/archive-index` | `getArchiveIndex` | `ContentItemsArchiveIndexContract` |
| GET | `/api/workspaces/:id/content-items/:itemId` | `getItem` | `ContentItemContract` |
| POST | `/api/workspaces/:id/content-items` | `createItem` | `ContentItemContract` |
| PUT | `/api/workspaces/:id/content-items/:itemId` | `updateItem` | `ContentItemContract` |
| POST | `/api/workspaces/:id/content-items/:itemId/archive` | `archiveItem` (idempotent) | `ContentItemContract` |
| POST | `/api/workspaces/:id/content-items/:itemId/unarchive` | `unarchiveItem` (idempotent) | `ContentItemContract` |
| DELETE | `/api/workspaces/:id/content-items/:itemId` | `deleteItem` | `{ deleted: true; id: string }` |

### 7.3 `ContentItemsService` — responsibilities

Injects `AgenticFilesystemService` and optional `MockDataService`.

**Projection helper.**

```ts
projectIndexEntry(item: ContentItemContract): ContentItemsIndexEntryContract
// picks the lean subset:
//   id, stage, status, title
//   platform ?? null, contentType ?? null
//   pillarIds ?? [], segmentIds ?? []
//   owner ?? null
//   parentIdeaId ?? null, parentConceptId ?? null
//   scheduledDate ?? null
//   archived ?? false
//   createdAt, updatedAt
```

**Internal readers.**

- `readIndex(tenant)` / `readArchiveIndex(tenant)` — list `content-items/`, find `_content-items-index.json` or `_content-items-archive-index.json`, batchRetrieve. Return `{ items: [], totalCount: 0, lastUpdated: now }` if missing.
- `readItem(tenant, itemId)` — list namespace, find by filename `${itemId}.json`, batchRetrieve.

**Internal writers.**

- `writeIndex(tenant, idx)` / `writeArchiveIndex(tenant, idx)` — recompute `totalCount = items.length`, `lastUpdated = new Date().toISOString()`, replace or upload.
- `upsertItemFile(tenant, item)` — replace by file_id if file exists else upload.

**Ordering.** Always write the full item file FIRST, then the index(es) SECOND. If item write fails, throw `ServiceUnavailableException`. If index write fails after item write succeeds, log error and surface success — add a TODO for a future reconciliation job that rebuilds indexes from item files.

**Mutations.**

- `createItem(tenant, request)` — generate `id = \`c-${crypto.randomUUID()}\``, set `createdAt = updatedAt = now()`, build full `ContentItemContract`, `upsertItemFile`, append entry to primary index, `writeIndex`.
- `updateItem(tenant, itemId, patch)` — read item, merge patch, bump `updatedAt`, `upsertItemFile`. Select index by `item.archived`; replace the row, write.
- `archiveItem(tenant, itemId)` — idempotent. If already archived, return item unchanged. Otherwise set `archived: true`, bump `updatedAt`, `upsertItemFile`. Remove row from primary index, append to archive index, write both.
- `unarchiveItem(tenant, itemId)` — inverse; idempotent.
- `deleteItem(tenant, itemId)` — read item (to know which index to update), delete file via AFS, remove entry from that index, write.

### 7.4 Mock mode (no `AGENTIC_FS_URL`)

When `AgenticFilesystemService.isConfigured()` returns false:

- **Reads** delegate to `MockDataService` for mock workspaces (`hive-collective`, `booze-kills`); any other tenant returns 404. Concretely:
  - `getIndex` → read `apps/blinksocial-api/src/mocks/data/<tenant>/content-items/_content-items-index.json`.
  - `getArchiveIndex` → read `_content-items-archive-index.json`; return empty shape if file missing.
  - `getItem` → read `apps/blinksocial-api/src/mocks/data/<tenant>/content-items/<itemId>.json`.
- **Writes** echo back the payload without persisting — matches the existing mock-write pattern on `WorkspacesService.saveNamespaceEntities` (`apps/blinksocial-api/src/workspaces/workspaces.service.ts` lines 597–623).
- Extend `MockDataService` (`apps/blinksocial-api/src/mocks/mock-data.service.ts`) with a small `getItemFile(workspaceId, itemId)` helper so the new service doesn't duplicate filesystem-join logic.

### 7.5 Mock data files to add

Under `apps/blinksocial-api/src/mocks/data/hive-collective/content-items/`:

- `_content-items-index.json` — three rows mirroring the reference sample, each with `archived: false`.
- `_content-items-archive-index.json` — `{ "items": [], "totalCount": 0, "lastUpdated": "<iso>" }`.
- `idea1.json`, `concept1.json`, `post1.json` — copy verbatim from `storage_reference/data/hive-collective/content-items/`.

Optionally also create an empty `apps/blinksocial-api/src/mocks/data/booze-kills/content-items/` with the two empty index files so a second mock workspace doesn't 404.

## 8. Frontend (`apps/blinksocial-web/`)

### 8.1 Column rename

In `src/app/pages/content/content.constants.ts`, change the `in-production` column's `label` from `'In Production'` to `'Posts in Production'`. No other change to `PIPELINE_COLUMNS`.

### 8.2 New API service

Create `src/app/pages/content/content-items-api.service.ts` with `providedIn: 'root'`. Methods mirror backend endpoints and return `Observable<T>`:

```
getIndex(workspaceId)
getArchiveIndex(workspaceId)
getItem(workspaceId, itemId)
createItem(workspaceId, payload)
updateItem(workspaceId, itemId, patch)
archiveItem(workspaceId, itemId)
unarchiveItem(workspaceId, itemId)
deleteItem(workspaceId, itemId)
```

### 8.3 State service refactor

Refactor `src/app/pages/content/content-state.service.ts`:

- Signals:
  - `indexEntries: signal<ContentItemsIndexEntryContract[]>([])` — active.
  - `archiveIndexEntries: signal<ContentItemsIndexEntryContract[]>([])` — archived.
  - `fullItemCache: Map<string, ContentItemContract>` — populated on detail-page enter.
- `items` becomes a `computed` that merges lean index rows with any cached full items (full wins where present). Existing bindings that iterate `items()` keep working.
- `loadAll(workspaceId)` — `forkJoin({ index: api.getIndex(), brandVoice })`; if `showArchived()` is already true, also fetch the archive index.
- `loadArchiveIndex()` — called on first toggle of "Show Archived" to true. Sets `archiveIndexEntries`.
- `loadFullItem(itemId)` — called by the detail page on enter; caches the full item and re-emits `items` so bindings see hydrated data.
- Mutations wire to API:
  - `saveItem(patch)` — if `patch.id` absent → `createItem`; else → `updateItem`. On success, update `indexEntries` and cache.
  - `updateStatus(id, status)` / `advanceStage(id)` → `updateItem`.
  - `archive(id)` / `unarchive(id)` → endpoints; move row between `indexEntries` and `archiveIndexEntries` on success.
  - `deleteItem(id)` → endpoint; drop from both signals and the cache.
- **Mock fallback retained.** On HTTP error or empty-index response for a known mock workspace, fall back to `getMockDataForWorkspace(workspaceId)` as today. Continue calling `mockData.markReal('content-items')` when AFS returns real rows.

### 8.4 Pipeline view

`src/app/pages/content/views/pipeline-view/pipeline-view.component.ts`:

- When `showArchived()` is true, source data from `archiveIndexEntries()`; when false, source from `indexEntries()`.
- `toggleShowArchived(true)` calls `stateService.loadArchiveIndex()` on first switch.
- Remove the now-redundant client-side `!i.archived` filter inside `filteredItems()` — each signal is already segregated.

### 8.5 Content detail

`src/app/pages/content/views/content-detail/content-detail-page.component.ts`:

- On route enter, call `stateService.loadFullItem(itemId)` in addition to the existing `loadAll`.
- Replace direct `saveItem({ ...it, archived: true })` with `stateService.archive(it.id)`. Symmetric for unarchive.

### 8.6 Content component create handlers

`src/app/pages/content/content.component.ts`:

- Create-modal emitters (`saveContent`, `saveMany`, `moveToProduction`, `draftAssets`, `createConcept`) must route through `stateService.saveItem` so creates persist via API. No modal-component changes needed.

## 9. API Contracts

Request/response JSON examples (executor must render these in the doc):

### 9.1 Create Idea

```http
POST /api/workspaces/fuzzee-coffee/content-items
Content-Type: application/json

{
  "stage": "idea",
  "status": "draft",
  "title": "Chair Yoga for Office Workers",
  "description": "5-part series...",
  "pillarIds": ["p1"],
  "segmentIds": ["s2"],
  "tags": ["chair-yoga"]
}
```

Response `201` — full `ContentItemContract` with server-generated `id`, `createdAt`, `updatedAt`.

### 9.2 Create Concept (from idea)

```http
POST /api/workspaces/fuzzee-coffee/content-items
{
  "stage": "concept",
  "status": "in-progress",
  "parentIdeaId": "c-<uuid>",
  "title": "Anti-Inflammatory Breakfast Carousel",
  "description": "...",
  "pillarIds": ["p4"],
  "segmentIds": ["s1", "s5"],
  "hook": "These 5 breakfasts fight inflammation.",
  "objective": "education",
  "cta": { "type": "other", "text": "Save this" },
  "keyMessage": "Anti-inflammatory eating starts at breakfast",
  "angle": "Science-backed, made simple",
  "formatNotes": ["b-roll"],
  "claimsFlag": true,
  "sourceLinks": ["https://example.com/..."],
  "riskLevel": "medium",
  "targetPublishWindow": { "start": "...", "end": "..." },
  "targetPlatforms": [
    { "platform": "instagram", "contentType": "carousel", "postId": null }
  ]
}
```

### 9.3 Create Post (production-brief path)

```http
POST /api/workspaces/fuzzee-coffee/content-items
{
  "stage": "post",
  "status": "in-progress",
  "parentConceptId": "c-<uuid>",
  "platform": "instagram",
  "contentType": "reel",
  "title": "60-Second Morning Mobility Flow",
  "description": "...",
  "pillarIds": ["p1"],
  "segmentIds": ["s4"],
  "objective": "engagement",
  "keyMessage": "A 60-second flow can transform your mornings",
  "production": { "brief": { "strategy": { /* ... */ }, "platformRules": { /* ... */ }, "creativePlan": { /* ... */ }, "compliance": { /* ... */ } } }
}
```

### 9.4 Archive / Unarchive

```http
POST /api/workspaces/fuzzee-coffee/content-items/c-<uuid>/archive
# empty body
```

Response `200` — full item with `archived: true` and bumped `updatedAt`. Idempotent: re-calling on an already-archived item returns the same shape without a duplicate index insert.

### 9.5 Errors

- `404` — workspace or item not found.
- `503` — AFS unreachable (`ServiceUnavailableException`).

## 10. Bootstrapping / Migration

- New workspaces: `content-items/` namespace is created on first write. No explicit bootstrap step.
- `fuzzee-coffee` on AFS: currently has no `content-items/` namespace (verified via `GET /v1/fuzzee-coffee/dirs?namespace=content-items` returning empty). No backfill required.
- `hive-collective` sample data: rename `storage_reference/data/hive-collective/content-items/_index.json` → `_content-items-index.json`; add empty archive index. Grep and update any stale references.
- Mock data: add files under `apps/blinksocial-api/src/mocks/data/hive-collective/content-items/` per §7.5.

## 11. Mock Fallback

Summary (full coverage in §7.4 and §8.3):

- **`AGENTIC_FS_URL` unset** → backend delegates reads to `MockDataService` for `hive-collective` and `booze-kills`; 404 for other tenants. Writes echo back without persisting.
- Frontend `content.mock-data.ts` client fallback covers any additional error path (e.g. 5xx on the API call). Preserves the existing "graceful failure" UX.
- Frontend `MockDataService` visual indicator (`※` markers) stays. Transitions to real via `markReal('content-items')` when AFS returns non-empty data.

## 12. Verification

- End-to-end test cases are in `content-integration.md` (sibling file).
- Clean-state requirement: each TC run starts with `content-items/` empty on `fuzzee-coffee`. A purge snippet is provided at the top of the test doc.
- Mock path coverage: TC-17 runs with `AGENTIC_FS_URL` unset against `hive-collective` and must pass before mock mode is considered green.
- Build gates: `npx nx build blinksocial-web`, `npx nx build blinksocial-api`, `npx nx affected -t test` (unit + integration), `npx nx affected -t lint`.

## 13. Critical Files

**New files.**

- `apps/blinksocial-api/src/content-items/content-items.module.ts`
- `apps/blinksocial-api/src/content-items/content-items.controller.ts`
- `apps/blinksocial-api/src/content-items/content-items.service.ts`
- `libs/blinksocial-contracts/src/lib/workspace/content-items-index.ts`
- `libs/blinksocial-models/src/lib/workspace/content-item.model.ts`
- `libs/blinksocial-models/src/lib/workspace/content-items-index.model.ts`
- `storage_reference/schemas/workspace/content-items-archive-index.schema.json`
- `storage_reference/data/hive-collective/content-items/_content-items-archive-index.json`
- `apps/blinksocial-api/src/mocks/data/hive-collective/content-items/_content-items-index.json`
- `apps/blinksocial-api/src/mocks/data/hive-collective/content-items/_content-items-archive-index.json`
- `apps/blinksocial-api/src/mocks/data/hive-collective/content-items/idea1.json`
- `apps/blinksocial-api/src/mocks/data/hive-collective/content-items/concept1.json`
- `apps/blinksocial-api/src/mocks/data/hive-collective/content-items/post1.json`
- `apps/blinksocial-web/src/app/pages/content/content-items-api.service.ts`

**Modified files.**

- `storage_reference/schemas/workspace/content-item.schema.json` (add `archived`)
- `storage_reference/schemas/workspace/content-items-index.schema.json` (add `archived`)
- `storage_reference/data/hive-collective/content-items/_index.json` → rename to `_content-items-index.json`
- `libs/blinksocial-contracts/src/lib/workspace/index.ts` (export new file)
- `libs/blinksocial-models/src/lib/workspace/index.ts` (export new files)
- `apps/blinksocial-api/src/app/app.module.ts` (import `ContentItemsModule`)
- `apps/blinksocial-api/src/workspaces/workspaces.controller.ts` (remove superseded `/:id/content-items` route)
- `apps/blinksocial-api/src/mocks/mock-data.service.ts` (add `getItemFile` helper)
- `apps/blinksocial-web/src/app/pages/content/content.constants.ts` (rename column label)
- `apps/blinksocial-web/src/app/pages/content/content-state.service.ts` (refactor)
- `apps/blinksocial-web/src/app/pages/content/content.component.ts` (route create handlers through state service)
- `apps/blinksocial-web/src/app/pages/content/views/pipeline-view/pipeline-view.component.ts` (archive toggle source)
- `apps/blinksocial-web/src/app/pages/content/views/content-detail/content-detail-page.component.ts` (archive/unarchive endpoints; load full item)

## 14. Out of Scope for MVP

- Skill execution (draft hooks, generate post copy, discover via skills).
- Calendar auto-creation on schedule.
- Bulk operations (bulk archive, bulk stage-advance).
- Concurrency control via ETags/versions — last-write-wins for MVP.
- Server-side search/filter (client-side on index is sufficient for ~10K).
- Rich inline editing of every nested production field beyond what the current modal and detail pages already support. The persistence layer supports arbitrary subsets.

## 15. Implementation Sequencing

1. **Schemas** — no deps. Add `archived` fields, create archive-index schema, update sample data.
2. **Contracts** — new `content-items-index.ts`; update barrel. Build `@blinksocial/contracts`.
3. **Models** — mirror contracts. Update barrel. Build `@blinksocial/models`.
4. **Backend** — module/service/controller; register in `AppModule`; remove generic `/:id/content-items`; add mock data files; extend `MockDataService`. Start API; curl-validate each endpoint against empty `fuzzee-coffee` per the test doc.
5. **Frontend API service** — `content-items-api.service.ts` + unit tests.
6. **Frontend state service refactor** — preserve mock fallback; keep `markReal('content-items')`.
7. **Pipeline view + content detail** — archive toggle source, archive/unarchive wiring, full-item load.
8. **Column label rename**.
9. **Run TC-1 → TC-19 manually**; purge `fuzzee-coffee` between runs.

## 16. Open Questions

1. **Server-authoritative ids.** Plan has the backend generate `c-${uuid}` ids on create; the UI must not send an id for new items. Matches existing `content.utils.ts` pattern.
2. **Controller pattern.** `@Controller('api/workspaces')` with explicit `:id/content-items/...` sub-routes (matches existing `WorkspacesController` style) vs. `@Controller('api/workspaces/:id/content-items')` (cleaner separation, repeated route param). Plan picks option A.
3. **Index filename.** Spec uses `_content-items-index.json`. Legacy sample uses `_index.json`. Plan renames the legacy sample.
4. **Idempotent archive.** `POST /:itemId/archive` is a no-op on already-archived items; symmetric for unarchive. Alternative: 409 Conflict. Plan recommends idempotent.
5. **Full-item cache vs. separate signal.** Plan merges full-item cache into the existing `items` signal so current bindings keep working. Alternative: separate `fullItems` signal.
