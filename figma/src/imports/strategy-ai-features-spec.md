# Strategy & Research — AI Feature Requirements
## Blink Social | Feature Spec for Claude Code

---

## Overview

This spec adds 6 AI-powered tools inspired by the pattern of "paste input → get structured AI output." While each feature originates in the **Strategy & Research** section, several of them must also connect into the Content workflow (Ideation, Production, Packaging). The `ContentItem` data model is already rich enough to receive output from all these tools — the integration points below are critical and should not be skipped.

All AI responses are simulated with mock data (no real API calls). The existing `handleAIAnalyze` loading state pattern should be reused throughout.

The 6 features in priority order:

1. **Content Repurposer** — Strategy tab + Ideation AI Writing Tools tab
2. **Competitor Deep Dive** — Upgrade existing "Competitor Audit" tab → creates ContentItems in Ideation
3. **Content Series Builder** — Strategy tab → batch-creates linked ContentItems in Ideation + Calendar
4. **Hook & Caption A/B Analyzer** — Strategy tab + Production Execution Studio (primary home)
5. **Social SEO & Hashtag Strategy** — Strategy tab → pipes into Production Packaging
6. **Content Investment Allocator** — Strategic Pillars tab + Content Overview health widget

---

## Cross-Workflow Integration Map

This section defines exactly how each feature connects to the rest of the app. Claude Code must implement these integrations — they are not optional additions.

### App workflow context (from reading the codebase)

**Content Studio top-level steps** (WorkflowStep type in types.ts):
`overview → strategy → ideation → production → review → performance`

**Production sub-steps** (ProductionStep type, defined in production-config.ts):
`brief → builder → packaging → qa → handoff`

Note: Old step names "draft", "blueprint", "assets", and "activity" no longer exist. They were consolidated into "builder" (ContentBuilderStudio.tsx). The `normalizeStep()` function in ContentProduction.tsx maps any legacy references to the current steps. The "select" and "handoff" states are transitional screens, not true steps in the stepper UI.

Navigation between top-level steps uses `onNavigateToStep(step: WorkflowStep)` callbacks. Production sub-step navigation uses `goToStep(step: ProductionStep)` internally. The shared data object is `ContentItem` defined in `types.ts`. Key existing fields that our features should populate:

| Feature Output | Target Field on ContentItem / ProductionOutput |
|---|---|
| Repurposer captions | `production.outputs.captionVariants[]` |
| Repurposer hooks | `production.outputs.hookBank[]` |
| Repurposer hashtags | `production.outputs.hashtagSets[]` |
| Series posts | Multiple new `ContentItem` objects with shared `conceptId` |
| Series schedule | `scheduledDate` on each new ContentItem |
| A/B winner copy | `production.outputs.hook` or `production.outputs.postCopy` |
| SEO hashtag sets | `production.outputs.hashtags[]` + `production.outputs.packagingData.keywords[]` |
| Competitor gaps | New `ContentItem` objects with `title`, `description`, `pillarIds` pre-filled |
| Allocator plan | Compared against actual pillar distribution in Overview stats |

### Integration rules per feature

**Content Repurposer:**
- Lives in Strategy tab (primary) AND Ideation → AI Writing Tools (as a 4th tool panel)
- "Create Idea →" buttons create a new `ContentItem` at `stage: "idea"` with `title` = hook, `description` = full output
- "Send to Builder →" button (shown only if a content item is currently in production) populates `production.outputs.captionVariants`, `hookBank`, and `hashtagSets` on the active item — this targets the **Builder** step (ContentBuilderStudio.tsx)

**Content Series Builder:**
- Lives in Strategy tab only
- "Build Series" button creates ALL posts as individual `ContentItem` objects simultaneously, each with:
  - `stage: "idea"`, `status: "draft"`
  - Shared `conceptId: \`series-${Date.now()}\``
  - `title` = hook, `description` = captionSummary + CTA
  - `pillarIds` from the selected pillar
  - `segmentIds` from the selected segment
  - `scheduledDate` calculated from the suggestedDay (next occurrence of that weekday from today)
- After creation: navigate to Ideation tab and show a toast "5 ideas created for your series"
- In the Editorial Calendar, series items sharing a `conceptId` should show a small "S" badge on their calendar pill

**Hook & Caption A/B Analyzer:**
- Lives in Strategy tab (standalone research tool)
- ALSO lives as a collapsible panel inside **ContentBuilderStudio.tsx** (the Builder production step) labeled "A/B Test Your Copy" — this is the primary use case
- In Builder context: "Use This Version" button writes the improved copy directly into `production.outputs.hook` (if hook) or `production.outputs.postCopy` (if caption), then shows toast "Copy applied"
- In Strategy context: "Create Idea with this copy" creates a new ContentItem with the improved copy as description

