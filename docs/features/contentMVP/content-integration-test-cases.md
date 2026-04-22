# Content MVP — Integration Test Cases (v2)

> This document is the authoritative integration-test spec for the Content MVP feature. It is designed to be executed by a human tester **or** by an AI testing agent driving a browser. Every test case specifies the preconditions, the exact UI selectors to interact with, the exact AFS curl commands to verify backend state, and a boolean checklist of expected results.
>
> **This is not a smoke test.** It is a thoroughness-oriented spec. An AI agent that executes every case and every edge probe in full should surface 95%+ of functional, field-validation, stage-model, and UX regressions in the content feature.

---

## Table of Contents

- [Part 0 — AI Agent Operating Guidelines](#part-0--ai-agent-operating-guidelines)
- [Part 1 — Prerequisites, Setup, Tooling](#part-1--prerequisites-setup-tooling)
- [Part 2 — Element Inventory (per page)](#part-2--element-inventory-per-page)
- [Part 3 — Field-Level Validation Matrix](#part-3--field-level-validation-matrix)
- [Part 4 — Input Edge-Case Matrix](#part-4--input-edge-case-matrix)
- [Part 5 — Original Test Cases (TC-1 .. TC-19, enhanced)](#part-5--original-test-cases-tc-1--tc-19-enhanced)
- [Part 6 — New Test Cases (TC-20 .. TC-45)](#part-6--new-test-cases-tc-20--tc-45)
- [Part 7 — Appendix: verification snippets](#part-7--appendix-verification-snippets)

---

## Part 0 — AI Agent Operating Guidelines

Read this section before running anything. The rules here prevent the most common classes of missed bugs.

### G-1 Observe before asserting
Take a screenshot **before** and **after** every mutating action (create, edit, save, archive, delete, stage advance). Diff the two. A mutation that changes the server but doesn't update the DOM — or vice versa — is a defect. Do not trust the UI alone; do not trust the API alone; cross-check both on every mutation.

### G-2 Verify backend state on every mutation
After every UI action that should touch AFS, run the corresponding verification curl in the same TC. A UI that appears to save but silently does not is a class of defect this doc specifically targets.

### G-3 Watch for silent failures
A button that is clickable but does nothing is a defect. If clicking a visible, non-disabled control produces no visible response and no AFS change within 2 s, **record it as a defect** (severity at least Major) with the element selector and the pre/post screenshots. Common silent-failure culprits: a disabled-styled-but-not-truly-disabled button, an `(click)` handler gated by hidden required-field validation that isn't surfaced to the user, a promise that rejects without a catch.

### G-4 Distinguish mock data from real data

**Mock architecture (authoritative).** Once a feature is wired to the server and AFS:

- **Frontend must not contain UI-level mocks.** UI-side mocks are only used during initial component development, before the feature is connected to its backend controller. After wiring is complete, those mocks are deleted — the frontend reads exclusively from `/api/*`.
- **Server-side mock fallback is gated by `AGENTIC_FS_URL`.** When the env var is **unset**, the API serves a canned mock dataset (see [apps/blinksocial-api/src/mocks/data/](../../apps/blinksocial-api/src/mocks/data/)) so the app is usable for demos and for UI work that does not require AFS to be running. When the env var **is set**, the API reads and writes AFS exclusively. There is no in-between: an empty AFS with `AGENTIC_FS_URL` set should render an empty pipeline, not mock cards.

**What this means for test cases.**

- If `AGENTIC_FS_URL` is set and the primary index is empty, the pipeline board must render 0 cards. Any card visible in that state is a defect — the frontend is either caching stale mock data or the server is leaking mocks on a configured tenant.
- If `AGENTIC_FS_URL` is unset, the pipeline must render the tenant's mock dataset (if any) and every write must be a no-op against AFS (because AFS is not addressable). This is what **TC-17** validates.
- Reconcile the UI count against `curl .../dirs?namespace=content-items | jq '.entries | length'` only when `AGENTIC_FS_URL` is set. When unset, the comparison is meaningless — there is no AFS to query — and the UI count is compared against the mock fixtures on disk instead.

If you see divergence in the `AGENTIC_FS_URL`-set case, hard-reload and record a defect.

### G-5 Hard reload at test boundaries
Between test cases that mutate state, do a hard reload (`Cmd+R` / `Ctrl+R`). This flushes in-memory state, mock fallback artifacts, and stale signals. If the app behaves differently before vs. after a hard reload for the same AFS state, **record that as a defect**.

### G-6 Selector preference order
When clicking or finding an element, prefer in this order: (1) `data-testid` attribute, (2) `aria-label`, (3) stable class on a unique element, (4) visible text content, (5) coordinate click. If you must use a coordinate click, record the screenshot it was derived from.

### G-7 Distinguish pass types
Each test case terminates with one of:
- **PASS** — every expected result and every data-integrity check held.
- **PASS with caveats** — functionality works but a minor/trivial defect was noted (e.g., stale label, missing confirmation dialog). List each caveat as a defect.
- **PARTIAL** — some expected results held, others failed. List which.
- **BLOCKED** — the test cannot be executed because the UI path, action, or field literally doesn't exist. List the missing surface.
- **SKIPPED** — explicitly skipped by operator directive. Record the directive.

### G-8 Defect logging template
Every defect must be logged with:
- **Title** (one line)
- **Severity**: Blocker / Major / Minor / Trivial
- **TC#** that surfaced it
- **Reproduction steps** (numbered, copy-pastable)
- **Expected vs actual**
- **Relevant log excerpt** (± 10 lines around the error, if any)
- **AFS response or screenshot path**
- **Hypothesis** (best-effort root cause)

### G-9 Don't lose the user's intent during an AI flow
Several UI flows trigger an AI call ("Generate Ideas", "Generate Concept Options", "AI Assist"). These can be slow (≥5 s) or flaky. Record both the "happy path" (returns and populates) and the "error path" (network error, LLM error, 500, timeout). If the UI spinners forever without surfacing an error, that is a defect.

### G-10 Respect tenancy and mock boundaries
All tests unless otherwise specified use tenant `fuzzee-coffee`. `hive-collective` is a mock-only workspace: it has no AFS namespace, and it is reachable **only when `AGENTIC_FS_URL` is unset** (so the API is serving mocks). Under a configured AFS, `hive-collective` should render an empty pipeline and any write must round-trip through mocks (not AFS). If you see `hive-collective` writes landing in AFS, or `fuzzee-coffee` reads returning `hive-collective` mock data, that is a defect.

### G-11 Screenshot only on defect or verification
Take a screenshot every time you record a defect, and when a visual assertion is required (e.g., column label text, stage badge color). Don't screenshot every click — the transcript and AFS state are sufficient for the routine path.

### G-12 Capture the post-run AFS state
At the end of every run, produce a final `curl .../dirs?namespace=content-items | jq '.entries | map(.name)'` snapshot. Include it in the report.

---

## Part 1 — Prerequisites, Setup, Tooling

### 1.1 Runtime prerequisites
- AFS on `localhost:8000`, with `fuzzee-coffee` tenant present. Verify: `curl http://localhost:8000/admin/tenants | jq '.tenants'` lists `fuzzee-coffee`.
- API on `localhost:3000` with `AGENTIC_FS_URL=http://localhost:8000` in `.env` (unless a TC explicitly unsets it, e.g., TC-17, TC-45-mock).
- Web on `localhost:4200`.
- `fuzzee-coffee` has `settings/business-objectives.json` populated with at least one objective (tested in TC-32). Verify: `curl -s "http://localhost:8000/v1/fuzzee-coffee/dirs?namespace=settings" | jq '.entries | map(.name) | index("business-objectives.json")'` returns a non-null integer.
- `hive-collective` exists as a mock-only workspace (used in TC-17).
- Browser: Chrome with DevTools Network tab reachable (the agent should be able to inspect network traffic for cache behavior tests).
- Shell: bash 5+ with `curl`, `jq`.

### 1.2 Clean-state purge (run before TC-1; rerun between full runs)

```bash
for fid in $(curl -s "http://localhost:8000/v1/fuzzee-coffee/dirs?namespace=content-items" | jq -r '.entries[] | .file_id'); do
  curl -s -X DELETE "http://localhost:8000/v1/fuzzee-coffee/files/$fid" > /dev/null
done
curl -s "http://localhost:8000/v1/fuzzee-coffee/dirs?namespace=content-items" | jq '.entries'
# Expected: []
```

After the purge, hard-reload the browser (`Cmd+R`). **If the kanban shows any cards (with `AGENTIC_FS_URL` set), record a defect** — per the mock architecture in G-4, a configured backend must render empty when AFS is empty. Mock fallback lives on the server and is only active when `AGENTIC_FS_URL` is unset; it must never leak into a configured tenant.

### 1.3 AFS API reference

```bash
# List tenants
curl http://localhost:8000/admin/tenants

# List namespaces for a tenant
curl "http://localhost:8000/v1/{tenant}/namespaces"

# List files in a namespace
curl "http://localhost:8000/v1/{tenant}/dirs?namespace={namespace}"

# Batch retrieve file contents (preferred over single GET)
curl -X POST http://localhost:8000/v1/{tenant}/files/batch \
  -H 'Content-Type: application/json' \
  -d '{"file_ids":["<file_id>"],"include_content":true}'

# Delete a file
curl -X DELETE http://localhost:8000/v1/{tenant}/files/{file_id}
```

### 1.4 Bash helpers (source once per shell session)

```bash
fileId() {
  # $1 tenant, $2 namespace, $3 filename
  curl -s "http://localhost:8000/v1/$1/dirs?namespace=$2" \
    | jq -r ".entries[] | select(.name == \"$3\") | .file_id"
}

fetch() {
  # $1 tenant, $2 namespace, $3 filename — prints JSON content
  local fid
  fid=$(fileId "$1" "$2" "$3")
  [ -z "$fid" ] && echo "null" && return
  curl -s -X POST "http://localhost:8000/v1/$1/files/batch" \
    -H 'Content-Type: application/json' \
    -d "{\"file_ids\":[\"$fid\"],\"include_content\":true}" \
    | jq '.files[0].content'
}

listItemFiles() {
  # $1 tenant — prints c-*.json names
  curl -s "http://localhost:8000/v1/$1/dirs?namespace=content-items" \
    | jq -r '.entries[] | select(.name | test("^c-")) | .name'
}

fileCount() {
  # $1 tenant — count of c-*.json files in content-items namespace
  curl -s "http://localhost:8000/v1/$1/dirs?namespace=content-items" \
    | jq '.entries | map(select(.name | test("^c-"))) | length'
}

indexItemIds() {
  # $1 tenant — prints primary-index ids, sorted
  fetch "$1" content-items _content-items-index.json | jq -r '.items[].id' | sort
}

archiveItemIds() {
  # $1 tenant — prints archive-index ids, sorted
  fetch "$1" content-items _content-items-archive-index.json 2>/dev/null \
    | jq -r '.items[].id' | sort
}
```

### 1.5 Browser automation primer (for AI agents)

The app does **not** ship with `data-testid` attributes. Prefer ARIA labels and semantic roles. Selector table for the most-often-used controls:

| Control | Selector preference |
|---|---|
| Kanban column "+" | ARIA label `"Add Ideas"` / `"Add Concepts"` / `"Add <column>"` |
| Filter button | class `.filter-btn` (top-right of pipeline board) |
| Show Archived toggle | role `switch`, aria-label `"Show Archived"` |
| Search input | class `.search-input`, placeholder `"Search content..."` |
| Detail page kebab | button aria-label `"More actions"` |
| Detail page primary action | by text: `"Concept"` (idea), `"Move to Production"` (concept) |
| Detail page title | click on title text to enter inline-edit |

---

## Part 2 — Element Inventory (per page)

Element inventories below enumerate every interactive surface. Use them as scan checklists: when you open a page, verify every element listed is present and behaves as described. **A missing element is a defect** unless the ContextualGuard notes say otherwise.

### 2.1 Create Content Modal (`/workspace/:id/content` → `+ New Content` or column `+`)

**Parent component:** `content-create-modal.component.{ts,html}`
**Form:** `content-create-form.component.{ts,html}`

| Element | Selector / Text | Expected behavior | Notes |
|---|---|---|---|
| Modal backdrop | `.modal-backdrop` | Click to cancel | Should close modal without saving |
| Close X | aria-label `"Close"` (top-right X) | Click to cancel | Same as Cancel |
| Type dropdown | text label `TYPE` | Options: `Idea`, `Concept`, `Production Brief` | Selected type changes form below |
| Cancel | button text `Cancel` | Close modal, no AFS write | Keyboard: Esc key must also close |
| Primary save | dynamic: `Save Idea`/`Save Concept`/`Save Brief` | Create item in AFS | Disabled if required fields unfilled |
| Advance save | `Create Concept` / `Move to Production` / `Draft Assets` | Create AND immediately advance stage | Idea form only |

#### 2.1.1 Idea section fields

| Field | Label | Type | Required | Min | Max | Default | Validation message |
|---|---|---|---|---|---|---|---|
| Mode | `MODE` | Tabs (Quick Add / Generate Ideas) | — | — | — | `Quick Add` | none |
| Title | `TITLE *` | text input | ✓ | 1 | unknown | `""` | Disables Save if empty |
| Description | `DESCRIPTION` | textarea (3 rows) | ✗ | 0 | unknown | `""` | none |
| Content Pillars | `CONTENT PILLARS` | chip toggle | ✗ (observed) | 0 | 3 (observed) | `[]` | Missing: segmentIds selector — D-03 |

**Generate Ideas mode adds:**
- Focus Pillars (chip toggle, required 1..maxFocusPillars)
- Generate Ideas button (disabled until a pillar is picked; shows spinner)
- Ideas grid (selectable cards, with checkboxes)

#### 2.1.2 Concept section fields

| Field | Label | Type | Required | Min | Max | Default |
|---|---|---|---|---|---|---|
| Title | `TITLE *` | text | ✓ | 1 | unknown | `""` |
| Description | `DESCRIPTION *` | textarea with AI Assist | ✓ | **50** | 400 | `""` |
| Content Pillars | `CONTENT PILLARS *` | chip toggle | ✓ | 1 | 3 | `[]` |
| Hook | `HOOK *` | text with AI Assist | ✓ | unknown | 120 | `""` |
| Objective | `OBJECTIVE *` | dropdown | ✓ | — | — | none |
| Platform | `PLATFORM` | dropdown | ✗ | — | — | none |
| Content Type | `CONTENT TYPE` | dropdown | ✗ (conditional on platform) | — | — | none |
| Audience Segments | chip toggle | ✗ | 0 | unknown | `[]` |
| CTA Type | dropdown | ✗ | — | — | none |
| CTA Text | text | conditional on CTA Type | 0 | 120 | `""` |

**Pre-Generation phase (AI-first):** Title + Objective button grid (5 options) → Generate Concept Options → post-gen phase. Back arrow returns to pre-gen.

#### 2.1.3 Brief section fields (Production Brief type)

| Field | Label | Type | Required | Min | Max |
|---|---|---|---|---|---|
| Title | `TITLE *` | text | ✓ | 1 | unknown |
| Description | `DESCRIPTION` | textarea | ✗ | 0 | unknown |
| Content Pillars | `CONTENT PILLARS *` | chip toggle | ✓ | 1 | 3 |
| Platform | `PLATFORM *` | dropdown | ✓ | — | — |
| Content Type | `CONTENT TYPE *` | dropdown | ✓ (conditional on platform) | — | — |
| Objective | `OBJECTIVE *` | dropdown | ✓ | — | — |
| Tone Preset | `TONE PRESET` | dropdown | ✗ | — | — |
| Key Message | `KEY MESSAGE *` | text | ✓ | 1 | 140 |
| Audience Segments | `AUDIENCE SEGMENTS *` | chip toggle | ✓ (if segments exist) | 1 | unknown |
| CTA Type | `CALL-TO-ACTION (OPTIONAL)` | dropdown | ✗ | — | — |
| CTA Text | `CTA TEXT` | text | conditional | 0 | 120 |

**Primary-save button label:** `Save Brief`. **Secondary (advance):** `Draft Assets`.

### 2.2 Pipeline View (`/workspace/:id/content`)

**Component:** `pipeline-view.component.{ts,html}`

| Element | Selector | Expected behavior |
|---|---|---|
| Search input | `.search-input`, placeholder `Search content...` | Filters visible cards by title/description substring; case-insensitive; non-regex |
| View mode toggle | text `Kanban` / `List` buttons | Swaps kanban layout vs list layout; should persist across reload (TC-25) |
| `+ New Content` | text `+ New Content` | Opens create modal in Idea type by default |
| Filter button | `.filter-btn` text `Filter` | Toggles filter panel; shows badge `(n)` when any filter active |
| Active-filter chip strip | `.active-filters` (only when filters active) | Each chip shows filter value with × to remove; `Clear all` removes all |

#### 2.2.1 Filter panel

| Element | Selector | Expected |
|---|---|---|
| Pillar chips | `PILLARS` section | One chip per pillar from workspace brand-voice settings |
| Platform chips | `PLATFORM` section | 5 platforms: Instagram, TikTok, YouTube, Facebook, LinkedIn |
| Content Type chips | `CONTENT TYPE` section | Dynamic — only types present in the visible set |
| Show Archived toggle | role=`switch`, aria-label `Show Archived` | Swaps data source primary ↔ archive |
| Clear all (panel) | `.clear-filters` text `Clear all` | Clears all chip filters |

#### 2.2.2 Kanban columns (from [content.constants.ts:202-274](../../apps/blinksocial-web/src/app/pages/content/content.constants.ts))

| # | id | Label | Add button? | Filter criteria |
|---|---|---|---|---|
| 1 | `ideas` | `Ideas (<n>)` | ✓ `Add Ideas` | stage=idea, status=draft |
| 2 | `concepts` | `Concepts (<n>)` | ✓ `Add Concepts` | stage=concept, status=draft |
| 3 | `in-production` | `Posts in Production (<n>)` | ✓ `Add Posts in Production` | status=in-progress |
| 4 | `review` | `Review & Schedule (<n>)` | ✗ | status=review OR scheduled |
| 5 | `published` | `Published (<n>)` | ✗ | status=published |

**Kanban card elements:** pillar badges (top), content-type badge + platform icon (if set), title, hook/description snippet, date (Feb 28, Apr 21, etc.). Entire card is clickable — opens detail page.

### 2.3 Idea Detail Page (`/workspace/:id/content/:itemId` for stage=idea)

| Section | Element | Notes |
|---|---|---|
| Header | Back button (`Back`) | Returns to pipeline |
| Header | Stage badge `IDEA` | Non-interactive |
| Header | Title | Click to enter inline-edit (blur saves) |
| Header | Platform display | Conditional |
| Header | Kebab `...` | aria-label `More actions`; opens menu |
| Kebab menu | `Copy link` | Copies deep link to clipboard |
| Kebab menu | `Duplicate` | Creates a new item cloned from this one |
| Kebab menu | `Archive` (danger) | Sets archived=true, moves row between indexes |
| Kebab menu | **Expected but missing:** `Unarchive` when archived | D-17 |
| Header primary | `Concept →` | Advances stage to concept (currently in-place mutation — D-06) |
| Main | Description | Inline-editable textarea; blur saves |
| Main | `Concept Options` panel | "Generate Concept Options" button; AI flow |
| Right rail | Content Pillars (chip toggle, max 3) | Click to toggle; immediately saves |
| Right rail | Audience Segments (chip toggle) | Click to toggle |
| Right rail | Business Objective | **Currently always renders** "No business objectives have been set up" — D-05 |
| Right rail | Content Journey stepper | `1 Idea` / `2 Concept` / `3 Post`; current step circled |
| Right rail | Timestamps | Read-only: Created, Last updated |

### 2.4 Concept Detail Page (stage=concept)

| Section | Element | Notes |
|---|---|---|
| Header | Back / Title / Platform / Kebab / `Move to Production` | same as idea detail plus SAVED indicator (aria-live=polite) |
| Kebab menu | `Send back to Idea` | Demotes stage to idea |
| Kebab menu | `Delete` (danger) | Removes item and index row. **Currently no confirmation — D-19** |
| Main | Description (required, min 50 chars) | Red counter if under min — D-20 |
| Main | Hook (required, max 120 chars) | Yellow counter at ≥100, red at max |
| Main | Content Goal (5 buttons) | Only 5 of 11 contract objectives exposed — D-10 |
| Main | Production Targets picker | Grouped by platform; `productionTargets` array — D-08 |
| Main | Call-to-Action (dropdown + text) | 8 options (no `follow` — D-14) |
| Right rail | Content Pillars / Audience Segments / Business Objective / Content Journey / Timestamps | same as idea |

**Missing fields** (per spec, not present in UI — D-07): `keyMessage`, `angle`, `formatNotes`, `claimsFlag`, `sourceLinks`, `riskLevel`, `targetPublishWindow`.

### 2.5 Post Detail Page (stage=post)

**Note:** Items created via `+ Posts in Production` currently have `stage='production-brief'` (D-11), which routes to a "coming soon" stub (D-12). The post-detail page below **only** renders for legacy `stage='post'` items.

| Section | Element | Notes |
|---|---|---|
| Header | Back, stage badge `IN PRODUCTION`, Title (read-only if briefApproved), Platform, SAVED indicator, `Back to Concept` button (conditional) | |
| Kebab menu | `Archive` / `Unarchive` (conditional), `Duplicate`, `Delete` | Post-detail has correct archive/unarchive toggling |
| Production Steps bar | `Brief` → `Builder` → `Packaging` → `QA` | Only `Brief` is implemented; others are `step-placeholder` stubs |
| Brief step form | Title, Description, Format (read-only platform/contentType), Pillars, Segments, Content Goal, Tone Preset, Key Message, CTA | Most fields locked after brief approval |
| Brief status sidebar | Status badge, progress bar, error/warning lists, Approve checkbox, Continue button | Gates the Builder step |

### 2.6 Production-Brief Detail Stub

**Current behavior:** stage=`production-brief` → router falls through to `@default { This view is coming soon. }`.
**Expected:** either route to post-detail (if `production-brief` is collapsed into `post`) or render a dedicated brief editor. **D-12** tracks this.

### 2.7 Global header (layout)

| Element | Selector | Notes |
|---|---|---|
| Logo | `BLINK SOCIAL` SVG | Click → `/` (dashboard) |
| Workspace switcher | button with workspace name + chevron | Opens dropdown with workspaces + `Add Workspace` |
| Content tab | `Content` nav link | `routerLink="/workspace/:id/content"` |
| Strategy tab | `Strategy & Research` | `routerLink="/workspace/:id/strategy"` |
| Theme toggle | sun/moon icon | Toggles light/dark; persists in localStorage |
| Settings gear | conditional | `routerLink="/workspace/:id/settings"` |
| User avatar | initials circle | Menu: Profile, Workspace Settings, Logout |

### 2.8 Routes

From [app.routes.ts](../../apps/blinksocial-web/src/app/app.routes.ts):

| Path | Component | Guards |
|---|---|---|
| `/login` | Login | — |
| `/` | Dashboard | authGuard |
| `/onboard` | Onboard | authGuard, adminGuard |
| `/new-workspace` | NewWorkspace | authGuard |
| `/profile-settings` | ProfileSettings | authGuard |
| `/workspace/:id/settings` | WorkspaceSettings | authGuard |
| `/workspace/:id/strategy` | StrategyResearch | authGuard |
| `/workspace/:id/content` | ContentComponent | authGuard |
| `/workspace/:id/content/:itemId` | ContentDetailPage | authGuard |

### 2.9 API service surface

From [content-items-api.service.ts](../../apps/blinksocial-web/src/app/pages/content/content-items-api.service.ts):

| Method | Endpoint |
|---|---|
| `getIndex(ws)` | `GET /api/workspaces/:ws/content-items/index` |
| `getArchiveIndex(ws)` | `GET /api/workspaces/:ws/content-items/archive-index` |
| `getItem(ws, id)` | `GET /api/workspaces/:ws/content-items/:id` |
| `createItem(ws, payload)` | `POST /api/workspaces/:ws/content-items` |
| `updateItem(ws, id, patch)` | `PUT /api/workspaces/:ws/content-items/:id` |
| `archiveItem(ws, id)` | `POST /api/workspaces/:ws/content-items/:id/archive` |
| `unarchiveItem(ws, id)` | `POST /api/workspaces/:ws/content-items/:id/unarchive` |
| `deleteItem(ws, id)` | `DELETE /api/workspaces/:ws/content-items/:id` |

### 2.10 State service surface

From [content-state.service.ts](../../apps/blinksocial-web/src/app/pages/content/content-state.service.ts):

- Signals: `workspaceId`, `loading`, `saving`, `indexEntries`, `archiveIndexEntries`, `pillars`, `segments`
- Computed: `items`, `activeItems`, `archivedItems`, `stepCounts`
- Key methods: `loadAll`, `loadArchiveIndex`, `loadFullItem`, `saveItem`, `deleteItem`, `updateStatus`, `advanceStage`, `archive`, `unarchive`

---

## Part 3 — Field-Level Validation Matrix

Each cell below is an executable test. An AI agent should probe every cell for every item stage that owns that field.

### 3.1 Required-field enforcement

For every field marked `required` in §2.1.x, attempt to submit the form with the field empty. Expected: save is blocked and the user is shown the reason. If the save proceeds to AFS with an empty required field, that is a defect.

| Form | Required field | Probe | Expected |
|---|---|---|---|
| Idea create (Quick Add) | Title | Leave blank, click Save Idea | Save button disabled OR inline error; no AFS write |
| Concept create (manual phase) | Title | Leave blank | Save disabled |
| Concept create (manual phase) | Description < 50 chars | Type 30 chars, click Save | Save either blocked with clear error OR permitted (current behavior — defect) |
| Concept create (manual phase) | Content Pillars | Pick 0 | Save disabled OR error |
| Concept create (manual phase) | Hook | Leave blank | Save disabled |
| Concept create (manual phase) | Objective | Leave unselected | Save disabled |
| Brief create | Title / Pillars / Platform / ContentType / Objective / KeyMessage / Segments | One at a time, leave blank | Save disabled each time |

### 3.2 Length boundaries

For every field with a max length, probe min, min-1, min+1, max-1, max, max+1.

| Field | Min | Max | Probes |
|---|---|---|---|
| Concept description | 50 | 400 | "a" (×49), "a" (×50), "a" (×51), "a" (×399), "a" (×400), "a" (×401) |
| Concept hook | — | 120 | `""`, "a" (×1), "a" (×119), "a" (×120), "a" (×121) |
| Brief keyMessage | 1 | 140 | `""`, "a" (×139), "a" (×140), "a" (×141) |
| CTA text | 1 (if CTA type set) | 120 | `""`, "a" (×119), "a" (×120), "a" (×121) |
| Concept ≥100 warn | — | 120 | "a" (×100) should tint the counter warning color |

Expected:
- At max: save OK; AFS value equals input verbatim.
- At max+1: input is either truncated or save is blocked; AFS must not contain value longer than max.
- At min-1: save is blocked OR permitted (depending on field); verify both paths.

### 3.3 Character-set probes (per text input)

Apply each probe to each text field (title, description, hook, keyMessage, CTA text, tag):

| Probe | Expected |
|---|---|
| Leading/trailing whitespace `"  TC40 edge  "` | Saved as-is OR trimmed; either is OK but behavior must be consistent |
| Embedded newlines `"line1\nline2"` | Preserved in textarea; not allowed in single-line input |
| Unicode `"TC40 — émoji 🎉"` | Preserved verbatim in AFS |
| RTL `"עברית"` | Preserved; DOM renders in RTL direction |
| HTML tags `"<script>alert(1)</script>"` | Escaped in DOM render (not executed); stored as string in AFS |
| HTML attributes `"\" onload=\"alert(1)"` | Same as above |
| SQL-ish `"'; DROP TABLE --"` | Stored as string; no parser error |
| Null byte `"a\u0000b"` | Preserved OR rejected; no crash |
| Very long `"a" × 100000` | Either truncated at max or save blocked; no crash |
| Quotes `"He said \"hi\""` | Preserved |
| Backslashes `"a\\b\\c"` | Preserved |
| Whitespace-only `"   "` | For required fields: treated as empty → save blocked |

### 3.4 Dropdown completeness

For each dropdown, enumerate its options and compare against the contract.

| Dropdown | UI options | Contract type | Gap? |
|---|---|---|---|
| Type (create modal) | Idea, Concept, Production Brief | `ContentStageContract` (+ production-brief) | post stage not exposed in create |
| Platform | TBD, Instagram, YouTube, TikTok, Facebook, LinkedIn | `PlatformContract` | match |
| Content Type | Filtered by platform | `ContentTypeContract` (21 values) | verify every contract value is reachable from some platform |
| Objective (concept goal) | Awareness, Engagement, Trust, Leads, Conversion | `ContentObjectiveContract` (11 values) | **D-10** — 6 missing |
| Objective (brief) | (verify completeness) | `ContentObjectiveContract` | Probe same |
| Tone Preset | Professional, Casual, Friendly, Authoritative, Inspiring, Playful | `TonePresetContract` | match |
| CTA Type | None, Learn More, Subscribe, Comment, Download, Buy, Book a Call, Other | `CtaTypeContract` | **D-14** — no `follow` |

For every gap, record a defect unless the contract is known to be a superset by design.

### 3.5 Chip selector constraints

| Field | UI rule | Probe | Expected |
|---|---|---|---|
| Concept Content Pillars | 1..3 required | Select 4 pillars | 4th click rejected with visible cue; OR save rejected |
| Idea Content Pillars | 0..3 | Select 4 | Same |
| Brief Content Pillars | 1..3 required | Select 0 | Save disabled |
| Audience Segments | 1..n (where surfaces) | Select 0 | Save disabled if required by form |
| Platform (concept Production Targets) | 1..n | Select 0 | Save disabled or visible error |
| Platform+ContentType dedupe | No duplicates | Select same combo twice | Second selection should be a no-op (first remains) |

### 3.6 Schema persistence audit

For every field entered in the UI, verify the corresponding persisted JSON path on disk:

| UI field | AFS path (item file) | Expected type | Notes |
|---|---|---|---|
| Title | `.title` | string | |
| Description | `.description` | string | never null on save |
| Pillars | `.pillarIds` | string[] | IDs, not names |
| Segments | `.segmentIds` | string[] | IDs, not names |
| Tags (idea) | `.tags` | string[] | **currently null — D-04** |
| Stage | `.stage` | `idea`/`concept`/`post`/`production-brief` | |
| Status | `.status` | `draft`/`in-progress`/`review`/`scheduled`/`published` | |
| Hook | `.hook` | string | concept |
| Objective | `.objective` | string | concept, brief |
| Platform | `.platform` | string | concept, brief |
| Content Type | `.contentType` | string | concept, brief |
| Tone Preset | `.tonePreset` | string | brief |
| Key Message | `.keyMessage` | string | brief |
| CTA | `.cta` | `{type, text}` | concept, brief |
| Production Targets | `.productionTargets` | `[{platform, contentType}]` | **D-08** (name), **D-09** (missing postId) |
| Archived | `.archived` | boolean | |
| Created / updated | `.createdAt`, `.updatedAt` | ISO string | updated bumps on every save |

After every save, run `fetch fuzzee-coffee content-items <item>.json | jq` and confirm every row above.

### 3.7 Index-row lean-projection audit

Index rows must contain **exactly** these keys (lean projection per [content-items.service.ts:37-55](../../apps/blinksocial-api/src/content-items/content-items.service.ts)):

```
id, stage, status, title, platform, contentType, pillarIds, segmentIds,
owner, parentIdeaId, parentConceptId, scheduledDate, archived, createdAt, updatedAt
```

After every mutation, assert the index row has no extra keys (`production`, `description`, `hook`, `cta`, `tags`, `objective`, `keyMessage`, `productionTargets` must not leak into index rows):

```bash
fetch fuzzee-coffee content-items _content-items-index.json \
  | jq '.items[] | keys' \
  | jq -s 'unique | if length > 1 then "MIXED KEYS — defect" else .[0] end'
```

Expected: exactly the 15 keys above. Any extra or missing key is a defect.

---

## Part 4 — Input Edge-Case Matrix

Run this matrix against every text-input field identified in §2 unless a TC says otherwise. Pair each probe with an AFS verification.

| Probe ID | Input value | Expected persistence | Expected render |
|---|---|---|---|
| E-01 | `""` (empty) | Required → blocked; optional → empty string | N/A |
| E-02 | `" "` (single space) | Treated as empty for required fields | Save blocked |
| E-03 | `"\t\n"` | Treated as empty | Save blocked |
| E-04 | `"a"` (single char) | Stored verbatim | 1-char render |
| E-05 | at-max-length string | Stored verbatim | counter at max, valid |
| E-06 | max+1 string | Truncated to max OR blocked | counter shows overflow or error |
| E-07 | `"   TC40   "` (whitespace padded) | Agent-defined: trim vs preserve; document behavior | Document either |
| E-08 | `"TC40-unicode—ẽéÑâ中文🎉"` | Verbatim | RTL-safe; emoji renders |
| E-09 | `"עברית"` | Verbatim | RTL direction |
| E-10 | `"<script>alert(1)</script>"` | Verbatim string | Rendered as escaped text, no script execution |
| E-11 | `"<img src=x onerror=alert(1)>"` | Verbatim | Escaped; no alert fires |
| E-12 | `"'; DROP TABLE items; --"` | Verbatim | No crash; no AFS disruption |
| E-13 | `"{\"key\": \"value\"}"` | Verbatim string, not parsed | Rendered as literal JSON |
| E-14 | `"a\u0000b"` | Verbatim OR rejected; never crash | Document outcome |
| E-15 | `"a".repeat(100000)` | Truncated or blocked | No UI freeze > 500 ms |
| E-16 | `"多行\n文本"` in textarea | Preserved | Newline renders |
| E-17 | `"multi\nline"` in single-line input | Newline stripped OR blocked | Document |
| E-18 | `"\"quoted\""` | Preserved | Displays with quotes |
| E-19 | `"C:\\path\\file"` | Preserved | Displays with backslashes |
| E-20 | `"https://evil.com?a=b&c=d"` | Stored string, not clicked | Rendered as plain text (unless field is explicitly a URL field with hyperlink rendering) |

---

## Part 5 — Original Test Cases (TC-1 .. TC-19, enhanced)

Each original TC is enhanced with:
- **Explicit selectors** (replacing ambiguous "click the + button")
- **Pre-state snapshot** and **post-state snapshot** curls
- **Negative probes** where applicable
- **Accessibility checks** (focus, ARIA, keyboard)
- **Data-integrity cross-checks**

---

### TC-1: Bootstrap — first create in empty `content-items` namespace

**Purpose.** Verify that when `content-items/` does not yet exist on a tenant, creating the first idea via the UI creates both the item file and the primary index manifest.

**Preconditions.**
```bash
# Run the purge snippet from §1.2, then confirm empty:
curl -s "http://localhost:8000/v1/fuzzee-coffee/dirs?namespace=content-items" | jq '.entries'
# Expected: []
```

**Pre-state guard (G-4).** Open `http://localhost:4200/workspace/fuzzee-coffee/content`. **If any cards render, record a defect** (mock fallback on empty real state — D-01). Hard-reload (`Cmd+R`) — still expect empty.

**UI Steps.**
1. From the Ideas column header, click the `Add Ideas` button (ARIA label `Add Ideas`).
2. In the modal, confirm Type dropdown reads `Idea` and Mode tab is `Quick Add`.
3. In the TITLE input, type `TC1 bootstrap idea`.
4. In the DESCRIPTION textarea, type `first idea ever`.
5. In the CONTENT PILLARS section, click the first pillar chip.
6. **Probe defect D-03.** Scroll the modal. If no AUDIENCE SEGMENTS section exists, record D-03. Otherwise, select the first segment.
7. Click `Save Idea`.

**Accessibility checks.**
- Modal opens with focus on the first interactive control (or a focusable container). Record failure if focus lands on body.
- `Esc` closes the modal. Record if it does not.
- Tab-navigation traverses TYPE → MODE → TITLE → DESCRIPTION → pillar chips → CANCEL → SAVE in visible reading order.

**Verification via AFS API.**
```bash
# 1. content-items namespace now exists
curl -s "http://localhost:8000/v1/fuzzee-coffee/namespaces" | jq '.namespaces | index("content-items")'
# Expected: non-null integer

# 2. Two files: the item and the index
curl -s "http://localhost:8000/v1/fuzzee-coffee/dirs?namespace=content-items" | jq '.entries | map(.name)'
# Expected: ["c-<uuid>.json", "_content-items-index.json"] (order may vary)

# 3. Item file contents
ITEM_NAME=$(listItemFiles fuzzee-coffee | head -n1)
fetch fuzzee-coffee content-items "$ITEM_NAME"

# 4. Index contents
fetch fuzzee-coffee content-items _content-items-index.json
```

**Expected Results.**
- Item file JSON:
  - [ ] `stage == "idea"`, `status == "draft"`
  - [ ] `title == "TC1 bootstrap idea"`, `description == "first idea ever"`
  - [ ] `pillarIds.length == 1`, `segmentIds.length == 1` (fail if D-03 present; record partial)
  - [ ] `createdAt == updatedAt`, both ISO
  - [ ] `archived` absent or `false`
  - [ ] `tags == []` (fail if null → D-04)
- Index file JSON:
  - [ ] `totalCount == 1`
  - [ ] `items[0].id` equals the item file's id
  - [ ] Lean projection: only the 15 keys in §3.7
  - [ ] `items[0].platform == null`, `items[0].contentType == null`, `items[0].parentIdeaId == null`, `items[0].parentConceptId == null`, `items[0].scheduledDate == null`
  - [ ] `lastUpdated >= items[0].updatedAt`
- [ ] `_content-items-archive-index.json` NOT present yet.

**Data Integrity Checks.** Run the union+lean-projection audit from §3.7.

**Post-state.** Hard reload. Confirm: kanban shows exactly 1 card in Ideas column titled `TC1 bootstrap idea`. Pipeline count chip reads `1 items`. **Any other count is a defect** (D-02 if duplicates appear).

---

### TC-2: Create Idea — field-level verification

**Purpose.** Create a second idea and verify every field in the item file and index row.

**Preconditions.** TC-1 completed.

**UI Steps.**
1. Click `Add Ideas`.
2. TITLE: `TC2 idea A`. DESCRIPTION: `idea-A description`.
3. Select two pillars (record the selected ids, e.g., `pillar-2` + `pillar-4`).
4. If Audience Segments present, select one.
5. Click `Save Idea`.

**Negative probes.**
- **N-1:** Reopen `Add Ideas`. Enter only a title, leave pillars empty, click Save Idea. **Expected:** save succeeds (pillars optional on idea form per §2.1.1 — but record if behavior contradicts spec).
- **N-2:** Open `Add Ideas`, leave Title blank. **Expected:** Save Idea button disabled.
- **N-3:** Reopen, enter Title = `   ` (whitespace only), click Save. **Expected:** treated as empty → save disabled.
- **N-4:** Reopen, click pillar A, pillar B, pillar C, pillar D (4 pillars). **Expected:** 4th click rejected (chip not toggling on) OR save blocked with error.

**Verification via AFS API.**
```bash
curl -s "http://localhost:8000/v1/fuzzee-coffee/dirs?namespace=content-items" | jq '.entries | map(.name)'
for NAME in $(listItemFiles fuzzee-coffee); do
  echo "=== $NAME ==="
  fetch fuzzee-coffee content-items "$NAME"
done
fetch fuzzee-coffee content-items _content-items-index.json | jq '.items | length, .totalCount'
```

**Expected Results.**
- [ ] Two `c-*.json` files exist.
- [ ] New item: `stage=idea`, `status=draft`, `pillarIds.length == 2`, `segmentIds.length == 1`, `tags == []`, `createdAt == updatedAt`.
- [ ] Primary index `totalCount == 2`.
- [ ] New index row matches lean projection with nulls for platform/contentType/parents/scheduledDate.
- [ ] No duplicate `id`s across index rows.

---

### TC-3: Create Concept from existing Idea

**Purpose.** Verify that creating a Concept with a `parentIdeaId` persists all concept-specific fields.

**Current blocker.** Per **D-06**, the UI stage-advance flow mutates the idea in place rather than creating a linked concept. For this TC, document the actual behavior and run the field checks against the resulting concept.

**UI Steps.**
1. Open the TC-2 idea detail page (click the `TC2 idea A` card).
2. Click the `Concept →` button (top-right).
3. Observe: stage badge flips IDEA → CONCEPT. Record this behavior + whether a new item was created (check with `listItemFiles fuzzee-coffee`).
4. Click the title (`TC2 idea A`) to enter inline-edit; change to `TC3 concept A`. Tab out to save.
5. Fill concept fields (all present in UI; missing ones are defects per D-07):
   - Description: preserves `idea-A description` (or edit to longer ≥ 50 chars)
   - Hook: `These 5 breakfasts fight inflammation.`
   - Content Goal: click `Engagement` (note: `education` not available — D-10)
   - Production Targets: Instagram → `Carousel`, LinkedIn → `Document`
   - CTA Type: `Other`. CTA Text: `Save this`.
6. Per the spec, also attempt: Objective=`education`, Angle, Format notes, claimsFlag, Source link, Risk level, Target publish window. **If fields are absent from UI, record D-07**.

**Verification via AFS API.**
```bash
# Find the concept file
for NAME in $(listItemFiles fuzzee-coffee); do
  STAGE=$(fetch fuzzee-coffee content-items "$NAME" | jq -r '.stage')
  [ "$STAGE" = "concept" ] && CONCEPT_FILE=$NAME && break
done
fetch fuzzee-coffee content-items "$CONCEPT_FILE" > /tmp/concept.json
jq '{stage,status,parentIdeaId,title,hook,objective,keyMessage,angle,formatNotes,claimsFlag,sourceLinks,riskLevel,targetPublishWindow,targetPlatforms,productionTargets,cta}' /tmp/concept.json
fetch fuzzee-coffee content-items _content-items-index.json | jq '.items[] | select(.stage=="concept")'
```

**Expected Results.**
- [ ] `stage == "concept"`
- [ ] Document observed `status` value (spec expected `in-progress` or `draft`)
- [ ] `parentIdeaId` **should** reference an idea's id — **D-06** if missing
- [ ] All concept-specific fields persist at the correct JSON path
- [ ] `productionTargets` has 2 entries in insertion order — **D-08** if named `productionTargets`; expected `targetPlatforms`
- [ ] Each entry has `postId: null` — **D-09** if missing
- [ ] Index row has the lean field set only; no `hook`, `objective`, `cta`, `productionTargets`

**Data Integrity Checks.**
- [ ] Concept file parses as valid JSON
- [ ] If `parentIdeaId` present, it points to an extant idea file
- [ ] Index row's `parentIdeaId` matches file's

---

### TC-4: Create Post via production-brief path

**Purpose.** Verify that creating a Post from the `Add Posts in Production` action persists stage/status and the full `production.brief` block.

**Pre-state snapshot.** `listItemFiles fuzzee-coffee` count (record before and after).

**UI Steps.**
1. In the Posts in Production column header, click the `Add Posts in Production` button.
2. TITLE: `TC4 post`. DESCRIPTION: `TC4 production brief description`.
3. CONTENT PILLARS: pick one.
4. PLATFORM: `Instagram`. CONTENT TYPE: `Reel`.
5. OBJECTIVE: `Engagement`. TONE PRESET: `Casual`.
6. KEY MESSAGE: `Morning mobility resets your day`.
7. AUDIENCE SEGMENTS: pick one.
8. CTA Type: `Other`. CTA Text: `Follow us`.
9. Click `Save Brief`. (If the flow prompts to link a concept, pick the TC-3 concept as `parentConceptId`.)

**Negative probes.**
- **N-1:** Reopen modal, leave PLATFORM blank → Save Brief disabled.
- **N-2:** Select PLATFORM only, not CONTENT TYPE → Save Brief disabled.
- **N-3:** Leave KEY MESSAGE blank → Save Brief disabled.
- **N-4:** Enter KEY MESSAGE > 140 chars → truncated OR blocked; verify AFS never has > 140.

**Verification via AFS API.**
```bash
for NAME in $(listItemFiles fuzzee-coffee); do
  STAGE=$(fetch fuzzee-coffee content-items "$NAME" | jq -r '.stage')
  [ "$STAGE" = "post" ] || [ "$STAGE" = "production-brief" ] && POST_FILE=$NAME && break
done
fetch fuzzee-coffee content-items "$POST_FILE" > /tmp/post.json
jq '{stage,status,platform,contentType,parentConceptId,title}' /tmp/post.json
jq '.production // "MISSING"' /tmp/post.json
jq '.production.brief.strategy // "MISSING"' /tmp/post.json
jq '.production.brief.platformRules // "MISSING"' /tmp/post.json
jq '.production.brief.creativePlan // "MISSING"' /tmp/post.json
jq '.production.brief.compliance // "MISSING"' /tmp/post.json
```

**Expected Results.**
- [ ] `stage == "post"` — **D-11** if `production-brief`
- [ ] `status == "in-progress"`
- [ ] `platform == "instagram"`, `contentType == "reel"`
- [ ] `parentConceptId` set if concept linked
- [ ] `production.brief.strategy.{objective,audienceSegmentIds,pillarIds,keyMessage,ctaType,ctaText,tonePreset,doChecklist,dontChecklist}` — **D-13** if any missing
- [ ] `production.brief.platformRules.{durationTarget,hookType,loopEnding}` — **D-13**
- [ ] `production.brief.creativePlan.{hook,storyArc,musicNotes}` — **D-13**
- [ ] Index row is lean; no `production` leak

**Accessibility.**
- `Esc` closes the modal.
- `Tab` navigation visits every required field.
- Required fields are programmatically marked (`aria-required="true"` or `required` attr).

---

### TC-5: Edit existing Idea

**Purpose.** Editing an idea replaces the item file in place and updates the same row in the primary index.

**Caveat.** If TC-3 consumed the TC-2 idea (D-06), substitute TC-1's idea for this TC and record the substitution.

**UI Steps.**
1. Open the target idea's detail page.
2. Click the title → type `TC1 bootstrap idea (edited)`. Tab out to save.
3. Click the description → clear, type `edited desc`. Tab out.
4. Add a tag `edited-tag` (via tag editor if present — **D-18** if absent).

**Verification via AFS API.**
```bash
ITEM_NAME=<idea item name>
BEFORE=$(fetch fuzzee-coffee content-items "$ITEM_NAME" | jq -r '.updatedAt')

# After save:
fetch fuzzee-coffee content-items "$ITEM_NAME" | jq '{title,description,tags,createdAt,updatedAt}'
AFTER=$(fetch fuzzee-coffee content-items "$ITEM_NAME" | jq -r '.updatedAt')
[ "$AFTER" \> "$BEFORE" ] && echo "updatedAt bumped" || echo "NOT bumped"

fetch fuzzee-coffee content-items _content-items-index.json | jq '.items[] | select(.id=="'"${ITEM_NAME%.json}"'") | {title,updatedAt}'
fetch fuzzee-coffee content-items _content-items-index.json | jq '.lastUpdated'
```

**Expected Results.**
- [ ] title/description updated verbatim
- [ ] `tags == ["edited-tag"]` — **D-04** if `tags==null`, **D-18** if no UI to add
- [ ] `updatedAt > createdAt` and `> BEFORE`
- [ ] Index row reflects the new title and `updatedAt`
- [ ] `lastUpdated` on index bumped
- [ ] File count unchanged (no duplicate file)
- [ ] Only one index row matches the item id

---

### TC-6: Edit Concept `targetPlatforms` array

**Purpose.** Adding and removing target-platform entries must persist.

**UI Steps.**
1. Open the concept detail.
2. In Production Targets → Facebook → click `Feed Post`. (Result: three entries.)
3. In Production Targets → LinkedIn → click `Document` again (to deselect). (Result: two entries.)

**Verification.**
```bash
CONCEPT_NAME=<concept>
fetch fuzzee-coffee content-items "$CONCEPT_NAME" | jq '.productionTargets, .targetPlatforms // "not-present"'
```

**Expected Results.**
- After step 2: three entries in insertion order (instagram/carousel, linkedin/ln-document, facebook/fb-feed-post).
- After step 3: two entries (instagram/carousel, facebook/fb-feed-post).
- [ ] Each entry has `postId: null` — **D-09** if missing
- [ ] Field name is `targetPlatforms` per spec — **D-08** if `productionTargets`
- [ ] No duplicate platform/contentType pairs

**Negative probe.**
- Toggle all targets off. Attempt save. Concept must either block save (required field) or permit; document observed behavior.

---

### TC-7: Edit Post full production fields

**Status.** **Currently BLOCKED by D-11 + D-12** — posts created via `+ Posts in Production` have `stage='production-brief'` and their detail page renders "This view is coming soon."

If the UI path is later unblocked, probe the sections below:

**UI Steps (intended).**
1. Open the post detail (`/workspace/fuzzee-coffee/content/<post-id>`).
2. Fill each section:
   - Outputs: postCopy, script, hook, hashtags (`#test`, `#mvp`), mentions (`@x`), ctaLine
   - Blueprint: 3 units (hook, value, cta), set `formatCoherenceConfirmed`, `logicalProgressionConfirmed`, `accessibilityPlanConfirmed` all true; aspectRatio `9:16`, runtimeSeconds `60`, unitCountTarget `3`
   - Assets: one master upload `video-final.mp4` with size and addedAt
   - Packaging: publishAction `schedule`, visibility `public`, scheduleAt ISO, title, packagedCopy, keywords (`morning routine`, `mobility`)
   - QA: 3 checklist items in groups `brand`, `accessibility`, `links`; approvals `brand-reviewer` (approved) and `publisher` (pending); qaNotes `ready for publish`
   - Activity: events `status`, `approval`, `asset`, `qa`, `packaging`; one decisionLog entry
3. Save.

**Verification.**
```bash
POST_NAME=<post>
fetch fuzzee-coffee content-items "$POST_NAME" > /tmp/post.json
jq '.production.outputs | {postCopy,script,hook,hashtags,mentions,ctaLine}' /tmp/post.json
jq '.production.outputs.blueprintData | {units,formatCoherenceConfirmed,logicalProgressionConfirmed,accessibilityPlanConfirmed,aspectRatio,runtimeSeconds,unitCountTarget}' /tmp/post.json
jq '.production.outputs.assetsData.masterUploads' /tmp/post.json
jq '.production.outputs.packagingData' /tmp/post.json
jq '.production.outputs.qaData | {humanChecklist,approvals,qaNotes}' /tmp/post.json
jq '.production.outputs.activityData | {events,decisionLog}' /tmp/post.json
```

**Expected Results.**
- Each query returns the values typed; arrays preserve UI order.
- Index row has only the lean field set (no `production` leak).

---

### TC-8: Status transitions (draft → in-progress → review → scheduled → published)

**Status.** **Currently BLOCKED by D-16** — no status selector exists on idea or concept detail pages.

**Intended UI Steps.**
1. Pick an idea; advance status via detail-page status chip or kanban drag.
2. After each transition, verify:

```bash
ITEM_NAME=<item>
fetch fuzzee-coffee content-items "$ITEM_NAME" | jq '{status,updatedAt}'
fetch fuzzee-coffee content-items _content-items-index.json | jq '.items[] | select(.id=="'"${ITEM_NAME%.json}"'") | {status,updatedAt}'
```

**Expected Results.**
- [ ] Item file status == Index row status at each point
- [ ] `updatedAt` is strictly monotonically increasing
- [ ] `lastUpdated` on index bumps on every transition

**Negative probe.**
- Attempt an illegal transition (e.g., draft → published). Expected: blocked with a clear error. Document observed behavior.

---

### TC-9: Stage advance (idea → concept → post)

**UI Steps.**
1. Create a fresh idea TC9-idea.
2. From idea detail, click `Concept →`. **Current behavior (D-06):** mutates the idea in place. Record new state.
3. Click `Move to Production`. **Current blocker (D-15):** button disabled with no indication why.

**Verification.**
```bash
fetch fuzzee-coffee content-items "$ITEM_NAME" | jq '{stage,status,updatedAt,parentIdeaId,parentConceptId}'
fetch fuzzee-coffee content-items _content-items-index.json | jq '.items[] | select(.id=="'"${ITEM_NAME%.json}"'") | {stage,status,updatedAt,parentIdeaId,parentConceptId}'
```

**Expected Results.**
- [ ] Stage transitions land in both file and index
- [ ] `updatedAt` bumps each time
- [ ] After idea→concept, `parentIdeaId` references the original — **D-06** if not
- [ ] After concept→post, `parentConceptId` references the concept
- [ ] Promotion initializes expected fields as empty (not `undefined`)

---

### TC-10: Archive from kanban — primary → archive index move

**Preconditions.** Pick any active item. Snapshot both indexes.

**UI Steps.**
1. Open item detail.
2. Click kebab `...` → `Archive`. (No confirmation dialog currently — document as TC-19-style caveat if spec requires one.)
3. Navigate back to kanban.

**Verification.**
```bash
ITEM_NAME=<item>
ID=${ITEM_NAME%.json}

fetch fuzzee-coffee content-items "$ITEM_NAME" | jq '{archived,updatedAt}'
fetch fuzzee-coffee content-items _content-items-index.json | jq '.items | map(.id) | index("'"$ID"'")'
fetch fuzzee-coffee content-items _content-items-archive-index.json | jq '.items | map(.id) | index("'"$ID"'")'
fetch fuzzee-coffee content-items _content-items-index.json | jq '{totalCount,lastUpdated}'
fetch fuzzee-coffee content-items _content-items-archive-index.json | jq '{totalCount,lastUpdated}'
```

**Expected Results.**
- [ ] `item.archived == true`, `updatedAt` bumped
- [ ] Primary index no longer lists the id; totalCount -1; lastUpdated refreshed
- [ ] Archive index lists the id exactly once; totalCount +1; lastUpdated refreshed
- [ ] Archive row has `archived == true`
- [ ] `primary.totalCount + archive.totalCount == fileCount fuzzee-coffee`

---

### TC-11: Show Archived filter

**UI Steps.**
1. Confirm Show Archived is off. Archived item from TC-10 is not visible.
2. Open filter panel. Toggle Show Archived on.
3. Verify only archived items visible; active items disappear.
4. Toggle off. Verify active items return.

**Network probe.** DevTools Network tab: step 2 triggers `GET /api/workspaces/fuzzee-coffee/content-items/archive-index` once. Step 4 does NOT re-fetch.

**Expected Results.**
- [ ] Kanban content matches the active signal
- [ ] No 500 / 404
- [ ] Client does not apply a `!archived` filter on the primary signal
- [ ] Toggling does not mutate AFS

---

### TC-12: Unarchive

**Status.** **Currently BLOCKED by D-17** — no Unarchive action on idea detail.

For posts (stage=post), the post-detail header has conditional Archive/Unarchive, which should work. Verify:

**UI Steps.**
1. With Show Archived on, open an archived post.
2. Click kebab `...`. **Expected:** menu shows `Unarchive`, not `Archive`.
3. Click `Unarchive`.
4. Toggle Show Archived off. Confirm item returns to its active column.

**Verification.**
```bash
fetch fuzzee-coffee content-items "$ITEM_NAME" | jq '{archived,updatedAt}'
fetch fuzzee-coffee content-items _content-items-index.json | jq '.items | map(.id) | index("'"$ID"'")'
fetch fuzzee-coffee content-items _content-items-archive-index.json | jq '.items | map(.id) | index("'"$ID"'")'
```

**Expected Results.**
- [ ] `item.archived == false`, `updatedAt` bumped
- [ ] Primary index has the id; archive does not
- [ ] Row does not appear in both indexes
- [ ] Primary totalCount +1; archive totalCount -1

**Extra coverage.**
- **Rapid toggle:** archive → unarchive → archive → unarchive in quick succession. Watch for race: both indexes should settle correctly, no duplicate rows, file count unchanged.

---

### TC-13: Delete content item

**UI Steps.**
1. Choose an active item.
2. Click kebab `...` → `Delete`.
3. **Expected:** confirmation dialog. **Current behavior (D-19):** delete fires immediately with no confirm.

**Verification.**
```bash
curl -s "http://localhost:8000/v1/fuzzee-coffee/dirs?namespace=content-items" | jq '.entries | map(.name)'
# Expected: the item's c-<id>.json is NOT in the list

fetch fuzzee-coffee content-items _content-items-index.json | jq '.items | map(.id) | index("'"$ID"'")'
# Expected: null
```

**Expected Results.**
- [ ] Item file gone from AFS
- [ ] Entry removed from its index; totalCount -1; lastUpdated refreshed
- [ ] No dangling index row
- [ ] File count == primary.totalCount + archive.totalCount

**Negative probe.**
- Try to delete an idea that has a child concept pointing at it via parentIdeaId. **Expected:** the UI blocks or cascade-deletes consistently. Document behavior.

---

### TC-14: Kanban label rename

**UI Steps.**
1. Open the content page.
2. Inspect the kanban columns.

**Expected Results.**
- [ ] Third column heading reads `Posts in Production` (count suffix `(<n>)` ok)
- [ ] Other columns: `Ideas`, `Concepts`, `Review & Schedule`, `Published`

**Source check.**
```bash
grep -n "In Production\|Posts in Production" apps/blinksocial-web/src/app/pages/content/content.constants.ts
# Expected: only "Posts in Production" appears
```

---

### TC-15: Filter panel (pillar, platform, content type, search)

**Preconditions.** Seed a variety of ideas/concepts/posts covering multiple pillars, platforms, content types.

**UI Steps.**
1. Open Filter panel.
2. Select a single pillar. Confirm only items tagged with that pillar remain.
3. Add a platform filter. Confirm the intersection.
4. Add a content type filter. Confirm the intersection.
5. Type a search term matching at least one remaining item's title.
6. Click `Clear all`.

**Edge probes.**
- Search with regex metacharacters: `.*[TC`. Expected: treated as literal substring; no crash.
- Search with leading/trailing whitespace: `  TC1  `. Expected: trimmed; matches TC1.
- Search case: `tc1 BOOTSTRAP`. Expected: case-insensitive.
- Chip × on active-filter strip: removes only that chip; other filters persist.
- Filter + Show Archived on together: confirm intersection applied correctly.

**Expected Results.**
- [ ] Each filter narrows the visible set correctly
- [ ] Clearing all restores the full active set
- [ ] No AFS calls fire during filter operations (Network tab)
- [ ] Counts in column headers update reactively
- [ ] Filter state does not mutate AFS

---

### TC-16: Concurrency / refresh

**UI Steps.**
1. Create a fresh idea; edit its description.
2. Hard reload (`Cmd+R`).

**Expected Results.**
- [ ] Idea visible in Ideas column with updated description
- [ ] No console errors
- [ ] Index and file agree

**Multi-tab probe.**
1. Open content page in tab A.
2. Open the same item's detail in tab B.
3. In tab A, edit the title.
4. In tab B, observe: does the title update without reload (expected: no, unless there's a live-update mechanism) or does it stay stale?
5. In tab B, edit the description and save.
6. In tab A, reload — expect both edits persisted.
7. Race: in tab A, edit title; in tab B, edit title; both save at roughly the same time. Document last-writer-wins behavior.

---

### TC-17: Server-side mock fallback (AGENTIC_FS_URL unset)

**Purpose.** Validate the server-side mock fallback path — the **only** path where mocks are active. Per G-4, UI-level mocks do not exist in this codebase post-wiring; the frontend always reads `/api/*`. Mocks are served by the API when `AGENTIC_FS_URL` is unset (demo mode, AFS offline, UI-only development).

**Setup.**
```bash
# Stop the API server.
# In .env (root), comment out or unset AGENTIC_FS_URL.
# Restart: npm run start:api
```

**UI Steps.**
1. Navigate to `/workspace/hive-collective/content`.
2. Confirm kanban renders the mock dataset for `hive-collective` (see [apps/blinksocial-api/src/mocks/data/hive-collective/content-items/](../../apps/blinksocial-api/src/mocks/data/hive-collective/content-items/) for the authoritative fixtures — counts and titles should match the files on disk).
3. Toggle Show Archived on; confirm the archive mock set (or empty, if no archived fixtures) renders without 500.
4. Toggle off.
5. Click `+ New Content` and create an Idea. Confirm it appears in the kanban for the session.
6. Reload. Confirm the created item is NOT persisted (mocks are in-memory only).
7. Network tab: confirm `GET /api/workspaces/hive-collective/content-items/index` returns 200 with the mock payload.
8. Confirm the frontend `※` mock indicator appears on content-items features (if implemented; D-note if absent).
9. Navigate to `/workspace/fuzzee-coffee/content`. Confirm fuzzee-coffee also renders its mock dataset from [apps/blinksocial-api/src/mocks/data/fuzzee-coffee/content-items/](../../apps/blinksocial-api/src/mocks/data/fuzzee-coffee/content-items/) (if present) — the mock path is server-wide, not tenant-specific.

**Teardown.** Re-set `AGENTIC_FS_URL`, restart API.

**Expected Results.**
- [ ] No 500 responses
- [ ] No console errors
- [ ] Mock items visible; archive filter empty / mocked gracefully
- [ ] Create action echoes; reload clears the in-session item
- [ ] All network responses 200
- [ ] AFS not contacted (verify via `curl localhost:8000/...` returns unchanged — or shut AFS down entirely to prove it)
- [ ] Mock data files on disk unchanged
- [ ] **No UI-level mock fallback triggers.** Frontend code that conditionally swaps in mock data when `/api/*` returns empty is a defect — that logic belongs on the server, gated by `AGENTIC_FS_URL`.

---

### TC-18: Index integrity audit (curl-only)

Run after any TC that mutates state.

```bash
TENANT=fuzzee-coffee

FILES=$(curl -s "http://localhost:8000/v1/$TENANT/dirs?namespace=content-items" \
  | jq -r '.entries[] | select(.name | test("^c-")) | .name' | sort)

PRIMARY_IDS=$(fetch "$TENANT" content-items _content-items-index.json | jq -r '.items[].id' | sort)
ARCHIVE_IDS=$(fetch "$TENANT" content-items _content-items-archive-index.json | jq -r '.items[].id' 2>/dev/null | sort)

# (1) Union of index ids == file ids
ALL_INDEX=$(echo -e "$PRIMARY_IDS\n$ARCHIVE_IDS" | grep -v '^$' | sort -u)
FILE_IDS=$(echo "$FILES" | sed 's/\.json$//' | sort)
diff <(echo "$ALL_INDEX") <(echo "$FILE_IDS")
# Expected: no output

# (2) No id appears in both indexes
comm -12 <(echo "$PRIMARY_IDS") <(echo "$ARCHIVE_IDS")
# Expected: no output

# (3) Every archive-index row has archived==true in its item file
for ID in $ARCHIVE_IDS; do
  ARCH=$(fetch "$TENANT" content-items "$ID.json" | jq -r '.archived')
  [ "$ARCH" = "true" ] || echo "MISMATCH: $ID file.archived=$ARCH"
done

# (4) Every primary-index row has archived!=true in its item file
for ID in $PRIMARY_IDS; do
  ARCH=$(fetch "$TENANT" content-items "$ID.json" | jq -r '.archived // false')
  [ "$ARCH" = "true" ] && echo "MISMATCH: $ID in primary but file.archived=true"
done

# (5) totalCount fields match items.length
fetch "$TENANT" content-items _content-items-index.json | jq '.totalCount == (.items | length)'
fetch "$TENANT" content-items _content-items-archive-index.json | jq '.totalCount == (.items | length)'

# (6) [NEW] Every index row has exactly the lean 15-key projection (§3.7)
fetch "$TENANT" content-items _content-items-index.json \
  | jq '.items[] | keys == ["archived","contentType","createdAt","id","owner","parentConceptId","parentIdeaId","pillarIds","platform","scheduledDate","segmentIds","stage","status","title","updatedAt"]' \
  | grep -v true && echo "LEAN KEY MISMATCH"

# (7) [NEW] Every item file's stage is in {idea, concept, post, production-brief}
for ID in $(listItemFiles $TENANT | sed 's/\.json$//'); do
  S=$(fetch $TENANT content-items "$ID.json" | jq -r '.stage')
  case "$S" in idea|concept|post|production-brief) ;; *) echo "INVALID STAGE: $ID=$S" ;; esac
done

# (8) [NEW] Every item's status is in {draft, in-progress, review, scheduled, published}
for ID in $(listItemFiles $TENANT | sed 's/\.json$//'); do
  S=$(fetch $TENANT content-items "$ID.json" | jq -r '.status')
  case "$S" in draft|in-progress|review|scheduled|published) ;; *) echo "INVALID STATUS: $ID=$S" ;; esac
done
```

**Expected Results.** All eight checks produce no mismatch output; queries 5a/5b print `true`.

---

### TC-19: Field-level production persistence

**Status.** **Currently BLOCKED by D-11 + D-12** if test subject is a `+ Posts in Production` item.

**If unblocked:** every field typed into the UI's production editor must land at the correct JSON path. See verification queries in TC-7.

Additional probes when unblocked:
- [ ] `stage == "post"`, `status == "in-progress"`
- [ ] `updatedAt > createdAt`
- [ ] Index row contains ONLY the lean field set

---

## Part 6 — New Test Cases (TC-20 .. TC-45)

These cases cover UI affordances, edge behaviors, and cross-cutting concerns not addressed in TC-1..TC-19.

---

### TC-20: Field validation — Concept Description (50..400 chars)

**Purpose.** Exercise the min/max validation on concept description end-to-end.

**Preconditions.** A concept item exists.

**Probes.**

| Input length | Input | Expected UI | Expected AFS |
|---|---|---|---|
| 0 | `""` | Required error visible; save blocked | No mutation |
| 49 | `"a"×49` | Red counter `49/400 (min 50)`; save blocked OR permitted with soft warning | If permitted, AFS value = input |
| 50 | `"a"×50` | Counter turns valid color | AFS = input |
| 51 | `"a"×51` | Valid | AFS = input |
| 399 | `"a"×399` | Valid | AFS = input |
| 400 | `"a"×400` | Valid; counter at max | AFS = input |
| 401 | `"a"×401` | Input truncated to 400 OR save blocked | AFS ≤ 400 chars |
| Whitespace-only `"   "×60` | Treat as empty for required purposes OR literal | Document |
| Unicode `"é"×60` | Counter counts code points correctly (or code units — document) | Preserved |

Each probe should leave the item in a clean state (re-edit before next probe).

---

### TC-21: Field validation — Concept Hook (0..120 chars)

Same pattern as TC-20 for hook field:

| Input length | Expected UI state | Expected AFS |
|---|---|---|
| 0 | Empty OK (if optional); else blocked | |
| 100 | Counter tints warning color | AFS preserved |
| 119 | Valid | Preserved |
| 120 | At max | Preserved |
| 121 | Truncated OR blocked | AFS ≤ 120 |

---

### TC-22: Field validation — Brief Key Message (1..140 chars)

Same pattern for keyMessage field. Add probe:
- Enter 140 chars → save → re-open modal → verify field loads exactly 140 chars back.

---

### TC-23: Quick Add vs Generate Ideas mode switch

**Purpose.** Verify the mode tabs on Idea create modal work.

**UI Steps.**
1. Open `Add Ideas`. Default mode should be `Quick Add`.
2. Click `Generate Ideas` tab.
3. Observe: form changes — title/description fields replaced with `Focus Pillars` chip picker + `Generate Ideas` action + (after generation) an ideas grid with selectable cards.
4. Click back on `Quick Add`. Title/description return.
5. Switch between tabs rapidly 5 times. No state loss in the active tab's fields.

**Expected Results.**
- [ ] Tab switch is instant (no network call)
- [ ] Fields in one tab are preserved while the other tab is active
- [ ] Generate Ideas button is disabled until at least one focus pillar is picked

---

### TC-24: Generate Ideas AI flow

**Purpose.** Exercise the AI idea-generation endpoint.

**UI Steps.**
1. Open `Add Ideas` → `Generate Ideas` tab.
2. Pick 1–3 focus pillars.
3. Click `Generate Ideas`.
4. Observe: spinner appears; button disabled; after ≤ 15 s, a grid of 6 suggestion cards appears.
5. Select 2 cards via their checkboxes.
6. Click save.

**Expected Results.**
- [ ] Selected cards become item files in AFS
- [ ] Each item has `stage=idea`, `status=draft`, `title` from the generated suggestion
- [ ] Deselected cards produce no AFS write
- [ ] Index updated with new rows

**Failure probes.**
- With AI service offline (stub): generation surfaces an error message to the user; spinner clears; no silent hang.
- With no focus pillars: button remains disabled.

---

### TC-25: Generate Concept Options AI flow

**Purpose.** Exercise the `Generate Concept Options` panel on idea detail, and the concept-create AI-first flow.

**UI Steps.**
1. Open an idea detail.
2. In `Concept Options` panel, click `Generate Concept Options`.
3. Observe: 6 angles appear as selectable cards.
4. Pick one angle.
5. Verify: concept is created with the chosen angle's title and hook.

**Alternative flow:**
1. `+ Concepts` (column +). Observe pre-gen phase: Title field + Objective button grid.
2. Enter title, pick an objective, click `Generate Concept`.
3. After generation, verify full concept form populates with AI-generated description/hook.
4. Back arrow returns to pre-gen. Fields persist.

**Expected Results.**
- [ ] AI output populates the correct fields
- [ ] Saving persists the AI-generated values verbatim
- [ ] Errors from the AI service surface to the user

---

### TC-26: AI Assist buttons on description/hook

**UI Steps.**
1. Open a concept detail.
2. Click `AI Assist` next to the Description field.
3. Observe: button shows spinner; description populates with AI output.
4. Repeat for Hook field.
5. While AI Assist is pending, click AI Assist again — button should be disabled to prevent duplicate calls.

**Expected Results.**
- [ ] AI output appears in the bound field
- [ ] The field's character counter updates
- [ ] Debouncing / disable prevents double-firing
- [ ] Errors surface to the user

---

### TC-27: Kanban ↔ List view toggle

**UI Steps.**
1. Open content page. Default view is `Kanban`.
2. Click `List`. Layout switches to a single-column list of all items across stages.
3. Verify list shows: column icon (to indicate stage), title, description, pillar badges, platform icon, stage label, updated date.
4. Click any list row. Detail page opens.
5. Go back. List view retained (no reversion to kanban).
6. Hard reload. **Document behavior:** does view mode persist (localStorage) or reset to kanban?

**Expected Results.**
- [ ] List view renders without error
- [ ] All active items present in list, regardless of stage
- [ ] Clicking a row opens the same detail page as kanban click

---

### TC-28: Deep link to valid item

**UI Steps.**
1. Copy an item id from AFS. Paste URL `/workspace/fuzzee-coffee/content/<id>` into a fresh tab.
2. Observe: detail page loads directly without visiting kanban first.

**Expected Results.**
- [ ] No flicker / empty state / 404
- [ ] Back button returns to `/workspace/fuzzee-coffee/content` (kanban)

---

### TC-29: Deep link to nonexistent item id

**UI Steps.** Navigate to `/workspace/fuzzee-coffee/content/c-does-not-exist`.

**Expected Results.**
- [ ] Page renders a recognizable "not found" UI ("This item no longer exists." per `content-detail-page.component.html:11-17`)
- [ ] `Back to pipeline` button present and functional
- [ ] No console errors; no 500s
- [ ] No AFS writes

---

### TC-30: Deep link to archived item

**UI Steps.** Navigate to `/workspace/fuzzee-coffee/content/<archived-id>`.

**Expected Results.**
- [ ] Detail page loads (archived items are still fetchable)
- [ ] Stage badge shows correct stage; archive indicator should appear (TBD: visual indicator if implemented)
- [ ] Unarchive action visible (only guaranteed on post-detail per D-17)

---

### TC-31: Deep link to production-brief item

**UI Steps.** Navigate to `/workspace/fuzzee-coffee/content/<production-brief-id>`.

**Expected Results.** Currently: "This view is coming soon." (D-12). When fixed: should render the brief editor or redirect to post-detail.

---

### TC-32: Business Objective panel renders from settings

**Purpose.** Verify idea/concept detail pages load and render business objectives from `fuzzee-coffee/settings/business-objectives.json`.

**Preconditions.** Confirm:
```bash
curl -s "http://localhost:8000/v1/fuzzee-coffee/dirs?namespace=settings" \
  | jq '.entries | map(.name) | index("business-objectives.json")'
# non-null
```

And the file has ≥ 1 objective:
```bash
BID=$(curl -s "http://localhost:8000/v1/fuzzee-coffee/dirs?namespace=settings" | jq -r '.entries[] | select(.name=="business-objectives.json") | .file_id')
curl -s -X POST "http://localhost:8000/v1/fuzzee-coffee/files/batch" -H 'Content-Type: application/json' -d "{\"file_ids\":[\"$BID\"],\"include_content\":true}" | jq '.files[0].content | length'
# > 0
```

**UI Steps.** Open any idea or concept detail. Locate the `BUSINESS OBJECTIVE` panel.

**Expected Results.**
- [ ] Panel lists the objectives from AFS (statement, target, timeframe, status)
- [ ] Never displays "No business objectives have been set up." when AFS has items (**D-05**)

**Edge probe.** Delete the settings file (save first!), reload detail → panel should show the empty-state warning. Restore file.

---

### TC-33: Duplicate action

**UI Steps.**
1. Open an idea detail.
2. Kebab → `Duplicate`.
3. Observe: a new item appears in the Ideas column with a title like `TC1 bootstrap idea (copy)` or similar.

**Expected Results.**
- [ ] New item has a fresh `id` (different from source)
- [ ] Fields copied: title (+ copy suffix or similar), description, pillarIds, segmentIds, tags
- [ ] `createdAt = updatedAt = <new>`
- [ ] Index row added for the duplicate
- [ ] Original item untouched

Repeat for concept detail and post detail.

---

### TC-34: Copy link action

**UI Steps.**
1. Open an idea detail.
2. Kebab → `Copy link`.
3. Paste clipboard contents.

**Expected Results.**
- [ ] Clipboard contains `http://localhost:4200/workspace/fuzzee-coffee/content/<item-id>`
- [ ] Toast / visual confirmation shown
- [ ] No AFS mutation

---

### TC-35: Send back to Idea (concept only)

**UI Steps.**
1. Open a concept detail.
2. Kebab → `Send back to Idea`.

**Expected Results.**
- [ ] Stage flips concept → idea
- [ ] `updatedAt` bumps
- [ ] Concept-only fields: behavior should either be preserved in the item file (and hidden in the idea UI) or cleared. Document observed.
- [ ] Index row reflects new stage

---

### TC-36: Theme toggle + persistence

**UI Steps.**
1. Open content page. Default theme (light or dark per system preference).
2. Click theme toggle in header.
3. Verify: all `--blink-*` CSS variables shift (background, text, borders).
4. Reload. Theme persists.
5. Clear localStorage; reload. Theme returns to default.

**Expected Results.**
- [ ] Toggle fires instantly; no flash
- [ ] All colors on the page use tokens (spot-check a card: should not render white-on-white in dark mode)
- [ ] Theme value persists in localStorage
- [ ] `html[data-theme]` attribute flips

---

### TC-37: Keyboard navigation

**UI Steps.**
1. Open content page.
2. Tab key: should traverse focusable elements in reading order (search → view toggle → + New Content → Filter → kanban cards → column + buttons).
3. Focused element has visible focus ring.
4. Enter on a focused kanban card opens detail.
5. Shift+Tab reverses.
6. In a create modal, Esc closes; Enter submits (unless in a textarea).
7. In a dropdown, Arrow keys navigate; Enter selects; Esc closes.

**Expected Results.**
- [ ] No keyboard traps (Tab should always advance)
- [ ] Focus ring visible on every focusable element
- [ ] Modal focus trap: Tab loops inside modal while it's open
- [ ] Esc always closes the topmost modal/menu

---

### TC-38: Focus trap inside modal

**UI Steps.**
1. Open `+ New Content` modal.
2. Tab repeatedly until focus should wrap. Confirm focus stays inside the modal.
3. Close modal. Focus returns to the control that opened it (accessibility best practice).

**Expected Results.**
- [ ] Focus does not escape to the page background while modal is open
- [ ] On close, focus returns to the trigger

---

### TC-39: Inline-edit blur saves

**UI Steps.**
1. Open an idea detail.
2. Click the title → type new text.
3. Tab out (blur).
4. Without manual save, observe: AFS file `updatedAt` should bump and the new title should persist.

**Verification.** Run `fetch` on the item immediately after blur; title should already be updated.

**Expected Results.**
- [ ] Blur triggers save within 1 second
- [ ] `SAVED` indicator appears briefly
- [ ] AFS reflects the new value
- [ ] If network fails, the UI should surface an error (probe by stopping AFS or API briefly if possible)

---

### TC-40: Text-input edge-case matrix per field

Execute the matrix from §4 for every text input on the Concept detail page (title, description, hook, keyMessage, CTA text). For each probe, save and verify the AFS value.

Record outcomes in a table per field. A single field failing E-10 (script injection) is a security-adjacent defect and must be flagged as Major.

---

### TC-41: Filter combinations (pillar + platform + type + search + archived)

**UI Steps.**
1. Seed AFS with at least 10 items covering: 3 pillars × 3 platforms × 2 content types + 1 archived. Use `createItem` directly via API for speed.
2. Open Filter panel.
3. Select 2 pillars. Observe: OR within pillar filter.
4. Add 1 platform. Observe: AND between filter categories.
5. Add 1 content type.
6. Enter a search substring.
7. Toggle Show Archived on.
8. Verify filter behavior:
   - Multiple pillars = union
   - Different categories = intersection
   - Search + filters = intersection
   - Show Archived: swaps data source; filters still applied
9. Remove individual filters via chip × on the active-filter strip.
10. Click `Clear all`.

**Expected Results.**
- [ ] Filters behave as described (union within category, intersection across categories)
- [ ] Column counts reflect filtered totals
- [ ] Removing a chip keeps other chips active
- [ ] `Clear all` clears everything including search text

---

### TC-42: Cross-tenancy isolation

**UI Steps.**
1. Create an item in `fuzzee-coffee`.
2. Switch workspace to `hive-collective` via header workspace switcher.
3. Confirm: `fuzzee-coffee` item does NOT appear.
4. Confirm URL is `/workspace/hive-collective/content`.
5. Attempt deep link `/workspace/hive-collective/content/<fuzzee-coffee-item-id>`. **Expected:** 404 / not-found state.

**Expected Results.**
- [ ] No cross-tenant data leakage
- [ ] URL tenant matches workspace switcher state

---

### TC-43: Content Journey stepper behavior

**UI Steps.**
1. Open an idea detail. Stepper shows `1 Idea` (filled), `2 Concept` (empty), `3 Post` (empty).
2. Advance to concept via `Concept →`. Stepper updates: `1 ✓`, `2 Concept` (filled), `3 Post` (empty).
3. Stepper itself: does clicking a step do anything? Document the actual behavior (decorative vs. interactive).

**Expected Results.**
- [ ] Stepper updates reactively with stage
- [ ] If interactive, clicking `3` on a concept should either be disabled, or trigger "Move to Production"

---

### TC-44: SAVED indicator behavior

**UI Steps.**
1. Open a concept detail.
2. Edit the hook and tab out.
3. Observe `SAVED` indicator in header within 1 s of blur.
4. Rapidly edit and blur 5 times. Indicator should show consistent state (not flicker to error).
5. Wait 10 s after last edit. Indicator should stay `SAVED` (or fade).

**Expected Results.**
- [ ] Indicator uses `aria-live="polite"` (screen reader announces)
- [ ] Indicator accurately reflects saving state
- [ ] No false `SAVED` when actually still in-flight

---

### TC-45: Performance smoke

**UI Steps.**
1. With 50+ items in the primary index, reload `/workspace/fuzzee-coffee/content`.
2. Measure: time to first meaningful paint, time to interactive (DevTools Performance tab).
3. Scroll the kanban. Check for frame drops.
4. Type in the search box rapidly. Verify debouncing (no AFS call per keystroke — client-side filter only).
5. Open filter panel and toggle pillars rapidly. No lag.

**Expected Results.**
- [ ] Kanban renders within 2 s on localhost
- [ ] Search filtering is purely client-side (0 network calls during typing)
- [ ] Rapid filter toggles don't cause layout thrash
- [ ] Memory usage stable over 5 min of interaction

**Seed script for 50 items:**
```bash
for i in $(seq 1 50); do
  curl -s -X POST "http://localhost:3000/api/workspaces/fuzzee-coffee/content-items" \
    -H 'Content-Type: application/json' \
    -b cookies.txt \
    -d "{\"stage\":\"idea\",\"status\":\"draft\",\"title\":\"Seed $i\",\"description\":\"seed desc $i\",\"pillarIds\":[\"pillar-$((i%4+1))\"],\"segmentIds\":[]}" > /dev/null
done
```

---

### TC-46: Empty-state rendering

**UI Steps.**
1. Purge all items (§1.2).
2. Hard reload.
3. **Expected:** kanban renders 5 empty columns; each shows `No items` placeholder.
4. Toggle Show Archived. Expected: 5 empty columns with `No items`.

**Expected Results.**
- [ ] No mock fallback cards appear when AFS is configured (D-01)
- [ ] Each column renders its header and empty-state placeholder
- [ ] Pipeline count chip reads `0 items`

---

### TC-47: Pillar max-3 enforcement (concept detail)

**UI Steps.**
1. Open a concept detail.
2. In right-rail Content Pillars, try to select a 4th pillar.

**Expected Results.**
- [ ] 4th selection rejected (chip doesn't toggle on) OR visible error
- [ ] AFS never has `pillarIds.length > 3` for a concept
- [ ] Label displays `(max 3)` or equivalent

---

### TC-48: Move to Production preconditions

**UI Steps.**
1. Create a concept with only Title. Open detail.
2. Click `Move to Production`. Observe: button disabled.
3. Add Description (< 50 chars). Still disabled.
4. Fill Description (≥ 50 chars). Still disabled (hook required).
5. Fill Hook. Still disabled (objective required).
6. Fill Objective. Still disabled until Production Target added.
7. Add target + select at least 1 pillar + at least 1 segment.
8. Click `Move to Production`. Button should now be enabled and stage advances to post (or production-brief — D-11).

**Expected Results.**
- [ ] Button is disabled until all required fields are filled
- [ ] Disabled button should either be clearly disabled-styled OR show a tooltip listing missing fields (D-15 says it currently does neither clearly)
- [ ] On advance, the item keeps its id and all filled fields; new stage-specific fields initialize empty (per TC-9 D-check)

**Alternative probe (defect discovery).** For each required field, leave it missing and attempt to save — record whether the UI surfaces an error, silently fails, or hides the disabled state.

---

### TC-49: Brief step form lock behavior (post detail)

**UI Steps.**
1. Open a post detail (stage=post).
2. Brief step: fill Title, Description, Pillars, Segments, Content Goal, Tone, Key Message, CTA.
3. In Brief Status sidebar, progress bar fills.
4. Check `Approve` checkbox.
5. Observe: form fields lock (read-only), `Unlock Brief` button appears.
6. Click `Unlock Brief`. Fields become editable again.
7. After approve, the step `Builder` becomes navigable.

**Expected Results.**
- [ ] Lock affects all fields with the `locked icon` hint
- [ ] Unlock restores edit mode
- [ ] Approve state persisted in AFS (`production.brief.approved` or similar)
- [ ] Errors in form prevent approval (approve checkbox disabled)

---

### TC-50: Production Steps stubs (post detail)

**UI Steps.**
1. Open a post detail → step bar.
2. Click `Builder`. Observe: `step-placeholder` with "coming soon" text.
3. Click `Packaging`. Same.
4. Click `QA`. Same.
5. Click `Brief`. Returns to the functional brief form.

**Expected Results.**
- [ ] All four step buttons reachable
- [ ] Current step has `is-active` styling
- [ ] Stubs don't mutate AFS
- [ ] Approved brief shows `is-approved` styling on the Brief step

---

## Part 7 — Appendix: verification snippets

Copy-pasteable snippets for common checks. Use alongside TCs.

### A.1 Full-item dump
```bash
fetch fuzzee-coffee content-items <c-uuid>.json | jq
```

### A.2 Lean-projection confirm
```bash
fetch fuzzee-coffee content-items _content-items-index.json \
  | jq '.items[] | keys | sort | join(",")' \
  | sort -u
# Expected: one line with the 15 lean keys
```

### A.3 All stages enumerated
```bash
for ID in $(listItemFiles fuzzee-coffee | sed 's/\.json$//'); do
  fetch fuzzee-coffee content-items "$ID.json" | jq -r '"\(.id) \(.stage) \(.status) \(.archived // false)"'
done
```

### A.4 Fast workspace purge (between runs)
```bash
for fid in $(curl -s "http://localhost:8000/v1/fuzzee-coffee/dirs?namespace=content-items" | jq -r '.entries[] | .file_id'); do
  curl -s -X DELETE "http://localhost:8000/v1/fuzzee-coffee/files/$fid" > /dev/null
done
```

### A.5 Quick index diff
```bash
# Compares primary totalCount with actual items array length
fetch fuzzee-coffee content-items _content-items-index.json | jq '.totalCount == (.items | length)'
```

### A.6 Network-call watcher (DevTools Network tab alternative via curl loop)
```bash
# Snapshot before
BEFORE=$(curl -s "http://localhost:8000/v1/fuzzee-coffee/dirs?namespace=content-items" | jq '.entries | length')
# ... perform UI action ...
AFTER=$(curl -s "http://localhost:8000/v1/fuzzee-coffee/dirs?namespace=content-items" | jq '.entries | length')
[ "$BEFORE" = "$AFTER" ] && echo "no mutation (as expected)" || echo "mutation occurred"
```

### A.7 Screenshot naming convention (for AI agents)
- Pre-action: `/tmp/tc-NN-before-<short-desc>.png`
- Post-action: `/tmp/tc-NN-after-<short-desc>.png`
- Defect evidence: `/tmp/tc-NN-defect-D-XX.png`

---

## Change log

- **v2 (this revision)** — Added AI Agent Operating Guidelines (Part 0), full Element Inventory (Part 2), Field-Level Validation Matrix (Part 3), Input Edge-Case Matrix (Part 4), and 26 new test cases TC-20..TC-50 covering AI flows, list view, deep links, theme, keyboard, concurrency, validation edges, tenancy isolation, stub rendering, and performance. Every original test case now has explicit selectors, pre/post snapshots, accessibility checks, and cross-references to the defects surfaced in the v1 execution.
- **v1** — Original 19 integration test cases. Superseded.
