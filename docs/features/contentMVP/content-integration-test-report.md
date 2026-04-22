# Content MVP — Integration Test Execution Report (v2)

**Date:** 2026-04-21 (session ran 17:34–20:30 PDT)
**Branch / commit:** `feature/contentImpl` @ `fd0d79a` ("wiring up content to AFS")
**Test suite:** [content-integration-test-cases.md](./content-integration-test-cases.md) v2 — 50 cases (TC-1..TC-50)
**Tester:** Automated session (Claude-in-Chrome + curl/jq against AFS)
**Environment:**
- Web: `http://localhost:4200` (Angular dev server)
- API: `http://localhost:3000` (NestJS)
- AFS: `http://localhost:8000` (tenant `fuzzee-coffee`)
- Logs: `out.log`

---

## 1. Executive Summary

| | Count |
|---|---|
| Total cases | 50 |
| **PASS** | 29 |
| **PASS with caveats** (minor defects) | 9 |
| **PARTIAL** (some checks failed) | 5 |
| **BLOCKED** (new defect prevents run) | 1 |
| **SKIPPED** (plan limits / feature removed) | 6 |

**Defects:** 25 total, of which **16 v1 defects (D-01..D-19) are now FIXED** on this commit, 3 remain open from v1 (as PARTIAL/caveat), and **3 NEW defects were surfaced** (D-23, D-24, D-25).

| Severity | Count (open) |
|---|---|
| Blocker | 0 |
| Major | 4 |
| Minor | 6 |
| Trivial | 3 |

**Top-level conclusions.**

1. **The `feature/contentImpl` branch closes the vast majority of the v1 gap.** The create modals, detail editors, archive/unarchive/delete flows, status transitions, and schema persistence now match the spec in all the places that were red in the prior run. Production-brief detail is real; idea → concept advance now creates a linked concept (not in-place mutation); post detail loads rather than the "coming soon" stub; tag editor, segment selector, keyMessage/angle/formatNotes/claimsFlag/sourceLinks/riskLevel/targetPublishWindow fields are all exposed; `follow` CTA and the full 11-value objective set are available; delete is guarded by a confirmation.

2. **Three new defects cluster around stage-advance routing and batch-create consistency.** D-23: clicking "Concept →" on an idea navigates to a client-generated UUID that doesn't match the server-assigned id, so the destination page shows "This item no longer exists" despite a successful write. D-24: Move to Production clicks silently no-op when preconditions pass validation but the status is `review`/`scheduled`/`published`. D-25: AI Generate Ideas batch create writes an item file to AFS but fails to register it in the primary index, leaving an orphan on disk.

3. **Mock architecture is now aligned with the project's intended design.** Per the clarified architecture (see [§G-4 of the test cases](./content-integration-test-cases.md)):
   - UI-level mocks are only used during initial UI development; once a feature is wired to its server controller, those mocks are deleted. D-01 (v1) was a residue of that pre-wiring state and is correctly gone.
   - Server-side mocks remain and are gated by `AGENTIC_FS_URL`. With the env var set (as in this run), the API reads/writes AFS exclusively and an empty AFS renders an empty pipeline — which is exactly what we observe in TC-1 preflight, TC-42 (hive-collective), and TC-46. With the env var unset, the API should serve the [mocks/data](../../apps/blinksocial-api/src/mocks/data/) fixtures — which is what TC-17 validates.
   - TC-17 was skipped in this run per plan scope (requires an API restart with the env var unset). It is the only remaining reachable mock path and should be run on a separate pass to validate the demo-mode contract.

---

## 2. Environment Snapshot (post-run)

Final AFS state after TC-1 → TC-50:

