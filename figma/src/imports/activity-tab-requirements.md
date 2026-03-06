ACTIVITY TAB — FIGMA-READY REQUIREMENTS (All Platforms + All Canonical Content Types)

PURPOSE
Provide a complete, low-friction audit trail of work: who did what, when, why, and what changed. Activity is mostly auto-generated. The only intentional user inputs are comments and lightweight decision notes.

SCOPE
Platforms: YouTube, Instagram, LinkedIn, Facebook, TikTok
Canonical Types: VIDEO_SHORT_VERTICAL, VIDEO_LONG_HORIZONTAL, VIDEO_SHORT_HORIZONTAL, IMAGE_SINGLE, IMAGE_CAROUSEL, TEXT_POST, LINK_POST, DOCUMENT_CAROUSEL_PDF, STORY_FRAME_SET, LIVE_BROADCAST

PRIMARY UX PRINCIPLES
- Read-first: show the most important events at a glance
- Zero redundant data entry: Activity is not another form
- Filterable timeline with smart grouping (reduces noise)
- Everything important is linkable back to the source tab/state
- Supports accountability + compliance audits without being annoying

INFORMATION ARCHITECTURE (top → bottom)
1) Activity Header (context + filters)
2) Comment Composer (user input)
3) Timeline (auto-generated, grouped)
4) Decision Log (optional, lightweight)
5) System Audit (advanced, expandable)

SECTION 1 — ACTIVITY HEADER (Always visible)
Component: Context summary (chips)
- Key: activity_context_summary (derived)
- Shows: platform, canonical_type, current status, owner, due_date, publish_action/schedule_at (if any)
- UX: compact; clicking a chip can open related tab (optional)

Component: Filters + search
- Key: activity_filters
- Type: controls
- Controls:
  - Search (text)
  - Event type filter (multiselect): Comments, Status changes, Assignments, Uploads, Field edits, AI validations, QA actions, Approvals, Exports/Publishes, Links
  - People filter (user multiselect)
  - Date range (optional)
  - “Show only important” toggle (default ON)
- Behavior: filters timeline in real time

SECTION 2 — COMMENT COMPOSER (Only user input, always visible)
Field: Comment
- Label: Add a comment
- Key: comment_text
- Type: textarea
- Required: Optional
- UX:
  - Supports @mentions
  - Supports attachments (optional; if you allow, store as comment_attachments)
  - Primary action: “Post”
  - Secondary: “Post + request review” (optional workflow shortcut)

Field: Comment visibility (optional)
- Key: comment_visibility
- Type: dropdown
- Required: Optional
- Options: Team, Approvers only (if you support)
- Default: Team

SECTION 3 — TIMELINE (Auto-generated, always visible)
Component: Activity timeline
- Key: activity_timeline (derived)
- Type: grouped list
- Default grouping (reduce noise):
  - “Today”, “Yesterday”, “Earlier”
  - Within each day, group consecutive similar events (e.g., multiple uploads)
- Each event item includes:
  - timestamp
  - actor (user or “System”)
  - event type icon
  - concise message (1 line)
  - “View details” expand affordance
  - deep link to relevant tab/field (where possible)

Event types (auto-captured):
A) Status changes
- Example: “Status changed: In Review → Approved”
- Include: old_status, new_status, reason (if provided), actor

B) Assignments / ownership changes
- Example: “Owner changed: Alex → Jamie”
- Include: field, old_value, new_value, actor

C) Draft edits
- Example: “Draft updated: caption edited”
- Include: changed_fields summary; optional diff view (advanced)

D) Blueprint updates
- Example: “Blueprint updated: runtime target changed 30s → 45s”

E) Asset uploads / removals
- Example: “Uploaded: master_video.mp4” / “Removed: v01 thumbnail”
- Include: file name(s), version tags if used

F) Packaging changes
- Example: “Packaging updated: schedule set for Mar 12, 10:00 AM”
- Include: key metadata fields changed

G) AI validations
- Example: “AI check: Captions present = FAIL → PASS”
- Include: check_name, old_state, new_state
- UX: show only important validation changes by default

H) QA actions
- Checklist item completion
- “Request changes” events (with link to notes)

I) Approvals
- Example: “Legal approved” / “Brand requested changes”
- Include: approver, decision, timestamp, optional note link

J) Export/Publish events
- Example: “Exported publishing packet v03”
- Example: “Scheduled post” / “Published”
- Include: publish_action, schedule time, destination (if known), version stamp

SECTION 4 — DECISION LOG (Optional, lightweight, recommended)
Purpose: capture “why” for key decisions without long comments.

Component: Decision log entries
- Key: decision_log (semi-structured; user input + auto references)
- Type: list + “Add decision” button
- Required: Optional
- Decision entry fields:
  - Decision title (text) — key: decision_title
  - Decision note (textarea) — key: decision_note
  - Related area (dropdown) — key: decision_scope
    Options: Brief, Draft, Blueprint, Assets, Packaging, QA
  - Date/actor auto-filled
- UX: keep short; not required

SECTION 5 — SYSTEM AUDIT (Advanced, expandable)
Component: Full audit trail (raw)
- Key: system_audit_trail (derived)
- Type: expandable panel
- Includes:
  - Field-level changes with old/new values (where appropriate)
  - System rule evaluations (e.g., “Legal required because has_claims=true”)
  - API/publishing integration logs (if applicable)
- Default: collapsed (only needed for debugging/compliance)

IMPORTANCE RANKING (for “Show only important”)
Important events include:
- Status changes
- Approval decisions
- Request changes + notes
- Export/Publish/Schedule events
- New blockers introduced (AI check FAIL)
- Required asset missing introduced (asset removed)
- Ownership reassignment

Everything else can be hidden unless user toggles “Show all”.

COMPLETION / GATING RULES
- No completion gating on Activity tab.
- Activity never blocks workflow states.

FIELD KEYS (Activity Tab Library)
activity_context_summary (derived),
activity_filters,
comment_text, comment_visibility,
activity_timeline (derived),
decision_log, decision_title, decision_note, decision_scope,
system_audit_trail (derived)