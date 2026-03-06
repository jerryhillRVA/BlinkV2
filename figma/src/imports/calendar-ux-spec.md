CALENDAR FEATURE — FIGMA-READY UX SPECIFICATIONS (Blink Social)

PURPOSE
Provide a unified planning surface for publish schedules + production deadlines, tightly integrated with Pipeline and Content Detail. Calendar must reduce missed deadlines, surface at-risk items early, and enable fast navigation to the right workflow tab.

SCOPE
Platforms: YouTube, Instagram, LinkedIn, Facebook, TikTok
Canonical Types: VIDEO_SHORT_VERTICAL, VIDEO_LONG_HORIZONTAL, VIDEO_SHORT_HORIZONTAL, IMAGE_SINGLE, IMAGE_CAROUSEL, TEXT_POST, LINK_POST, DOCUMENT_CAROUSEL_PDF, STORY_FRAME_SET, LIVE_BROADCAST
Workflow Tabs: Brief, Draft, Blueprint, Assets, Packaging, QA, Activity
Statuses: Intake, In Progress, In Review, Revisions, Approved, Scheduled, Published, Archived

CORE UX PRINCIPLES
- Calendar is not a second workflow: it surfaces dates + status and deep-links to Content Detail.
- No manual “confirmations” for AI-checkable items; use read-only chips/badges.
- One source of truth: edits in Calendar must sync to Packaging (publish date) and Timeline/Milestones (deadlines).
- Minimal friction: quick peek + quick edit should cover 80% of actions.
- Consistent color/status encoding with Pipeline.

1) JOBS-TO-BE-DONE (JTBD)
- See what’s scheduled to publish and when, across platforms, in one view.
- See upcoming deadlines (draft/assets/QA) to prevent late-stage surprises.
- Identify at-risk scheduled items (missing assets/approvals/requirements) early.
- Reassign ownership and adjust deadlines quickly when workload shifts.
- Create new content from a date context (e.g., “need a post Friday”).
- Jump from any calendar event to the relevant Content Detail tab (Draft vs QA vs Packaging).
- Plan the week: filter to “This week launches” and align milestones to hit publish dates.
- Audit changes: know who moved a publish date or deadline and why.

2) DATA MODEL & EVENT TYPES (Figma-ready)

A) Content Item (existing fields used by Calendar)
- content_id (string)
- platform (enum)
- canonical_type (enum)
- status (enum)
- owner (user)
- approvers (users; optional)
- schedule_at (datetime; optional; from Packaging)
- title_display (string; derived: Packaging.title OR Brief.key_message truncated)
- flags (booleans): publishing_mode, has_claims, has_talent, has_music, needs_accessibility

B) Milestones (NEW)
- milestones[] (array)
  - milestone_id (string)
  - milestone_type (enum): brief_due, draft_due, blueprint_due, assets_due, packaging_due, qa_due, publish_ready_due (optional)
  - due_at (datetime)
  - milestone_owner (user; default = content owner)
  - is_required (boolean; derived by policy/config; editable only by admins if desired)
  - milestone_status (derived): not_started, in_progress, done, overdue, blocked (optional)

C) Calendar Event rendering (derived, not stored)
Event Type 1: Publish Event
- Key: publish_event
- Source of truth: schedule_at (Packaging)
- Multiplicity: 0..1 per content item (MVP)
- Calendar pill label: “[PlatformAlias] • [title_display]”
- Icon: publish (paper plane)
- Click → opens Content Detail to Packaging tab

Event Type 2: Milestone Event
- Key: milestone_event
- Source of truth: milestones[].due_at
- Multiplicity: 0..N per content item
- Calendar pill label: “[MilestoneLabel] • [title_display]”
- Icon: flag
- Click → opens Content Detail to tab mapped by milestone_type:
  - brief_due → Brief
  - draft_due → Draft
  - blueprint_due → Blueprint
  - assets_due → Assets
  - packaging_due → Packaging
  - qa_due → QA

(OPTIONAL) Event Type 3: Review Meeting
- Only include if your org schedules review sessions in Blink.
- Stored as milestone_type=review_meeting with due_at + attendees.

SYNC RULES
- Editing publish event updates schedule_at (Packaging).
- Editing milestone updates milestones[].due_at (Timeline).
- All date edits create Activity log entries (who/when/what changed).

3) VIEWS & LAYOUT

A) Traditional Calendar View (Month / Week / Day)
Shared controls (top bar):
- View switch: Month | Week | Day | List
- Date navigation: Prev / Today / Next
- Filters (see section 7)
- Toggle: Show milestones (default ON)
- Toggle: Show published (default ON)

