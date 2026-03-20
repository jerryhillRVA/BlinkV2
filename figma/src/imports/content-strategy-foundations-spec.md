# Content Strategy Foundations — Feature Spec
**Blink Social | Strategy & Research Section**
Last updated: 2026-03-18

---

## Overview

This spec covers 7 features that fill the gaps between Blink's current strategy tools (Pillars, Audience, Research, Competitor) and industry-standard content strategy best practices. Each feature is scoped for standalone Claude Code implementation.

**Implement one at a time in this recommended order:**
1. Brand Voice & Tone (new Strategy tab)
2. Content Goals & KPIs (enhancement to Strategic Pillars)
3. Channel Strategy (new Strategy tab)
4. Funnel / Journey Mapping (enhancement to Audience Segments)
5. Content Mix Framework (new Strategy tab + Overview widget)
6. Content Audit (new view in Performance Tracking)
7. Distribution & Amplification (post-QA section in Production)

**Tab order after all features are implemented (StrategyResearch.tsx):**
Brand Voice & Tone → Strategic Pillars → Audience → Channel Strategy → Content Mix → Research Sources → Competitor Deep Dive

---

## Feature 1: Brand Voice & Tone

**File:** `src/app/components/content/StrategyResearch.tsx` + new component `BrandVoice.tsx`
**Placement:** First tab in Strategy section (insert before Strategic Pillars)
**Type changes:** Add `BrandVoice` interface to `types.ts`; pass via props from parent state

### New Types (types.ts)

```ts
export interface VoiceAttribute {
  id: string;
  label: string;          // e.g. "Empowering"
  description: string;    // What this means for the brand
  doExample: string;      // Example of voice done right
  dontExample: string;    // Example of what to avoid
}

export interface ToneContext {
  id: string;
  context: string;        // e.g. "Educational", "Motivational", "Promotional"
  tone: string;           // Description of tone in that context
  example: string;        // Sample line of copy
}

export interface BrandVoice {
  missionStatement: string;           // Why we create content, for whom, to what end
  voiceAttributes: VoiceAttribute[];  // 3–5 defining personality traits
  toneByContext: ToneContext[];        // How tone shifts per situation
  platformToneAdjustments: {          // Per-platform tone nudges
    platform: Platform;
    adjustment: string;               // e.g. "More casual on TikTok, use trending audio language"
  }[];
  vocabulary: {
    preferred: string[];              // Words/phrases to use
    avoid: string[];                  // Words/phrases to avoid
  };
  generatedAt?: string;               // ISO timestamp if AI-generated
}
```

### State (StrategyResearch.tsx)

Add `brandVoice: BrandVoice` to the strategy state, initialized with empty defaults. Pass down to `BrandVoice` component.

### UI: BrandVoice.tsx Component

**Section 1 — Content Mission**
- Textarea: "Content Mission Statement" — why we create content, for whom, what outcome
- Helper text: "Complete this sentence: We create content to help [audience] [achieve outcome] by [our approach]."
- Save button (inline, auto-saves to state)
- AI button: "Draft Mission" (2500ms mock → `toast.success("Mission drafted")`)

**Section 2 — Voice Attributes**
- Label: "Brand Personality" — 3–5 defining traits
- Cards grid (2-col): each shows attribute label, description, Do example (green tint), Don't example (red tint)
- "+ Add Attribute" button → inline form: label, description, do example, don't example
- Edit / Delete on each card (hover reveal)
- "AI Generate Voice Attributes" button — generates 4 mock attributes based on mission statement (2500ms mock)

**Section 3 — Tone by Context**
- Label: "Tone Shifts" — how the voice adapts in different situations
- Table-style list: context | tone description | example line of copy
- "+ Add Context" → inline form
- Pre-populated contexts: Educational, Motivational, Community, Promotional

**Section 4 — Platform Tone Adjustments**
- Label: "Platform Nuances"
- One row per active platform (instagram, tiktok, youtube, facebook, linkedin)
- Each row: platform icon + name, editable text input for tone adjustment note
- "AI Suggest" button per row (1500ms mock)

