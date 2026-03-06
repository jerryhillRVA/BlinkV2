ASSETS TAB — FIGMA-READY REQUIREMENTS (All Platforms + All Canonical Content Types)

PURPOSE
Collect and organize production files with minimal thinking: the system generates an asset checklist from Platform + Canonical Type + Flags (paid/claims/talent/music/accessibility). Users upload or link files; AI validates file presence + basic specs (format/size/duration when available). No manual “confirmations” for AI-checkable items.

SCOPE
Platforms: YouTube, Instagram, LinkedIn, Facebook, TikTok
Canonical Types: VIDEO_SHORT_VERTICAL, VIDEO_LONG_HORIZONTAL, VIDEO_SHORT_HORIZONTAL, IMAGE_SINGLE, IMAGE_CAROUSEL, TEXT_POST, LINK_POST, DOCUMENT_CAROUSEL_PDF, STORY_FRAME_SET, LIVE_BROADCAST

PRIMARY UX PRINCIPLES
- Checklist-first: user sees “what’s needed” before uploading
- Auto-generate checklist; keep manual entry optional
- Drag/drop uploads; allow link attachments (Drive/Dropbox/etc.)
- Validate automatically: presence, file type, size, basic dimensions if available
- Progressive disclosure: show only relevant asset sections by type
- Clear “Ready” state: Assets are complete when required checklist items are satisfied

INFORMATION ARCHITECTURE (top → bottom)
1) Assets Header (read-only context)
2) Required Asset Checklist (auto-generated)
3) Uploads (grouped by asset category)
4) Accessibility Assets (conditional)
5) Rights & Releases (conditional)
6) Source Files (Advanced, optional)
7) AI Checks (read-only) + Missing Items summary

SECTION 1 — ASSETS HEADER (Read-only, always visible)
Component: Context summary (chips)
- Key: assets_context_summary (derived)
- Shows: platform, canonical_type, publishing_mode, needs_accessibility, has_music, has_talent, has_claims
- Behavior: changing Brief/Blueprint updates checklist immediately

SECTION 2 — REQUIRED ASSET CHECKLIST (Auto-generated, always visible)
Component: Checklist with required/optional grouping
- Key: asset_checklist (derived + editable status)
- Type: checklist
- Required: Always (component)
- Behavior:
  - Auto-generates required + optional items based on rules below
  - Each checklist item can be “fulfilled by” an uploaded file or linked URL
  - Users cannot delete required items; can add optional/custom items
- Checklist item structure:
  - item_label
  - item_key (snake_case)
  - required (true/false)
  - fulfillment (file/link/status)
  - owner_role suggestion (optional)
  - validation status chip (Pass/Warn/Fail)

SECTION 3 — UPLOADS (Grouped, type-driven)

A) Primary Deliverables (shown when media exists)
Field: Master media upload(s)
- Label: Master file(s)
- Key: master_uploads
- Type: file (multi)
- Required: Conditional
- Condition: canonical_type in [VIDEO_*, IMAGE_SINGLE, IMAGE_CAROUSEL, DOCUMENT_CAROUSEL_PDF, STORY_FRAME_SET]
- Validation:
  - Must be allowed format per platform/type config (warn if unknown; block only if clearly incompatible)
  - If multiple required (carousel/story): enforce count >= unit_count_target (warn if less)
- UX:
  - Drag/drop zone
  - Auto-detect file properties (type, size, dimensions if available)

B) Cover / Thumbnail Assets (conditional)
Field: Cover / thumbnail
- Label: Cover / Thumbnail
- Key: cover_upload
- Type: file OR “select from uploads”
- Required: Conditional
- Condition:
  - VIDEO_LONG_HORIZONTAL (YouTube) => usually required
  - VIDEO_SHORT_VERTICAL => required if your workflow mandates a cover selection; otherwise optional but recommended
- Validation: image format + size (platform config)
- UX: allow “Choose frame from video” (optional feature), otherwise upload/select

C) Additional Creative Variants (paid)
Field: Variants (optional)
- Label: Creative variants
- Key: creative_variants
- Type: file (multi)
- Required: Conditional
- Condition: publishing_mode=PAID_BOOSTED (optional; required only if your ads process needs multiple sizes)
- UX: keep collapsed unless paid

SECTION 4 — ACCESSIBILITY ASSETS (Conditional)
A) Captions (video/live)
Field: Captions file
- Label: Captions (SRT/VTT)
- Key: captions_file
- Type: file
- Required: Conditional
- Condition: needs_accessibility=true AND canonical_type in [VIDEO_*, LIVE_BROADCAST] AND captions_strategy in [Upload SRT/VTT]
- Validation: file extension .srt or .vtt
- UX: if captions_strategy=Burned-in, replace with a checkbox “Captions burned into video” as derived state (no manual confirmation required; validated later via QA if you do visual checks)

Field: Captions approach (read-only)
- Key: captions_strategy (from Blueprint)
- Type: read-only

B) Alt text (images/docs)
Field: Alt text
- Label: Alt text
- Key: alt_text
- Type: textarea
- Required: Conditional
- Condition: needs_accessibility=true AND canonical_type in [IMAGE_SINGLE, IMAGE_CAROUSEL, DOCUMENT_CAROUSEL_PDF]
- Behavior:
  - If alt_text_strategy=Per slide/page summary, allow repeating subfields:
    - alt_text_items (list, each with slide/page number + text)
