# Blink Development Patterns & Decisions

## UI Patterns

### Field Styling (always use this)
```
bg-[#f3f4f6] border-none shadow-none focus-visible:ring-1 focus-visible:ring-gray-200 focus-visible:bg-[#edeff2] transition-colors
```

### Mock AI Pattern
```ts
setTimeout(() => {
  // set mock result state
  toast.success("Message here")
}, 2500)
```

### Motion/React Animations (entry)
```tsx
<motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
```

### Toast Patterns
- Success: `toast.success("...")`
- Always fire after mock AI delay

## Architectural Decisions

### Strategic Hierarchy
Business Objectives → Content Pillars → Content Goals → Content Items
Everything traces back to objectives.

### Wizard Step Logic
Simple steps first (name/mission) → strategic (objectives) → voice/brand → audience → platforms → content pillars → review
Brand voice and audience decisions flow FROM objectives, not before them.

### Audience Segments in Wizard
Wizard: names only (simple)
Full personas, pain points, journey stages: built in the Strategy section

### Competitor Intel
- Collapsible per card (not a separate modal/page)
- Auto-runs on load or on demand per card
- No "Run Teardown" button — replaced by collapsible toggle
- No single global teardown

### Content Distribution Analysis
- Renamed from "Investment Allocator" — "investment" implied ad spend
- No primary platform dropdown (was redundant)
- Uses audience segment pills for focus
- Shows pillar distribution bars + platform split + quick wins

## Naming Conventions
| Old Name | New Name | Why |
|----------|----------|-----|
| Teardown | Competitor Intel | "Teardown" not standard marketing term |
| Threat Level | Relevancy | More accurate, less alarming |
| Investment Allocator | Content Distribution Analysis | "Investment" implies budget/ad spend |

## Batching Strategy for Claude Code
- Group features into logical batches (2-3 per prompt) to reduce token spend
- Always include spec file path in prompt: read /path/to/spec.md first
- Always include the guard: "Read FULL file before editing. Only ADD. Do NOT remove existing code."
- One component per feature when possible (prevents overwrites)

## Component Safety Rules
- StrategyResearch.tsx: READ FULL FILE, ADD ONLY — it's large and overwrites are destructive
- Any component with tabs: never rewrite tab rendering logic, only add new tab cases
- Extract large tab content into own component files for safety
