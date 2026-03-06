QA TAB — FIGMA-READY REQUIREMENTS (All Platforms + All Canonical Content Types)

PURPOSE
Provide a single, reliable “release gate” that verifies: (1) requirements are met, (2) risks are reviewed, (3) content is publishable/exportable. QA combines automated checks + human review where needed. Users should never confirm what AI can validate; AI checks appear as read-only results, while humans approve judgments and compliance.

SCOPE
Platforms: YouTube, Instagram, LinkedIn, Facebook, TikTok
Canonical Types: VIDEO_SHORT_VERTICAL, VIDEO_LONG_HORIZONTAL, VIDEO_SHORT_HORIZONTAL, IMAGE_SINGLE, IMAGE_CAROUSEL, TEXT_POST, LINK_POST, DOCUMENT_CAROUSEL_PDF, STORY_FRAME_SET, LIVE_BROADCAST

PRIMARY UX PRINCIPLES
- QA is the main “go/no-go” gate (single approval point for MVP)
- Separate “AI Validations” (read-only) from “Human Checks” (checkboxes)
- Only show checks relevant to platform/type/toggles
- Blocking rules are explicit: what prevents approval vs what is a warning
- Audit-friendly: show who approved what, when, and what changed since

INFORMATION ARCHITECTURE (top → bottom)
1) QA Header (status + readiness)
2) AI Validations (read-only)
3) Human Review Checklist (conditional sections)
4) Approvals (role-based)
5) Fix Notes / Required Changes
6) Approval History / Change Log (read-only)

SECTION 1 — QA HEADER (Always visible)
Component: QA readiness banner
- Key: qa_readiness_banner (derived)
- Shows:
  - Overall state: Ready / Blocked / Needs Review
  - Blockers count + list summary
  - Warnings count
  - Last updated + “changes since last approval” indicator

Component: Quick links
- “View missing assets”
- “Open Packaging”
- “Open Draft”

SECTION 2 — AI VALIDATIONS (Read-only, always visible)
Component: AI Checks (Final) — validations list + chips
- Key: qa_ai_validations (derived)
- Type: list with Pass/Warn/Fail chips
- Behavior:
  - Derived from Brief/Blueprint/Draft/Assets/Packaging
  - Re-runs when content changes
- Typical validations (show only when applicable):
  General:
  - Required fields complete (Brief/Draft/Blueprint/Assets/Packaging) — Pass/Fail
  - Links valid (if required) — Pass/Fail
  - Schedule valid (if scheduled) — Pass/Fail
  Video:
  - Captions present (strategy satisfied) — Pass/Fail
  - Safe-zone risk (OST) — Pass/Warn
  - Runtime within recommended range — Pass/Warn
  Image/Carousel/PDF:
  - Alt text present (if required) — Pass/Fail
  - Carousel/page count meets target — Pass/Warn/Fail (policy-driven)
  Platform metadata:
  - Character limits respected (caption/title/description) — Pass/Fail
  Rights triggers:
  - Talent release evidence present (if required) — Pass/Fail
  - Music license/source evidence present (if required) — Pass/Warn/Fail (policy-driven)

Severity rules (AI)
- FAIL items are BLOCKERS (cannot approve)
- WARN items do not block approval but must be visible

SECTION 3 — HUMAN REVIEW CHECKLIST (Conditional, always visible when relevant)
Component: Human QA checklist (grouped, checkbox)
- Key: qa_human_checklist
- Type: checklist
- Required: Always (component), but checklist items are conditional

Checklist groups + items (show conditionally):

A) Brand & Editorial (default for all content types)
- Spelling/grammar pass
- Brand voice/tone pass
- CTA clarity (if objective requires)
- No prohibited terms (if your brand has a list)

B) Visual/Audio Quality (only for media types)
Condition: canonical_type in [VIDEO_*, IMAGE_SINGLE, IMAGE_CAROUSEL, DOCUMENT_CAROUSEL_PDF, STORY_FRAME_SET]
- Visual legibility (text readable on mobile)
- Audio clarity (video/live)
- Cropping/composition looks correct in preview
- Cover/thumbnail communicates topic (if cover exists)

C) Accessibility (when needs_accessibility=true)
- Captions accurate (video/live) OR captions burned-in verified
- Alt text quality check (images/docs)
- Contrast/readability check (images/OST)
- No flashing/risky motion (if applicable)