**Social SEO & Hashtag Strategy:**
- Lives in Strategy tab
- Each hashtag set card has a "Apply to Active Content" button — enabled only if a content item is currently open in production
- Clicking pushes the tag array into `production.outputs.hashtags` on the active item and tag strings into `production.outputs.packagingData.keywords` — this feeds the **Packaging** step (PackagingStudio.tsx)
- Also add a "Copy All" button per hashtag tier for manual use

**Competitor Deep Dive:**
- Lives in Strategy → Competitor Audit tab (upgrade of existing tab)
- "Create Idea from Gap" buttons must pre-fill a new `ContentItem`:
  - `title`: the uncoveredAngle string
  - `description`: the counterStrategy paragraph
  - `pillarIds`: best-match pillar by keyword, or prompt user to pick
  - `segmentIds`: empty (user selects later)
  - `sourceUrl`: competitor handle string for traceability
- After creating: show toast and navigate to Ideation, highlighting the new item

**Content Investment Allocator:**
- Lives in Strategic Pillars tab (upgrade, as specced)
- ALSO surfaces in **ContentStudioOverview.tsx** as a "Content Health" widget below the existing stats row
- Widget shows one horizontal bar per pillar: Recommended % vs Actual % (calculated live from `items[].pillarIds`)
- Items with no pillar tagged show as "Untagged"
- Red indicator if a pillar is >10% over or under the recommendation
- Widget only renders after the allocator has been run at least once (gate on allocator result existing in state)

---

## Navigation Changes

In `StrategyResearch.tsx`, update the `views` array and `StrategyView` type to include the new tabs:

```ts
type StrategyView = "pillars" | "audience" | "research" | "competitors" | "repurposer" | "series" | "ab-analyzer" | "seo";
```

Updated tab order (left to right):
1. Strategic Pillars *(existing, enhanced)*
2. Audience *(existing, no change)*
3. Research Sources *(existing, no change)*
4. Competitor Deep Dive *(existing, upgraded)*
5. Content Repurposer *(new)*
6. Content Series Builder *(new)*
7. Hook & A/B Analyzer *(new)*
8. Social SEO & Hashtags *(new)*

Icons to use from lucide-react:
- Repurposer: `RefreshCw`
- Series Builder: `ListOrdered`
- A/B Analyzer: `FlaskConical`
- SEO & Hashtags: `Hash`

---

## Feature 1: Content Repurposer (New Tab)

### Purpose
Paste one piece of long-form content (blog post, podcast transcript, interview, newsletter) and get AI-generated social media adaptations for each platform.

### Location
New tab: `id: "repurposer"`, label: `"Content Repurposer"`, icon: `RefreshCw`

Create new file: `src/app/components/content/ContentRepurposer.tsx`

### UI Layout

**Step 1 — Input Panel (top)**
- `<Textarea>` labeled "Source Content" — placeholder: "Paste your blog post, podcast transcript, newsletter, or any long-form content here..."
  - `min-h-[160px]`, full width
- Row below textarea:
  - `<Select>` "Content Pillar" → maps to existing `pillars` prop (pass pillars down)
  - `<Select>` "Target Audience" → maps to existing `segments` prop
  - `<Button>` "Repurpose with AI" (brand red `#d94e33`, Sparkles icon)
- Character count shown bottom-right of textarea (e.g. "1,240 chars")

**Step 2 — Output Panel (shown after AI runs)**

Display a grid of platform output cards. Each card has:
- Platform icon + label in header (Instagram, TikTok, YouTube, LinkedIn)
- Content type badge (e.g. "Reel Hook", "Carousel Concept", "Short Video Hook", "Text Post")
- The generated output text in a styled `<pre>`-style box with copy-to-clipboard button
- "Create Idea →" button that calls `onNavigateToIdeation` and pre-fills (toast: "Idea created")

Platform outputs to generate (one card each):
1. **Instagram Reel** — 3 hook options (3-7 seconds each, pattern-break style)
2. **Instagram Carousel** — 6-slide outline (Slide 1: Hook, Slides 2-5: Value, Slide 6: CTA)
3. **Instagram Caption** — Full caption with line breaks, emoji cadence, 3 hashtag suggestions
4. **TikTok Hook** — Hook line + first 5 seconds script
5. **YouTube Short** — Hook + visual concept + on-screen text plan
6. **LinkedIn Post** — Professional adaptation, no hashtags, hook + insight + CTA

**Empty state (before AI runs):**
- Center-aligned icon (RefreshCw, gray)
- "Paste your content above and click Repurpose with AI"
- "Transforms one piece of content into 6 platform-ready formats"

