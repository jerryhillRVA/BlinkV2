# Strategy & Research Integration — Test Execution Report

**Date:** 2026-04-09
**Branch:** `feature/researchImpl`
**Test workspace:** `test-wellness-co` (created during TC-1)
**Pre-existing workspace:** `fuzzee-coffee` (TC-5)
**TC-6 (Mock Fallback):** Deferred — requires stopping AFS

---

## Summary

| TC | Description | Result |
|----|-------------|--------|
| TC-1 | Onboard new workspace + AFS verification | ⚠️ PARTIAL PASS — 4 issues found |
| TC-2 | Validate blueprint data on research pages | ⚠️ PARTIAL PASS — 7 issues found |
| TC-3 | Update fields and validate persistence | ⚠️ PARTIAL PASS — 2 blocked, 1 design issue |
| TC-4 | AFS data integrity and contract validation | ⚠️ PARTIAL PASS — 3 contract issues |
| TC-5 | Graceful defaults for pre-existing workspace | ✅ PASS (with known carry-over bugs) |

---

## Issues Found

### HIGH Severity

---

#### BUG-01 — `channel-strategy.json` created with empty channels array

**Test Cases:** TC-1, TC-2, TC-3, TC-4
**Severity:** HIGH
**Affected file:** `settings/channel-strategy.json`

**Description:**
During workspace onboarding, the wizard collects platform selections (Step 4: Channels & Capacity). After workspace creation, the `channel-strategy.json` in AFS has `"channels": []`. The selected platforms (Instagram, TikTok, YouTube, Facebook) are not written to this file.

**Impact:**
- Channel Strategy view is completely blank for all newly onboarded workspaces
- TC-3 steps 19–27 (all Channel Strategy CRUD operations) are untestable
- Applies to both `test-wellness-co` and `fuzzee-coffee`

**AFS Evidence:**
```json
{ "channels": [] }
```

**Expected:** Array of channel objects with `platform`, `active`, `role`, `primaryContentTypes`, etc.

---

#### BUG-02 — `_content-mix.json` not created during workspace onboarding

**Test Cases:** TC-1, TC-2, TC-3, TC-4
**Severity:** HIGH
**Affected file:** `content-pillars/_content-mix.json`

**Description:**
The `_content-mix.json` file is never created during workspace setup. The Content Mix view renders but shows "Total: 0% — under by 100%" with no sliders, since no target percentages are defined.

**Impact:**
- Content Mix view is broken for all new workspaces
- TC-3 steps 28–30 (Content Mix slider CRUD) are untestable
- Applies to both `test-wellness-co` and `fuzzee-coffee`

**AFS Evidence:** `content-pillars/` namespace contains only `pillar-X.json` files — no `_content-mix.json`.

---

#### BUG-03 — Brand voice sub-sections do not independently persist to AFS

**Test Cases:** TC-3 steps 2–10
**Severity:** HIGH
**Affected components:**
- `voice-attributes.component.ts`
- `tone-context.component.ts`
- `platform-adjustments.component.ts`
- `vocabulary-guide.component.ts`

**Description:**
Clicking "Save" in the voice attributes, tone context, platform nuances, and vocabulary sub-sections only updates local Angular signal state. No HTTP request is made to the backend. These changes are only persisted to AFS when the user subsequently clicks **"Save Mission"** in the Content Mission Statement section.

If the user adds voice attributes, then navigates away or reloads without clicking "Save Mission", all sub-section changes are lost.

**Root Cause:**
Only `voice-mission.component.ts:30` calls `this.stateService.saveBrandVoice()`. The other four sub-components call `stateService.brandVoice.update()` (local signal update only).

**Evidence:**
```typescript
// voice-attributes.component.ts:59 — NO saveBrandVoice() call
save(): void {
  const attr = this.editAttribute();
  if (!attr.label.trim()) return;
  this.stateService.brandVoice.update(bv => { ... });  // local only
  this.editingId.set(null);
}

// voice-mission.component.ts:28 — CORRECT pattern
saveMission(): void {
  this.stateService.saveBrandVoice(this.stateService.brandVoice());  // persists to API
  this.toast.showSuccess('Mission statement saved');
}
```

**Fix:** Each sub-component's save handler should also call `this.stateService.saveBrandVoice(this.stateService.brandVoice())` after updating local state (or emit an event that triggers the parent to save).

---

#### BUG-04 — `brand-voice.json` populated with only description during onboarding

**Test Cases:** TC-1, TC-2
**Severity:** HIGH
**Affected file:** `settings/brand-voice.json`

**Description:**
After workspace creation, `brand-voice.json` only contains `brandVoiceDescription` and `toneGuidelines`. The `voiceAttributes`, `toneByContext`, `platformToneAdjustments`, and `vocabulary` fields are all empty even though the blueprint contains brand voice data.

**Impact:**
- Brand Personality section shows "No voice attributes defined yet" even after onboarding
- Tone Shifts section shows "No tone contexts defined" even after onboarding
- Blueprint data for brand voice is partially lost

**AFS Evidence (immediately after workspace creation):**
```json
{
  "brandVoiceDescription": "...",
  "voiceAttributes": [],
  "toneByContext": [],
  "platformToneAdjustments": [],
  "vocabulary": { "preferred": [], "avoid": [] }
}
```

---

### MEDIUM Severity

---

#### BUG-05 — Audience segment `description` field contains segment name

**Test Cases:** TC-1, TC-2, TC-5
**Severity:** MEDIUM
**Affected files:** `audience-segments/seg-X.json`

**Description:**
During workspace creation, the `description` field for each audience segment is populated with the segment's name instead of a descriptive text. This causes segment cards to display the name twice (once as the card header, once as the "description" text below).

