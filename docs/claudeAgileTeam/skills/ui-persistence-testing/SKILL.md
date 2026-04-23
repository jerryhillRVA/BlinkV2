---
name: ui-persistence-testing
description: Use when executing end-to-end UI tests that must validate data persistence — i.e. confirm that every field visible in the UI actually makes it into the API payload and the persistence layer, and conversely that what's persisted matches what the UI displays after a refresh. Designed for use with the Claude for Chrome browser plugin. Trigger when running `/test-ticket` or any request involving UI+DB parity validation.
---

# UI ↔ API ↔ DB parity testing

## Three-layer assertion model

Pure UI-vs-DB comparison misses bugs where data is dropped *between* layers. Always assert at all three boundaries:

```
  UI state (what user sees)
       │
       ▼  (form submit / action)
  API payload (captured via Chrome devtools network)
       │
       ▼  (persistence write)
  DB row (queried via dbInspectCommand)
       │
       ▼  (page refresh)
  UI state (again — must match original input)
```

A test passes only if all four states agree on every field. Any disagreement is a defect, even if the user-visible UI "looks right" after refresh — that's often just optimistic caching hiding a persistence bug.

## Test execution loop (per test case)

For each test case from the design doc:

1. **Prepare**: note the starting DB state for affected tables.
2. **Act via Chrome**: use the Claude for Chrome plugin to drive the UI through the TC steps. Capture screenshots at each key step.
3. **Capture network**: while acting, record the request/response of the relevant API call(s). Store the exact JSON payload sent and received.
4. **Query DB**: run `dbInspectCommand` (from `.claude/kanban.config.json`) to fetch the resulting row(s). If `dbInspectCommand` is empty, note "DB parity skipped — dbInspectCommand not configured" in the test report and continue with UI↔API checks only.
5. **Refresh UI**: reload the page and re-read the rendered values for the same fields.
6. **Compare across four states** (pre-act UI input, API payload, DB row, post-refresh UI). Build the parity table in the test report.
7. **Record**: pass/fail per test case, with evidence.

## Field-level parity checks

Don't just compare whole objects. For each field the TC touches:
- String fields: exact match (note whitespace/case explicitly if trimmed).
- Numeric: exact match; watch for float representation drift.
- Dates/timestamps: compare in UTC; note timezone conversion if UI shows local.
- Arrays/sets: order-sensitive only if UI displays ordered; otherwise compare as sets.
- Nullable fields: distinguish `null` from `""` from missing key — all three are common silent-drop bugs.
- Enums: compare both stored code and displayed label.

## Things to probe beyond the happy path

Every TC should exercise at least one of these unless explicitly N/A:

- **Maximum lengths** — enter max-allowed input, confirm full round-trip.
- **Unicode** — include emoji, RTL text, combining characters in at least one string field.
- **Empty vs. null** — submit with an optional field left blank; confirm DB stores `null`, not `""`.
- **Concurrent edit** — open the record in two tabs, edit both, save sequentially, confirm last-write behaviour matches spec.
- **Refresh during load** — hard-reload mid-submit; confirm no partial write.

## Defect severity rubric

- **Blocker**: data loss, security issue, core AC not met, crash.
- **Major**: any UI↔API↔DB mismatch, wrong data persisted, accessibility regression.
- **Minor**: cosmetic, non-blocking edge case, UX polish.

`/test-ticket` promotes to In Review only if there are **zero blockers and zero majors**. Any minor defects are filed as follow-up issues, linked to the ticket, and noted in the test report.

## Dev server lifecycle

Before running tests:
1. Check if `appBaseUrl` responds. If yes, reuse.
2. If no, start `devCommand` in background, wait for the URL to respond (up to 60s).
3. After testing, leave the dev server running (other commands may need it).

## Test data hygiene

Use a prefix like `TEST-<issue>-<timestamp>-` for any record the test creates, so test data is trivially filterable and cleanable. Do not depend on a clean slate; tests should be idempotent given the prefix.