### Mock Output Data

Add to a new file `src/app/components/content/mock-repurpose-data.ts`:

```ts
export const MOCK_REPURPOSE_OUTPUT = {
  instagram_reel_hooks: [
    "Nobody tells women over 40 this about their metabolism — and it's costing you results.",
    "Stop blaming your hormones. Here's what's actually happening at 40.",
    "I tried 3 different morning routines. This one changed everything for perimenopause."
  ],
  instagram_carousel: {
    slide1: { headline: "Your metabolism isn't broken — you just need a new strategy", role: "hook" },
    slide2: { headline: "What changes at 40 (it's not what you think)", role: "value" },
    slide3: { headline: "The 3 hormones that control your energy", role: "value" },
    slide4: { headline: "Why cardio alone stops working", role: "value" },
    slide5: { headline: "The strength training protocol that actually helps", role: "proof" },
    slide6: { headline: "Save this for your next workout. Follow for more.", role: "cta" }
  },
  instagram_caption: "Your 40s aren't working against you — your strategy might be.\n\nHere's what most women don't realize about perimenopause and fitness:\n\nThe rules genuinely change. Not because you're getting old, but because your hormones are shifting — and your training needs to shift with them.\n\nSwipe to see the 3 biggest changes and exactly what to do about each one. →\n\n#WomenOver40 #PerimenopauseFitness #HiveCollective",
  tiktok_hook: "Hook: 'Three things your doctor won't tell you about working out in perimenopause.' // First 5 sec: Talking head, direct to camera, bold text overlay reading 'THE RULES CHANGED' appears at 2 sec.",
  youtube_short: "Hook: 'This is why you're exhausted after workouts that used to energize you.' // Visual: Quick cuts of common workout mistakes. On-screen text: '1. Your cortisol is higher' / '2. Your recovery window is longer' / '3. Strength > cardio now.' // End card: 'Follow for more perimenopause fitness tips.'",
  linkedin_post: "Most fitness advice for women in their 40s is just recycled 20s-era advice.\n\nThe research tells a different story.\n\nAfter 40, the variables that predict fitness success shift — hormones, recovery time, stress load, and sleep quality become primary inputs, not afterthoughts.\n\nThe women thriving in midlife fitness aren't working harder. They're working with their biology instead of against it.\n\nWorth sharing with someone who needs to hear this."
};
```

### Data Type to Add (types.ts)

```ts
export interface RepurposeOutput {
  sourceText: string;
  pillarId: string;
  segmentId: string;
  generatedAt: string;
  reelHooks: string[];
  carouselSlides: { headline: string; role: string }[];
  instagramCaption: string;
  tiktokHook: string;
  youtubeShort: string;
  linkedinPost: string;
}
```

---

## Feature 2: Competitor Deep Dive (Upgrade Existing Tab)

### Purpose
Upgrade the current "Competitor Audit" tab from a read-only list to an interactive tool where users input a competitor's handle or post URL and get a structured teardown: positioning analysis, messaging hierarchy, hook strategy, content gaps, and actionable opportunities.

### Location
Upgrade `id: "competitors"` tab. Rename label to `"Competitor Deep Dive"`.

Modify inline within `StrategyResearch.tsx` (or extract to `CompetitorDeepDive.tsx`).

### UI Layout

**Input Panel (always visible at top)**

Row with:
- `<Input>` labeled "Competitor Handle or Post URL" — placeholder: "@competitorhandle or paste a post URL"
- `<Select>` "Platform" — options: Instagram, TikTok, YouTube, LinkedIn, Facebook
- `<Button>` "Run AI Teardown" (brand red, Eye icon)

Below that, keep the existing `<Button>` "AI Competitor Scan" which refreshes the existing competitor cards.

**Divider** with label "Teardown Results" (shown only after a teardown has been run)

**Teardown Output** — shown after AI runs, structured as:

```
[Card: Positioning Analysis]
  - Brand Voice: [badge] e.g. "Educational + Empowering"
  - Primary Message: [text]
  - Messaging Hierarchy: [ordered list 1-3]
  - Who they're targeting: [text]

[Card: Content Strategy]
  - Top Performing Format: [badge] e.g. "Short-form Reel"
  - Posting Frequency: [text]
  - Hook Style: [text]
  - CTA Pattern: [text]
  - Avg Engagement Signal: [badge: High/Very High/Medium]

[Card: Content Gaps & Opportunities]  ← most important card, brand-accented
  - 3 content angles they're NOT covering (bulleted)
  - 2 audience pain points they're missing (bulleted)
  - Recommended counter-strategy (1 paragraph)

[Card: AI Recommended Actions]
  - [Button] "Create Idea from Gap #1"
  - [Button] "Create Idea from Gap #2"
  - [Button] "Create Idea from Gap #3"
  Each button calls onNavigateToIdeation() + shows toast "Idea created from competitor gap"
```

