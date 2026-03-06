DRAFT TAB — FIGMA-READY REQUIREMENTS (All Platforms + All Canonical Content Types)

PURPOSE
Capture the actual publishable “message layer” (copy + script + on-screen text) in a creator-friendly way, with platform/type-aware constraints and minimal required inputs. Draft is where “Hook” lives (not Brief).

SCOPE
Platforms: YouTube, Instagram, LinkedIn, Facebook, TikTok
Canonical Types: VIDEO_SHORT_VERTICAL, VIDEO_LONG_HORIZONTAL, VIDEO_SHORT_HORIZONTAL, IMAGE_SINGLE, IMAGE_CAROUSEL, TEXT_POST, LINK_POST, DOCUMENT_CAROUSEL_PDF, STORY_FRAME_SET, LIVE_BROADCAST

PRIMARY UX PRINCIPLES
- One primary input area per content type (don’t show irrelevant fields)
- Progressive disclosure: Advanced copy fields collapsed by default
- Show live counters + inline constraint warnings (warn vs block rules below)
- Never ask the user to “confirm” things AI can validate; use validations/chips instead
- Draft should be “fast to write, easy to review”

INFORMATION ARCHITECTURE (top → bottom)
1) Draft Header (read-only context)
2) Primary Draft Inputs (varies by canonical type)
3) CTA & Links (conditional)
4) Tags & Mentions (optional)
5) Disclosures / Compliance Copy (conditional)
6) Notes (optional)
7) AI Assist + Validations (read-only, optional component)

SECTION 1 — DRAFT HEADER (Read-only, always visible)
Component: Context summary (chips)
- Key: draft_context_summary (derived)
- Shows: platform, canonical_type, objective, publishing_mode, key_message (truncated)
- Behavior: clicking opens Brief in side panel (optional)

SECTION 2 — PRIMARY DRAFT INPUTS (Type-driven)

A) Hook (the opening line / first frame headline)
Field: Hook
- Key: hook
- Type: text
- Required: Conditional (rule below)
- Label changes by type:
  - VIDEO_*: “Hook (first line / first 2 seconds)”
  - STORY_FRAME_SET: “Frame 1 hook”
  - IMAGE_CAROUSEL / DOCUMENT_CAROUSEL_PDF: “Slide 1 headline”
  - TEXT_POST / LINK_POST: “Opening line”
  - IMAGE_SINGLE: “Headline overlay (optional)” (default Optional)
- Helper: “Make the first thing they see/hear impossible to ignore.”
- Validation: warn if >120 chars (non-blocking)

Hook Required Rule (implementation)
hook_required = true when:
- canonical_type in [VIDEO_SHORT_VERTICAL, STORY_FRAME_SET]
OR
- publishing_mode=PAID_BOOSTED
OR
- (canonical_type in [TEXT_POST, LINK_POST] AND platform in [LinkedIn, Facebook])
OR
- (canonical_type in [VIDEO_LONG_HORIZONTAL, VIDEO_SHORT_HORIZONTAL] AND objective in [Awareness, Engagement])
Otherwise optional.

B) Main Copy / Caption / Body
Field: Primary copy
- Key: post_copy
- Type: textarea
- Required: Conditional (rule below)
- Label changes by platform/type:
  - Instagram/TikTok/Facebook: “Caption”
  - LinkedIn: “Post text”
  - YouTube long: “Description (draft)” (title handled in Packaging)
  - LINK_POST: “Post text (with link preview)”
- Platform constraints: apply live character counter + limit warnings (platform-specific values from your config)
- Default/Auto-fill: suggest from key_message + objective + CTA

post_copy Required Rule
- Required when canonical_type in [TEXT_POST, LINK_POST, IMAGE_SINGLE, IMAGE_CAROUSEL, DOCUMENT_CAROUSEL_PDF, STORY_FRAME_SET]
- Optional when canonical_type in [VIDEO_* , LIVE_BROADCAST] (because script may be primary), but recommended if platform typically uses captions (IG/TikTok/FB).

C) Script / Run of Show (video/live/story optional)
Field: Script / narration
- Key: script
- Type: richtext
- Required: Conditional
- Condition:
  - Required for LIVE_BROADCAST (as “Run of show”)
  - Optional for VIDEO_* (show by default for long-form; collapsed for short-form)
- Helper:
  - VIDEO_*: “Voiceover/dialog or beat-by-beat notes.”
  - LIVE: “Segment plan + prompts + timing.”

D) On-Screen Text (OST) / Overlays
Field: On-screen text plan
- Key: on_screen_text
- Type: textarea
- Required: Conditional
- Condition: canonical_type in [VIDEO_SHORT_VERTICAL, VIDEO_SHORT_HORIZONTAL, VIDEO_LONG_HORIZONTAL, STORY_FRAME_SET]
- UX: show a “safe zone warning” chip if text is likely near edges (if your AI supports)

