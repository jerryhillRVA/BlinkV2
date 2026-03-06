CALENDAR FEATURE — FIGMA-READY UX SPECIFICATIONS (Blink Social) — NEW FEATURES
(Additions: Multi-day spans via Phase Windows + Configurable Deadline Templates in Settings)

PURPOSE (Delta)
Enhance Calendar to support:
1) Multi-day spanning bars for production/review “phases” (Phase Windows)
2) Configurable default milestone offsets (“deadline templates”) and reminder timings via Settings
While preserving: one source of truth, no redundant data entry, and tight integration with Pipeline + Content Detail.

SCOPE
Platforms: YouTube, Instagram, LinkedIn, Facebook, TikTok
Canonical Types: VIDEO_SHORT_VERTICAL, VIDEO_LONG_HORIZONTAL, VIDEO_SHORT_HORIZONTAL, IMAGE_SINGLE, IMAGE_CAROUSEL, TEXT_POST, LINK_POST, DOCUMENT_CAROUSEL_PDF, STORY_FRAME_SET, LIVE_BROADCAST
Statuses: Intake, In Progress, In Review, Revisions, Approved, Scheduled, Published, Archived

1) DATA MODEL ADDITIONS (Figma-ready)

A) Phase Windows (NEW; multi-day spans)
phase_windows[] (array)
- phase_window_id (string)
- content_id (string)
- phase_type (enum):
  - production_window
  - review_window
  - launch_window (optional; only if you truly need it)
- start_at (datetime; typically all-day)
- end_at (datetime; inclusive end or end-exclusive per your system convention)
- owner (user; optional; default = content owner)
- is_required (boolean; optional; policy-driven)
- notes (string; optional)

B) Workspace Deadline Template Settings (NEW; global defaults)
workspace_deadline_templates (object)
- enabled (boolean; default true)
- auto_create_on_publish_set (boolean; default true)
- templates_by_canonical_type (map)
  - key: canonical_type
  - value:
    - milestones (array of objects):
      - milestone_type (enum): brief_due, draft_due, blueprint_due, assets_due, packaging_due, qa_due, publish_ready_due
      - offset_days (integer; negative = before publish, positive = after)
      - default_time (time; optional; e.g., 17:00)
      - required (boolean; default true for draft/assets/qa, optional for others)
    - phase_windows (array of objects; optional):
      - phase_type (production_window, review_window)
      - start_offset_days (integer)
      - end_offset_days (integer)
      - required (boolean)
- templates_by_platform (optional; off by default; only add if needed later)

C) Workspace Reminder Settings (NEW; global defaults)
workspace_reminder_settings (object)
- enabled (boolean; default true)
- reminders_by_event_type:
  - milestone_event: [72h, 24h, overdue_morning] (defaults)
  - publish_event: [24h_if_not_approved_or_blocked] (default)
- delivery_channels (optional UI only): in_app, email, slack (if supported)

D) Per-item overrides (NEW)
- use_workspace_deadline_defaults (boolean; default true)
- item_deadline_overrides (optional):
  - milestones[] (existing, with user-edited due_at)
  - phase_windows[] (existing, with user-edited start/end)

2) NEW EVENT TYPES & RENDERING RULES

A) Phase Window Event (NEW)
- Key: phase_window_event
- Source of truth: phase_windows[]
- Multiplicity: 0..N per content item (recommend max 2 by default: production + review)
- Calendar representation:
  - Month view: thin spanning bar across days (like all-day range)
  - Week/Day view: appears in all-day lane as a spanning bar
  - List view: appears as a range row (e.g., “Production window: Mar 10–Mar 14”)
- Visual encoding:
  - Uses status color stripe (same as item status)
  - Uses pattern/border to differentiate from publish/milestone:
    - Phase bar: semi-transparent fill + label + small icon
    - Milestone: outlined pill + flag icon
    - Publish: solid pill + publish icon
  - Icon:
    - production_window: wrench/gear
    - review_window: check/clipboard
- Label format:
  - “[PhaseLabel] • [title_display]”
- Click behavior:
  - Opens Content Detail → default tab based on phase_type:
    - production_window → Draft tab (or Blueprint if you prefer)
    - review_window → QA tab
  - Quick actions available in peek/modal (edit range dates, owner)

B) Relationship to milestones
- Phase windows are not a replacement for deadlines:
  - Milestones remain point-in-time “due by” events
  - Phase windows show multi-day work periods (planning + review)

3) CALENDAR VIEW UPDATES (Month/Week/Day/List/Upcoming)

A) Month View
- Render order within a day cell:
  1) Phase window bars (behind/at top edge of cell)
  2) Overdue milestone pills
  3) Upcoming milestone pills
  4) Publish pills (timed badge)
- Density:
  - Phase bars do not count against “N events shown” threshold; they render as background bars
  - “+X more” applies to milestone/publish pills only

B) Week/Day View
- All-day lane:
  - Phase bars span their date range
  - Milestones appear as all-day pills (flag)
- Timed grid:
  - Publish events at schedule_at time
- Collision behavior:
  - If multiple phase bars overlap, stack to max 2 lines before collapsing with “+X phases”

