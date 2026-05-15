# Calendar — Feature Spec

> Canonical reference for what the Calendar renders, under what conditions, and with what visual treatment. Every Calendar-related ticket should map its acceptance criteria back to a section in this doc.

## 1. Scope

**Verified end-to-end against AFS** (ticket #130, Instagram-Reel projection): publish events + milestone events for posts where `platform = 'instagram'` and `contentType = 'reel'` (canonical type `VIDEO_SHORT_VERTICAL`).

**Documented but not yet AFS-verified** — these render in the UI today (the mapper covers them) but their full round-trip (Brief → Draft → Packaging → Approve & Schedule → Calendar) has not been proven against a live AFS workspace:

- Instagram Feed Post / Carousel / Story / Live
- TikTok (`short-video`, `shorts`)
- YouTube (`long-form`, `shorts`)
- Facebook (`fb-feed-post`, `fb-link-post`, `fb-reel`, `fb-story`, `fb-live`)
- LinkedIn (`ln-article`, `ln-text-post`, `ln-video`, `ln-document`)

Each will be verified by its own future ticket (parallel in shape to #126 + #130).

## 2. View modes

The view mode is set by the segmented toolbar control at the top of the page; the URL retains it via `?calendarView=<mode>&calendarCursor=<ISO>`.

| Mode  | Source                                                              | Layout                                                                                                                       |
| ----- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| month | `calendar-page.component.html` `[data-testid="month-grid"]`         | 6×7 grid, 130 px cell, 3-pill cap per cell with `+N more` overflow, out-of-month cells dim to 55 % opacity                   |
| week  | `[data-testid="week-grid"]`                                         | 7-column. **All-day** (milestone) lane above **timed** (publish) lane                                                        |
| day   | `[data-testid="day-grid"]`                                          | Vertical list of events for the selected date with time prefixes                                                             |
| list  | `[data-testid="list-grid"]`                                         | Date-grouped, full-detail rows: title, platform badge, status badge, severity badge                                          |

Each cell renders publish events with the status-tinted pill described in §4 and milestone events with the dashed-outline chip described in §5.

## 3. Event types

Two kinds of events are derived from the API response (`CalendarResponseContract`).

| Kind        | Source                                                                                       | Visual container                                                                                                          | Icon                       |
| ----------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `publish`   | One per `items[]` entry that has `scheduleAt` set                                            | Solid pill, background + text from the per-status token (see §4)                                                          | Send / arrow SVG, 9×9, 2.5 px stroke |
| `milestone` | One per `milestones[]` entry, derived from `settings/calendar.json` `deadlineTemplates[type]` | Transparent fill, **dashed** outline using `var(--blink-outline)`, muted text `var(--blink-on-surface-muted)`             | Flag / banner SVG, 9×9, 2.5 px stroke |

Publish events without `scheduleAt` are filtered out by `mapContentItemToCalendarItem`. Milestone events whose `contentId` does not match an `items[]` entry are filtered out by `buildEvents`.

## 4. Status → token map

All eight `CalendarItemStatusContract` values render a pill driven by `data-status="<value>"` on `.event-pill`. Tokens are defined in [`_blink-tokens.scss`](../../apps/blinksocial-web/src/app/core/theme/_blink-tokens.scss).

| Status        | `--*-bg` (light) | `--*-text` (light) | `--*-bg` (dark)              | `--*-text` (dark) |
| ------------- | ---------------- | ------------------ | ---------------------------- | ----------------- |
| `intake`      | `#f3f4f6`        | `#4b5563`          | `rgba(156,163,175,0.18)`     | `#d1d5db`         |
| `in-progress` | `#dbeafe`        | `#1d4ed8`          | `rgba(59,130,246,0.18)`      | `#93c5fd`         |
| `in-review`   | `#ede9fe`        | `#6d28d9`          | `rgba(139,92,246,0.18)`      | `#c4b5fd`         |
| `revisions`   | `#fef3c7`        | `#b45309`          | `rgba(251,191,36,0.18)`      | `#fcd34d`         |
| `approved`    | `#dcfce7`        | `#15803d`          | `rgba(34,197,94,0.18)`       | `#86efac`         |
| `scheduled`   | `#dcfce7`        | `#15803d`          | `rgba(34,197,94,0.18)`       | `#86efac`         |
| `published`   | `#d1fae5`        | `#065f46`          | `rgba(16,185,129,0.18)`      | `#6ee7b7`         |
| `archived`    | _no distinct token_ — same as `published` today (Known Gap §11)                                                                                                                  |

Token names: `var(--blink-pill-status-<status>-bg)`, `var(--blink-pill-status-<status>-text)`, `var(--blink-pill-status-<status>-border)`.

## 5. Severity — derivation and tokens

Computed per event in [`calendar-event.util.ts`](../../apps/blinksocial-web/src/app/pages/calendar/calendar-event.util.ts).

### Derivation rules

```
overdue:   due/schedule date  <  referenceDate
at-risk:   (scheduleAt within 7 days of referenceDate)
           AND status NOT IN {approved, scheduled, published}
blocked:   item.blockers.length > 0   (publish AND milestone events)
null:      none of the above
```

`blocked` is checked first for both `derivePublishSeverity` and `deriveMilestoneSeverity` — a blocking issue trumps a date-based reason.

### Visual treatment

| Severity | Container styling                                                                       | Tokens (light → dark)                                                                                                                                                                                                  |
| -------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| overdue  | Solid red fill on the pill, solid 1 px red border                                       | `--blink-calendar-overdue-bg`: `#fef2f2` → `rgba(239,68,68,0.12)` · `--blink-calendar-overdue-text`: `#b91c1c` → `#fca5a5`                                                                                              |
| at-risk  | Inset 1 px amber shadow on the pill, no fill change                                     | `--blink-calendar-atrisk`: `#f59e0b` → `#fbbf24` · side-panel bg `--blink-calendar-atrisk-bg`: `#fffbeb` → `rgba(245,158,11,0.12)`                                                                                       |
| blocked  | **Shares** the overdue visual today — no distinct token (Known Gap §11)                                                                                                                                                                                                                                                              |
| null     | No severity indicator                                                                                                                                                                                                                                                                                                                |

The side-panel **Upcoming** list re-uses these tokens: overdue and blocked rows render with `--blink-calendar-overdue-bg/text`; at-risk rows render with `border-color: --blink-calendar-atrisk` over `rgba(245,158,11,0.05)`.

## 6. Milestone types

`CalendarMilestoneTypeContract` values, all rendered with the shared flag SVG and the dashed-outline container from §3. No per-type color today.

| Type           | Display label  |
| -------------- | -------------- |
| `brief_due`    | Brief Due      |
| `draft_due`    | Draft Due      |
| `blueprint_due`| Blueprint Due  |
| `assets_due`   | Assets Due     |
| `packaging_due`| Packaging Due  |
| `qa_due`       | QA Due         |

Each milestone type also maps to a Post-Detail tab via `MILESTONE_TAB_MAP` ([calendar-page.component.ts](../../apps/blinksocial-web/src/app/pages/calendar/calendar-page.component.ts)), so clicking a milestone chip lands on the right step.

## 7. Peek card

[`peek-card/peek-card.component.html`](../../apps/blinksocial-web/src/app/pages/calendar/peek-card/peek-card.component.html)

**Trigger:** hover or focus on a pill / chip. **Close debounce:** 220 ms after `mouseleave` / `blur`. **Placement:** the card opens to the right of its anchor by default and flips to the left when the right edge would overflow the viewport (Saturday-column case); vertical flip mirrors this for bottom-row cells.

**Rendered fields:**

- Title (clickable — opens content detail with `?from=calendar&calendarView=…&calendarCursor=…`)
- Status badge (color-coded per §4) + Platform badge
- Milestone-type badge — only for milestone events
- Summary line — full date + time for publish events; "all day" + date for milestone events
- Severity warning row — appears only when severity is non-null
- Owner
- Action buttons:
  - **Edit Dates** — opens the Quick Edit modal (§ 9). For a publish event the modal edits `scheduleAt` (datetime); for a milestone event it edits that milestone's `dueAt` as a per-item override (date-only, midnight UTC). Save is optimistic — the pill moves immediately, the PUT runs in the background, and a failure reverts the move and surfaces a toast.
  - **Open Item** — navigates to the Post Detail page with the right tab (see § 9 milestone tab map).
  - **Copy Link** — copies the deep link to the content item to the clipboard.

**Severity copy in the warning row:**

| Severity | Copy                              |
| -------- | --------------------------------- |
| overdue  | "deadline has passed"             |
| at-risk  | "schedule is tight"               |
| blocked  | "required step not approved"      |

## 8. Filters

Defined in [`calendar.types.ts`](../../apps/blinksocial-web/src/app/pages/calendar/calendar.types.ts) as `CalendarFilterState`. Controls live in the filters popover, opened from the toolbar.

| Field            | Default | Control type                | Application                                                                 |
| ---------------- | ------- | --------------------------- | --------------------------------------------------------------------------- |
| `platforms`      | `[]`    | Multi-checkbox (5 platforms)| Event excluded if `item.platform` not in list (empty list = all)             |
| `statuses`       | `[]`    | Multi-checkbox (8 statuses) | Event excluded if `item.status` not in list                                  |
| `owners`         | `[]`    | Multi-checkbox (dynamic)    | Event excluded if `item.owner` not in list                                   |
| `search`         | `''`    | Text input                  | Substring match on `item.title + ' ' + item.owner` (lowercased)              |
| `showMilestones` | `true`  | Toggle                      | All milestone events hidden when `false`                                     |
| `showPublished`  | `true`  | Toggle                      | Publish events with `status === 'published'` hidden when `false`             |

**Persistence semantics:** filter state is held in the component signal `filter()`; it resets on component init and on **Clear all filters**. It is **not** persisted to localStorage or `settings/calendar.json` today. Making filters persistent is a future ticket.

## 9. Scheduling flow

The Calendar surfaces two scheduling affordances: (a) the **Approve & Schedule** step of the Post Detail view (canonical entry point for new schedules), and (b) the **Quick Edit modal** on the peek card (in-place date adjustments for items already on the Calendar). Bulk create, drag-to-reschedule, and create-from-empty-day all remain out of scope.

### Where `scheduleAt` is set (initial schedule)

`scheduleAt` is set on the **Approve & Schedule** step of the Post Detail view (`apps/blinksocial-web/src/app/pages/content/views/post-detail/approve-schedule-step/`):

- The user fills `production.qa.publishConfig.publishAction = 'schedule'` and `publishConfig.scheduleAt = '<ISO>'`.
- On save, the post is persisted to AFS via the `ContentItemsService` flow finalized in #126.
- The post's top-level `scheduledAt` is mirrored from `publishConfig.scheduleAt`; alternatively, `scheduledDate` (a date-only string) can be set, in which case the Calendar projects it at the default publish time of `14:00 UTC` ([`calendar-mappers.ts:14`](../../apps/blinksocial-api/src/calendar/calendar-mappers.ts#L14) `DEFAULT_PUBLISH_TIME_UTC`).

### Quick Edit modal (in-place date adjustments, #134)

[`quick-edit-modal/quick-edit-modal.component.ts`](../../apps/blinksocial-web/src/app/pages/calendar/quick-edit-modal/quick-edit-modal.component.ts)

Opens from the peek card's **Edit Dates** button. Two variants:

- **Publish-event variant** — single `datetime-local` input. Save emits `PUT /api/workspaces/:id/content-items/:itemId` with `{ scheduledAt: <ISO>, scheduledDate: <YYYY-MM-DD> }`. No status flip, no owner / notes edit — those still live on Post Detail.
- **Milestone-event variant** — single `date` input. Save emits `PUT` with `{ milestoneOverrides: { [milestoneType]: { dueAt: '<YYYY-MM-DD>T00:00:00.000Z' } } }`, deep-merged onto the existing record. The workspace deadline template at `settings/calendar.json` is **not** mutated; only the per-item exception is persisted.

**Optimistic UX**: `calendar-page.component` mutates the in-memory `response` signal first (via `applyPatchToResponse`) so the pill moves to its new cell immediately. The modal stays open with a busy Save button until the PUT settles. On `2xx`, the modal closes and the Calendar re-fetches `GET /api/calendar/<workspaceId>` to pick up authoritative state (cursor preserved). On non-`2xx`, the in-memory mutation reverts, the modal closes, and an error toast surfaces — `"Couldn't save the new publish date — please try again"` for publish edits, `"Couldn't save the milestone date — please try again"` for milestone edits.

### `milestoneOverrides` data model

`ContentItemContract.milestoneOverrides` is an optional `Partial<Record<MilestoneType, { dueAt: string }>>` on the per-item AFS record. Keyed by `milestoneType` rather than `milestoneId` because the latter is recomputed on every render and isn't stable across template changes. Absent overrides → `deriveMilestonesForItem` falls back to the template's `offsetDays` from `scheduleAt` (existing behavior). Override types not present in the active template are silently ignored — no phantom milestone is emitted.

To honor the override server-side, `CalendarService.tryDeriveFromAfs` / `tryDeriveFromMockContent` now read the **full item file** (not just the index entry) for each non-archived item with `contentType`, parallelized via `Promise.all`. Same gate as today's milestone derivation, so the additional reads are bounded.

### How the Calendar reflects it

On the next `GET /api/calendar/<workspaceId>`:

- When `AGENTIC_FS_URL` is set → `CalendarService.tryDeriveFromAfs` reads `content-items/_content-items-index.json` from AFS, fans out per-item reads to pick up `milestoneOverrides`, and projects each non-archived entry through `mapContentItemToCalendarItem` + `deriveMilestonesForItem`.
- When unset → the existing 3-path mock logic runs (`tryLoadFixture` → `tryDeriveFromMockContent` → `generateSynthetic`).

In both modes the response shape is identical, so the UI is invariant.

### Explicitly out of scope here

- Drag-to-reschedule from the Calendar surface.
- Create-event-from-empty-day on the Calendar surface.
- Bulk re-scheduling (multi-select, mass move).
- Phase-window event editing (phase windows aren't rendered on the Calendar today; adding them is its own ticket).
- Editing owner / notes / status from the Quick Edit modal — those flows remain on Post Detail.

## 10. Calendar settings tab

[`apps/blinksocial-web/src/app/pages/workspace-settings/tabs/tab-calendar/`](../../apps/blinksocial-web/src/app/pages/workspace-settings/tabs/tab-calendar/) — configures milestone offsets, phase windows, and reminders per canonical content type.

| Setting                                          | Field                                                | Shape                                                                                                                                       |
| ------------------------------------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Enable deadline templates                        | `enableDeadlineTemplates`                            | boolean                                                                                                                                     |
| Auto-create milestones on publish                | `autoCreateOnPublish`                                | boolean                                                                                                                                     |
| Per-canonical-type milestones                    | `deadlineTemplates[canonicalType].milestones[]`      | `{ milestoneType, offsetDays (negative = before schedule), required }`                                                                      |
| Per-canonical-type phases                        | `deadlineTemplates[canonicalType].phases[]`          | `{ phaseType: 'production_window' \| 'review_window', startOffsetDays, endOffsetDays, required }`                                            |
| Enable reminders                                 | `enableReminders`                                    | boolean                                                                                                                                     |
| Reminder defaults                                | `reminderSettings.{milestone72h, milestone24h, milestoneOverdue, publish24h}` | booleans                                                                                                                                    |

**Persistence:** stored as `settings/calendar.json` and read/written through `WorkspacesService.getSettings('calendar')` / `setSettings('calendar', …)`. That service already follows the canonical AFS-or-mock pattern (`fs.isConfigured()` → AFS path; else → MockDataService) and was not changed in #130.

## 11. Known gaps

Defined in the contract but not surfaced or fully wired today. Each is a candidate for a future ticket; **none are in scope for #130**.

- `flags.hasClaims` — `CalendarItemFlagsContract` supports it; no peek-card / pill surface; `ContentItemsService.projectIndexEntry` does not carry it onto the index, so the AFS-projected Calendar would never see it even if the UI grew a badge.
- `flags.hasTalent` — same shape, same gap.
- `flags.publishingMode` (`ORGANIC` / `PAID_BOOSTED`) — same shape, same gap. Note the Approve & Schedule step **does** read/write this on the post itself; it just doesn't currently project onto the calendar item.
- `blockers[]` reason strings — `item.blockers.length > 0` drives the `blocked` severity, but the reason text is never displayed (peek-card severity row uses a static "required step not approved" copy).
- Distinct `archived` styling — the contract supports `status === 'archived'` but the SCSS reuses the `published` token treatment; archived items therefore appear identical to published.

## 12. Color-token inventory

Every Calendar-surface SCSS reference to a `var(--blink-*)` token, with light + dark resolved values. Sourced from `_blink-tokens.scss`. Audit this list whenever the SCSS changes.

### Calendar-specific tokens

| Token                                | Light value              | Dark value                       | Used by                       |
| ------------------------------------ | ------------------------ | -------------------------------- | ----------------------------- |
| `--blink-calendar-production-bg`     | `#dbeafe`                | `rgba(59,130,246,0.18)`          | Page-level callout            |
| `--blink-calendar-production-accent` | `#3b82f6`                | `#60a5fa`                        | Page-level callout            |
| `--blink-calendar-review-bg`         | `#ede9fe`                | `rgba(139,92,246,0.18)`          | Page-level callout            |
| `--blink-calendar-review-accent`     | `#8b5cf6`                | `#a78bfa`                        | Page-level callout            |
| `--blink-calendar-publish-bg`        | `rgba(217,78,51,0.1)`    | `rgba(217,78,51,0.18)`           | Cell publish-row tint         |
| `--blink-calendar-overdue-text`      | `#b91c1c`                | `#fca5a5`                        | Severity (overdue + blocked)  |
| `--blink-calendar-overdue-bg`        | `#fef2f2`                | `rgba(239,68,68,0.12)`           | Severity (overdue + blocked)  |
| `--blink-calendar-atrisk`            | `#f59e0b`                | `#fbbf24`                        | Severity (at-risk)            |
| `--blink-calendar-atrisk-bg`         | `#fffbeb`                | `rgba(245,158,11,0.12)`          | Upcoming-panel at-risk row    |

### Pill-status tokens

Light values shown in §4 above; full dark-mode values:

| Status        | bg (dark)                | text (dark) | border (dark)            |
| ------------- | ------------------------ | ----------- | ------------------------ |
| `intake`      | `rgba(156,163,175,0.18)` | `#d1d5db`   | `rgba(156,163,175,0.35)` |
| `in-progress` | `rgba(59,130,246,0.18)`  | `#93c5fd`   | `rgba(59,130,246,0.4)`   |
| `in-review`   | `rgba(139,92,246,0.18)`  | `#c4b5fd`   | `rgba(139,92,246,0.4)`   |
| `revisions`   | `rgba(251,191,36,0.18)`  | `#fcd34d`   | `rgba(251,191,36,0.4)`   |
| `approved`    | `rgba(34,197,94,0.18)`   | `#86efac`   | `rgba(34,197,94,0.4)`    |
| `scheduled`   | `rgba(34,197,94,0.18)`   | `#86efac`   | `rgba(34,197,94,0.4)`    |
| `published`   | `rgba(16,185,129,0.18)`  | `#6ee7b7`   | `rgba(16,185,129,0.4)`   |

### Shared surface tokens (in calendar SCSS)

Calendar surfaces also use the global tokens: `--blink-surface`, `--blink-surface-dim`, `--blink-surface-container`, `--blink-surface-hover`, `--blink-on-surface`, `--blink-on-surface-strong`, `--blink-on-surface-muted`, `--blink-on-surface-faint`, `--blink-outline`, `--blink-outline-variant`, `--blink-shadow-sm` / `-lg`, `--blink-brand-primary` (+ hover-bg variant), and the typography scale (`--blink-headline-small`, `--blink-body-medium`, `--blink-label-small/medium/large`). All defined in `_blink-tokens.scss`.