**Section 5 — Vocabulary Guide**
- Two columns: "Use These Words" (green badge chips) | "Avoid These Words" (red badge chips)
- "+ Add" chip input for each column
- Delete on each chip
- "AI Generate Vocabulary" button (2500ms mock)

### Cross-Workflow Integration
- `BriefBuilder.tsx`: Add a collapsible "Voice Guide" reference panel in the sidebar. Show the brand's voice attributes and mission as read-only context when filling out the brief.
- Future: ContentBuilderStudio could reference voice attributes during AI caption/hook generation.

---

## Feature 2: Content Goals & KPIs

**File:** `src/app/components/content/StrategicPillars.tsx` + `types.ts`
**Placement:** Enhancement to existing Strategic Pillars tab

### New Types (types.ts)

```ts
export interface PillarGoal {
  id: string;
  metric: string;            // e.g. "Follower Growth", "Engagement Rate", "Posts Published"
  target: number;            // e.g. 20
  unit: "%" | "followers" | "posts" | "views" | "leads" | string;
  period: "monthly" | "quarterly" | "yearly";
  current?: number;          // Actual current value for progress display
}

// Extend ContentPillar:
export interface ContentPillar {
  id: string;
  name: string;
  description: string;
  color: string;
  goals?: PillarGoal[];      // ADD THIS
}
```

### UI Changes: StrategicPillars.tsx

**Pillar Card Enhancement:**
- Below the existing name + description in each card, add a "Goals" section
- If no goals: show a subtle "+ Add Goal" link
- If goals exist: show each goal as a compact row: metric label | progress bar | "X / Y unit (period)"
- Progress bar uses pillar color, fills based on `(current / target) * 100`
- If `current` is undefined, show progress bar at 0% with target label only

**Pillar Dialog Enhancement:**
- Add a "Goals" section below the color picker in the create/edit dialog
- List existing goals with inline Delete icon
- "+ Add Goal" button → inline sub-form within the dialog:
  - Input: Metric name (text, e.g. "Monthly reach")
  - Input: Target (number)
  - Select: Unit (%, followers, posts, views, leads, or custom text)
  - Select: Period (Monthly, Quarterly, Yearly)
  - Input: Current value (number, optional — for progress tracking)
  - Save / Cancel inline buttons

**AI Suggest Goals button:**
- Small "AI Suggest Goals" link in the dialog Goals section
- 2500ms mock → pre-fills 2 suggested goals based on pillar name (e.g., for "Yoga & Movement": Engagement Rate 5% monthly, Posts Published 12 monthly)
- `toast.success("Goals suggested — review and adjust")`

### Cross-Workflow Integration
- `PerformanceTracking.tsx` dashboard view: Add a "Pillar Goal Progress" card in the dashboard grid showing a compact list of all pillars with their primary goal progress bars. Uses same data from pillars prop.

---

## Feature 3: Channel Strategy

**File:** `src/app/components/content/StrategyResearch.tsx` + new component `ChannelStrategy.tsx`
**Placement:** New tab in Strategy section, after Audience, before Content Mix
**Type changes:** Add `ChannelStrategyEntry` to `types.ts`

### New Types (types.ts)

```ts
export interface ChannelStrategyEntry {
  platform: Platform;
  active: boolean;              // Is this platform part of the brand's active strategy?
  role: string;                 // e.g. "Primary discovery channel", "Community hub"
  primaryContentTypes: ContentType[];  // From PLATFORM_CONTENT_TYPES
  toneAdjustment: string;       // How tone shifts for this platform
  postingCadence: string;       // e.g. "5x/week", "Daily at 7am"
  primaryAudience: string;      // Which segment / demographic to prioritize
  primaryGoal: string;          // e.g. "Follower growth", "Engagement", "Traffic"
  notes: string;                // Free-form strategy notes
  generatedAt?: string;
}
```

### State (StrategyResearch.tsx)

Add `channelStrategies: ChannelStrategyEntry[]` initialized with one entry per platform (instagram, tiktok, youtube, facebook, linkedin), all with `active: false` and empty fields.

### UI: ChannelStrategy.tsx Component