**AFS Evidence:**
```json
{
  "name": "The Natural Performance Seeker",
  "description": "The Natural Performance Seeker"   ← should be descriptive text
}
```

Affects both `test-wellness-co` (seg-1, seg-2) and `fuzzee-coffee`.

---

#### BUG-06 — No "Add Objective" button in Business Objectives edit panel

**Test Cases:** TC-3 step 35
**Severity:** MEDIUM

**Description:**
The Business Objectives edit panel (accessed via the "Edit" button in the strip) shows existing objectives that can be edited and deleted, but provides no way to add a new objective from the UI. The test case expects an "Add Objectives" button. An "AI Suggest" button is present but it generates suggestions rather than allowing manual entry.

**Expected:** A button to add a new objective manually with category, statement, target, unit, and timeframe fields.

---

#### BUG-07 — Content pillar wizard shows incorrect Target Audience chip options

**Test Cases:** TC-1
**Severity:** MEDIUM

**Description:**
During onboarding step 3 (Content Strategy), the pillar configuration form shows Target Audience chip options of "Engineers, Founders, Social Media Managers" — generic tech/business personas. For a wellness workspace, these chips are completely irrelevant. The audience options should either be blank/dynamic (populated from the audience segments defined in step 3 of the discovery conversation) or removed.

---

### LOW Severity

---

#### BUG-08 — LinkedIn appears in Platform Nuances despite being set inactive

**Test Cases:** TC-2
**Severity:** LOW

**Description:**
In the Brand Voice → Platform Nuances section, LinkedIn appears in the platform list despite being toggled to "inactive" during onboarding. Only active platforms (Instagram, TikTok, YouTube, Facebook) should show tone adjustment fields.

---

#### BUG-09 — Competitor Deep Dive has no empty state message

**Test Cases:** TC-2
**Severity:** LOW

**Description:**
The Competitor Deep Dive view shows a blank gray area when no competitors exist, instead of a helpful empty state message like "No competitors yet — add one or run an AI scan." Compare with Research Sources which correctly shows "No sources found for the selected filter."

---

## Passing Checks

| Area | Result |
|------|--------|
| TC-1: Workspace created, tenant registered in AFS | ✅ PASS |
| TC-1: Settings namespace files created (brand-voice, business-objectives, channel-strategy, general, platforms, etc.) | ✅ PASS |
| TC-1: Content pillar files created in `content-pillars/` namespace | ✅ PASS |
| TC-1: Audience segment files created in `audience-segments/` namespace | ✅ PASS |
| TC-2: Strategic Pillars — all 5 pillars shown with name, description, color, Add Goal | ✅ PASS |
| TC-2: Audience — segment cards render, Customer Journey accordion present, AI Analyze Audience visible | ✅ PASS |
| TC-2: Research Sources — empty state renders, filter dropdown populated with pillar names, AI Discover Sources button present | ✅ PASS |
| TC-3: Mission statement edit → Save → Reload → Persisted | ✅ PASS |
| TC-3: Add Content Pillar → modal, create, AFS file created with correct contract | ✅ PASS |
| TC-3: Add Audience Segment → modal, create, AFS file created with correct contract | ✅ PASS |
| TC-3: Business Objectives edit (target value change) → Save → AFS updated | ✅ PASS |
| TC-4: Content pillar contract valid (id, name, description, color, goals present) | ✅ PASS |
| TC-4: Business objectives contract valid (id, category, statement, target, unit, timeframe, status) | ✅ PASS |
| TC-5: All views render without 500 errors for fuzzee-coffee | ✅ PASS |
| TC-5: Mission statement save persists to AFS for fuzzee-coffee | ✅ PASS |
| TC-5: Brand Voice/Strategic Pillars/Audience show graceful empty states | ✅ PASS |

---

## Blocked Tests

| TC Step | Reason |
|---------|--------|
| TC-3 steps 19–27 (Channel Strategy CRUD) | BUG-01: channels array is empty, no accordions to expand/edit |
| TC-3 steps 28–30 (Content Mix sliders) | BUG-02: `_content-mix.json` missing, no sliders rendered |
| TC-3 step 35 (Add Objective) | BUG-06: no Add Objective button available |

---

## AFS Contract Deviations

| File | Expected | Actual | Issue |
|------|----------|--------|-------|
| `settings/channel-strategy.json` | `channels` array with platform objects | `channels: []` | BUG-01 |
| `content-pillars/_content-mix.json` | File must exist with `targets` array | File does not exist | BUG-02 |
| `settings/brand-voice.json` | `voiceAttributes`, `toneByContext`, `platformToneAdjustments` populated from blueprint | All empty arrays | BUG-04 |
| `audience-segments/seg-X.json` | `description` is descriptive text | `description` = segment name | BUG-05 |

---

## Fix Priority Order

1. **BUG-01** — Channel strategy not written during onboarding (blocks entire Channel Strategy section)
2. **BUG-02** — Content mix not initialized during onboarding (blocks Content Mix section)
3. **BUG-03** — Brand voice sub-sections don't independently persist (data loss risk)
4. **BUG-04** — Brand voice blueprint data not fully written to AFS (voiceAttributes, toneByContext)
5. **BUG-05** — Audience segment description uses name (data quality, onboarding pipeline)
6. **BUG-06** — Add Objective UI missing (feature gap)
7. **BUG-07** — Wrong audience chips in content pillar wizard (UX)
8. **BUG-08** — Inactive platform in Platform Nuances (UX)
9. **BUG-09** — Missing empty state in Competitor Deep Dive (UX polish)