**Keep existing competitor cards** below the teardown section (current `competitorInsights` grid).

### Mock Teardown Data

Add state: `competitorTeardown: CompetitorTeardown | null` initialized to `null`.

```ts
export interface CompetitorTeardown {
  handle: string;
  platform: Platform;
  analyzedAt: string;
  positioning: {
    brandVoice: string;
    primaryMessage: string;
    messagingHierarchy: string[];
    targetAudience: string;
  };
  contentStrategy: {
    topFormat: string;
    postingFrequency: string;
    hookStyle: string;
    ctaPattern: string;
    engagementSignal: "Very High" | "High" | "Medium" | "Low";
  };
  gaps: {
    uncoveredAngles: string[];
    missedPainPoints: string[];
    counterStrategy: string;
  };
}
```

Mock value for teardown result:

```ts
export const MOCK_COMPETITOR_TEARDOWN: CompetitorTeardown = {
  handle: "@drmaryClairehaver",
  platform: "tiktok",
  analyzedAt: new Date().toISOString(),
  positioning: {
    brandVoice: "Clinical + Empowering",
    primaryMessage: "Menopause doesn't have to derail your life — science can help.",
    messagingHierarchy: [
      "1. Bust menopause myths with medical authority",
      "2. Give actionable protocol-level advice",
      "3. Validate shared frustration with traditional healthcare"
    ],
    targetAudience: "Women 45-60 frustrated with traditional OB-GYN menopause guidance"
  },
  contentStrategy: {
    topFormat: "60-second talking head with bold on-screen text",
    postingFrequency: "5x per week",
    hookStyle: "Myth-busting opener ('Everyone thinks X, but actually...')",
    ctaPattern: "Save this + follow for more + link in bio for free guide",
    engagementSignal: "Very High"
  },
  gaps: {
    uncoveredAngles: [
      "Movement and yoga as menopause symptom management — almost no fitness content",
      "Community and emotional support angle — purely informational, no vulnerability",
      "Perimenopause for active women in their early 40s — skews toward 50s audience"
    ],
    missedPainPoints: [
      "Women who are already fitness-focused and don't know why their routine stopped working",
      "The intersection of career peak years + hormonal change — energy management at work"
    ],
    counterStrategy: "Position Hive Collective as the movement-first complement to medical menopause content. Where Dr. Haver owns 'understand your hormones,' own 'move with your hormones.' Lead with active women in their early 40s who are already fit but confused — this audience is underserved and highly engaged."
  }
};
```

---

## Feature 3: Content Series Builder (New Tab)

### Purpose
Adapted from the "email sequence writer" concept — input an audience segment, content pillar, campaign goal, and number of posts, and get a complete multi-post social series with individual post briefs, a narrative arc, and a suggested posting schedule.

### Location
New tab: `id: "series"`, label: `"Series Builder"`, icon: `ListOrdered`

Create new file: `src/app/components/content/ContentSeriesBuilder.tsx`

### UI Layout

**Input Form (top section)**
- `<Select>` "Audience Segment" (from segments prop)
- `<Select>` "Content Pillar" (from pillars prop)
- `<Select>` "Series Goal" — options:
  - Educate & Build Trust
  - Drive Profile Follows
  - Launch a New Topic or Offer
  - Re-engage Inactive Audience
  - Community & Engagement Push
- `<Select>` "Series Length" — options: 3 posts, 5 posts, 7 posts
- `<Select>` "Primary Platform" — options: Instagram, TikTok, YouTube, LinkedIn
- `<Button>` "Build Series with AI" (brand red, ListOrdered icon)

**Output — Series Overview Card**
After AI runs, show:
- Series title (bold, prominent)
- Narrative arc description (1-2 sentences)
- Platform badge + series length badge

**Output — Post Cards (numbered list)**
One card per post, each containing:
- Post number + suggested publish day (e.g. "Post 1 — Monday")
- Content type badge (e.g. "Reel", "Carousel")
- Hook (bold, prominent)
- Caption summary (2-3 sentences)
- CTA for this post specifically
- Series role badge: "Hook", "Value", "Proof", "Pivot", "Conversion" — color coded
- `<Button>` "Create in Ideation →" (outline style)

**Connecting arc visualization**
Between post cards, show a small vertical connector with an arrow and a one-line "bridge" note (e.g. "→ Builds credibility before the pivot").

### Data Type (add to types.ts)

