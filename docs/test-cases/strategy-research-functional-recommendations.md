# Strategy & Research — Functional Recommendations

**Date:** 2026-04-09
**Source:** Test session on `feature/researchImpl` (see `strategy-research-test-report.md` for bugs)

These are feature gaps and UX improvements observed during testing. They are not bugs — the code works as written — but the current implementation is incomplete or creates friction for users.

---

## FR-01 — Business Objectives: Add "Add Objective" button

**Section:** Business Objectives strip
**Priority:** HIGH

**Current state:**
The Business Objectives edit panel (opened via "Edit" in the strip) lists existing objectives with editable fields and delete (×) buttons. There is an "AI Suggest" button, but it auto-generates suggestions rather than providing a blank form for manual entry. There is no way to manually create a new objective from scratch.

**Recommendation:**
Add an "+ Add Objective" button at the bottom of the edit panel that opens an inline form with:
- Category chip selector (Growth, Revenue, Awareness, Trust, Community, Engagement)
- Objective statement (free text)
- Target (number)
- Unit (free text, e.g., "followers", "sales", "%")
- Timeframe (e.g., "90 days", "12 months")

This directly mirrors the tc-3 step 35 test expectation.

---

## FR-02 — Research Sources: Add "Add Source" button for manual entry

**Section:** Research Sources
**Priority:** HIGH

**Current state:**
The only way to add research sources is via "AI Discover Sources", which runs a simulated discovery and creates a single hardcoded mock result. There is no way for a user to manually add a known, relevant source they already have in mind (a specific article, report, or social account).

**Code evidence:**
`research-sources.component.ts` has two placeholder methods that never execute:
```typescript
createIdea(_source: ResearchSource): void { /* Placeholder */ }
startProduction(_source: ResearchSource): void { /* Placeholder */ }
```

**Recommendation:**
Add an "+ Add Source" button that opens a form with:
- Title
- URL
- Type (article / report / social / news / video)
- Relevance score (or leave auto-generated)
- Pillar tag(s) (multi-select from existing pillars)
- Summary (optional free text)

Also implement `createIdea()` and `startProduction()` on source cards, or remove those action buttons until they are ready.

---

## FR-03 — Channel Strategy: Add platform configuration when channels are empty

**Section:** Channel Strategy
**Priority:** HIGH

**Current state:**
When `channel-strategy.json` has `channels: []`, the entire Channel Strategy view is blank except for an "AI Generate All Strategies" button. The AI Generate button iterates over `list.map(...)` — so on an empty array, it produces nothing. The user has no path forward except waiting for a bug fix.

**Code evidence:**
```typescript
aiGenerateAll(): void {
  this.channels.update(list =>
    list.map(c => ({ ...c, ... }))  // no-ops on empty array
  );
}
```

**Recommendation:**
When `channels` is empty, show a platform selection UI that lets the user check which platforms they want to configure (Instagram, TikTok, YouTube, Facebook, LinkedIn). Upon confirmation, initialize the `channels` array with those platforms and persist to AFS. The "AI Generate All Strategies" button would then work as intended.

---

## FR-04 — Channel Strategy: Audience and Goal dropdowns are hardcoded

**Section:** Channel Strategy → Primary Audience and Primary Goal dropdowns
**Priority:** MEDIUM