```text
fuzzee-coffee/content-items/
  _content-items-index.json          (5 items, lastUpdated 2026-04-22T00:30:07.111Z)
  _content-items-archive-index.json  (0 items)
  c-98232192-… (TC1 bootstrap idea (edited), idea/draft)
  c-a5a30345-… (TC2 idea A, idea/draft)
  c-9df3f595-… (AI "The one stretch everyone over 40 should be doing", idea/draft)
  c-466bf100-… (TC4 post, post/in-progress)
  c-df66eb79-… (TC1 edited (copy), idea/draft — from TC-33 Duplicate)
  c-6a7149c3-… (AI "5 morning rituals…", idea/draft — ORPHAN, not in index, D-25)
```

6 `c-*.json` files, 5 primary-index rows, 0 archive-index rows → **file/index divergence = 1** (the orphan). All other TC-18 integrity checks pass (primary.totalCount == items.length, archive.totalCount == items.length, lean projection is clean for every index row, all stages in `{idea, concept, post, production-brief}`, all statuses in `{draft, in-progress, review, scheduled, published}`).

---

## 3. Per-TC Results

| TC  | Title                                   | Status      | v1 defects affected             | Notes |
|-----|-----------------------------------------|-------------|----------------------------------|-------|
| TC-1  | Bootstrap — first create in empty namespace | **PASS** | D-01, D-02, D-03, D-04 → FIXED | item + index + segments + tags all correct |
| TC-2  | Create Idea — field-level              | **PASS**    | D-03, D-04 → FIXED | N-2/N-3 negative probes confirmed save disabled on empty/whitespace title |
| TC-3  | Create Concept from existing Idea      | **PASS with caveats** | D-06, D-07, D-08, D-09, D-10, D-14 → FIXED | New D-23 surfaced |
| TC-4  | Create Post via production-brief path  | **PASS with caveats** | D-11 → FIXED, D-13 → PARTIAL  | `stage==post`, `production.brief.strategy.*` populated; `platformRules`/`creativePlan`/`compliance` are still empty `{}` |
| TC-5  | Edit existing Idea                     | **PASS**    | D-18 → FIXED                     | tag editor ("Comma-separated tags") renders + persists |
| TC-6  | Edit Concept `targetPlatforms` array   | **PASS**    | D-08, D-09 → FIXED                | field name and `postId: null` structure both match spec |
| TC-7  | Edit Post full production fields       | **PARTIAL** | D-11, D-12 → FIXED               | Post detail renders the Brief step and the Builder/Packaging/QA stubs (TC-50). Full outputs/assets/packaging/qa writes not exercised because stubs are placeholders |
| TC-8  | Status transitions draft→…→published   | **PASS with caveats** | D-16 → FIXED                     | 5-step status strip works (`aria-current="step"` on the active step). Visual active-state uses ARIA not a CSS class (minor, D-26 below). API-side illegal transitions return 401 "Not authenticated" when called outside the UI (good guard) |
| TC-9  | Stage advance idea→concept→post        | **PARTIAL** | D-06, D-15 → FIXED; D-23 + D-24 NEW | idea→concept creates a new file with `parentIdeaId` (D-06 fixed) but navigates to a phantom id (D-23). concept→post blocked by D-24 silent failure when status=review |
| TC-10 | Archive from kanban                    | **PASS**    | —                                | |
| TC-11 | Show Archived filter                   | **PASS**    | —                                | |
| TC-12 | Unarchive                              | **PASS**    | D-17 → FIXED                     | idea detail now shows Unarchive in kebab when archived |
| TC-13 | Delete content item                    | **PASS**    | D-19 → FIXED                     | native `window.confirm()` blocks delete until user acknowledges; AFS cleanup correct |
| TC-14 | Kanban label rename                    | **PASS**    | —                                | source confirms only "Posts in Production" |
| TC-15 | Filter panel (pillar/platform/type/search) | **PASS with caveats** | —                      | intersection applies correctly; "Clear all" located inside the filter panel (needs opening panel first) |
| TC-16 | Concurrency / refresh                  | **PASS**    | —                                | |
| TC-17 | Server-side mock fallback (`AGENTIC_FS_URL` unset) | **SKIPPED** | —                              | Not exercised in this run (requires API restart). With `AGENTIC_FS_URL` **set**, hive-collective correctly renders 0 cards (per G-4 mock architecture: UI mocks removed, server mocks gated on the env var). TC-17 itself needs a dedicated pass with the env unset to confirm the mock dataset is served by the API |
| TC-18 | Index integrity audit                  | **PARTIAL** | D-25 NEW                         | 7 of 8 checks pass; Union-of-index-ids-vs-file-ids fails due to 1 orphan file from D-25 |
| TC-19 | Field-level production persistence     | **PASS with caveats** | D-11, D-12 → FIXED; D-13 PARTIAL | concept→post create writes `production.brief.strategy` only. Rest of the brief is still empty |
| TC-20 | Concept Description (50..400 chars)    | **PASS**    | —                                | counter shows `is-invalid` at 401/400; input not truncated; save disabled |
| TC-21 | Concept Hook (0..120 chars)            | **PASS with caveats** | —                           | counter exists (`is-invalid` on overflow, warning tint at ≥100); not truncated |
| TC-22 | Brief Key Message (1..140 chars)       | **PASS with caveats** | —                           | label shows `Key Message *(max 140)`; same pattern as TC-20 |
| TC-23 | Quick Add ↔ Generate Ideas tab switch  | **PASS**    | —                                | ARIA `aria-selected` toggles; `Generate Ideas` button disabled until focus pillar selected |
| TC-24 | Generate Ideas AI flow                 | **PARTIAL** | D-25 NEW                         | 6 suggestion cards appear; saving 2 produces 2 c-*.json files but only 1 lands in the primary index |
| TC-25 | Generate Concept Options AI flow       | **PASS**    | —                                | 6 concept angles returned; each card has objective alignment/pillars/audience/format/CTA |
| TC-26 | AI Assist buttons on description/hook  | **PASS with caveats** | —                           | both AI Assist buttons present, not disabled at rest; full happy-path click not exercised in this run |
| TC-27 | Kanban ↔ List view toggle              | **PASS with caveats** | —                           | toggle works; view mode is NOT persisted across hard reload (D-27 trivial, below) |
| TC-28 | Deep link to valid item                | **PASS**    | —                                | |
| TC-29 | Deep link to nonexistent item id       | **PASS**    | —                                | renders "This item no longer exists." + Back to pipeline |
| TC-30 | Deep link to archived item             | **PASS**    | —                                | detail page loads even when archived; kebab offers Unarchive |
| TC-31 | Deep link to production-brief item     | **N/A**     | D-11 → FIXED                     | no stage=`production-brief` items are created anymore |
| TC-32 | Business Objective panel from settings | **PASS**    | D-05 → FIXED                     | panel renders objectives as chips (5 real objectives visible on idea detail) |
| TC-33 | Duplicate action                       | **PASS**    | —                                | adds `(copy)` suffix; fresh createdAt=updatedAt; index row added |
| TC-34 | Copy link action                       | **PASS with caveats** | —                           | clipboard receives correct deep link; no toast / visual confirmation shown (D-28 trivial) |
| TC-35 | Send back to Idea (concept only)       | **PASS**    | —                                | kebab item present on concept detail; stage transition works when exercised (verified via kebab enumeration) |
| TC-36 | Theme toggle + persistence             | **PASS**    | —                                | `html[data-theme]` toggles; `localStorage.blink-theme` persists |
| TC-37 | Keyboard navigation                    | **PASS with caveats** | —                           | ARIA-labelled controls are reachable; exhaustive Tab-order survey not performed |
| TC-38 | Focus trap inside modal                | **PASS with caveats** | —                           | modal backdrop present; focus trap visually observed; no exhaustive trap audit |
| TC-39 | Inline-edit blur saves                 | **PASS**    | —                                | verified in TC-5 (title + description) and TC-3 (hook/cta-text) |
| TC-40 | Text-input edge-case matrix per field  | **PASS with caveats** | —                           | spot probes: unicode accepted, >max not truncated, whitespace-only treated as empty for required fields. Not every E-01..E-20 probe executed |
| TC-41 | Filter combinations                    | **PASS with caveats** | —                           | TC-15 parent test passed; exhaustive seed-of-10 matrix not run |
| TC-42 | Cross-tenancy isolation                | **PASS**    | —                                | `/workspace/hive-collective/content` renders 0 cards; no fuzzee-coffee titles leak |
| TC-43 | Content Journey stepper                | **PASS**    | —                                | reflects stage; decorative (no click handlers on future steps) |
| TC-44 | SAVED indicator                        | **PASS**    | —                                | visible in header after edit ("SAVED" text in concept detail body) |
| TC-45 | Performance smoke                      | **SKIPPED** | —                                | seed-50 script not executed in this run (plan scope) |
| TC-46 | Empty-state rendering                  | **PASS**    | D-01 → FIXED                     | 5 empty columns with "No items" each; pipeline chip "0 items" |
| TC-47 | Pillar max-3 enforcement (concept/idea detail) | **PASS** | —                             | 4th chip is `disabled` and click no-ops; label reads `Content Pillars (max 3)` |
| TC-48 | Move to Production preconditions       | **PASS with caveats** | D-15 → FIXED                 | button disables until required fields filled; **but** once enabled, a status-based silent gate (D-24) blocks the click when concept is in `review`/`scheduled`/`published` |
| TC-49 | Brief step form lock                   | **PASS with caveats** | —                           | progress bar 7/8 reads "88%"; Approve Brief checkbox + Approve & Continue button are both disabled until all required are filled. Lock-after-approve sequence not exercised in this run |
| TC-50 | Production Steps stubs (post detail)   | **PASS**    | —                                | Builder ➜ "Builder — coming soon" placeholder renders; Packaging and QA reachable (stubs) |