E) Story Frame Breakdown (Stories only)
Field: Frame list
- Key: story_frames
- Type: checklist (each item has mini text input)
- Required: Conditional
- Condition: canonical_type = STORY_FRAME_SET
- UX: default frame count derived from Blueprint; allow add/remove

F) Carousel / Document Page Breakdown (Carousel/PDF only)
Field: Slide list
- Key: slide_outline
- Type: checklist (each item has mini text input)
- Required: Conditional
- Condition: canonical_type in [IMAGE_CAROUSEL, DOCUMENT_CAROUSEL_PDF]
- UX: require at least Slide 1 + final CTA slide outline (warn if missing)

SECTION 3 — CTA & LINKS (Conditional, appears when relevant)
Field: CTA line (optional reinforcement)
- Key: cta_line
- Type: text
- Required: Conditional
- Condition: objective in [Traffic, Leads, Sales]
- Helper: “What should they do next?”

Field: Link(s)
- Key: links
- Type: url (multi)
- Required: Conditional
- Condition: canonical_type=LINK_POST OR destination_url required from Brief OR objective in [Traffic, Leads, Sales]
- Validation: valid URLs; optional UTM suggestion (warn if missing UTMs when paid/traffic)

SECTION 4 — TAGS & MENTIONS (Optional, collapsed by default)
Field: Hashtags
- Key: hashtags
- Type: tag
- Required: Optional
- UX: optional suggestions; show count

Field: Mentions / tags
- Key: mentions
- Type: tag
- Required: Optional
- UX: used for collabs/partners; can map to platform tagging in Packaging

Field: Location (optional)
- Key: location
- Type: text
- Required: Optional

SECTION 5 — DISCLOSURES / COMPLIANCE COPY (Conditional, auto-shown when triggered)
Field: Disclosure text
- Key: disclosures
- Type: textarea
- Required: Conditional
- Condition: publishing_mode=PAID_BOOSTED OR paid_partnership=true
- Helper: “Include required disclosure language (e.g., #ad).”

Field: Claims list (what is being claimed)
- Key: claims_list
- Type: checklist (each item text)
- Required: Conditional
- Condition: has_claims=true
- Helper: “List each claim so QA can verify substantiation.”

Field: Safety / medical disclaimer line (wellness/nutrition)
- Key: safety_disclaimer
- Type: text
- Required: Conditional
- Condition: has_claims=true OR content touches health guidance
- Default: short template (editable)

SECTION 6 — NOTES (Optional)
Field: Creative notes to production
- Key: creative_notes
- Type: textarea
- Required: Optional
- Helper: “Tone, pacing, visual style, examples.”

SECTION 7 — AI ASSIST + VALIDATIONS (Read-only component, optional but recommended)
Component: Draft Quality Checks (chips)
- Key: draft_validations (derived)
- Shows: Hook present, CTA clarity, Reading clarity (warn), Claim flags, Disclosure present, Link present
- Severity:
  - WARN: missing recommended items (e.g., hashtags)
  - BLOCKER only at QA/Packaging stage (Draft should not hard-block creative work)

REQUIRED-FIELD SUMMARY BY CANONICAL TYPE (for implementation)
VIDEO_SHORT_VERTICAL
- Required: hook (per hook rules), on_screen_text (recommended; optional unless your process requires), post_copy (recommended), script (optional)
VIDEO_LONG_HORIZONTAL
- Required: hook when objective awareness/engagement or paid; script recommended (optional); post_copy optional; on_screen_text optional
VIDEO_SHORT_HORIZONTAL
- Same as long horizontal, but hook more often required (use hook rule)
IMAGE_SINGLE
- Required: post_copy; hook optional; links conditional; disclosures/claims conditional
IMAGE_CAROUSEL
- Required: post_copy; slide_outline (min slide 1 + CTA slide outline recommended); hook required as “Slide 1 headline” when paid or engagement goal (via hook rule)
TEXT_POST
- Required: post_copy; hook required on LinkedIn/Facebook (via hook rule)
LINK_POST
- Required: post_copy + links; hook required on LinkedIn/Facebook (via hook rule)
DOCUMENT_CAROUSEL_PDF
- Required: post_copy; slide_outline; hook as slide 1 headline recommended/required via hook rule
STORY_FRAME_SET
- Required: hook (frame 1), story_frames, post_copy optional (often unused), on_screen_text recommended
LIVE_BROADCAST
- Required: script/run_of_show; hook recommended (opening); post_copy optional; disclosures/claims conditional

WARN vs BLOCK (Draft Tab)
- BLOCK only for missing fields marked Required (per rules above)
- WARN for:
  - very long hook/copy
  - missing CTA line when objective requires conversion
  - has_claims=true but claims_list empty
  - paid_partnership/PAID_BOOSTED but disclosures empty

FIELD KEYS (Draft Tab Library)
hook, post_copy, script, on_screen_text, story_frames, slide_outline,
cta_line, links, hashtags, mentions, location,
disclosures, claims_list, safety_disclaimer, creative_notes