**Header:**
- Title: "Channel Strategy"
- Subtitle: "Define the role and approach for each platform in your content mix"
- "AI Generate All Strategies" button — generates mock strategies for all active platforms (3000ms mock)

**Platform Cards (one per platform):**
- Card header: platform icon + platform name + Active toggle switch (right-aligned)
- If `active: false`: card is dimmed, shows "Mark as active to define strategy"
- If `active: true`: show full strategy fields:
  - **Role** — text input: "What role does this platform play?" (e.g. "Primary discovery channel")
  - **Primary Content Types** — multi-select checkboxes from `PLATFORM_CONTENT_TYPES[platform]`
  - **Posting Cadence** — text input: "e.g. 5x/week, Mon/Wed/Fri at 7am"
  - **Primary Audience** — text input or dropdown of existing segment names
  - **Primary Goal** — select: Follower Growth | Engagement | Traffic | Lead Gen | Community | Brand Awareness
  - **Tone Adjustment** — textarea: "How does your voice shift on this platform?"
  - **Notes** — textarea: open strategy notes
  - "AI Generate Strategy" button (per card) — 2500ms mock, fills all fields for that platform
  - Last generated timestamp if `generatedAt` is set

**Layout:** Stacked cards (full width), each collapsible. Active platforms expanded by default.

### Cross-Workflow Integration
- `PackagingStudio.tsx`: When a platform is selected for packaging, show a "Channel Strategy" read-only reference panel in the sidebar with the role, cadence, and tone note for that platform.

---

## Feature 4: Funnel / Journey Mapping

**File:** `src/app/components/content/AudienceSegments.tsx` + `types.ts`
**Placement:** Enhancement to existing Audience tab — collapsible Journey section per segment card

### New Types (types.ts)

```ts
export type JourneyStage = "awareness" | "consideration" | "conversion" | "retention";

export interface SegmentJourneyStage {
  stage: JourneyStage;
  primaryGoal: string;          // e.g. "Introduce brand and build recognition"
  contentTypes: string[];       // e.g. ["Educational Reels", "Trend hooks", "Value carousels"]
  hookAngles: string[];         // e.g. ["Did you know...", "Stop doing X", "The truth about Y"]
  successMetric: string;        // e.g. "New followers, Reach, Saves"
}

// Extend AudienceSegment:
export interface AudienceSegment {
  id: string;
  name: string;
  description: string;
  demographics?: string;
  interests?: string[];
  painPoints?: string[];
  peakTimes?: string[];
  journeyStages?: SegmentJourneyStage[];  // ADD THIS
}
```

### UI Changes: AudienceSegments.tsx

**Segment Card Enhancement:**
- Below the existing segment info, add a "Customer Journey" collapsible section
- Toggle: "View Journey Map" / "Hide Journey Map" (chevron icon)
- If no journey data: collapsed state shows "+ Map Journey" button inside
- If journey data exists: collapsed state shows a compact 4-stage pill strip (Awareness → Consideration → Conversion → Retention), each pill color-coded:
  - Awareness: blue
  - Consideration: amber
  - Conversion: green
  - Retention: purple

**Expanded Journey View:**
- 4 columns (or stacked on mobile) — one per journey stage
- Each stage card shows:
  - Stage name + icon (Awareness: Eye, Consideration: Search, Conversion: Target, Retention: Heart)
  - Primary Goal (editable inline)
  - Content Types (editable chip list)
  - Hook Angles (editable chip list)
  - Success Metric (editable inline)
- "AI Map Journey" button per segment — 2500ms mock, generates all 4 stages based on segment name/description → `toast.success("Journey mapped for [segment name]")`

**Segment Dialog Enhancement:**
- No changes to the create dialog (journey is mapped post-creation via the card)

### Cross-Workflow Integration
- `IdeationPlanning.tsx` Idea Hub: Add a "Journey Stage" filter dropdown (All | Awareness | Consideration | Conversion | Retention). Filter content ideas by the journey stage tag.
- ContentItem type: Add optional `journeyStage?: JourneyStage` field so ideas can be tagged to a stage.

---

## Feature 5: Content Mix Framework