- UX: default collapsed for carousel/PDF unless strategy requires per-item

SECTION 5 — RIGHTS & RELEASES (Conditional, non-negotiable when triggered)
Field: Talent release / consent evidence
- Label: Talent release / consent
- Key: talent_release_evidence
- Type: file OR url
- Required: Conditional
- Condition: has_talent=true
- Validation: file/link present

Field: Music license / usage evidence
- Label: Music license / source proof
- Key: music_license_evidence
- Type: file OR url
- Required: Conditional
- Condition: has_music=true OR audio_plan in [Licensed track]
- Note: platform library selections may not need proof; treat as optional unless your policy requires documentation

Field: Third-party asset rights
- Label: Third-party rights (images/fonts/footage)
- Key: third_party_rights_evidence
- Type: file OR url
- Required: Conditional
- Condition: any third-party assets used (toggle or detected; optional field if you don’t track it)
- UX: keep under “Rights” accordion

SECTION 6 — SOURCE FILES (Advanced, collapsed)
Field: Editable project files
- Label: Source files (project)
- Key: source_files
- Type: file (multi)
- Required: Optional
- Examples: .aep, .prproj, .psd, .ai, .fig, etc.
- UX: collapsed under Advanced

Field: Export notes / handoff notes
- Label: Export notes
- Key: export_notes
- Type: textarea
- Required: Optional

SECTION 7 — AI CHECKS + MISSING ITEMS (Read-only, always visible)
Component: Missing required assets (summary)
- Key: missing_assets_summary (derived)
- Type: list with “Upload” CTA
- Behavior: shows only required items not fulfilled

Component: Asset validation chips (per file + overall)
- Key: asset_validations (derived)
- Type: chips with severity
- Examples:
  - “Master uploaded” Pass/Fail
  - “Format appears correct” Pass/Warn (warn if unknown)
  - “Cover present” Pass/Warn
  - “Captions present” Pass/Fail (if required)
  - “Alt text present” Pass/Fail (if required)
  - “Rights evidence present” Pass/Fail (if required)

COMPLETION / GATING RULES (Assets “Complete”)
Assets can be marked “Complete” when ALL required checklist items are fulfilled:
- Master media present when required by canonical type
- Captions file present when required (captions_strategy=Upload and needs_accessibility=true)
- Alt text present when required (needs_accessibility=true for image/PDF)
- Rights evidence present when triggered (talent/music/third-party)
- Cover/thumbnail present when required by platform/type

WARN vs BLOCK (Assets Tab)
BLOCK only for missing required assets.
WARN for:
- missing optional but recommended assets (e.g., cover for short-form)
- file properties outside recommended ranges (resolution/ratio/size), when you can detect them
- carousel/story count mismatch vs unit_count_target (warn; block only if your process requires exact count)

AUTO-GENERATED ASSET CHECKLIST RULES (by canonical type)
VIDEO_SHORT_VERTICAL
- Required: master_video
- Conditional: cover_image (recommended/optional unless policy says required)
- Conditional: captions_file OR captions_burned_in (depends on captions_strategy + accessibility)
- Optional: source_project_file

VIDEO_LONG_HORIZONTAL
- Required: master_video, thumbnail_image
- Conditional: captions_file OR captions_burned_in
- Optional: chapters_timestamps_doc, source_project_file

VIDEO_SHORT_HORIZONTAL
- Required: master_video
- Conditional: captions_file OR captions_burned_in
- Optional: cover_image (recommended), source_project_file

IMAGE_SINGLE
- Required: master_image
- Conditional: alt_text (if needs_accessibility)
- Optional: source_design_file

IMAGE_CAROUSEL
- Required: master_images (count >= unit_count_target)
- Conditional: alt_text (if needs_accessibility; per post or per slide)
- Optional: source_design_file

TEXT_POST
- No required uploads (show “No assets required” state)
- Optional: supporting_image/video attachment (if your system allows)

LINK_POST
- Optional: preview_image (if you allow customizing)
- Required: none unless your policy requires a creative for link posts

DOCUMENT_CAROUSEL_PDF
- Required: pdf_document
- Conditional: alt_text (if needs_accessibility; often summary)
- Optional: editable_source_file (ppt/key/fig)

STORY_FRAME_SET
- Required: story_assets (images/videos) count >= unit_count_target
- Conditional: captions_file for story video frames (if applicable) OR burned-in
- Optional: storyboard/pdf

LIVE_BROADCAST
- Optional (pre-live): run_of_show_doc (if not stored elsewhere), lower_thirds_graphic, thumbnail/cover (platform-dependent)
- Conditional: rights evidence if music/talent
- Note: recordings/captions may be post-live; treat as optional in Assets, enforce later in QA if needed

FIELD KEYS (Assets Tab Library)
asset_checklist, master_uploads, cover_upload, creative_variants,
captions_file, alt_text, alt_text_items,
talent_release_evidence, music_license_evidence, third_party_rights_evidence,
source_files, export_notes,
missing_assets_summary (derived), asset_validations (derived)