**Current state:**
The "Primary Audience" dropdown in each platform accordion uses a hardcoded list of wellness-specific audience personas:
```typescript
const AUDIENCE_OPTIONS: DropdownOption[] = [
  { value: 'active-40s', label: 'Active 40s' },
  { value: 'thriving-50s', label: 'Thriving 50s' },
  ...
];
```
These are irrelevant for non-wellness workspaces (e.g., fuzzee-coffee's segments are "The Conscious Energy Seeker" and "The Health-Curious Guy").

**Recommendation:**
Populate the Primary Audience dropdown dynamically from `stateService.segments()` — the workspace's actual audience segments loaded from AFS. This ensures the options are workspace-specific and always current.

---

## FR-05 — Brand Voice: Sub-section changes require "Save Mission" to persist — not obvious

**Section:** Brand Voice & Tone — Voice Attributes, Tone Shifts, Platform Nuances, Vocabulary
**Priority:** HIGH

**Current state:**
Each sub-section (Voice Attributes, Tone Shifts, Platform Nuances, Vocabulary) has its own "Save" button or add action. These buttons update local Angular signal state only. Changes are only written to AFS when the user explicitly clicks **"Save Mission"** in the unrelated Content Mission Statement section at the top of the page.

A user who adds 5 voice attributes and then navigates to Strategic Pillars will lose all 5 attributes because they have no reason to know they need to click "Save Mission" first.

**Recommendation (pick one):**
- **Option A (preferred):** Each sub-section save action calls `stateService.saveBrandVoice()` immediately after updating local state (same pattern as `voice-mission.component.ts:30`). Add a toast per sub-section: "Voice attributes saved", "Vocabulary saved", etc.
- **Option B:** Add a prominent "Save All Brand Voice Changes" button at the top or bottom of the Brand Voice view that persists the entire document.
- **Option C:** Auto-save on blur for all fields in these sub-sections (debounced).

---

## FR-06 — Platform Nuances: Inactive platforms should be hidden

**Section:** Brand Voice → Platform Nuances
**Priority:** MEDIUM

**Current state:**
`platform-adjustments.component.ts` iterates over `ALL_PLATFORMS = ['instagram', 'tiktok', 'youtube', 'facebook', 'linkedin']` — a hardcoded static list. LinkedIn appears even when it was set to inactive during onboarding. The component does not consult `stateService.channelStrategy()` to filter to active platforms only.

**Recommendation:**
Filter the platforms shown in Platform Nuances to only those present in `channelStrategy` with `active: true`. If no channel strategy is available, fall back to showing all platforms.

---

## FR-07 — Content Mix: Content categories are fixed — no custom category support

**Section:** Content Mix Framework
**Priority:** MEDIUM

**Current state:**
The content mix supports exactly 5 hardcoded categories: `educational`, `entertaining`, `community`, `promotional`, `trending`. The "AI Suggest Mix" button also uses a hardcoded distribution for these same 5 categories:
```typescript
const suggestedTargets: Record<ContentCategory, number> = {
  educational: 30, entertaining: 25, community: 25, promotional: 10, trending: 10,
};
```
If a workspace's content strategy uses different category names (e.g., "Product Education", "Behind The Scenes"), there is no way to reflect that.

**Recommendation:**
- Allow users to add custom categories via an "+ Add Category" button
- Store custom category names in `_content-mix.json` alongside the target percentages
- Update "AI Suggest Mix" to distribute across whatever categories exist, not a hardcoded set

---

## FR-08 — AI Competitor Scan: Not implemented

**Section:** Competitor Deep Dive
**Priority:** MEDIUM

**Current state:**
`runAiScan()` only toggles `isScanning` on/off with a timeout. It never produces any results or creates any competitor entries:
```typescript
runAiScan(): void {
  this.isScanning.set(true);
  safeTimeout(() => {
    this.isScanning.set(false);  // no results added
  }, AI_SIMULATION_DELAY_MS, this.destroyRef);
}
```
`runTeardown()` is also a placeholder with no implementation.

**Recommendation:**
Implement `runAiScan()` to simulate discovering 2–3 competitor insight entries (similar to how `discoverSources()` works in Research Sources). The results should be added to the `competitorInsights` list and persisted via `stateService.saveCompetitorInsights()`. Implement or remove `runTeardown()`.

---

## FR-09 — Content Distribution Analysis: Platform split is hardcoded, ignores workspace platforms

**Section:** Strategic Pillars → Content Distribution Analysis
**Priority:** MEDIUM

**Current state:**
`analyzeDistribution()` always outputs a platform split across Instagram, TikTok, YouTube, and Pinterest — hardcoded regardless of which platforms the workspace actually uses:
```typescript
const platformSplit: PlatformAllocation[] = [
  { platform: 'instagram', ... },
  { platform: 'tiktok', ... },
  { platform: 'youtube', ... },
  { platform: 'pinterest', ... },  // may not be a configured platform
];
```
Pinterest is not a platform option anywhere else in the app.

**Recommendation:**
Drive the platform split from the workspace's active channels in `stateService.channelStrategy()` (filtered to `active: true`). If channel strategy is empty, show a note suggesting the user configure their channels first.

---

## FR-10 — Strategic Pillars: Goal details not visible on pillar cards

**Section:** Strategic Pillars
**Priority:** LOW

**Current state:**
Pillar cards show a count badge ("1 obj") for goals, but the actual goal details (metric, target, current value, period) are only accessible by clicking the card to open the edit modal. There is no inline view of goal progress.

**Recommendation:**
Expand the pillar card to show goal summaries inline — e.g., "Engagement rate: 0 / 5% monthly". A progress bar or simple text list would be sufficient. This makes the pillar cards actionable at a glance without requiring a modal open.

---

## FR-11 — Business Objectives: Status is always "On Track" — no update mechanism

**Section:** Business Objectives strip
**Priority:** LOW

**Current state:**
All objectives display "On Track" status. The AFS contract includes a `status` field, but there is no UI to change it and no logic that computes it from `currentValue` vs `target`. The status shown is whatever was written during onboarding (always "On Track" as default).

**Recommendation:**
Either:
- Add a status dropdown in the edit panel (On Track / At Risk / Behind / Completed)
- Or compute status automatically from `currentValue` / `target` when `currentValue` is populated

Also add a `currentValue` input to the edit panel so progress can be tracked against the target.

---

## FR-12 — Add Competitor form: New entries default to placeholder values

**Section:** Competitor Deep Dive → Add Competitor
**Priority:** LOW

**Current state:**
When a competitor is added manually via the "Add Competitor" form, the created entry uses placeholder values for fields the form doesn't collect:
```typescript
const insight: CompetitorInsight = {
  relevancyLevel: 'Medium',   // always Medium
  frequency: 'Unknown',
  insight: 'Pending analysis...',
};
```
The user fills in competitor name, platform, content type, and topic — but relevancy, frequency, and insight text are always placeholders. The card then shows "Pending analysis..." as the insight text.

**Recommendation:**
Either add these fields to the "Add Competitor" form (relevancy level dropdown, frequency selector), or trigger an AI analysis immediately after manual add to populate them. The "Pending analysis..." placeholder is confusing — consider showing a "Run AI Analysis" button on the card instead.

---

## Summary Table

| ID | Section | Recommendation | Priority |
|----|---------|---------------|----------|
| FR-01 | Business Objectives | Add "Add Objective" button for manual entry | HIGH |
| FR-02 | Research Sources | Add "Add Source" button; implement createIdea/startProduction | HIGH |
| FR-03 | Channel Strategy | Add platform selection UI when channels array is empty | HIGH |
| FR-04 | Channel Strategy | Populate Primary Audience dropdown from workspace segments | MEDIUM |
| FR-05 | Brand Voice | Sub-section saves should independently persist to AFS | HIGH |
| FR-06 | Platform Nuances | Hide inactive platforms from the adjustments list | MEDIUM |
| FR-07 | Content Mix | Support custom content categories; remove hardcoded 5-category constraint | MEDIUM |
| FR-08 | Competitor Deep Dive | Implement AI Competitor Scan and Teardown | MEDIUM |
| FR-09 | Strategic Pillars | Drive Content Distribution platform split from workspace channels | MEDIUM |
| FR-10 | Strategic Pillars | Show goal summaries inline on pillar cards | LOW |
| FR-11 | Business Objectives | Add status update UI and currentValue tracking | LOW |
| FR-12 | Competitor Deep Dive | Collect or compute relevancy/frequency/insight on manual add | LOW |