Month View
- Density rules:
  - Show up to N events per day cell; “+X more” expands day drawer
  - Prioritize display order:
    1) Overdue milestones
    2) Upcoming milestones (soonest first)
    3) Publish events (timed)
- All-day vs timed:
  - Milestones default to all-day display
  - Publish events show time badge if schedule_at includes time

Week View
- Timed lane:
  - Publish events appear in timed grid (schedule_at)
- All-day lane:
  - Milestones appear as all-day rows by default
- Optional toggle: “Show milestones in time grid” (off by default)

Day View
- Full list + time grid
- Supports quick edit without leaving the view

B) List Calendar View (Agenda)
- Grouping: by day (default), collapsible headers
- Sorting: chronological; optional “At-risk first” toggle
- Row design:
  - Left: time/all-day + event icon (flag/publish)
  - Middle: title_display + platform chip + canonical_type chip
  - Right: status chip + severity badge (At-risk/Overdue/Blocked)
- Infinite scroll: “Load next 7 days”

C) Upcoming Panel (Persistent)
- Placement: right sidebar (collapsible); on mobile becomes drawer
- Time horizon: next 14 days (default), configurable to 7/30
- Default count: 10 items, with “View all” link to List view
- Shows:
  - All publish events within horizon
  - Overdue milestones (always pinned at top)
  - Next required milestone per content item (if no publish date exists)
- Upcoming row:
  - icon + date/time
  - title_display
  - platform chip
  - status color stripe
  - severity badge if at-risk/overdue/blocked
- Inline actions:
  - Reassign owner (user picker)
  - Edit date (date/time picker)
  - Open item (deep link)

4) COLOR SYSTEM & VISUAL ENCODING

A) Status color mapping (consistent across Pipeline + Calendar)
- Intake: neutral gray
- In Progress: blue
- In Review: purple
- Revisions: orange
- Approved: teal
- Scheduled: green
- Published: dark green (or green + check icon)
- Archived: muted gray

B) Event type encoding (no extra colors)
- Publish event pill: solid fill + publish icon
- Milestone pill: outlined/dashed border + flag icon

C) Severity encoding (redundant cues)
- Overdue: red “Overdue” badge + warning icon + red border
- At-risk: amber “At-risk” badge + warning icon
- Blocked: red “Blocked” badge + stop icon + “View blockers” link in peek/modal
Accessibility:
- Never rely on color only: always include icon + text badge

5) INTERACTION MODEL (Critical)

A) Click / navigation behavior
- Clicking any calendar pill opens Content Detail (deep link)
- Default tab opened depends on event type:
  - Publish event → Packaging tab
  - Milestone event → tab mapped by milestone_type (see section 2)
- Secondary: “Open in new tab” available via context menu (optional)

B) Quick Peek (hover/long-press)
Quick peek card content:
- title_display
- platform + canonical_type chips
- status chip
- owner
- next milestone (type + date) and/or publish time
- severity summary (top 1–2 blockers if blocked)
Actions:
- Open
- Quick edit
- Reassign

C) Quick Edit Modal (small, fast)
Modal fields (publish event):
- Date/time picker (schedule_at)
- Publish action (optional if you support: publish now/schedule/draft)
- Read-only chips: at-risk/blocked + top blockers
Buttons:
- Save
- Open item

Modal fields (milestone event):
- Date/time picker (due_at)
- Milestone owner (user picker)
- Notes (optional)
- Read-only chips: overdue/at-risk + suggested sequencing warnings
Buttons:
- Save
- Open item

D) Drag-and-drop behaviors
Publish event drag/drop:
- Updates schedule_at
- BLOCK if:
  - moved to past
  - status=Archived
- WARN if:
  - content not Approved and publish is within policy window (e.g., <48h)
  - qa_due exists after new schedule_at
Milestone drag/drop:
- Updates due_at
- WARN if:
  - qa_due moved after schedule_at (if schedule_at exists)
  - draft_due moved after assets_due (best practice warning)
- No rigid enforcement unless configured by admin policy

E) Create content from Calendar (recommended)
Entry points:
- Click empty day cell (Month) or empty time slot (Week/Day) → “Create content”
Create modal uses Brief MVP fields only:
- platform (prefill from current filter)
- canonical_type
- objective
- key_message
- owner
- Optional: set publish date (schedule_at) OR create a milestone due date
On create:
- New item in Intake
- If publish date set, auto-suggest milestone template (see section 9)

