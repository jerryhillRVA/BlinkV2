CALENDAR EVENT CLICK LOGIC — FIGMA-READY SPEC (Single-day + Span tasks)

GOALS
- Every calendar item (single-day events + span bars) is interactive.
- Primary click always provides a predictable path to the Content Detail screen.
- Users can edit dates from the calendar via quick edit (without losing context).
- Clicking should respect “where the item is” in the pipeline (status + blockers), and route to the most relevant tab.

EVENT TYPES
1) publish_event (single point-in-time; schedule_at)
2) milestone_event (single point-in-time; due_at; draft_due/assets_due/qa_due/etc.)
3) phase_window_event (span bar; start_at/end_at; production_window/review_window)

INTERACTION MODEL (applies to ALL events)

A) PRIMARY CLICK (single click / tap)
Action: open a Quick Peek card (not full navigation)
- Rationale: lets user decide whether to edit dates or open the item.
- Applies to: publish_event, milestone_event, phase_window_event (including span bars)

Quick Peek Card content (consistent across event types)
- title_display (clickable)
- platform chip + canonical_type chip
- status chip (color-coded)
- owner
- event summary line:
  - publish_event: “Publishes: Tue, Mar 12 • 10:00 AM”
  - milestone_event: “Draft due: Mon, Mar 10 • All day”
  - phase_window_event: “Production window: Mar 10–Mar 14”
- readiness badges (derived):
  - Blocked / At-risk / Overdue (if applicable)
- top blockers snippet (max 2 bullets; read-only):
  - examples: “QA not approved”, “Thumbnail missing”, “Captions missing”
- actions:
  1) Open item (deep link)
  2) Edit date(s) (opens Quick Edit modal)
  3) Reassign owner (optional inline)
  4) View in Pipeline (optional)

B) SECONDARY CLICK (double click / “Open” button)
Action: deep link to Content Detail
- Default tab depends on event type (see routing rules below)

C) RIGHT-CLICK / KEBAB MENU (desktop)
- Open item
- Edit date(s)
- Copy link
- View activity
- (Optional) Duplicate item

DEEP LINK ROUTING RULES (Content Detail tab selection)

Rule 1: If item has “Blocked” status badge (hard blockers)
- Open to QA tab (because blockers usually resolve there)
- Exception: If blocker is purely missing Packaging fields for publish_event, open Packaging

Rule 2: Otherwise, route by event type
publish_event → Packaging tab
milestone_event → tab mapped to milestone_type:
- brief_due → Brief
- draft_due → Draft
- blueprint_due → Blueprint
- assets_due → Assets
- packaging_due → Packaging
- qa_due → QA
phase_window_event → tab mapped to phase_type:
- production_window → Draft (default) OR Blueprint (if you prefer planning-first)
- review_window → QA
- launch_window (if used) → Packaging

Rule 3: “Where it is in pipeline” override (status-aware)
If status is:
- Intake → open Brief (unless user clicked publish_event; then Packaging)
- In Progress → open Draft (default for most work)
- In Review / Revisions → open QA (review-centric)
- Approved / Scheduled → open Packaging (finalization)
- Published / Archived → open Activity (audit view) with “View Packaging” link

EDITING DATES FROM CALENDAR (Quick Edit)

A) Quick Edit Modal — publish_event
- Title (read-only)
- Date/time picker (schedule_at)
- Publish action (optional): Schedule / Publish now / Save as draft
- Read-only warnings:
  - “QA not approved” (if true)
  - “Missing required assets” (if true)
Buttons:
- Save
- Open item (Packaging)
Validation:
- BLOCK: schedule_at in the past
- WARN: scheduling earlier than qa_due or status not Approved (policy-configurable)

B) Quick Edit Modal — milestone_event
- Milestone label (draft_due/assets_due/qa_due/etc.)
- Date/time picker (due_at) with “All day” toggle (default on)
- Milestone owner (user picker; optional)
- Notes (optional)
Buttons:
- Save
- Open item (mapped tab)
Validation:
- WARN: due_at after schedule_at (if schedule exists AND milestone is required)
- WARN: draft_due after assets_due (best practice)

C) Quick Edit Modal — phase_window_event (span bar)
- Phase label (production_window/review_window)
- Range picker:
  - start_at
  - end_at
  - All-day toggle (default on)
- Owner (optional)
- Notes (optional)
Buttons:
- Save
- Open item (mapped tab)
Validation:
- BLOCK: end_at < start_at
- WARN: review_window ends after schedule_at (if publish exists)
- WARN: review_window overlaps publish day (if strict mode enabled)

SPAN TASK INTERACTION (fix prototype gap)
- Span bars MUST be clickable/tappable:
  - Click → Quick Peek (same as above)
  - Drag bar → shifts entire range (start/end move together)
  - Resize handles (optional):
    - drag start handle adjusts start_at
    - drag end handle adjusts end_at
- Hover state: highlight bar + show tooltip summary
- Selected state: thicker outline + shows Quick Peek anchored to bar

DRAG-AND-DROP RULES (Calendar direct manipulation)

publish_event drag:
- Updates schedule_at
- BLOCK if dropped in past
- WARN if not Approved / QA blockers exist (policy)

milestone_event drag:
- Updates due_at
- WARN if it creates inverted order (draft_due after qa_due, etc.) — suggestions only

phase_window_event drag:
- Shifts range; updates start_at/end_at
- BLOCK invalid range
- WARN if review window extends beyond publish date

LINKING BACK TO PIPELINE (wherever it is)
- Quick Peek includes a “View in Pipeline” link:
  - Opens Pipeline filtered to this item
  - Highlights card and shows next milestone + publish date
- Content Detail header includes breadcrumb:
  - Pipeline → Item → Calendar (back)

EMPTY/UNSCHEDULED ITEMS
- Items with no publish_event and no milestones:
  - Not shown on calendar
  - If user clicks “Create” in calendar, creation modal can optionally add:
    - publish date OR a milestone OR a phase window

MICROCOPY (key)
- Quick Peek CTA: “Open item”
- Quick Edit CTA: “Save changes”
- Warning: “This schedules publishing before QA is due.”
- Block: “Can’t schedule in the past.”
- Tooltip on disabled drag (permissions): “You don’t have permission to change publish dates.”

IMPLEMENTATION NOTE (for designers)
- Single click/tap = Quick Peek (anchored popover)
- Double click / Open button = Navigate to Content Detail
- This prevents accidental navigation and supports fast date edits.