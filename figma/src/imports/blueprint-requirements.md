BLUEPRINT TAB — FIGMA-READY REQUIREMENTS (All Platforms + All Canonical Content Types)

PURPOSE
Turn intent (Brief) + message (Draft) into a production-ready plan with the minimum human input. Blueprint is for “planning decisions” and “production guardrails,” NOT subjective confirmations. Anything AI can validate should appear as read-only status chips (Pass/Warn/Fail), not required checkboxes.

SCOPE
Platforms: YouTube, Instagram, LinkedIn, Facebook, TikTok
Canonical Types: VIDEO_SHORT_VERTICAL, VIDEO_LONG_HORIZONTAL, VIDEO_SHORT_HORIZONTAL, IMAGE_SINGLE, IMAGE_CAROUSEL, TEXT_POST, LINK_POST, DOCUMENT_CAROUSEL_PDF, STORY_FRAME_SET, LIVE_BROADCAST

PRIMARY UX PRINCIPLES
- Blueprint is conditional: only show the sections that matter for the chosen canonical type
- Auto-fill everything derivable from platform + canonical type (aspect ratio, resolution targets, safe zone rules)
- Keep Blueprint short:
  - Short-form video: 3–5 visible inputs
  - Long-form video: 5–7 visible inputs
  - Stories/carousels: 3–6 visible inputs
  - Live: 6–10 visible inputs
- No “confirm” checkboxes for things AI can evaluate (format coherence, hook timing, progression, etc.)
- Validations are read-only chips with fix suggestions; hard blocking happens at Packaging/QA, not Blueprint

INFORMATION ARCHITECTURE (top → bottom)
1) Blueprint Header (read-only context)
2) Format Plan (auto + minimal inputs)
3) Structure Plan (conditional by type)
4) Audio / Music Plan (conditional)
5) Accessibility Plan (minimal, decision-based)
6) Compliance & Risk Flags (conditional)
7) AI Checks (Preview) — read-only chips (optional but recommended)
8) More (Advanced) — collapsed

SECTION 1 — BLUEPRINT HEADER (Read-only, always visible)
Component: Context summary (chips)
- Key: blueprint_context_summary (derived)
- Shows: platform, canonical_type, objective, publishing_mode, format_profile (auto)
- Behavior: links back to Brief/Draft

SECTION 2 — FORMAT PLAN (Always present, mostly auto)
Field: Format profile (auto)
- Label: Format profile
- Key: format_profile
- Type: read-only pill / text
- Required: Always
- Source: derived from platform + canonical_type
- Example: “Instagram Reels — 9:16 — 1080×1920”

Field: Orientation / aspect ratio (rarely user-editable)
- Label: Aspect ratio
- Key: aspect_ratio
- Type: dropdown
- Required: Conditional
- Condition: only when platform supports multiple ratios for this type AND your workflow allows choice (otherwise hidden + derived)
- Default: derived
- UX: keep hidden unless user has a real choice

Field: Runtime target (seconds)
- Label: Runtime target
- Key: runtime_seconds
- Type: number
- Required: Conditional
- Condition: canonical_type in [VIDEO_SHORT_VERTICAL, VIDEO_LONG_HORIZONTAL, VIDEO_SHORT_HORIZONTAL]
- Validation: warn if outside recommended range for the platform/type (use your platform config)
- Helper: “Target length, not a hard limit.”

Field: Frame/slide count target
- Label: Frame count / Slide count
- Key: unit_count_target
- Type: number
- Required: Conditional
- Condition:
  - STORY_FRAME_SET => required (frames)
  - IMAGE_CAROUSEL / DOCUMENT_CAROUSEL_PDF => required (slides/pages)
- Validation: warn if unusually high/low (non-blocking)

SECTION 3 — STRUCTURE PLAN (Conditional)
A) Video structure (VIDEO_* only)
Field: Beat plan (simple)
- Label: Beat plan
- Key: beats
- Type: checklist
- Required: Optional (Recommended)
- Default items:
  - Hook
  - Value / demonstration
  - Proof / credibility (optional)
  - CTA