**Files:** New component `ContentMix.tsx` in strategy section + widget in `ContentStudioOverview.tsx`
**Placement:** New tab in StrategyResearch.tsx (between Channel Strategy and Research Sources)
**Type changes:** Add `ContentMixTarget` and `contentCategory` to ContentItem in `types.ts`

### New Types (types.ts)

```ts
export type ContentCategory =
  | "educational"
  | "entertaining"
  | "community"
  | "promotional"
  | "trending";

export interface ContentMixTarget {
  category: ContentCategory;
  label: string;          // Human-readable: "Educational", "Entertaining", etc.
  targetPercent: number;  // 0–100, all should sum to 100
  color: string;          // Hex color for chart display
  description: string;    // What belongs in this category
}

// Extend ContentItem:
export interface ContentItem {
  // ... existing fields ...
  contentCategory?: ContentCategory;  // ADD THIS
}
```

### Default Mix Targets

```ts
const DEFAULT_MIX: ContentMixTarget[] = [
  { category: "educational", label: "Educational", targetPercent: 35, color: "#3b82f6", description: "How-tos, tips, tutorials, expert insights" },
  { category: "entertaining", label: "Entertaining", targetPercent: 25, color: "#f59e0b", description: "Relatable content, humor, storytelling, trends" },
  { category: "community", label: "Community", targetPercent: 20, color: "#10b981", description: "UGC, Q&As, behind the scenes, audience spotlights" },
  { category: "promotional", label: "Promotional", targetPercent: 15, color: "#d94e33", description: "Products, services, offers, launches" },
  { category: "trending", label: "Trending / Reactive", targetPercent: 5, color: "#8b5cf6", description: "Timely content, news hooks, cultural moments" },
]
```

### UI: ContentMix.tsx Component

**Section 1 — Target Mix**
- Title: "Target Content Mix"
- Subtitle: "Define the ideal ratio of content types across your strategy"
- For each category: horizontal slider (0–100%) + percentage input + label + description
- Real-time validation: warn if total ≠ 100% (show running total)
- Color swatch per category
- "Reset to Defaults" button
- "AI Suggest Mix" button (2500ms mock — adjusts targets based on pillar types and audience data) → `toast.success("Mix adjusted based on your pillars and audience")`

**Section 2 — Actual vs. Target (read-only, derived from content items)**
- Donut chart (using recharts PieChart) showing actual distribution by `contentCategory` across all ContentItems
- Legend: each category with target % vs. actual %
- Gap indicators: if actual is more than 10% below target, show a warning badge ("Below target")
- Note: ContentItems without a `contentCategory` are grouped as "Uncategorized" in the chart

### Cross-Workflow Integration

**ContentStudioOverview.tsx:**
- Add a "Content Mix" widget card below the stats grid (before the filter bar)
- Shows a compact horizontal stacked bar: actual vs. target
- Each segment colored per category
- Clicking navigates to Strategy → Content Mix tab

**IdeationPlanning.tsx:**
- When creating a new idea in the Idea Hub, show a "Category" select field (Educational | Entertaining | Community | Promotional | Trending)
- Auto-suggest category based on pillar assignment (mock logic: Educational pillar → Educational category)

---

## Feature 6: Content Audit

**File:** `src/app/components/content/PerformanceTracking.tsx`
**Placement:** New 4th view in Performance section ("Audit" tab alongside Dashboard, Content Performance, AI Recommendations)

### UI: New "Audit" view in PerformanceTracking.tsx

**Add to `PerfView` type:** `"dashboard" | "content" | "recommendations" | "audit"`
**Add to views array:** `{ id: "audit", label: "Content Audit", icon: ClipboardList }`

**Audit Dashboard Layout (4 sections):**

**Section 1 — Freshness Check**
- Scans items where `status !== "published"` and last `updatedAt` is > 30 days ago
- Shows a list of stale content items with: title, stage, status, days since update, "View" button to navigate to item
- If none: green checkmark + "All active content is up to date"