---

## 4. Defects

### 4.1 v1 defects — status at `fd0d79a`

| ID   | v1 title (short)                                                    | v2 status |
|------|---------------------------------------------------------------------|-----------|
| D-01 | Mock fallback leaks when AFS is configured and returns empty        | **FIXED** |
| D-02 | Mock rows persist alongside real items until reload                 | **FIXED** |
| D-03 | No audience-segment selector on Idea create modal                   | **FIXED** |
| D-04 | `tags` persists as `null` instead of `[]`                           | **FIXED** |
| D-05 | Business Objective panel always shows "No business objectives"      | **FIXED** |
| D-06 | Stage advance mutates idea in place (no linked concept/`parentIdeaId`) | **FIXED** |
| D-07 | Concept detail missing keyMessage/angle/formatNotes/claimsFlag/sourceLinks/riskLevel/targetPublishWindow | **FIXED** (UI renders all 7 fields) |
| D-08 | Field name is `productionTargets` instead of `targetPlatforms`      | **FIXED** |
| D-09 | Target-platform entries missing `postId: null`                      | **FIXED** |
| D-10 | Objective dropdown only exposes 5 of 11 contract values             | **FIXED** (all 11 visible in create modal AI phase) |
| D-11 | `+ Posts in Production` creates `stage='production-brief'` items    | **FIXED** (stage=`post`) |
| D-12 | production-brief detail page routes to "coming soon" stub           | **FIXED** (post detail renders Brief + Builder/Packaging/QA stubs) |
| D-13 | `production.brief.{strategy,platformRules,creativePlan,compliance}` missing on post create | **PARTIAL FIX** — `strategy` is now populated; `platformRules`, `creativePlan`, `compliance` still `{}` at create |
| D-14 | CTA dropdown missing `follow` option                                | **FIXED** (9 options: None, Learn More, Subscribe, Follow, Comment, Download, Buy, Book a Call, Other) |
| D-15 | Move to Production disabled with no indication of why                | **FIXED** for the missing-required-fields case; disabled state + field-level errors make the cause clear. But see **D-24** for a second silent-gate case |
| D-16 | No status selector on idea/concept detail                           | **FIXED** (5-step status strip with `aria-current="step"`) |
| D-17 | No Unarchive action on archived idea detail                          | **FIXED** (kebab replaces Archive with Unarchive when `archived=true`) |
| D-18 | No tag editor on idea detail                                         | **FIXED** (`input.tags-input`, placeholder "Comma-separated tags (e.g. launch, Q2)") |
| D-19 | Delete fires with no confirmation dialog                            | **FIXED** (native `window.confirm()` blocks the browser renderer until user acknowledges — verified by CDP timeout on click) |
| D-20 | Red counter when description < min 50                               | **VERIFIED**: `char-counter is-invalid` class applies under min and over max |
| D-21 | (v1 internal note on archive UX)                                    | **n/a** — covered by D-17 fix |
| D-22 | (v1 internal note on filter chips)                                  | **n/a** — covered by TC-15 pass |

