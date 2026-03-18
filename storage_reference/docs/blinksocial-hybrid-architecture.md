# BlinkSocial — Hybrid Skill Architecture

## Design Philosophy

Two routing paths, one skill format. The UI handles deterministic routing (user clicks a button → skill fires directly). A lightweight planner handles ambiguous or multi-step requests from a conversational interface. Skills are the only unit that talks to the LLM — the planner just picks which skill to run and with what context.

---

## Directory Structure on AgenticFilesystem

```
/blinksocial/
├── skills/
│   ├── post-drafting/
│   │   ├── skill.md                  # Instructions + routing metadata
│   │   ├── templates/
│   │   │   ├── post.schema.json      # Output schema (validated by UI)
│   │   │   ├── platform-rules.md     # Platform-specific constraints
│   │   │   └── examples.md           # Few-shot examples for tone/format
│   │   └── README.md                 # Human-readable docs for devs
│   │
│   ├── content-calendar/
│   │   ├── skill.md
│   │   └── templates/
│   │       ├── calendar-entry.schema.json
│   │       └── planning-prompt.md
│   │
│   ├── channel-management/
│   │   ├── skill.md
│   │   └── templates/
│   │       ├── channel-config.schema.json
│   │       └── channel-audit.md
│   │
│   ├── analytics-summary/
│   │   ├── skill.md
│   │   └── templates/
│   │       ├── summary-report.schema.json
│   │       └── metrics-context.md
│   │
│   ├── image-prompt/
│   │   ├── skill.md
│   │   └── templates/
│   │       ├── image-request.schema.json
│   │       └── style-guide.md
│   │
│   └── planner/
│       ├── skill.md                  # The "router" — itself just a skill
│       └── templates/
│           ├── plan.schema.json      # Output: ordered list of skill calls
│           └── skill-registry.md     # Auto-generated index of all skills
│
├── context/                          # Shared org context (RAG-indexed)
│   ├── brand-voice.md
│   ├── audience-personas.md
│   └── platform-accounts.json
│
└── data/                             # Runtime data (posts, calendars, etc.)
    ├── posts/
    ├── channels/
    └── calendars/
```

---

## Skill Format — `skill.md`

Every skill follows the same structure. This is the contract between the UI, the planner, and the LLM.

### Example: `post-drafting/skill.md`

```markdown
---
id: post-drafting
name: Draft Social Post
description: >
  Creates a platform-ready social media post given a topic, channel,
  and optional tone/style guidance. Returns structured JSON matching
  the post schema.
triggers:
  - "write a post"
  - "draft content for"
  - "create a post about"
input_context:
  required:
    - channel_id        # Which channel/platform
    - topic             # What to write about
  optional:
    - tone              # e.g. "casual", "professional", "provocative"
    - reference_urls    # URLs to pull context from
    - thread_length     # For Twitter/X threads
    - cta               # Desired call-to-action
output_schema: ./templates/post.schema.json
templates:
  - ./templates/platform-rules.md
  - ./templates/examples.md
---

## System Prompt

You are a social media content specialist for {{brand_name}}.

Your job is to draft a single post for the specified platform and channel.
Follow the platform constraints in the attached rules document.
Match the brand voice described in the org context.

## Instructions

1. Read the platform-rules.md for the target platform's constraints
   (character limits, hashtag conventions, media requirements).
2. If reference_urls are provided, incorporate key points naturally.
3. Return ONLY valid JSON matching the output schema. No commentary.
4. If thread_length > 1, return an array of post objects.

## Output Contract

Return JSON conforming to `post.schema.json`. The UI will validate
before storing to the AgenticFilesystem. If validation fails, the
UI will re-invoke with the error message appended to context.
```

---

