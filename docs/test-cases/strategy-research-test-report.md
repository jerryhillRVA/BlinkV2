# Strategy & Research Integration — Test Report

**Date:** 2026-04-10
**Tester:** Claude (Automated)
**Environment:** localhost — Web :4200 | API :3000 | AFS :8000
**Branch:** `feature/researchImpl`
**Workspaces Tested:** `fuzzee-coffee` (pre-existing), `tc1-test-workspace` (newly onboarded)

---

## Executive Summary

15 of 16 test cases were executed (TC-12 Mock Fallback skipped — requires AFS shutdown). The Strategy & Research integration is **functionally solid** with correct sidebar navigation, data loading, view rendering, and CRUD operations. However, **3 critical defects** were found in the onboarding-to-strategy pipeline, and **2 moderate UI issues** were identified.

| Severity | Count |
|----------|-------|
| Critical | 3     |
| Moderate | 2     |
| Minor    | 3     |
| Pass     | ~80% of individual checklist items |

---

## Defects

### DEF-001: Onboarding does not create channel-strategy entries from active platforms [CRITICAL]

**TC:** TC-1, TC-6
**Steps to reproduce:**
1. Onboard a new workspace (e.g., `tc1-test-workspace`)
2. In Step 5 (Platforms), enable Instagram, TikTok, YouTube, LinkedIn
3. Complete onboarding
4. Navigate to `/workspace/tc1-test-workspace/strategy` -> Channel Strategy

**Expected:** `channel-strategy.json` should have 4 channel entries matching the active platforms from onboarding.
**Actual:** `channel-strategy.json` has `"channels": []` — empty array. The Channel Strategy view shows the platform picker empty state instead of pre-populated accordions.
**Impact:** Every new workspace requires users to manually re-select and initialize platforms in the Channel Strategy view, duplicating work already done during onboarding. This is also true for pre-existing workspaces like `fuzzee-coffee` which have `platforms.json` but no `channel-strategy.json`.
**AFS Verification:** `curl http://localhost:8000/v1/tc1-test-workspace/dirs?namespace=settings` — `channel-strategy.json` exists but contains `{"channels": []}`.

---

### DEF-002: Onboarding does not create default content mix categories [CRITICAL]

**TC:** TC-1, TC-7
**Steps to reproduce:**
1. Onboard a new workspace
2. Navigate to Content Mix view

**Expected:** `_content-mix.json` should have 5 default categories (Educational, Entertaining, Community, Promotional, Trending) totaling 100%.
**Actual:** `_content-mix.json` has `"targets": []` — no categories. Content Mix shows "Total: 0% — under by 100%".
**Impact:** Users see an empty Content Mix with no guidance on default categories. "Reset to Defaults" button also fails to populate defaults (tested on `fuzzee-coffee`).
**AFS Verification:** `curl` batch read of `_content-mix.json` returns `{"targets": []}` for both `tc1-test-workspace` and `fuzzee-coffee`.

---

### DEF-003: Audience segment description is identical to name after onboarding [CRITICAL]

**TC:** TC-1, TC-13
**Steps to reproduce:**
1. Onboard a workspace with audience segments (e.g., "Startup Founders")
2. Check AFS: `audience-segments/seg-1.json`

**Expected:** `description` field should contain a meaningful description different from `name`.
**Actual:** `description: "Startup Founders"` === `name: "Startup Founders"`. Same issue on `fuzzee-coffee` where `seg-1.json` has `description: "The Conscious Energy Seeker"` === `name`.
**Impact:** Segment cards in the Audience view show duplicate text (name and description are identical). This reduces the usefulness of segment cards and violates the data integrity check.
**Root Cause:** The onboarding wizard only collects segment names (Step 4 says "Keep this simple — just names for now"), but the backend saves `name` as `description` instead of generating or leaving `description` empty/null.

---

### DEF-004: Platform picker buttons lack visual selected/unselected state [MODERATE]

**TC:** TC-6
**Location:** Channel Strategy view — empty state platform picker
**Expected:** When clicking platform buttons (Instagram, TikTok, etc.), selected platforms should have a visually distinct style (e.g., filled background, border color change).
**Actual:** All platform buttons look identical regardless of selection state. Users cannot tell which platforms they've selected before clicking "Initialize Channels."
**Impact:** Users may initialize incorrect platforms due to lack of visual feedback.

---

### DEF-005: Content Mix "Reset to Defaults" button has no effect [MODERATE]

**TC:** TC-7
**Steps to reproduce:**
1. Navigate to Content Mix on a workspace with empty targets
2. Click "Reset to Defaults"

**Expected:** 5 default content categories should populate with percentages totaling 100%.
**Actual:** Nothing happens. The view remains at "Total: 0%".
**Impact:** Users have no way to get the default content mix without manually adding categories.

---

### DEF-006: No visible toast/snackbar on save operations [MINOR]