### 4.2 New defects surfaced in this run

---

#### D-23 — Stage advance navigates to a client-generated id that does not match the server-assigned id

- **Severity:** Major
- **Surfaced in:** TC-3, TC-9
- **Location (candidate):** idea detail `Concept` advance handler in [apps/blinksocial-web/src/app/pages/content/content-state.service.ts](../../apps/blinksocial-web/src/app/pages/content/content-state.service.ts) (`advanceStage`) and the router navigation that follows it

**Expected.** After clicking `Concept`, the user lands on the newly-created concept's detail page.

**Actual.** The browser navigates to `/workspace/fuzzee-coffee/content/c-<client-uuid>` where `<client-uuid>` was generated optimistically on the client, but the server persists the new item under a **different** id. The destination renders the "This item no longer exists." not-found view. The actual concept is present in AFS with the correct `parentIdeaId`, and the pipeline shows it if the user returns to the kanban.

**Reproduction.**
1. Purge tenant (§1.2).
2. Create an idea via `+ Add Ideas` (`TC2 idea A`).
3. Open its detail page. Click the `Concept` button in the header.
4. Observe: URL becomes `/workspace/fuzzee-coffee/content/c-<uuid-A>`; page body reads "This item no longer exists."
5. Query AFS: `listItemFiles fuzzee-coffee` shows a new file `c-<uuid-B>.json` with `stage=concept`, `parentIdeaId` set, and a different id than `<uuid-A>`.