```ts
export interface SeriesPost {
  postNumber: number;
  suggestedDay: string;
  contentType: ContentType;
  seriesRole: "Hook" | "Value" | "Proof" | "Pivot" | "Conversion";
  hook: string;
  captionSummary: string;
  cta: string;
  bridgeNote?: string; // Connection to next post
}

export interface ContentSeries {
  title: string;
  narrativeArc: string;
  platform: Platform;
  goal: string;
  pillarId: string;
  segmentId: string;
  posts: SeriesPost[];
  generatedAt: string;
}
```

### Mock Series Data

```ts
export const MOCK_CONTENT_SERIES: ContentSeries = {
  title: "The Perimenopause Fitness Reset",
  narrativeArc: "Moves from validating frustration → reframing the problem → delivering a concrete protocol → proving it works → inviting community action.",
  platform: "instagram",
  goal: "Educate & Build Trust",
  pillarId: "p3",
  segmentId: "s1",
  generatedAt: new Date().toISOString(),
  posts: [
    {
      postNumber: 1, suggestedDay: "Monday", contentType: "reel", seriesRole: "Hook",
      hook: "Your workouts didn't stop working. Your hormones changed the rules.",
      captionSummary: "Opens with the core frustration: active women in their 40s doing everything 'right' but seeing different results. Validates the experience without blaming the person.",
      cta: "Save this — series drops all week.",
      bridgeNote: "Establishes shared frustration → next post reframes the cause"
    },
    {
      postNumber: 2, suggestedDay: "Wednesday", contentType: "carousel", seriesRole: "Value",
      hook: "3 hormones that quietly reshape your fitness after 40 (and what to do about each)",
      captionSummary: "Educates on estrogen, cortisol, and progesterone shifts. Practical, not scary. Each slide = one hormone + one action.",
      cta: "Which one resonates most? Comment below.",
      bridgeNote: "Teaches the 'why' → next post delivers the 'what'"
    },
    {
      postNumber: 3, suggestedDay: "Friday", contentType: "reel", seriesRole: "Value",
      hook: "The 20-minute strength routine designed specifically for perimenopause",
      captionSummary: "Demonstrates the actual workout. Modifications shown. Focuses on compound movements and recovery emphasis.",
      cta: "Save this workout. Try it this weekend.",
      bridgeNote: "Delivers protocol → next post provides social proof"
    },
    {
      postNumber: 4, suggestedDay: "Sunday", contentType: "feed-post", seriesRole: "Proof",
      hook: "She's 47, runs a company, and just hit her strongest season of training yet.",
      captionSummary: "Member story or testimonial format. Real results, real woman from the Hive Collective community. Emphasizes the transformation of approach, not just body.",
      cta: "Share this with someone who needs to hear it.",
      bridgeNote: "Social proof → final post converts to community action"
    },
    {
      postNumber: 5, suggestedDay: "Tuesday", contentType: "story", seriesRole: "Conversion",
      hook: "Which part of this series hit hardest for you?",
      captionSummary: "Interactive story series recapping the series highlights. Poll sticker asking which topic to go deeper on next. Drives follows and engagement.",
      cta: "Vote + follow to see what we cover next.",
      bridgeNote: undefined
    }
  ]
};
```

---

## Feature 4: Hook & Caption A/B Analyzer (New Tab)

### Purpose
Paste two post variants (hooks, captions, or full copy) and get an AI analysis of which is stronger, why, and suggested improvements. Adapted from the A/B test analyzer concept but applied to copy before publishing.

### Location
New tab: `id: "ab-analyzer"`, label: `"A/B Analyzer"`, icon: `FlaskConical`

Create new file: `src/app/components/content/ABAnalyzer.tsx`

### UI Layout

**Two-column input (side by side on desktop, stacked on mobile)**

Left column — "Variant A":
- `<Textarea>` labeled "Variant A" — placeholder: "Paste your hook, caption, or full copy..."
- `min-h-[140px]`
- Badge: "A" (blue)

Right column — "Variant B":
- `<Textarea>` labeled "Variant B" — same placeholder
- `min-h-[140px]`
- Badge: "B" (purple)

Below both columns:
- `<Select>` "Content Goal" — Maximize Saves, Maximize Comments, Maximize Shares, Maximize Follows, Drive Link Clicks
- `<Select>` "Platform" (Instagram, TikTok, LinkedIn, YouTube)
- `<Button>` "Analyze with AI" (brand red, FlaskConical icon)

**Output Section**

Winner banner (full-width card, green tint):
- Large "Variant A Wins" or "Variant B Wins" with confidence score badge (e.g. "High Confidence")
- One-sentence verdict

Then 3 analysis cards side by side (or stacked):