D) Compliance & Disclosures (conditional)
Condition: publishing_mode=PAID_BOOSTED OR paid_partnership=true OR has_claims=true
- Disclosure present and correctly placed (#ad/partner)
- Claims match substantiation provided (has_claims)
- No medical/guarantee language beyond policy (wellness/nutrition)
- Privacy okay (no personal data exposed)

E) Links & Tracking (conditional)
Condition: destination_url required OR objective in [Traffic, Leads, Sales] OR publishing_mode=PAID_BOOSTED
- Destination URL correct
- UTMs present (if required by your policy; otherwise optional)
- Link placement matches platform behavior (bio/description/link sticker)

F) Live readiness (LIVE_BROADCAST only)
- Moderator assigned + available
- Run-of-show complete
- Tech rehearsal complete (internet/audio/lighting)
- Safety escalation plan known (optional)

Checkbox behavior:
- Items can be “Required” or “Optional” depending on your policy
- Required items must be checked before approval

SECTION 4 — APPROVALS (Role-based, always visible)
Component: Approval panel
- Key: approvals
- Type: status per role with user + timestamp
- Default roles:
  - Brand Reviewer (default required for all unless you choose to relax)
  - Legal/Compliance (conditional)
  - Publisher (conditional — required only to publish/schedule)
- Required rules:
  - Legal/Compliance approval required if:
    - has_claims=true OR publishing_mode=PAID_BOOSTED OR paid_partnership=true
  - Publisher approval required if:
    - publish_action in [Publish now, Schedule] OR your process requires publisher gate

Approval actions:
- Approve
- Request changes (requires note)
- Revoke approval (if content changed after approval; system can auto-flag)

SECTION 5 — FIX NOTES / REQUIRED CHANGES (Always visible)
Field: QA notes / change requests
- Key: qa_notes
- Type: textarea
- Required: Conditional
- Condition: if any approval = Request changes OR any blocker exists
- UX: when “Request changes” is clicked, focus this field automatically

Field: Assign fixes to
- Key: fix_assignee
- Type: user_picker
- Required: Conditional
- Condition: Request changes selected
- Default: Owner (from Brief) or last editor

SECTION 6 — APPROVAL HISTORY / CHANGE LOG (Read-only, always visible)
Component: Audit trail
- Key: qa_audit_trail (derived)
- Shows:
  - approvals history
  - checklist completion timestamps
  - what changed since last approval (diff summary: Draft/Assets/Packaging changes)

COMPLETION / GATING RULES (QA “Approved” state)
QA can be marked “Approved” when ALL are true:
- No AI validation FAIL items remain (no blockers)
- All required human checklist items checked (as determined by conditions)
- Required approvals collected (Brand always; Legal conditional; Publisher conditional)
- If publish_action=Schedule => schedule_at valid and in future
- If destination_url required => URL valid

WARN vs BLOCK (QA)
BLOCK:
- any AI validation FAIL
- missing required approvals
- missing required human checklist items
- invalid schedule or invalid required URL

WARN:
- AI validation WARN items
- optional checklist items unchecked
- copy near character limits
- recommended-but-not-required assets missing (e.g., cover for short-form if policy says optional)

DEFAULT REQUIRED CHECKS BY CANONICAL TYPE (for implementation)
VIDEO_SHORT_VERTICAL
- Required groups: Brand & Editorial, Visual/Audio, Accessibility (if needs_accessibility), Compliance (if toggles)
VIDEO_LONG_HORIZONTAL / VIDEO_SHORT_HORIZONTAL
- Same as above + “Thumbnail effectiveness” if thumbnail required (YouTube long)
IMAGE_SINGLE
- Brand & Editorial + Visual + Accessibility (alt text) + Compliance (if toggles)
IMAGE_CAROUSEL / DOCUMENT_CAROUSEL_PDF
- Brand & Editorial + Visual + Accessibility (alt text) + “Slide 1 clarity” + “CTA slide present” (can be AI warn + human check optional)
TEXT_POST
- Brand & Editorial + Compliance (if toggles) + Links (if required)
LINK_POST
- Brand & Editorial + Links & Tracking required + Compliance (if toggles)
STORY_FRAME_SET
- Brand & Editorial + Visual + Accessibility + “Frame 1 hook clarity” (optional human check)
LIVE_BROADCAST
- Brand & Editorial + Live readiness (required) + Compliance (if toggles)

FIELD KEYS (QA Tab Library)
qa_readiness_banner (derived), qa_ai_validations (derived),
qa_human_checklist, approvals,
qa_notes, fix_assignee,
qa_audit_trail (derived)