## Output Schema — `post.schema.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SocialPost",
  "type": "object",
  "required": ["platform", "body", "status"],
  "properties": {
    "platform": {
      "type": "string",
      "enum": ["linkedin", "twitter", "instagram", "facebook", "tiktok"]
    },
    "body": {
      "type": "string",
      "maxLength": 3000
    },
    "headline": {
      "type": "string",
      "description": "For LinkedIn articles or Facebook posts with titles"
    },
    "hashtags": {
      "type": "array",
      "items": { "type": "string" },
      "maxItems": 30
    },
    "media": {
      "type": "object",
      "properties": {
        "type": { "enum": ["image", "video", "carousel", "none"] },
        "prompt": { "type": "string", "description": "Image generation prompt if needed" },
        "alt_text": { "type": "string" }
      }
    },
    "cta": {
      "type": "object",
      "properties": {
        "text": { "type": "string" },
        "url": { "type": "string", "format": "uri" }
      }
    },
    "metadata": {
      "type": "object",
      "properties": {
        "estimated_read_time_seconds": { "type": "integer" },
        "content_category": { "type": "string" },
        "target_persona": { "type": "string" }
      }
    },
    "status": {
      "type": "string",
      "enum": ["draft", "ready_for_review", "approved", "scheduled", "published"],
      "default": "draft"
    }
  }
}
```

---

## The Planner — A Skill, Not an Agent Layer

The planner is just another skill with a specific job: decompose ambiguous requests into an ordered list of skill invocations. It lives at `skills/planner/skill.md`.

### `planner/skill.md`

```markdown
---
id: planner
name: Task Planner
description: >
  Decomposes ambiguous or multi-step user requests into an ordered
  sequence of skill invocations. Only invoked when the UI cannot
  deterministically route to a single skill.
input_context:
  required:
    - user_message       # Raw natural language request
    - available_skills   # Auto-injected from skill-registry.md
  optional:
    - conversation_history
    - active_channel_ids
output_schema: ./templates/plan.schema.json
templates:
  - ./templates/skill-registry.md
---

## System Prompt

You are a task planner for BlinkSocial. Given a user's request and
the list of available skills, produce a plan — an ordered list of
skill invocations that will fulfill the request.

## Rules

1. Each step must reference a valid skill `id` from the registry.
2. Steps execute sequentially. A step can reference output from
   prior steps using `{{step_N.output}}` syntax.
3. If the request maps to a SINGLE skill, return a plan with one step.
4. If the request is unclear, return a plan with `needs_clarification: true`
   and include the clarifying question in `clarification_prompt`.
5. Never invent skills that don't exist in the registry.
6. Return ONLY valid JSON matching plan.schema.json.
```

### `planner/templates/plan.schema.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "TaskPlan",
  "type": "object",
  "required": ["steps"],
  "properties": {
    "needs_clarification": {
      "type": "boolean",
      "default": false
    },
    "clarification_prompt": {
      "type": "string",
      "description": "Question to ask user if intent is ambiguous"
    },
    "steps": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["step", "skill_id", "input"],
        "properties": {
          "step": { "type": "integer" },
          "skill_id": { "type": "string" },
          "description": { "type": "string" },
          "input": {
            "type": "object",
            "description": "Key-value pairs matching the skill's input_context"
          },
          "depends_on": {
            "type": "array",
            "items": { "type": "integer" },
            "description": "Step numbers this depends on"
          }
        }
      }
    }
  }
}
```

### `planner/templates/skill-registry.md` (auto-generated)

```markdown
# Available Skills

