PACKAGING TAB — FIGMA-READY REQUIREMENTS (All Platforms + All Canonical Content Types)

PURPOSE
Turn Draft + Assets into a publish-ready “package” with platform-aware metadata, selections, and final technical validations. Packaging is where platform-specific fields live (e.g., YouTube title, cover selection, scheduling). AI validates what it can; users only choose/enter what’s necessary.

SCOPE
Platforms: YouTube, Instagram, LinkedIn, Facebook, TikTok
Canonical Types: VIDEO_SHORT_VERTICAL, VIDEO_LONG_HORIZONTAL, VIDEO_SHORT_HORIZONTAL, IMAGE_SINGLE, IMAGE_CAROUSEL, TEXT_POST, LINK_POST, DOCUMENT_CAROUSEL_PDF, STORY_FRAME_SET, LIVE_BROADCAST

PRIMARY UX PRINCIPLES
- Show only fields required for the selected platform + canonical type
- Prefer “select from existing uploads” over re-uploading
- Provide inline validations (Pass/Warn/Fail) and preview where feasible
- Enforce hard blockers here only for publish-critical requirements (or defer to QA if your process prefers)
- Progressive disclosure: advanced metadata is collapsed

INFORMATION ARCHITECTURE (top → bottom)
1) Packaging Header (read-only context)
2) Publish Settings (visibility + schedule)
3) Platform Metadata (title/caption/description/etc.)
4) Media Selections (cover/thumbnail/featured image)
5) Link & Tracking (conditional)
6) Platform Controls (category, audience, tags, etc. — advanced)
7) Final Technical Checks (read-only validations)
8) Export / Publish Packet Summary (if applicable)

SECTION 1 — PACKAGING HEADER (Read-only, always visible)
Component: Context summary (chips)
- Key: packaging_context_summary (derived)
- Shows: platform, canonical_type, objective, publishing_mode, assets_status, qa_status
- Behavior: includes “View missing assets” quick link

SECTION 2 — PUBLISH SETTINGS (Conditional by platform/type, always near top)
Field: Publish action
- Label: Publish action
- Key: publish_action
- Type: dropdown
- Required: Always
- Options: Publish now, Schedule, Save as draft, Export packet (if your system supports)
- Default: Save as draft (or Schedule if you commonly schedule)

Field: Visibility / privacy
- Label: Visibility
- Key: visibility
- Type: dropdown
- Required: Conditional
- Condition: platform supports privacy states (e.g., YouTube) OR your workflow needs it
- Options (platform-dependent): Public, Unlisted, Private
- Default: Public (or last used)

Field: Schedule datetime
- Label: Schedule
- Key: schedule_at
- Type: datetime
- Required: Conditional
- Condition: publish_action = Schedule
- Validation: must be in the future; warn if within too-short lead time

SECTION 3 — PLATFORM METADATA (Type-driven)

A) Title (where applicable)
Field: Title / headline
- Key: title
- Type: text
- Required: Conditional
- Condition: platform/type uses a title field (strongly: YouTube VIDEO_LONG_HORIZONTAL; optionally others depending on your publishing workflow)
- Validation: platform max length (from platform config)
- UX: live counter + truncation preview

B) Caption / Post text (most social posts)
Field: Caption / post text
- Key: packaged_copy
- Type: textarea
- Required: Conditional
- Condition: canonical_type in [VIDEO_SHORT_VERTICAL, IMAGE_SINGLE, IMAGE_CAROUSEL, TEXT_POST, LINK_POST, DOCUMENT_CAROUSEL_PDF, STORY_FRAME_SET]
- Default: pull from Draft.post_copy (editable)
- Validation: platform character limits (from platform config)
- UX: show “uses Draft copy” with revert option

C) Description (YouTube and long-form contexts)
Field: Description
- Key: description
- Type: textarea
- Required: Conditional
- Condition: platform=YouTube AND canonical_type in [VIDEO_LONG_HORIZONTAL, VIDEO_SHORT_VERTICAL] (if you treat Shorts description separately) OR when your publishing workflow has descriptions
- Default: pull from Draft.post_copy or separate Draft field
- Validation: platform max length (from config)

D) Tags / Keywords (advanced)
Field: Tags / keywords
- Key: keywords
- Type: tag
- Required: Optional (Advanced)
- Condition: platform supports tags/keywords in your workflow (e.g., YouTube)

SECTION 4 — MEDIA SELECTIONS (Select from Assets)
Field: Primary media selection
- Label: Primary asset
- Key: primary_media_asset
- Type: dropdown (select from uploaded master assets)
- Required: Conditional
- Condition: canonical_type includes media and multiple masters exist

Field: Cover / Thumbnail selection
- Label: Cover / Thumbnail
- Key: cover_asset
- Type: dropdown (select from uploads) OR file upload
- Required: Conditional
- Condition:
  - YouTube VIDEO_LONG_HORIZONTAL => Always
  - Other video types => Required if your policy says “cover required,” otherwise Optional
- Validation: must match platform spec (ratio/dimensions/file size if detectable)
- UX: show preview + crop guidance if applicable