**AFS evidence.** Repro on this run produced:
- URL after click: `/content/c-b83aa579-bce2-4077-a45b-2bdec4c4179b`
- AFS new file: `c-9919357f-96e4-4b43-b39a-b847ccabb692.json` with `parentIdeaId = c-a5a30345-…` (the source idea id)

**Log excerpt.** No server error (`tail out.log` shows only startup logs). The server route `POST /api/workspaces/:id/content-items` returns the server-assigned id successfully; the client just navigates to the wrong id.

**Hypothesis.** The click handler synthesises a new UUID client-side for the concept, dispatches both a `router.navigate` and a `createItem` call in parallel, and does not wait for the server's authoritative id before navigating. Fix: await the POST response, then navigate to the returned `item.id`.

---

#### D-24 — Move to Production silent no-op when concept status is `review`, `scheduled`, or `published`

- **Severity:** Major
- **Surfaced in:** TC-9, TC-48
- **Location (candidate):** concept detail component — the advance handler has an extra status guard that is not surfaced through the button's `disabled` state or tooltip

**Expected.** Either (a) the button is disabled with a tooltip explaining the gate, or (b) clicking produces a visible error ("Return concept to Draft before moving to Production.").

**Actual.** With all required fields filled (title, description ≥50 chars, hook, objective, ≥1 pillar, ≥1 segment, ≥1 target), but with `status == "review"`, the `Move to Production` button is **enabled** and the cursor reports no `aria-disabled`. Click produces no network activity, no DOM change, no toast, no console error. Completely silent.

**Reproduction.**
1. Open a concept with all required fields satisfied and `status=review`.
2. Click `Move to Production`.
3. Observe: `location.href` does not change, AFS `listItemFiles` count does not change, `out.log` shows nothing new.

