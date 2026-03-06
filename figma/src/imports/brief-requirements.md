BRIEF TAB — FIGMA-READY REQUIREMENTS (All Platforms + All Canonical Content Types)

PURPOSE
Capture intent + constraints with minimal input, then auto-generate downstream requirements (Draft/Blueprint/Assets/Packaging/QA) based on Platform + Canonical Type + Toggles.

SCOPE
Platforms: YouTube, Instagram, LinkedIn, Facebook, TikTok
Canonical Types: VIDEO_SHORT_VERTICAL, VIDEO_LONG_HORIZONTAL, VIDEO_SHORT_HORIZONTAL, IMAGE_SINGLE, IMAGE_CAROUSEL, TEXT_POST, LINK_POST, DOCUMENT_CAROUSEL_PDF, STORY_FRAME_SET, LIVE_BROADCAST

PRIMARY UX PRINCIPLES
- ≤ 8 visible inputs by default (excluding a compact toggle row)
- Progressive disclosure: “More” is collapsed by default
- Brief collects intent; execution copy (e.g., Hook line) belongs in Draft
- No “user validates what AI can validate” on Brief (no confirmation checkboxes)
- Platform/type-specific requirements appear as a read-only preview, not more fields

LAYOUT / INFORMATION ARCHITECTURE (top → bottom)
1) Core Setup (always visible)
2) Goal & Message (always visible)
3) Flags (always visible, compact)
4) Ownership & Timeline (always visible)
5) Requirements Preview (read-only, optional but recommended)
6) More (collapsed)

SECTION 1 — CORE SETUP (Always visible)
Field: Platform
- Key: platform
- Type: dropdown
- Required: Always
- Options: YouTube, Instagram, LinkedIn, Facebook, TikTok
- Default: last used (per user/workspace)
- Behavior: changing platform re-filters canonical_type options + updates requirements preview

Field: Content type (Canonical)
- Key: canonical_type
- Type: dropdown
- Required: Always
- Options (canonical): VIDEO_SHORT_VERTICAL, VIDEO_LONG_HORIZONTAL, VIDEO_SHORT_HORIZONTAL, IMAGE_SINGLE, IMAGE_CAROUSEL, TEXT_POST, LINK_POST, DOCUMENT_CAROUSEL_PDF, STORY_FRAME_SET, LIVE_BROADCAST
- Validation: only show types supported by selected platform
- Behavior: changing type updates requirements preview + downstream required fields

SECTION 2 — GOAL & MESSAGE (Always visible)
Field: Objective
- Key: objective
- Type: dropdown
- Required: Always
- Options: Awareness, Engagement, Traffic, Leads, Sales, Community, Recruiting
- Default: Engagement

Field: Key message (1 sentence)
- Key: key_message
- Type: text
- Required: Always
- Validation: warn if <10 chars or >160 chars (non-blocking)
- Helper: “The one thing the audience should remember.”

Field: Primary CTA
- Key: primary_cta
- Type: dropdown
- Required: Conditional
- Condition: objective in [Traffic, Leads, Sales]
- Options: Learn more, Sign up, Download, Shop now, Book now, Contact us, Watch more
- Behavior: when selected, may trigger destination_url requirement

SECTION 3 — FLAGS (Always visible, compact row)
Field: Publishing mode
- Key: publishing_mode
- Type: segmented control
- Required: Always
- Options: ORGANIC (default), PAID_BOOSTED
- Downstream effects: requires campaign_name + destination_url; adds stricter approvals + QA checks

Field: Contains claims
- Key: has_claims
- Type: boolean
- Required: Optional
- Default: false
- Downstream effects: requires Legal/Compliance approver; later requires substantiation upload + QA checks

Field: Contains talent/faces
- Key: has_talent
- Type: boolean
- Required: Optional
- Default: false
- Downstream effects: later requires talent release/privacy evidence

Field: Uses music
- Key: has_music
- Type: boolean
- Required: Optional
- Default: false
- Downstream effects: later requires music source/license evidence