**Card 1: Strengths & Weaknesses**
- Two sub-columns (A vs B)
- Each sub-column: 2 strengths (green check) + 1-2 weaknesses (amber warning)

**Card 2: Score Breakdown**
- Table with 4 rows: Hook Strength, Clarity, Emotional Resonance, CTA Effectiveness
- Each row: A score (1-10) vs B score (1-10) with colored bars

**Card 3: Improved Version**
- Shows a rewritten version combining the best of both
- Copy-to-clipboard button
- "Create Idea with this copy →" button

### Data Type (add to types.ts)

```ts
export interface ABAnalysisResult {
  winner: "A" | "B";
  confidence: "High" | "Medium" | "Low";
  verdict: string;
  variantA: {
    strengths: string[];
    weaknesses: string[];
    scores: { hook: number; clarity: number; emotion: number; cta: number };
  };
  variantB: {
    strengths: string[];
    weaknesses: string[];
    scores: { hook: number; clarity: number; emotion: number; cta: number };
  };
  improvedVersion: string;
  improvementRationale: string;
}
```

### Mock Data

```ts
export const MOCK_AB_RESULT: ABAnalysisResult = {
  winner: "A",
  confidence: "High",
  verdict: "Variant A leads with a stronger pattern-break hook and clearer outcome promise. Variant B is warmer but buries the value.",
  variantA: {
    strengths: [
      "Immediate pattern-break in the first 5 words",
      "Clear outcome stated before any context"
    ],
    weaknesses: ["CTA is generic — 'save this' without specificity"],
    scores: { hook: 9, clarity: 8, emotion: 7, cta: 6 }
  },
  variantB: {
    strengths: [
      "Warmer, more conversational tone",
      "Specific audience callout ('if you're in your 40s')"
    ],
    weaknesses: [
      "Hook takes too long to get to the point",
      "Outcome is buried in the third sentence"
    ],
    scores: { hook: 6, clarity: 7, emotion: 9, cta: 7 }
  },
  improvedVersion: "Nobody tells active women this about training in perimenopause — and it's the reason your results stalled.\n\nIf you're in your 40s and doing everything right but seeing different results, this is for you.\n\nSwipe to see the 3 things that actually changed — and exactly what to adjust. →\n\nSave this. You'll want it.",
  improvementRationale: "Combined A's strong opening pattern-break with B's specific audience callout. Moved the outcome up to sentence two. Made the CTA specific ('you'll want it') rather than generic."
};
```

---

## Feature 5: Social SEO & Hashtag Strategy (New Tab)

### Purpose
Input a niche, platform, and content pillar, and get a complete hashtag taxonomy, bio keyword recommendations, and caption SEO strategy. Adapted from the "Programmatic SEO builder" concept applied to social search.

### Location
New tab: `id: "seo"`, label: `"SEO & Hashtags"`, icon: `Hash`

Create new file: `src/app/components/content/SocialSEOStrategy.tsx`

### UI Layout

**Input Panel**
- `<Select>` "Content Pillar" (from pillars prop)
- `<Select>` "Platform" (Instagram, TikTok, YouTube, LinkedIn)
- `<Select>` "Content Goal" — Discoverability, Saves & Shares, Niche Authority, Trending Reach
- `<Button>` "Generate SEO Strategy" (brand red, Hash icon)

**Output — 4 Cards**

**Card 1: Hashtag Sets (tabbed)**
Three tabs: "Reach" / "Niche" / "Community"
Each tab shows 8-12 hashtags as clickable chips with estimated reach size badge:
- Reach hashtags: 500K-5M posts (blue badge)
- Niche hashtags: 50K-500K posts (green badge)
- Community hashtags: Under 50K posts (purple badge)
Copy-all button per tab.

**Card 2: Bio & Profile Keywords**
- "Recommended keywords for your bio" — list of 6-8 keyword phrases
- "Search intent your profile should satisfy" — 3 bullet points
- Example optimized bio snippet

**Card 3: Caption SEO Checklist**
A checklist (not interactive, just display) of 8 caption best practices with pass/fail context:
- Include primary keyword in first line ✓
- Use keyword naturally 2-3x ✓
- Alt text strategy for images ✓
- etc.

**Card 4: Trending Angles**
- 4 trending topic angles related to the selected pillar
- Each shows: angle title + hook example + estimated virality signal (badge)
- "Create Idea →" button on each

### Data Type (add to types.ts)