- UX: pre-filled; user can edit/reorder; keep it lightweight

Field: CTA placement
- Label: CTA placement
- Key: cta_placement
- Type: dropdown
- Required: Conditional
- Condition: objective in [Traffic, Leads, Sales]
- Options: Early | Middle | End | Repeated
- Default: End (short-form), Middle+End (long-form)

B) Carousel/PDF structure (IMAGE_CAROUSEL / DOCUMENT_CAROUSEL_PDF)
Field: Slide narrative pattern
- Label: Slide pattern
- Key: slide_pattern
- Type: dropdown
- Required: Optional (Recommended)
- Options: Problem→Solution | Steps/How-to | Myth-bust | Checklist | Before/After | FAQ
- Default: Steps/How-to

Field: CTA slide requirement (derived rule)
- Label: CTA slide included
- Key: cta_slide_included
- Type: read-only chip (derived from slide_outline presence in Draft)
- Required: Not applicable (no checkbox)
- UX: chip shows Pass/Warn with suggestion if missing

C) Stories structure (STORY_FRAME_SET)
Field: Story arc
- Label: Story arc
- Key: story_arc
- Type: dropdown
- Required: Optional (Recommended)
- Options: Tease→Tip→CTA | Poll→Reveal→CTA | Challenge prompt→Responses→CTA
- Default: Tease→Tip→CTA

Field: Interactive elements
- Label: Stickers / interactions
- Key: interactive_elements
- Type: multiselect
- Required: Optional
- Options: Poll | Questions | Quiz | Link sticker | Countdown

D) Live structure (LIVE_BROADCAST)
Field: Run of show (high-level)
- Label: Run of show
- Key: run_of_show
- Type: checklist (each item supports a short text note)
- Required: Always
- Default items: Intro, Main segment, Demo/flow, Q&A, CTA/close

Field: Roles
- Label: Roles
- Key: live_roles
- Type: checklist (with user picker per role)
- Required: Always
- Default roles: Host, Moderator, Producer/Tech

Field: Engagement plan
- Label: Engagement plan
- Key: live_engagement_plan
- Type: textarea
- Required: Optional (Recommended)

SECTION 4 — AUDIO / MUSIC PLAN (Conditional)
Field: Audio plan
- Label: Audio plan
- Key: audio_plan
- Type: dropdown
- Required: Conditional
- Condition: canonical_type in [VIDEO_* , STORY_FRAME_SET, LIVE_BROADCAST]
- Options: Original audio | Voiceover | Licensed track | Platform library | None
- Default: Original audio (short-form), Voiceover (long-form) — adjust per your norms

Field: Music source (metadata)
- Label: Music source / license notes
- Key: music_source
- Type: text
- Required: Conditional
- Condition: has_music=true OR audio_plan in [Licensed track, Platform library]
- UX: keep short; detailed proof belongs in Assets

SECTION 5 — ACCESSIBILITY PLAN (Decision-based, minimal)
Field: Captions strategy
- Label: Captions
- Key: captions_strategy
- Type: dropdown
- Required: Conditional
- Condition: canonical_type in [VIDEO_* , LIVE_BROADCAST] AND needs_accessibility=true
- Options: Burned-in | Upload SRT/VTT | Platform auto-captions (not recommended)
- Default: Burned-in (short-form), Upload SRT/VTT (long-form)

Field: Alt text approach
- Label: Alt text
- Key: alt_text_strategy
- Type: dropdown
- Required: Conditional
- Condition: canonical_type in [IMAGE_SINGLE, IMAGE_CAROUSEL, DOCUMENT_CAROUSEL_PDF] AND needs_accessibility=true
- Options: Per post | Per slide/page summary | Not needed
- Default: Per post (single image), Per slide summary (carousel/PDF)