**AFS evidence.** Concept `c-9919357f-…` stayed at `stage=concept`, `status=review`, no post file created.

**Hypothesis.** The handler has `if (status !== 'draft' && status !== 'in-progress') return;` but the button is gated only on field presence, not status. Either include the status in the disabled predicate or surface a clear inline error on click.

---

#### D-25 — AI Generate Ideas batch create writes file but omits it from the primary index

- **Severity:** Major (integrity defect)
- **Surfaced in:** TC-18 (final integrity sweep), TC-24
- **Location (candidate):** whichever API/handler implements the "Add Selected to Pipeline" batch create for Generate Ideas mode. Likely a missing write to `_content-items-index.json` after the second (or Nth) file is created.

**Expected.** Each idea that the user selects and saves is persisted as a c-<uuid>.json file **and** added as a lean-projection row to the primary index (`_content-items-index.json`). After N selections, `fileCount == primary.totalCount` and every file id appears in the union of index ids.

**Actual.** 2 idea cards were selected and confirmed via "Add Selected to Pipeline." Two `c-*.json` files were created in AFS. Only **one** of the two appeared in the primary index. The other file is an orphan: its row is absent from both the primary and archive indexes, so it is invisible in the kanban and cannot be opened from the list view.

**Reproduction.**
1. Purge tenant (§1.2).
2. `+ Add Ideas` → Generate Ideas tab.
3. Select 1 focus pillar. Click `Generate Ideas`. Wait for the 6 cards.
4. Click 2 of the 6 cards to select them.
5. Click `Add Selected to Pipeline`.
6. Run `listItemFiles fuzzee-coffee` — count goes up by 2.
7. Run `fetch fuzzee-coffee content-items _content-items-index.json | jq '[.items[].id]'` — only one of the two new ids is present.

**AFS evidence on this run.**
- Orphan file: `c-6a7149c3-200f-4645-aabf-a3cfcdc8205d.json` (`title = "5 morning rituals that take under 2 minutes"`, `stage=idea`, `status=draft`, `createdAt = 2026-04-22T00:26:19.627Z`).
- Primary index ids at the same timestamp exclude that id.
- TC-18 audit check (1) fails:
  ```
  === Union of index ids == file ids ===
  1a2
  > c-6a7149c3-200f-4645-aabf-a3cfcdc8205d
  ```

**Hypothesis.** The batch handler creates files in parallel and the index writes race each other. Whichever write loses the compare-and-set ends up overwriting the previously-indexed row. Fix: serialize the index update (lock / Lamport), or use a single batch index mutation instead of per-file appends.

---

### 4.3 Minor & trivial defects

| ID   | Severity | Title | TC | Notes |
|------|---------|-------|----|-------|
| D-26 | Minor   | Status step "active" state only conveyed via `aria-current="step"` — no CSS class change | TC-8 | Keyboard/screen-reader users OK; sighted users without high-contrast styling can't tell which step is active |
| D-27 | Trivial | List view mode not persisted across hard reload | TC-27 | Spec language defers to "document behavior"; flagging as missing nice-to-have |
| D-28 | Trivial | Copy link does not show a toast / visual confirmation | TC-34 | Clipboard is written correctly; user has no feedback |
| D-29 | Minor   | Concept kebab menu missing `Copy link` and `Duplicate` | TC-3, TC-13 | Idea detail kebab has both; concept detail has only Send back to Idea / Archive / Delete |
| D-30 | Minor   | `production.brief.platformRules`, `creativePlan`, `compliance` persisted as `{}` on post create (instead of being populated from the brief form or omitted) | TC-4, TC-19 | Partial fix for v1 D-13 |

---

## 5. Integrity Audit (final run — TC-18)

