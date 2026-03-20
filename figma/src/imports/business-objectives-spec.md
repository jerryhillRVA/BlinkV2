# Business Objectives & Strategy Foundation — Feature Spec
**Blink Social | Differentiator Feature**
Last updated: 2026-03-20

---

## Strategic Intent

Blink's competitive differentiator is being the first social media content tool rooted in business objectives — not just execution. Every feature should trace back to an objective. This spec implements that foundation across four areas:

1. Business Objectives (Setup Wizard + Strategy section)
2. Brand Positioning (Setup Wizard + Brand Voice tab)
3. Objective Progress Tracking (Performance section)
4. Setup Wizard Overhaul (remove redundancies, establish strategic foundation)

**Implement one at a time. Recommended order: 1 → 4 → 2 → 3**

---

## New Types (types.ts)

```ts
export type ObjectiveCategory =
  | "growth"
  | "revenue"
  | "awareness"
  | "trust"
  | "community"
  | "engagement";

export interface BusinessObjective {
  id: string;
  category: ObjectiveCategory;
  statement: string;        // e.g. "Grow Instagram following to 10K"
  target: number;           // e.g. 10000
  unit: string;             // e.g. "followers", "%", "leads/month"
  timeframe: string;        // e.g. "Q2 2026", "By December 2026"
  currentValue?: number;    // for live progress tracking
  pillarIds?: string[];     // which pillars serve this objective
  status: "on-track" | "at-risk" | "behind" | "achieved";
}

export interface BrandPositioning {
  targetCustomer: string;   // Who you serve
  problemSolved: string;    // The problem they have
  solution: string;         // What Blink/brand does
  differentiator: string;   // Why you're different from alternatives
  positioningStatement: string; // AI-generated or manually written composite
}
```

Add to workspace-level state (App.tsx or equivalent top-level state):
```ts
objectives: BusinessObjective[]
positioning: BrandPositioning | null
```

---

## Feature 1: Business Objectives

### 1A — Setup Wizard Step (StepObjectives.tsx)

**New file:** `src/app/components/steps/StepObjectives.tsx`
**Insert:** After StepWorkspaceBasics, before StepContent in the wizard flow

**UI:**
- Header: "Business Objectives" / subtitle: "What does success look like? Define 2–4 measurable goals that your content strategy will serve."
- Introductory callout (amber tint): "Everything in Blink — your pillars, audience, content, and performance — traces back to these objectives. Set them carefully."
- List of objective cards (default: 2 starter cards, max 4)

Each objective card:
- Select "Category" (icons + labels): 📈 Growth | 💰 Revenue | 📣 Awareness | 🤝 Trust | 👥 Community | ⚡ Engagement
- Input "Objective" — placeholder: "e.g. Grow Instagram following to 10,000"
- Row: Input "Target" (number) + Input "Unit" (e.g. followers, leads/month, %) + Input "Timeframe" (e.g. Q2 2026)
- Remove button (X, top right, only if >1 card)

"+ Add Objective" button (outline, max 4)
"AI Suggest Objectives" button — 2500ms mock, generates 2 relevant objectives based on workspace purpose/mission from StepWorkspaceBasics → `toast.success("Objectives suggested — adjust to fit your goals")`

Mock suggested objectives:
```ts
[
  { category: "growth", statement: "Grow combined social following to 25,000", target: 25000, unit: "followers", timeframe: "Q4 2026", status: "on-track" },
  { category: "engagement", statement: "Achieve 5% average engagement rate across platforms", target: 5, unit: "%", timeframe: "Q3 2026", status: "on-track" }
]
```

### 1B — Strategy Section Objectives Strip

**File:** `src/app/components/content/StrategyResearch.tsx`
**Placement:** Persistent strip at the very top of the Strategy section — above all tabs, always visible regardless of which tab is active. NOT a tab itself.