**Section 2 — Pillar Coverage Gaps**
- Bar chart (recharts) showing count of ContentItems per pillar
- Highlights pillars with 0 or low content relative to others
- "Gaps Detected" badge on pillars significantly below average
- Uses existing `pillarData` calculation pattern from dashboard

**Section 3 — Platform Coverage Gaps**
- Grid showing content count per platform (instagram, tiktok, youtube, facebook, linkedin)
- Platform icon + name + content count + bar showing relative distribution
- Platforms with 0 content shown in red with "No content" label

**Section 4 — Format Gaps**
- Shows content type distribution across all items
- Groups by canonical format category: Video | Carousel/Doc | Static Image | Text | Stories | Live
- Highlights formats with 0 pieces as "Untested"

**AI Audit button:**
- "Run Full AI Audit" button at top of view
- 3000ms mock → generates a prioritized list of 4–5 gap findings, each with:
  - Finding title (e.g. "TikTok is underutilized — 0 posts")
  - Priority: High | Medium | Low
  - Recommended action (e.g. "Create 2 short-form videos for TikTok this month")
  - Link to relevant workflow step
- `toast.success("Audit complete — 5 gaps identified")`

---

## Feature 7: Distribution & Amplification

**File:** `src/app/components/content/production/QAStudio.tsx`
**Placement:** Collapsible "Post-Publish Plan" section, revealed after QA approval (all approvals passed)

### UI Changes: QAStudio.tsx

**"Post-Publish Plan" section:**
- Only shown/expanded when `qaData.approved === true` (all approvals complete)
- Section header: "Post-Publish Amplification" with Megaphone icon
- Subtitle: "Content is approved — now plan how to maximize its reach"

**4 checklist groups:**

**1. Paid Boost**
- Toggle: "Boost this post?" (Yes / No / Decide Later)
- If Yes: show fields for Platform, Budget, Duration, Target Audience (brief text)
- Recommended boost platform pre-filled from item's platform

**2. Cross-Post Plan**
- Checklist of other active platforms (from ChannelStrategy active platforms)
- For each: checkbox "Cross-post to [Platform]?" + optional adaptation note
- "AI Suggest Adaptations" button (1500ms mock) — fills in brief adaptation notes per platform

**3. Repurpose Plan**
- Textarea: "How will this content be repurposed?"
- AI-populated suggestions (from existing `repurposePlan` field in `ProductionOutput`):
  - e.g., "Turn YouTube video into 3 TikTok clips", "Extract quotes for LinkedIn text posts"
- "AI Generate Repurpose Plan" button (2500ms mock)

**4. Employee Advocacy / Sharing**
- Checkbox: "Share with team for organic amplification?"
- Text input: "Suggested caption for team to share"
- "AI Draft Team Caption" (1500ms mock)

**Save state:** All data saved to a new `amplificationData` object within `ProductionData` (add to `ProductionData` type and `ProductionOutput` type).

### New Type (types.ts)

```ts
export interface AmplificationData {
  boostEnabled?: boolean;
  boostPlatform?: Platform;
  boostBudget?: string;
  boostDuration?: string;
  boostAudience?: string;
  crossPostPlans?: { platform: Platform; enabled: boolean; adaptationNote: string }[];
  repurposePlan?: string;
  teamShare?: boolean;
  teamCaption?: string;
}

// Add to ProductionData:
amplification?: AmplificationData;
```

---

## Implementation Notes for Claude Code

- **Mock AI pattern:** All AI buttons use 2500ms setTimeout + `toast.success()` (1500ms for lighter actions)
- **Brand color:** `#d94e33` for primary buttons, `#c4452d` for hover
- **Component pattern:** Follow StrategicPillars.tsx and AudienceSegments.tsx patterns for new components
- **Passing state:** All new state should be hoisted to the parent that manages `pillars` and `segments` (likely `StrategyResearch.tsx` or `App.tsx`) and passed as props
- **shadcn components available:** Card, Button, Input, Textarea, Dialog, Badge, Progress, Collapsible, Tooltip, Switch, Select, Tabs — all confirmed in `/ui/` folder
- **recharts available:** Used in PerformanceTracking.tsx — import pattern available there
- **Do not implement more than one feature per Claude Code session**