```ts
export interface SEOStrategy {
  platform: Platform;
  pillarId: string;
  goal: string;
  generatedAt: string;
  hashtagSets: {
    reach: { tag: string; estimatedPosts: string }[];
    niche: { tag: string; estimatedPosts: string }[];
    community: { tag: string; estimatedPosts: string }[];
  };
  bioKeywords: string[];
  searchIntents: string[];
  exampleBio: string;
  captionChecklist: { label: string; tip: string }[];
  trendingAngles: {
    angle: string;
    hookExample: string;
    viralitySignal: "Very High" | "High" | "Medium";
  }[];
}
```

### Mock Data

```ts
export const MOCK_SEO_STRATEGY: SEOStrategy = {
  platform: "instagram",
  pillarId: "p1",
  goal: "Discoverability",
  generatedAt: new Date().toISOString(),
  hashtagSets: {
    reach: [
      { tag: "#yoga", estimatedPosts: "120M" },
      { tag: "#fitness", estimatedPosts: "500M" },
      { tag: "#wellness", estimatedPosts: "80M" },
      { tag: "#womenshealth", estimatedPosts: "15M" },
      { tag: "#healthylifestyle", estimatedPosts: "95M" }
    ],
    niche: [
      { tag: "#yogaover40", estimatedPosts: "820K" },
      { tag: "#womenover40fitness", estimatedPosts: "1.2M" },
      { tag: "#perimenopausehealth", estimatedPosts: "450K" },
      { tag: "#midlifewellness", estimatedPosts: "380K" },
      { tag: "#yogaforwomen", estimatedPosts: "2.1M" },
      { tag: "#over40andfit", estimatedPosts: "670K" }
    ],
    community: [
      { tag: "#hivecollective", estimatedPosts: "Under 10K" },
      { tag: "#women40plus", estimatedPosts: "48K" },
      { tag: "#yogamidlife", estimatedPosts: "22K" },
      { tag: "#perimenopauseyoga", estimatedPosts: "15K" },
      { tag: "#thriving40s", estimatedPosts: "31K" }
    ]
  },
  bioKeywords: [
    "yoga for women 40+",
    "perimenopause fitness",
    "midlife wellness",
    "women's strength training",
    "hormone health yoga",
    "menopause movement"
  ],
  searchIntents: [
    "Women searching for yoga routines safe for perimenopause",
    "Active women 40+ looking for community and expert guidance",
    "Women frustrated with generic fitness advice who want age-specific protocols"
  ],
  exampleBio: "🧘‍♀️ Yoga & movement for women 40+ | Perimenopause-friendly fitness | Hive Collective community | Weekly flows + wellness tips ↓",
  captionChecklist: [
    { label: "Open with primary keyword", tip: "Include 'yoga for women 40+' or 'perimenopause fitness' in your first sentence" },
    { label: "Use keyword naturally 2-3 times", tip: "Don't force it — work keywords into conversational sentences" },
    { label: "Include a search-friendly first line", tip: "Instagram indexes the first 125 chars — make it keyword-rich" },
    { label: "Add location context if relevant", tip: "Local search boosts discovery for community-based content" },
    { label: "End with save/share CTA", tip: "Saves signal high value to the algorithm — explicitly request them" },
    { label: "Use 3-tier hashtag stack", tip: "Mix reach + niche + community tags every post" },
    { label: "Alt text on images", tip: "Describe the image with natural keyword inclusion" },
    { label: "Reply to comments quickly", tip: "First-hour engagement velocity strongly influences reach" }
  ],
  trendingAngles: [
    {
      angle: "Myth-busting perimenopause fitness advice",
      hookExample: "Everything you've been told about cardio in perimenopause is wrong.",
      viralitySignal: "Very High"
    },
    {
      angle: "Morning routines for hormone support",
      hookExample: "5-minute yoga sequence that supports estrogen balance (yes, really)",
      viralitySignal: "High"
    },
    {
      angle: "Before/after strength training mindset shift",
      hookExample: "I stopped running and started lifting at 43. Here's what actually changed.",
      viralitySignal: "Very High"
    },
    {
      angle: "Science-backed wellness explainer",
      hookExample: "What happens to your muscles during perimenopause (and the one fix that works)",
      viralitySignal: "High"
    }
  ]
};
```

---

## Feature 6: Content Investment Allocator (Upgrade Existing Tab)

### Purpose
Upgrade the "Strategic Pillars" tab to add a content distribution analyzer below the pillars grid. User inputs how many posts they publish per week, and AI recommends how to distribute them across pillars and platforms for maximum impact.

### Location
Modify `StrategicPillars.tsx` to add a new section below the pillars grid.

### UI Addition

Add below the pillars grid in `StrategicPillars.tsx`:

**Section Header**: "Content Investment Optimizer" with a divider