**TC:** TC-3
**Observation:** When saving the mission statement or adding voice attributes, no toast notification appears to confirm the save succeeded. The PUT request returns 200, but there's no visual feedback.
**Impact:** Low — data does save correctly, but users don't get confirmation.

---

### DEF-007: Onboarding skips Step 7 (Review) [MINOR]

**TC:** TC-1
**Observation:** After completing Step 6 (Content Strategy) and clicking "Next", the wizard redirects directly to the dashboard instead of showing Step 7 (Review) with a summary of all entered data.
**Impact:** Users don't get a chance to review their full configuration before workspace creation.
**Note:** It's possible the review step auto-submits. Needs code investigation.

---

### DEF-008: Business Objectives all show currentValue=0 with no progress bars [MINOR]

**TC:** TC-10
**Observation:** All 5 objectives in `fuzzee-coffee` have `currentValue: 0`. The strip cards show "On Track" status but no visible progress bar or percentage indicator.
**Impact:** Low — this is expected for new data. The edit panel does allow setting currentValue.

---

## Test Case Results

| TC | Description | Result | Notes |
|----|-------------|--------|-------|
| TC-1 | Onboard New Workspace | PARTIAL PASS | Workspace created in AFS, but channel-strategy empty, content-mix empty, segment desc=name |
| TC-2 | State Service Loads All Domains | PASS | All 7 API calls returned 200. Sidebar correct. No console errors. |
| TC-3 | Brand Voice & Tone View | PASS | Mission save, attribute CRUD, vocabulary CRUD, cross-nav persistence all work. |
| TC-4 | Strategic Pillars View | PASS | 4 pillar cards render with colors, goals, edit/delete icons. Distribution analysis present. |
| TC-5 | Audience View | PASS | 2 segments render. Customer Journey section present. AI Analyze available. |
| TC-6 | Channel Strategy View | PARTIAL PASS | Empty state/picker works. Initialize creates channels. Dynamic audience dropdown works. Platform picker lacks visual selection state. |
| TC-7 | Content Mix View | FAIL | Empty targets on both workspaces. Reset to Defaults has no effect. |
| TC-8 | Research Sources View | PASS | Empty state correct. Pillar filter populated with workspace pillars. Add Source form works. |
| TC-9 | Competitor Deep Dive View | PASS | Empty state correct. Add competitor slim form works. Delete inline confirm works. AFS persistence verified. |
| TC-10 | Business Objectives Strip | PASS | 5 objectives render. Edit panel with add/remove/category works. |
| TC-11 | Graceful Defaults (pre-existing) | PASS | All views render without errors for fuzzee-coffee. Empty states shown appropriately. |
| TC-12 | Mock Fallback | SKIPPED | Requires AFS shutdown — not tested. |
| TC-13 | AFS Data Contract Validation | PARTIAL PASS | brand-voice, pillars, segments exist with correct structure. channel-strategy and content-mix empty. |
| TC-14 | Cross-View Data Flow | PASS | Audience segments appear in Channel Strategy dropdown. Pillars appear in Research Sources filter. |
| TC-15 | Save Operation Verification | PASS | PUT requests to brand-voice, channel-strategy, competitor-insights all return 200. Data persists on reload. |
| TC-16 | Error Handling & Edge Cases | PARTIAL PASS | No console errors during any navigation. Rapid sidebar clicks don't cause race conditions. |

---

## AFS Data Verification Summary

### tc1-test-workspace (newly onboarded)

| File | Status | Issues |
|------|--------|--------|
| settings/general.json | EXISTS | OK |
| settings/brand-voice.json | EXISTS | voiceAttributes=[], brandVoiceDescription populated |
| settings/business-objectives.json | EXISTS | 1 objective created |
| settings/channel-strategy.json | EXISTS | **channels=[] — EMPTY** |
| settings/platforms.json | EXISTS | 4 active platforms configured |
| settings/brand-positioning.json | EXISTS | OK |
| content-pillars/pillar-1.json | EXISTS | "Industry News" |
| content-pillars/pillar-2.json | EXISTS | "How-To Guides" |
| content-pillars/_content-mix.json | EXISTS | **targets=[] — EMPTY** |
| audience-segments/seg-1.json | EXISTS | **description === name** |
| audience-segments/seg-2.json | EXISTS | **description === name** |
| research-sources/ | NOT CREATED | Expected empty for new workspace |
| competitor-insights/ | NOT CREATED | Expected empty for new workspace |

### fuzzee-coffee (pre-existing)

| File | Status | Issues |
|------|--------|--------|
| settings/channel-strategy.json | CREATED DURING TEST | 2 channels (initialized via UI) |
| settings/brand-voice.json | EXISTS | missionStatement populated, 1 attr (added during test), vocabulary has 1 preferred word |
| content-pillars/ | EXISTS | 4 pillars + _content-mix.json (empty targets) |
| audience-segments/ | EXISTS | 2 segments (description === name) |
| competitor-insights/ | EXISTS | 1 competitor (added during test) |