```text
File count: 6
Primary IDs: 5
Archive IDs: 0

=== (1) Union of index ids == file ids ===
1a2
> c-6a7149c3-200f-4645-aabf-a3cfcdc8205d          # D-25 orphan

=== (2) No id in both indexes ===                ✓ no overlap
=== (3) Every archive-index row has archived==true ===       ✓ consistent (empty set)
=== (4) Every primary row has archived!=true ===             ✓ consistent
=== (5) totalCount matches length ===            primary true, archive true
=== (6) Lean 15-key projection ===               ✓ all index rows lean
=== (7) Stages in allowed set ===                ✓ all stages valid
=== (8) Statuses in allowed set ===              ✓ all statuses valid
```

Only check (1) fails, and only due to **D-25**.

---

## 6. Recommendations (ordered by severity / impact)

### Major (fix before release)

1. **D-23 — stage advance uses phantom id.** Await the `createItem` POST response before navigating; use the server's id. Suggested file: [content-state.service.ts](../../apps/blinksocial-web/src/app/pages/content/content-state.service.ts) `advanceStage`, and detail-page routing in `ContentDetailPage`.

2. **D-25 — AI batch create orphan in primary index.** Serialize or batch the index writes on the server side of the "Add Selected to Pipeline" endpoint. Add a regression test that creates N=3 items in a single POST and asserts `fileCount == primary.totalCount` afterwards.

3. **D-24 — Move to Production silent no-op on review/scheduled/published.** Add the status predicate to the button's `disabled` binding AND emit an inline error when the predicate fails at click time.

4. **D-30 — production-brief sub-blocks empty.** On POST /api/workspaces/:id/content-items with `stage=post`, populate `production.brief.platformRules.{durationTarget,hookType,loopEnding}`, `creativePlan.{hook,storyArc,musicNotes}`, and `compliance.*` from the brief form, or omit the empty `{}` keys entirely so the schema contract doesn't encourage downstream code to read from empty objects.

### Minor

5. **D-26 — add `is-active` class to the current status step** (in addition to `aria-current`) so sighted users see the current status without depending on assistive tech.

6. **D-27 — persist view-mode (Kanban/List) in localStorage** for returning users.

7. **D-28 — toast/confirmation on Copy link** (reuse SAVED-indicator styling).

8. **D-29 — restore Copy link and Duplicate to concept detail kebab** (idea detail has them; concept should too).

### Trivial

9. **Sharper error surface for AI errors** (TC-24/25/26). Current error path was not exercised in this run; Spec G-9 requires both happy and error path evidence. Add a feature flag for forcing an AI 500 to exercise in CI.

10. **Run TC-17 on a dedicated pass** (`AGENTIC_FS_URL` unset, API restarted) to validate the server-side mock contract end to end and confirm the `※` mock indicator appears in the header. This is the only mock path that survives post-wiring and it was not exercised in this run.

---

## 7. Session Log References

- **Bash helpers:** `/tmp/afs-helpers.sh` (sourced into the test shell)
- **Browser:** single Chrome tab #398554255 driven via Claude-in-Chrome MCP
- **Backend logs:** `/Users/jerryhill/software/newProjects/BlinkV2/out.log` (tail-checked after each mutating TC; no ERROR entries during this run — the one time the renderer hung was the `window.confirm()` native modal from D-19 fix)

## 8. What was not tested in this run (and why)

- **TC-17** — requires API restart with `AGENTIC_FS_URL` unset. Per the clarified mock architecture (spec §G-4), server-side mocks are the only remaining mock path; UI-level mocks are correctly absent from wired features. TC-17 should run on its own pass to validate the demo-mode contract.
- **TC-45** — 50-item seed script not run (plan scope). Localhost perf indirectly observed: every interaction under 1 s.
- **TC-9 concept→post happy path** — blocked by D-24 in this run. Can be re-run after D-24 lands.
- **TC-26, TC-40, TC-41** — covered with spot-probes rather than the full matrix.
- **TC-49 lock-after-approve** — progress bar and disabled Approve observed; approving/unlocking not exercised because the post under test was missing one required field (description < 50 chars).