Field: Carousel ordering (if multi-asset)
- Label: Carousel order
- Key: carousel_order
- Type: reorderable list
- Required: Conditional
- Condition: canonical_type in [IMAGE_CAROUSEL, STORY_FRAME_SET]
- Default: upload order

SECTION 5 — LINKS & TRACKING (Conditional)
Field: Destination URL
- Key: destination_url
- Type: url
- Required: Conditional
- Condition: objective in [Traffic, Leads, Sales] OR canonical_type=LINK_POST OR publishing_mode=PAID_BOOSTED
- Default: pull from Brief.destination_url
- Validation: valid URL

Field: UTM parameters
- Key: utm_params
- Type: text (or structured fields)
- Required: Optional (Advanced) or Conditional if paid policy requires
- Condition: publishing_mode=PAID_BOOSTED OR objective in [Traffic, Leads, Sales]
- UX: “Generate UTMs” helper (optional)

Field: Link placement note (platform behavior helper)
- Key: link_placement_note
- Type: read-only hint
- Required: Not applicable
- Behavior: platform-aware helper (e.g., “Link in bio,” “Link sticker,” “Description link”)

SECTION 6 — PLATFORM CONTROLS (Advanced, platform-specific)
Only show these when platform/type supports them AND your workflow uses them.

YouTube (advanced)
- Field: Category
  - Key: category
  - Type: dropdown
  - Required: Optional
- Field: Made for kids / audience
  - Key: made_for_kids
  - Type: boolean
  - Required: Conditional (if you publish to YouTube; policy-driven)
- Field: Playlist
  - Key: playlist
  - Type: dropdown
  - Required: Optional

Instagram (advanced)
- Field: Collaborator / partner tag
  - Key: collaborator_tags
  - Type: tag
  - Required: Conditional (paid_partnership=true)
- Field: Location tag
  - Key: ig_location
  - Type: text
  - Required: Optional

TikTok (advanced)
- Field: Allow comments
  - Key: allow_comments
  - Type: boolean
  - Required: Optional
- Field: Allow duet/stitch (if used)
  - Key: allow_duet_stitch
  - Type: boolean
  - Required: Optional

Facebook (advanced)
- Field: Page (if multiple)
  - Key: fb_page
  - Type: dropdown
  - Required: Conditional (multi-page org)
- Field: Crosspost toggle
  - Key: crosspost_to_ig
  - Type: boolean
  - Required: Optional

LinkedIn (advanced)
- Field: Company page / profile selector
  - Key: li_publisher_identity
  - Type: dropdown
  - Required: Conditional (if multiple identities)
- Field: Comment-to-pin (draft)
  - Key: pinned_comment
  - Type: textarea
  - Required: Optional

SECTION 7 — FINAL TECHNICAL CHECKS (Read-only, always visible)
Component: Packaging validations (chips)
- Key: packaging_validations (derived)
- Examples:
  - “Required metadata present” Pass/Fail
  - “Caption length within limits” Pass/Warn/Fail
  - “Title length within limits” Pass/Warn/Fail
  - “Cover meets spec” Pass/Warn/Fail
  - “Primary media format acceptable” Pass/Warn/Fail
  - “Schedule valid” Pass/Fail
  - “Destination URL valid” Pass/Fail
- Severity rules:
  - BLOCK: missing required metadata; invalid URL; schedule in past; missing required cover/thumbnail; missing required primary media
  - WARN: recommended improvements (e.g., no hashtags, very long copy, missing UTMs when not mandated)

SECTION 8 — EXPORT / PUBLISH SUMMARY (Conditional)
Component: Export/Publish readiness summary
- Key: packaging_readiness_summary (derived)
- Shows:
  - What will be published/exported (assets + metadata)
  - Missing blockers
  - Warnings
  - Approvals status (from QA)
- CTA buttons:
  - “Export packet” OR “Mark Ready for QA” OR “Mark Ready to Publish” (depending on workflow)

COMPLETION / GATING RULES (Packaging “Complete”)
Packaging can be marked “Complete” when:
- All required metadata fields for platform/type are present
- All required selections are made (primary media, cover/thumbnail where required)
- Schedule/visibility fields are valid (if scheduling)
- Destination URL present when required
- No BLOCKER validations remain

WARN vs BLOCK (Packaging Tab)
BLOCK:
- missing required fields or required asset selections
- invalid URL where required
- scheduling in past / invalid datetime
- cover/thumbnail missing when required
- primary media missing when required

WARN:
- missing optional best practices (hashtags, pinned comment, UTMs when not required)
- caption/title near limit (e.g., >90% of limit)
- cover present but low-quality or mismatched ratio (if detectable)

FIELD KEYS (Packaging Tab Library)
publish_action, visibility, schedule_at,
title, packaged_copy, description, keywords,
primary_media_asset, cover_asset, carousel_order,
destination_url, utm_params, link_placement_note,
category, made_for_kids, playlist,
collaborator_tags, ig_location,
allow_comments, allow_duet_stitch,
fb_page, crosspost_to_ig,
li_publisher_identity, pinned_comment,
packaging_validations (derived), packaging_readiness_summary (derived)