C) List View (Agenda)
- Phase windows display as range rows:
  - Left: date range
  - Middle: label + chips
  - Right: status + severity if at-risk/blocked
- Sorting:
  - Phase windows appear before same-day milestones, before timed publish events

D) Upcoming Panel
- Include Phase Windows:
  - Show phase windows that intersect the next 14 days
  - Show “Today is within Production window” indicator
- Default order:
  1) Overdue milestones
  2) Items currently in a phase window (production/review)
  3) Next publish events
  4) Next milestone per item

4) INTERACTION MODEL UPDATES

A) Create / Auto-generate deadlines when publish date is set
Trigger: user sets schedule_at via Packaging or Calendar
If workspace_deadline_templates.enabled AND auto_create_on_publish_set=true:
- System suggests milestones + phase windows based on canonical_type template
- UX: show a small modal/toast:
  - “Added suggested deadlines for this publish date” with “Review” link
- User can:
  - Accept (default)
  - Undo (removes auto-created events)
  - Customize (opens Timeline editor)

B) Timeline editor (Content Detail) updates
Add Timeline section actions:
- “Apply workspace defaults” (toggle on/off)
- “Reset to defaults” (button; only if overrides exist)
- Add phase window (button; shows types allowed)
- Edit phase window range (start/end pickers)
- Edit milestone due date/time + owner

C) Quick Edit Modal updates
Publish quick edit:
- Adds checkbox: “Apply default deadlines” (shown if schedule_at changed and defaults enabled)
Milestone quick edit:
- No change
Phase window quick edit (NEW):
- Range picker: start_at, end_at
- Owner (optional)
- Notes (optional)
- Read-only chips: “Overlaps publish date” warn if review window extends past publish (policy-configurable)

D) Drag-and-drop updates
Phase window drag:
- Drag entire bar to shift range (start/end shift equally)
- Resize handles (optional feature):
  - Drag start handle to adjust start
  - Drag end handle to adjust end
- Constraints:
  - BLOCK: end before start
  - WARN: review_window ending after publish date (if publish exists)
  - WARN: production_window starting after draft_due (if draft_due exists)

5) SETTINGS — NEW SECTION (Workspace-level)

Add Settings section:
- Settings → Calendar & Deadlines

A) Deadline Templates
- Toggle: Enable deadline templates
  - Key: deadline_templates_enabled
- Toggle: Auto-create deadlines when publish date set
  - Key: auto_create_on_publish_set
- Template editor (by canonical type):
  - Dropdown: canonical_type selector
  - Milestones list (reorderable):
    - milestone_type
    - offset_days (integer)
    - default_time (optional)
    - required (toggle)
  - Phase windows list (optional):
    - phase_type
    - start_offset_days
    - end_offset_days
    - required (toggle)
- Preview panel:
  - “If publish date is Apr 30, your deadlines will be…”
- Default templates (recommended baseline; editable):
  - VIDEO_SHORT_VERTICAL: draft -7, assets -5, qa -2; production window -7 to -3; review window -2 to -1
  - VIDEO_LONG_HORIZONTAL: draft -14, assets -10, qa -3; production -14 to -6; review -3 to -1
  - IMAGE_SINGLE: draft -5, assets -3, qa -1; production -5 to -2; review -1 to -1
  - IMAGE_CAROUSEL/PDF: draft -7, assets -4, qa -2; production -7 to -3; review -2 to -1
  - TEXT/LINK: draft -3, qa -1; review -1 to -1
  - STORIES: draft -4, assets -2, qa -1
  - LIVE: prep checklist window -7 to -1; qa -1 (optional)

B) Reminder Defaults
- Toggle: Enable reminders
  - Key: reminders_enabled
- Milestone reminders:
  - Multi-select: 72h before, 24h before, day-of morning, overdue morning
- Publish reminders:
  - Toggle: remind 24h before publish if not approved/blocked
- Note: delivery channels are optional; keep UI minimal

6) RULES / WARNINGS / BLOCKERS (Updated)

BLOCKERS (hard stop)
- Invalid ranges (end_at < start_at)
- Scheduling publish into the past
- Editing restricted by permissions (no silent failures)

WARNINGS (non-blocking, visible)
- review_window end_at after schedule_at (if publish exists)
- qa_due after schedule_at (if publish exists)
- draft_due after assets_due (best practice)
- phase windows overlap in ways that indicate overload (optional heuristic)
- item is “At-risk” (scheduled soon, not approved, missing requirements)

7) FIGMA DELIVERABLE INVENTORY (Delta)

New/Updated screens
- Settings → Calendar & Deadlines (Deadline Templates + Reminders)
- Phase Window quick edit modal
- Timeline editor updates in Content Detail (phase windows + reset/apply defaults UI)

New/Updated components
- Phase window bar (multi-day span)
- Phase window bar states: normal/hover/selected/dragging/resizing/overdue/at-risk
- Template editor row (milestone offset row, phase window row)
- “Apply defaults” toast/modal
- Range picker component (start/end)

Microcopy (new)
- Auto-create toast: “Suggested deadlines added based on your workspace defaults.”
- Undo: “Undo”
- Reset button: “Reset to workspace defaults”
- Warning: “Review window extends past publish date.”