6) INTEGRATION WITH PIPELINE & CONTENT DETAIL

Pipeline card requirements (tight integration)
- Show publish date/time (if schedule_at exists)
- Show next milestone (soonest due_at)
- Show severity badge (Overdue/At-risk/Blocked)
- Quick actions:
  - Set publish date
  - Add milestone
  - Open in Calendar (filtered)

Content Detail requirements (Timeline integration)
Add a “Timeline” section (recommended: top Overview panel or Brief sidebar)
- Displays:
  - schedule_at (publish)
  - milestones list (type, due_at, owner, status)
- Allows editing milestones (same fields as quick edit)
- Shows derived chips:
  - “At-risk” if missing requirements for scheduled publish
  - “Blocked” if QA has fails or required approvals missing
Activity logging:
- Log every date change with old/new values + actor + source (“edited in Calendar”)

QA integration signals in Calendar
- If QA has blockers: show “Blocked” badge on publish pill and in Upcoming
- If missing required approvals/assets for scheduled publish: show “At-risk” badge

7) FILTERS & CONTROLS

Filter bar (applies to Calendar + List + Upcoming)
- Platform (multi)
- Canonical type (multi)
- Status (multi)
- Owner (multi)
- Approver (multi)
- Campaign name (text)
- Flags toggles: paid_boosted, has_claims, has_talent, has_music
- Tags (optional)
- Saved views dropdown (see below)
- Search (title_display, key_message, content_id)

Saved views (presets)
- My items (owner=me)
- Team launches this week (schedule_at within 7 days)
- Needs review (status=In Review)
- At-risk scheduled (schedule_at within 7 days AND status≠Approved)
- Overdue milestones
- Paid campaigns (publishing_mode=PAID_BOOSTED)

8) NOTIFICATIONS & REMINDERS (UX spec only)

Reminder defaults (suggested)
- For required milestones:
  - 72h before due
  - 24h before due
  - On overdue (start of day)
- For scheduled publish:
  - 24h before publish if status≠Approved OR blockers exist

Reminder configuration UX
- Global settings (workspace): default reminder timings
- Per item override (Timeline section): toggle reminders on/off + timing presets

Upcoming panel behavior
- Overdue items pinned at top
- Optional “Snooze” (1 day / 3 days) for reminders (if supported)

9) EDGE CASES & RULES

Items without publish date
- Still appear via milestones (if any)
- If no publish date and no milestones: not shown on calendar; accessible via Pipeline
- Provide CTA in Upcoming: “Add publish date or deadline”

Items with publish date but incomplete requirements
- Show “At-risk” badge
- Quick peek shows top 1–2 reasons (e.g., “QA not approved”, “Thumbnail missing”)

Multiple platforms per item (if supported)
MVP recommendation:
- Single content item with platform chips; one schedule_at
- If you later add per-platform variants, show split publish events per variant

Time zones
- Display defaults to America/New_York
- If user profile has different zone, show local time with small “ET” indicator + hover reveals both

Permissions
- Publisher role: can edit schedule_at
- Owner/Producer: can edit milestones
- Approver: cannot reschedule unless granted
- UI: disable drag/drop with tooltip when lacking permission

Milestone template suggestion (non-mandatory)
When schedule_at is set, suggest milestones (editable):
- draft_due = publish - 7 days
- assets_due = publish - 5 days
- qa_due = publish - 2 days

10) FIGMA DELIVERABLE INVENTORY

Screens
- Calendar Month / Week / Day
- Calendar List (Agenda)
- Upcoming panel (expanded/collapsed)
- Day drawer (“+X more” expanded list)
- Quick peek card
- Quick edit modal (publish event)
- Quick edit modal (milestone event)
- Create content modal (from calendar)

Components
- Event pill: publish
- Event pill: milestone
- Status chip
- Platform chip
- Canonical type chip
- Severity badges: Overdue / At-risk / Blocked
- Filter bar + saved views
- Upcoming row
- Validation chips (Pass/Warn/Fail)
- “Requirements preview” snippet (top blockers list)

State specs (event pill)
- Normal
- Hover/peek
- Selected
- Dragging
- Drag invalid (blocked)
- Overdue
- At-risk
- Blocked

Microcopy (key)
- Empty day: “No content scheduled. Create content for this day.”
- No publish date: “No publish date set — add one or add a deadline.”
- Blocked move: “Can’t schedule in the past.”
- Warning move: “This moves publish ahead of QA due date. Update QA deadline or proceed.”
- Permission: “You don’t have permission to change publish dates.”