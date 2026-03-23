# Blink Social

**Status:** Active development
**Stack:** React + TypeScript + Vite + shadcn/ui + Tailwind CSS
**Project path (local):** /Documents/Blink
**Brand color:** #d94e33

## What It Is
A social media content management app positioned as a full agency replacement. The core differentiator: everything is rooted in business objectives, not just execution. Objectives → Pillars → Goals → Content.

## Vision / Thesis
Replace companies' reliance on outside agencies for content strategy AND execution. Differentiated from tools like Sprout, Hootsuite, Buffer by being rooted in business objectives, not just scheduling and reporting.

## Architecture

### Workflow Steps
`overview → strategy → ideation → production → review → performance`

### Production Steps
`brief → builder → packaging → qa` (4 steps — confirmed, no "draft/blueprint/assets/activity")

### Key Components
| Component | Location | Notes |
|-----------|----------|-------|
| StrategyResearch.tsx | content/ | FRAGILE — read fully before editing, only ADD |
| StrategicPillars.tsx | content/ | Has objectiveIds, BusinessObjective type |
| PerformanceTracking.tsx | content/ | 4 views: dashboard, content, recommendations, audit |
| StepWorkspaceBasics.tsx | steps/ | Strategic Foundation wizard step |
| StepObjectives.tsx | steps/ | Business Objectives wizard step |
| BriefBuilder.tsx | content/ | Brief form — needs objective context surface |
| ContentProduction.tsx | content/ | Production workflow |

### Core Data Model: ContentItem
Key fields: conceptId, hookBank, captionVariants, hashtagSets, hashtags, scheduledDate, pillarIds, segmentIds, contentCategory, journeyStage

### Key Types (types.ts)
- BusinessObjective, ObjectiveCategory, BrandPositioning
- PillarGoal, SegmentJourneyStage, ContentMixTarget, ContentCategory
- ContentPillar (extended with goals?, objectiveIds?)
- CompetitorInsight: relevancyLevel (not threatLevel), intel? (not teardown?)
- InvestmentPlan with selectedSegmentIds?

## Setup Wizard Step Order (CORRECT ORDER)
1. Strategic Foundation — workspace name, purpose, mission
2. Business Objectives — StepObjectives.tsx
3. Brand & Voice — StepBrandPositioning.tsx (positioning + voice/tone)
4. Audience — StepAudience.tsx (names only, full personas in Strategy section)
5. Platforms — StepPlatforms (existing)
6. Content Strategy — StepContent (pillars with linked objectives)
7. Review — StepReview (existing)

## Features Completed (Claude Code)

### Group 1 — AI Strategy Features
1. ✅ Competitor Deep Dive (Competitor Intel, collapsible, relevancy, AI find competitors)
2. ✅ Content Repurposer (platform-specific, card titles)
3. ✅ Series Builder
4. ✅ A/B Analyzer
5. ✅ SEO & Hashtags
6. ✅ Content Distribution Analysis (formerly Investment Allocator)

### Group 2 — Content Strategy Foundations (spec written, batched prompts)
- Batch 1: Brand Voice & Tone + Channel Strategy
- Batch 2: Content Goals & KPIs + Journey Mapping + Content Mix
- Batch 3: Content Audit + Distribution & Amplification

### Business Objectives (3 prompts)
- Prompt 1: StepObjectives.tsx + StrategyResearch objectives strip + StrategicPillars linked objectives
- Prompt 2: Setup Wizard Overhaul (corrected step order, StepBrandPositioning, StepAudience)
- Prompt 3: Objective Progress Tracking (Performance 5th view "objectives" + BriefBuilder context)

## Spec Files (on local machine)
- `src/imports/strategy-ai-features-spec.md` — Group 1 full spec
- `src/imports/content-strategy-foundations-spec.md` — Group 2 full spec
- `src/imports/business-objectives-spec.md` — Business Objectives full spec

## Known Issues / Rules
- **StrategyResearch.tsx is fragile** — too large, modified by every batch. ALWAYS read full file, ONLY ADD, never rewrite. Long-term fix: extract each tab to its own component.
- **ARC-001 constraint is REMOVED** — content no longer requires a research source gate
- **Single Competitor Teardown removed** — only Competitor Intel (collapsible per card) remains
- **"Teardown" → "Competitor Intel"** everywhere in code and UI
- **"Threat Level" → "Relevancy"** everywhere in code and UI

## Pending Work
- [ ] Group 2 Batch 1 prompt → Code
- [ ] Group 2 Batch 2 prompt → Code
- [ ] Group 2 Batch 3 prompt → Code
- [ ] Business Objectives Prompt 1 → Code (verify StepObjectives.tsx exists)
- [ ] Business Objectives Prompt 2 → Code (wizard overhaul, corrected step order)
- [ ] Business Objectives Prompt 3 → Code (Performance objectives view + BriefBuilder)
- [ ] Extract CompetitorDeepDive into its own component file (prevent future overwrites)
- [ ] Fix wizard step indicator label overlap (CSS fix — labels cramping at 7 steps)