Field: Accessibility required
- Key: needs_accessibility
- Type: boolean
- Required: Optional
- Default: true
- Downstream effects: captions required for video; alt text required for image (rules by type)

SECTION 4 — OWNERSHIP & TIMELINE (Always visible)
Field: Owner
- Key: owner
- Type: user_picker
- Required: Always
- Default: current user (or project owner)

Field: Due date
- Key: due_date
- Type: date
- Required: Optional (make Conditional if your process requires a due date at intake)
- Validation: warn if due date < today (non-blocking)

SECTION 5 — REQUIREMENTS PREVIEW (Read-only, recommended)
Component: “Auto Requirements” chips (read-only)
- Key: requirements_preview (derived)
- Type: chips/badges
- Required: Optional UI component (recommended)
- Behavior: updates instantly when platform/canonical_type/toggles change
- Example chips:
  - “Captions required” (video + needs_accessibility)
  - “Alt text required” (image + needs_accessibility)
  - “Cover required” (Reels/Shorts/video types where applicable)
  - “Title required” (YouTube video types)
  - “Legal approval required” (has_claims or paid)
  - “Export packet required” (if your system exports instead of publishes)

SECTION 6 — MORE (Collapsed by default)
Field: Destination URL
- Key: destination_url
- Type: url
- Required: Conditional
- Condition: canonical_type=LINK_POST OR primary_cta implies link OR publishing_mode=PAID_BOOSTED
- Validation: must be valid URL; optional UTM suggestion (non-blocking)

Field: Approvers
- Key: approvers
- Type: user_picker (multi)
- Required: Conditional
- Condition: publishing_mode=PAID_BOOSTED OR has_claims=true OR paid_partnership=true
- Default behavior:
  - Always include Brand Reviewer (if your org uses brand review)
  - Auto-add Legal/Compliance when has_claims=true or PAID_BOOSTED
- UX: show as suggested default list with ability to edit

Field: Audience notes
- Key: audience_notes
- Type: textarea
- Required: Optional

Field: Must include / avoid
- Key: constraints_notes
- Type: textarea
- Required: Optional

Field: References / inspiration links
- Key: reference_links
- Type: url (multi)
- Required: Optional

Field: Hook angle (strategy hint — not the hook line)
- Key: hook_angle
- Type: dropdown
- Required: Optional
- Visibility: show only when canonical_type in [VIDEO_SHORT_VERTICAL, VIDEO_LONG_HORIZONTAL, VIDEO_SHORT_HORIZONTAL, STORY_FRAME_SET]
- Options: Pain relief, Beginner-friendly, Time-saver, No equipment, Stress relief, Mobility, Strength, Nutrition tip, Myth-bust, Common mistakes
- Note: the actual Hook line is created/required in Draft

PAID/PARTNERSHIP ADD-ONS (Auto-show only when triggered)
Field: Campaign name
- Key: campaign_name
- Type: text
- Required: Conditional
- Condition: publishing_mode=PAID_BOOSTED
- Default: auto-generate from platform + canonical_type + date (editable)

Field: Paid partnership
- Key: paid_partnership
- Type: boolean
- Required: Optional
- Downstream effects: requires disclosure fields + partner tagging later

COMPLETION / GATING RULES (Brief save/complete)
Required to mark Brief “Complete”:
- platform, canonical_type, objective, key_message, owner
Additional conditional required fields:
- If objective in [Traffic, Leads, Sales] => primary_cta required
- If destination_url condition true => destination_url required
- If PAID_BOOSTED => campaign_name + destination_url + approvers required (and must include Legal/Compliance)

NON-BLOCKING WARNINGS (do not prevent completion)
- key_message length outside recommended range
- due date in the past
- destination_url missing UTM (suggest only)

DOWNSTREAM OUTPUTS (Auto-derived from Brief)
- format_profile (from platform + canonical_type)
- required_fields_by_tab (Draft/Blueprint/Assets/Packaging/QA)
- asset_checklist (generated)
- qa_checklist (generated)
- approvals_required (based on toggles)