**Input Row:**
- `<Input type="number">` labeled "Posts per week" (min 1, max 50)
- `<Select>` "Primary Platform" (Instagram, TikTok, YouTube, LinkedIn, All Platforms)
- `<Button>` "Optimize Distribution" (brand red, BarChart3 icon)

**Output — Pillar Distribution Chart (displayed as horizontal bar chart using CSS/divs, not a library)**

Each pillar gets a row:
- Pillar color dot + name
- Horizontal bar (width = % of total posts)
- "X posts/week" label
- Rationale badge (e.g. "Highest Engagement Pillar", "Audience Growth Driver", "Trust Builder")

**Output — Platform Split Card**
Below the pillar bars, a platform split recommendation:
- Instagram: X posts/week
- TikTok: Y posts/week
- YouTube: Z posts/week (if applicable)
Each with a one-line rationale.

**Output — Quick Wins Card**
3 bullet points of immediate optimization suggestions based on the current pillars (hardcoded smart mock).

### Mock Allocator Output

```ts
export interface PillarAllocation {
  pillarId: string;
  postsPerWeek: number;
  percentage: number;
  rationale: string;
}

export interface PlatformAllocation {
  platform: Platform;
  postsPerWeek: number;
  rationale: string;
}

export interface InvestmentPlan {
  totalPostsPerWeek: number;
  pillarAllocations: PillarAllocation[];
  platformAllocations: PlatformAllocation[];
  quickWins: string[];
  generatedAt: string;
}

export const MOCK_INVESTMENT_PLAN: InvestmentPlan = {
  totalPostsPerWeek: 10,
  pillarAllocations: [
    { pillarId: "p1", postsPerWeek: 3, percentage: 30, rationale: "Top engagement driver for your segments" },
    { pillarId: "p3", postsPerWeek: 3, percentage: 30, rationale: "Highest save rate content type" },
    { pillarId: "p4", postsPerWeek: 2, percentage: 20, rationale: "Strongest share signal" },
    { pillarId: "p2", postsPerWeek: 1, percentage: 10, rationale: "Trust & credibility builder" },
    { pillarId: "p5", postsPerWeek: 1, percentage: 10, rationale: "Community & belonging driver" }
  ],
  platformAllocations: [
    { platform: "instagram", postsPerWeek: 6, rationale: "Primary platform for 88% of Active 40s segment" },
    { platform: "youtube", postsPerWeek: 3, rationale: "Long-form yoga content drives highest retention" },
    { platform: "tiktok", postsPerWeek: 1, rationale: "Discovery channel — test trending formats" }
  ],
  quickWins: [
    "You're underinvested in Yoga & Movement relative to your audience's #1 stated interest — shift 1 post/week from Nutrition",
    "Your Thriving 50s segment indexes heavily on YouTube — adding one long-form/week could unlock that audience",
    "Competitor analysis shows a gap in perimenopause fitness for active women — Fitness & Strength content here is underserved"
  ],
  generatedAt: new Date().toISOString()
};
```

---

## Implementation Notes for Claude Code

### File changes summary:
1. `src/app/components/content/StrategyResearch.tsx` — Add new tab IDs, import new components, add loading state per feature
2. `src/app/components/content/types.ts` — Add new interfaces listed in each feature section
3. `src/app/components/content/ContentRepurposer.tsx` — Create new
4. `src/app/components/content/ContentSeriesBuilder.tsx` — Create new
5. `src/app/components/content/ABAnalyzer.tsx` — Create new
6. `src/app/components/content/SocialSEOStrategy.tsx` — Create new
7. `src/app/components/content/StrategicPillars.tsx` — Add Investment Allocator section
8. `src/app/components/content/mock-repurpose-data.ts` — Create new (mock data)

### Patterns to follow from existing code:
- Use `handleAIAnalyze(type)` pattern with `isAnalyzing` state — 2500ms timeout, then show results
- Use shadcn/ui components throughout: Card, CardContent, CardHeader, CardTitle, Badge, Button, Select, Input, Textarea
- Brand red: `#d94e33` / `hover:bg-[#c4452d]`
- Use `toast.success()` for confirmations (sonner is already installed)
- Empty states: centered icon (gray), descriptive text, subtext
- Loading states: `<Loader2 className="animate-spin">` centered in card

### Prop threading:
All new components should receive `pillars: ContentPillar[]` and `segments: AudienceSegment[]` as props, threaded down from `StrategyResearch.tsx`. Also pass `onNavigateToIdeation: () => void` for "Create Idea" CTA buttons.

### Do NOT:
- Install new npm packages (no charting library — use CSS-only bars for the allocator)
- Make real API calls — all AI responses are simulated mock data with the existing timeout pattern
- Change the top navigation or routing — everything lives within the Strategy & Research tab