| id | name | description | required inputs |
|----|------|-------------|-----------------|
| post-drafting | Draft Social Post | Creates platform-ready posts | channel_id, topic |
| content-calendar | Content Calendar | Plans and schedules content | channel_ids, date_range |
| channel-management | Channel Manager | Configure and audit channels | channel_id |
| analytics-summary | Analytics Summary | Summarize engagement metrics | channel_id, date_range |
| image-prompt | Image Prompt Gen | Generate image prompts for posts | post_body, platform |
```

This file is rebuilt automatically whenever a skill is added or updated. The planner always gets the current registry injected as context.

---

## Routing: How It All Connects

### Path 1 — Deterministic (90%+ of interactions)

```
┌──────────────┐     skill_id + input      ┌─────────────┐
│   WebUI      │ ───────────────────────── │  Skill      │
│              │                            │  Runner     │
│  User clicks │     structured JSON        │             │
│  "Draft Post"│ ◄──────────────────────── │  Validates  │
│  on LinkedIn │                            │  against    │
│  channel pg  │                            │  schema     │
└──────────────┘                            └─────────────┘
```

The UI knows:
- **Which skill** → user action maps directly (button, menu, screen context)
- **What input** → channel_id from current page, topic from form field
- **What to expect back** → schema is known, UI can pre-render the form

No LLM call wasted on routing. The skill runner loads `skill.md`, assembles the prompt from the system prompt + templates + input context, calls the LLM, validates the JSON output against the schema, and returns it to the UI.

### Path 2 — Conversational (chat interface, ambiguous requests)

```
┌──────────────┐   user_message    ┌─────────────┐   plan.json    ┌─────────────┐
│   Chat UI    │ ────────────────  │  Planner    │ ──────────────  │  Skill      │
│              │                   │  (skill)    │                 │  Runner     │
│  "Plan next  │   plan or         │             │   Execute each  │  (sequential│
│   week's     │   clarification   │  Returns    │   step, pass    │   or fan-   │
│   content"   │ ◄──────────────── │  steps[]    │   outputs fwd   │   out)      │
└──────────────┘                   └─────────────┘                 └─────────────┘
```

The planner only fires when:
1. User is in a chat/conversational interface (not a structured screen)
2. The UI can't map the request to a single skill deterministically
3. The request implies multiple steps ("plan next week AND draft posts")

---

## Skill Runner — The Execution Engine

The skill runner is a **code component**, not an LLM. It:

```
function runSkill(skillId, input, orgContext) {
  1. Load skill.md from AgenticFilesystem
  2. Parse frontmatter for schema path + template paths
  3. Load output schema + template files
  4. Assemble prompt:
     - System: skill.md system prompt
     - Context: org context (brand-voice.md, etc.) via RAG
     - Templates: platform-rules.md, examples.md, etc.
     - Input: serialized input_context
  5. Call LLM → get response
  6. Validate response against output schema
  7. If invalid: retry with error context (max 2 retries)
  8. Store result in AgenticFilesystem /data/
  9. Return structured JSON to UI
}
```

Key design decisions:
- **Schema validation is mandatory** — the UI and data layer depend on it
- **Retry with error feedback** — if the LLM returns invalid JSON, include
  the validation error in a follow-up call so it can self-correct
- **Org context via RAG** — brand voice, personas, etc. are pulled from
  `/context/` using the AgenticFilesystem's vector search, not hardcoded
- **Templates are loaded fresh** — skills can be updated without redeployment

---

## Adding a New Skill — The Workflow

1. Create the directory under `/blinksocial/skills/`
2. Write `skill.md` following the standard frontmatter format
3. Create the output `schema.json` and any `.md` templates
4. The skill-registry auto-rebuilds (the planner sees it immediately)
5. Wire a UI trigger if deterministic routing is needed
6. Done — no code changes, no redeployment

### Skill Checklist

```
[ ] skill.md has valid frontmatter (id, name, description, triggers)
[ ] input_context lists all required/optional fields
[ ] output_schema points to a valid JSON Schema file
[ ] Templates referenced in skill.md exist in ./templates/
[ ] Output schema tested with 3+ example outputs
[ ] Deterministic UI route wired (if applicable)
[ ] Skill appears in auto-generated registry
```

---

## Why This Works for BlinkSocial

| Concern | How It's Addressed |
|---|---|
| **Simplicity** | Skills are just markdown + JSON files. No framework, no classes, no inheritance. |
| **Extensibility** | Add a folder, write a skill.md, define a schema. The planner discovers it automatically. |
| **Testability** | Each skill is independently testable — give it input, check output against schema. |
| **No god-prompt** | The planner is thin. It routes; it doesn't accumulate domain logic. Domain knowledge lives in individual skills. |
| **UI stays in control** | Deterministic path means the UI is never waiting on an LLM just to figure out what to do. |
| **Schema as contract** | The UI, skill runner, and data layer all agree on the shape of data. Schema changes are versioned and explicit. |
| **Org context is shared** | Brand voice, personas, platform accounts live in `/context/` and are injected via RAG — not duplicated across skills. |
| **AgenticFilesystem native** | Skills, templates, schemas, context, and data all live on the same filesystem with vector indexing. |

---

## What To Build First

1. **Skill runner** — the execution engine that loads a skill and runs it
2. **post-drafting skill** — highest-value, most concrete use case
3. **Schema validation layer** — catches bad LLM output before it hits the UI
4. **Deterministic routing in UI** — wire "Draft Post" button to skill runner
5. **Planner skill** — add later, only when you build the chat interface
6. **Skill registry auto-generation** — a script that walks `/skills/` and builds the index