Field: Safety / motion considerations
- Label: Safety & motion
- Key: motion_safety
- Type: checklist
- Required: Optional
- Options: Avoid flashing | Avoid rapid cuts | Text contrast check | Readable font size

SECTION 6 — COMPLIANCE & RISK (Conditional, minimal)
Field: Claims risk level
- Label: Claims risk
- Key: claims_risk
- Type: dropdown
- Required: Conditional
- Condition: has_claims=true
- Options: Low | Medium | High
- Default: Medium
- UX: used to enforce stricter QA later

Field: Required disclaimer pattern (short)
- Label: Disclaimer pattern
- Key: disclaimer_pattern
- Type: dropdown
- Required: Conditional
- Condition: has_claims=true OR publishing_mode=PAID_BOOSTED
- Options: “Results vary” | “Not medical advice” | “Consult a professional” | Custom
- Default: context-dependent (use your org policy)

SECTION 7 — AI CHECKS (PREVIEW) (Read-only, optional but recommended)
Component: AI Checks (chips)
- Key: blueprint_ai_checks (derived)
- Type: chips/badges with severity
- Required: Optional UI component (recommended)
- Examples (type-driven):
  VIDEO_*:
  - Hook timing: Pass/Warn/Fail (based on beat timestamps if available, or heuristic on script)
  - Segment balance: Pass/Warn/Fail (based on runtime + beat plan)
  - Safe-zone risk: Pass/Warn/Fail (if OST present)
  - Accessibility plan completeness: Pass/Warn/Fail (based on captions_strategy)
  CAROUSEL/PDF:
  - Slide 1 hook present: Pass/Warn
  - CTA slide present: Pass/Warn
  STORIES:
  - Frame 1 hook present: Pass/Warn
  LIVE:
  - Roles assigned: Pass/Warn/Fail
  - Run of show complete: Pass/Warn/Fail

Severity rules (Blueprint)
- Never block “Blueprint Complete” due to AI checks
- Show “Fix suggestions” inline for Warn/Fail
- Hard blocking occurs later in Packaging/QA when assets exist

SECTION 8 — MORE (ADVANCED) (Collapsed by default)
Field: Detailed notes to production
- Key: production_notes
- Type: textarea
- Required: Optional

Field: Shot list (advanced)
- Key: shot_list
- Type: checklist
- Required: Optional
- Visibility: VIDEO_LONG_HORIZONTAL only (default collapsed)

Field: Chapter plan (advanced)
- Key: chapters_plan
- Type: textarea
- Required: Optional
- Visibility: YouTube + VIDEO_LONG_HORIZONTAL (advanced)

Field: Brand style constraints (advanced)
- Key: brand_style_constraints
- Type: textarea
- Required: Optional

COMPLETION / GATING RULES (Blueprint “Complete”)
Required to mark Blueprint “Complete”:
- Always: format_profile (auto)
- VIDEO_*: runtime_seconds
- STORY_FRAME_SET: unit_count_target (frames)
- IMAGE_CAROUSEL / DOCUMENT_CAROUSEL_PDF: unit_count_target (slides/pages)
- LIVE_BROADCAST: run_of_show + live_roles
- Accessibility decisions required when needs_accessibility=true (captions_strategy for video/live; alt_text_strategy for image/PDF)

WARN vs BLOCK (Blueprint)
- BLOCK only for missing required Blueprint fields above
- WARN for:
  - runtime outside recommended range (platform/type config)
  - has_music=true but music_source empty
  - has_claims=true but claims_risk not set
  - stories/carousels with unusually high unit count

FIELD KEYS (Blueprint Tab Library)
format_profile, aspect_ratio, runtime_seconds, unit_count_target,
beats, cta_placement, slide_pattern, cta_slide_included, story_arc, interactive_elements,
run_of_show, live_roles, live_engagement_plan,
audio_plan, music_source,
captions_strategy, alt_text_strategy, motion_safety,
claims_risk, disclaimer_pattern,
production_notes, shot_list, chapters_plan, brand_style_constraints,
blueprint_ai_checks (derived)