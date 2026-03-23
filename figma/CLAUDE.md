when creating prompts for Claude Code always include this statement: I want to make some changes to the prototype in the figma folder

# Memory
 
## Me
Brett, building Blink Social — a React content management app that replaces agency reliance by rooting all content in business objectives and strategy.
 
## Active Projects
| Name | What | Status |
|------|------|--------|
| **Blink Social** | React/TS/Vite social media CMS app | Active dev |
 
→ Full details: memory/blink-social.md
→ Dev patterns & decisions: memory/blink-patterns.md
 
## Workflow
- **Cowork tab** = planning, UX review, specs, Claude Code prompts
- **Code tab** = implementation only
- Never ask Code to do two features at once — one feature per prompt
- Always read full files before editing; only ADD, never rewrite existing code
 
## Terms
| Term | Meaning |
|------|---------|
| **Blink** | Blink Social app |
| **WorkflowStep** | overview → strategy → ideation → production → review → performance |
| **ProductionStep** | brief → builder → packaging → qa |
| **Group 1** | AI Strategy Features (6 features) |
| **Group 2** | Content Strategy Foundations (7 features) |
| **Business Objectives** | Top-level differentiator feature — objectives drive everything |
| **mock AI pattern** | setTimeout 2500ms + toast.success() |
| **fieldStyles** | "bg-[#f3f4f6] border-none shadow-none focus-visible:ring-1 focus-visible:ring-gray-200 focus-visible:bg-[#edeff2] transition-colors" |
| **brand color** | #d94e33 |
| **Competitor Intel** | Collapsible AI-generated competitor analysis (formerly "teardown") |
| **Relevancy** | Competitor relevancy indicator (formerly "threat level") |
 
## Preferences
- Honest, concise answers — no flattery
- Batch Claude Code prompts when possible to save context/cost
- Cowork for planning/specs, Code for implementation
- One feature at a time in Code tab
 
→ Full glossary: memory/glossary.md