**UI:**
- Section header row: "Business Objectives" (Target icon, #d94e33) + "Edit" link (right-aligned, opens objectives management dialog)
- Horizontal scrollable row of objective cards (compact):
  - Category icon + category label (muted, uppercase xs)
  - Objective statement (bold, sm, truncated)
  - Progress bar: width = (currentValue / target) * 100%, colored by status (green=on-track, amber=at-risk, red=behind, #d94e33=achieved)
  - Status badge: "On Track" / "At Risk" / "Behind" / "Achieved"
  - Timeframe (muted, xs)
- If no objectives set: soft empty state — "No objectives defined. Add objectives to root your strategy in measurable goals." + "Add Objectives →" button

**Objectives Management Dialog** (opened via "Edit" link):
- List of current objectives with edit/delete per card
- Same card format as wizard step
- "+ Add Objective" button
- "AI Suggest" button
- Save button

**Objective → Pillar Linking:**
- In the Strategic Pillars pillar dialog (StrategicPillars.tsx), add a multi-select "Linked Objectives" field
- Shows existing objectives as toggleable pills (statement truncated to 40 chars)
- Saves selected objective IDs to pillar.objectiveIds
- On pillar cards, show a small linked objectives count badge if objectiveIds.length > 0

### 1C — Pillar Goals → Objective Connection

In the Pillar Goals section (already implemented in StrategicPillars.tsx), add an optional "Linked Objective" select to each goal form — maps the goal to a specific business objective. This creates the full chain: Objective → Pillar → Goal → Content.

---

## Feature 2: Brand Positioning

### 2A — Setup Wizard Enhancement (StepWorkspaceBasics.tsx)

Add a "Brand Positioning" section to StepWorkspaceBasics BELOW the existing Mission field:

- Label: "Brand Positioning" with FieldInfo tooltip: "Your positioning statement defines who you serve, what problem you solve, and what makes you different. This guides every piece of content."
- Four compact inputs:
  - "Who is your target customer?" — placeholder: "e.g. Women 40+ navigating midlife wellness"
  - "What problem do they have?" — placeholder: "e.g. Overwhelmed by conflicting fitness advice"
  - "What's your solution?" — placeholder: "e.g. A movement-first wellness community with expert guidance"
  - "What makes you different?" — placeholder: "e.g. We combine clinical expertise with authentic community"
- "Generate Positioning Statement" button (outline, Sparkles icon) — 1500ms mock → fills a read-only textarea below the four inputs with: "For [targetCustomer] who [problemSolved], [workspaceName] is the [solution] that [differentiator]."
- The generated statement is editable after generation

### 2B — Brand Voice Tab Enhancement (BrandVoice.tsx)

Add "Brand Positioning" as Section 0 (before Content Mission) in the Brand Voice component:

- Show the positioning statement from workspace setup (read from props/state) as a read-only highlighted card
- "Edit Positioning" button opens an inline form with the same 4 fields
- If no positioning statement exists yet: prompt to complete it with a link-style CTA
- The positioning statement should be visually prominent — this is the strategic anchor for everything in Brand Voice

---

## Feature 3: Objective Progress Tracking

**File:** `src/app/components/content/PerformanceTracking.tsx`
**Placement:** New 5th view — "Objectives" — alongside dashboard, content, recommendations, audit

Add to PerfView type: `"objectives"`
Add to views array: `{ id: "objectives", label: "Objectives", icon: Target }`

**UI — Objectives view:**

Header card (full width, subtle brand-tinted bg):
- "Strategy → Performance Connection"
- Subtitle: "Track progress toward your business objectives across all content activity"

Per-objective card (one per objective, full width):
- Left: Category icon (large, colored by category) + Objective statement (bold, large) + Timeframe badge
- Center: Large progress bar with current vs. target labels
  - current: `{currentValue ?? 0} {unit}` (left)
  - target: `{target} {unit}` (right)
  - Bar color: green (on-track), amber (at-risk), red (behind), #d94e33 (achieved)
- Right: Status badge (On Track / At Risk / Behind / Achieved) + "Update Progress" button
  - "Update Progress" opens a small popover with a number input to manually update currentValue → saves to state → `toast.success("Progress updated")`
- Below bar: "Linked Pillars" — compact pill row showing which pillars feed this objective (from pillar.objectiveIds)
- Below pillars: "Content Activity" — count of ContentItems tagged to those pillars in last 30 days (derived from items[].pillarIds + items[].updatedAt)

Empty state (no objectives):
- Centered Target icon (gray)
- "No objectives defined yet"
- "Add Objectives →" button that navigates to Strategy section

**AI Insights button** (top of view):
- "Get AI Objective Analysis" — 2500ms mock → generates 3 insights about objective progress:
  - Which objective is most/least on track
  - Which pillar is most underinvested relative to objectives
  - Recommended content focus for next 2 weeks
- toast.success("Objective analysis complete")

---

## Feature 4: Setup Wizard Overhaul

**Files:** `src/app/components/steps/StepWorkspaceBasics.tsx`, `src/app/App.tsx` (or wherever wizard steps are orchestrated)

### Problems with current wizard:
1. Brand Voice is a single textarea — redundant with the full Brand Voice tab now being built
2. Audience Segments are collected (name + age range only) but the full Audience tab does this properly
3. No Business Objectives step
4. The wizard feels like account setup, not strategic foundation

### Changes:

**StepWorkspaceBasics.tsx:**
- KEEP: Workspace Name, Workspace Purpose, Mission
- REMOVE: Brand Voice textarea (single field — superseded by Brand Voice tab)
- ADD: Brand Positioning section (4 fields + AI generate, per Feature 2A above)
- UPDATE: Audience Segments section — simplify to just segment names (remove age range, add note: "You'll define full segment details in the Strategy section")
- UPDATE: Section header from "Workspace Identity" to "Strategic Foundation"
- UPDATE: Subtitle to "Define the purpose, mission, and positioning that your content strategy will serve"

**New step: StepObjectives.tsx (Feature 1A above)**
Insert in wizard flow between StepWorkspaceBasics and StepContent.

**StepContent.tsx:**
- Add "Linked Objective" select to each pillar card — lets users immediately connect pillars to objectives defined in the previous step
- Available objectives come from the wizard state

**Wizard step labels update:**
1. Strategic Foundation (was: Workspace Basics)
2. Business Objectives (NEW)
3. Platforms
4. Content Strategy (pillars)
5. Review

### Wizard → App state seeding:
When the wizard completes (StepReview → Submit), the collected data should seed:
- `objectives[]` from StepObjectives → available in Strategy → Objectives strip
- `positioning` from StepWorkspaceBasics → available in Brand Voice tab
- `segments[]` from StepWorkspaceBasics → pre-populates Audience tab
- `pillars[]` from StepContent → pre-populates Strategic Pillars tab
- Objective → Pillar links from StepContent → pillar.objectiveIds

---

## Cross-Feature Integration Map

| Where | What changes |
|---|---|
| Setup Wizard | New Objectives step; positioning fields in Workspace Basics; pillar→objective linking in Content step |
| Strategy section top | Persistent Objectives strip, always visible above tabs |
| Strategic Pillars | "Linked Objectives" multi-select on each pillar; shown on pillar cards |
| Pillar Goals | Optional "Linked Objective" field on each goal |
| Brand Voice tab | Positioning statement shown as Section 0 |
| Performance → Objectives view | Progress bars, linked pillars, content activity, AI insights |
| Content Brief (BriefBuilder) | Show linked objective as read-only context — "This content serves: [objective statement]" |

---

## Implementation Notes

- Objectives state should live at App.tsx level (same level as pillars and segments) and be passed down as props
- Brand Positioning state should also live at App.tsx level
- Both should be initialized from the wizard on first run, then editable in-app
- Mock AI pattern: 2500ms setTimeout + toast.success()
- Brand color: #d94e33
- Do not install new packages
- Read full files before editing — StrategyResearch.tsx especially
