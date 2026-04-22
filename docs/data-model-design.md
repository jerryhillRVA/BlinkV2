# BlinkSocial Data Model Design

## 1. Overview

BlinkSocial is a social media content management platform. Each workspace maps to a **tenant** on the **AgenticFilesystem** (`../AgenticFilesystem`, API at `http://localhost:8000/docs`).

All data — settings, strategy, content items, calendars, binary assets, and skill definitions — lives on the AgenticFilesystem.

### Related Artifacts

| Artifact | Path | Description |
|----------|------|-------------|
| JSON Schemas | `schemas/` | Formal schema definitions for all data types |
| Sample Data | `data/` | Complete sample dataset (Hive Collective workspace) |
| Global Skills | `skills/` | Skill definitions deployed to `blinksocial_system` tenant |
| Hybrid Architecture | `docs/blinksocial-hybrid-architecture.md` | Skill routing and execution design |
| UI Prototype | `Blink Social v2_03-05-2026/` | Source of truth for UI structure and field mappings |

---

## 2. Storage Layer: The AgenticFilesystem

The AgenticFilesystem provides:

- **Multi-tenant isolation**: Every API call is scoped to a `tenant_id`. Workspace = tenant.
- **Namespace + path organization**: Files organized into namespaces (logical collections) with directory paths within them.
- **RAG-indexed search**: Every uploaded file is automatically chunked, embedded, and indexed for semantic search, BM25 keyword search, and hybrid RRF search.
- **Binary file support**: Images, videos, audio stored as files with text extraction (Tika/OCR) and pairing to metadata docs.
- **Metadata & tags**: Each file carries `custom_metadata` (arbitrary key-value) and `tags` (string array).
- **Batch retrieval**: Multi-file fetch in a single API call.

**Limitation**: No native deterministic filtering by structured fields (e.g., "all items where status=draft AND platform=instagram"). Qdrant payload indexes exist only for `tenant_id`, `file_id`, and `path`. We solve this with **index documents** (see Section 7).

---

## 3. Architecture

### Two Tenants

```
AgenticFilesystem
├── blinksocial_system    ← Global (skills + workspace registry)
└── {workspace-id}        ← Per-workspace runtime data
```

- **`blinksocial_system`** — Part of the BlinkSocial codebase. Deployed at app startup. Contains global skill definitions and the workspace registry.
- **`{workspace-id}`** (e.g., `hive-collective`) — Each workspace gets its own tenant with all runtime data.

There is **no separate context layer**. Context for skill prompts is assembled dynamically by the skill runner, which queries the AgenticFilesystem's search APIs against the tenant's own data. What to fetch is configured deterministically in each skill's `skill.md` frontmatter (see Section 6).

### Namespace Layout

```
blinksocial_system
├── namespace: registry
│   └── workspaces.json               # Tracks all workspace tenants
│
└── namespace: skills
    ├── path: post-drafting/skill.md   # Global skill definitions
    ├── path: research-scanning/       # (skill.md + templates/)
    ├── path: content-calendar/
    ├── path: hook-generation/
    ├── path: analytics-summary/
    ├── path: image-prompt/
    └── path: planner/                 # Router skill

{workspace-tenant-id}
├── namespace: settings                # 8 settings files (1 per UI tab)
├── namespace: audience-segments       # One doc per segment
├── namespace: content-pillars         # One doc per pillar
├── namespace: research-sources        # One doc PER PILLAR (all sources)
├── namespace: competitor-insights     # One doc per competitor insight
├── namespace: audience-insights       # One doc per segment (keyed by segment ID)
├── namespace: content-items           # Ideas, concepts, posts + _index.json
├── namespace: calendars               # Monthly calendar documents
├── namespace: assets                  # Binary files per content item
└── namespace: skill-runs              # Execution history
```

Schema files: `schemas/*.schema.json`
Sample data: `data/hive-collective/` and `data/blinksocial_system/`

---

## 4. Content Pipeline Lineage

Ideas, concepts, and posts form a directed lineage:

```
Idea ──→ 0..N Concepts ──→ 1..N Posts
                                 │
                                 └── One post per (platform + contentType) combination
```

- **Idea**: Raw content spark. No platform/contentType assigned.
- **Concept**: Enriched idea with angle, hook, objective. Defines `targetPlatforms[]` — the platform+contentType combinations it will produce posts for.
- **Post**: Single platform + contentType. Links back to concept via `parentConceptId`. Contains full production data (brief, draft, blueprint, assets, packaging, QA).

All stages live in the same `content-items` namespace, discriminated by the `stage` field. No document moves on promotion.

**Key schema fields:**
- `parentIdeaId` (on concepts) → FK to originating idea
- `parentConceptId` (on posts) → FK to originating concept
- `targetPlatforms[]` (on concepts) → array of `{platform, contentType, postId}`

See: `schemas/content-item.schema.json`, samples at `data/hive-collective/content-items/`

---

## 5. Skills Replace Agents

What the UI calls "Agent Personalities" are actually **skill configurations** — workspace-specific overrides that extend global skill definitions.

### Three-Layer Model

1. **Global skill definition** (`blinksocial_system/skills/{skillId}/skill.md`) — System prompt, context requirements, output schema, templates
2. **Workspace skill config** (`{tenant}/settings/skills.json`) — Persona override, tone, context preferences, triggers
3. **Skill run instance** (`{tenant}/skill-runs/{runId}.json`) — Execution log with input, output, token usage, duration

### Data Flow

1. UI triggers skill (deterministic button) or planner routes (conversational chat)
2. Skill runner loads `skill.md` from `blinksocial_system` tenant
3. Reads `context_requirements` from frontmatter (deterministic — no extra agent)
4. Fetches workspace overrides from tenant `settings/skills.json`
5. Assembles context by querying tenant data namespaces (see Section 6)
6. Calls LLM → validates output against schema
7. Stores result in target namespace + updates `_index.json`
8. Logs execution in `skill-runs/`

See: `schemas/workspace/settings/skills.schema.json`, `schemas/workspace/skill-run.schema.json`

---

## 6. Skill Context Assembly (Deterministic)

Each skill's `skill.md` frontmatter defines exactly what context it needs via `context_requirements`:

```yaml
context_requirements:
  always:                              # Always fetched
    - namespace: settings
      file: brand-voice.json
    - namespace: settings
      file: platforms.json
  conditional:                         # Fetched based on input values
    - namespace: audience-segments
      file: "{{input.segment_ids[*]}}.json"
    - namespace: content-pillars
      file: "{{input.pillar_ids[*]}}.json"
    - namespace: content-items
      file: "{{input.parent_concept_id}}.json"
      when: input.parent_concept_id
    - namespace: research-sources
      file: "{{input.pillar_ids[*]}}.json"
  search:                              # Dynamic search via AgenticFilesystem
    - query: "{{input.topic}}"
      namespace: research-sources
      mode: hybrid
      k: 3
```

**Why no agent layer is needed:**
- A post targets a specific platform → skill runner fetches only that platform's config
- Content item specifies `segmentIds` → runner fetches only those audience segments
- Different skills need different artifacts → `conditional` maps each skill to exactly what it needs
- AgenticFilesystem hybrid search handles semantic discovery of relevant research

---

## 7. Scaling Strategy

### Problem

Workspaces accumulate ideas/content over time. RAG search is great for semantic queries but not for deterministic filtering ("all draft ideas for Instagram sorted by date").

### Solution: Index Documents

Each namespace needing list-view filtering maintains a lightweight `_index.json` manifest with only the fields needed for filtering, sorting, and list display.

- UI loads `_index.json` → instant client-side filtering for pipeline/kanban views
- Full documents fetched on-demand when user opens a specific item
- Index updated atomically after any content-item write
- Shardable by stage for 10K+ items (e.g., `_index-ideas.json`, `_index-posts.json`)

| Approach | Deterministic? | Scale | Chosen? |
|----------|---------------|-------|---------|
| RAG search only | No | Good | No |
| In-memory DB (SQLite) | Yes | Excellent | Future option |
| **Index document** | **Yes** | **Good to ~10K** | **Yes (v1)** |
| Per-status subdirs | Partial | Poor | No |

See: `schemas/workspace/content-items-index.schema.json`, sample at `data/hive-collective/content-items/_content-items-index.json`

---

## 8. Binary Assets

Images, videos, and audio files are stored as separate files in the `assets` namespace, organized by content-item ID:

```
assets/{item-id}/
├── cover.jpg
├── video-final.mp4
├── raw-footage.mov
└── _manifest.json          # Asset inventory with metadata
```

- Upload via AgenticFilesystem `POST /v1/{tenant}/files` with `namespace=assets`, `path={item-id}/`
- AgenticFilesystem handles binary storage, text extraction, and indexing
- Content items reference assets via `assetRefs[]` (inline array of `{fileId, filename, role, mimeType, sizeBytes}`)
- Manifest provides full asset inventory per content item

See: `schemas/workspace/asset-manifest.schema.json`, sample at `data/hive-collective/assets/post1/_manifest.json`

---

## 9. Monthly Calendars

Calendar data is organized as one document per month containing ALL events (publish dates, milestones, phase windows) for that month.

- Filename: `{YYYY-MM}.json` (e.g., `2026-03.json`)
- Derived from content-item publish dates + `settings/calendar.json` deadline templates
- Rebuilt/updated when publish dates change, milestones auto-generate, or statuses change
- Phase windows spanning month boundaries appear in BOTH months' documents
- Includes summary stats (counts by type, overdue/at-risk counts, platform breakdown)

See: `schemas/workspace/monthly-calendar.schema.json`, sample at `data/hive-collective/calendars/2026-03.json`

---

## 10. Research Sources (Per-Pillar)

Research sources are organized as one document per content pillar, containing all sources found, available for use, or already in use for that pillar.

- Filename matches pillar ID: `research-sources/{pillar-id}.json`
- Source lifecycle: `discovered` → `available` → `in-use` → `archived`
- Tracks which content items reference each source via `usedInContentIds[]`
- Updated by the research-scanning skill and when content items reference sources

See: `schemas/workspace/pillar-sources.schema.json`, sample at `data/hive-collective/research-sources/p1.json`

---

## 11. Design Rationale

| Decision | Rationale |
|----------|-----------|
| **Skills replace agents** | UI "Agent Personalities" are workspace-level skill configs. Skills are the only unit that talks to the LLM. |
| **Global skills + tenant overrides** | Skill definitions in `blinksocial_system`, workspace customizations in `settings/skills.json`. No duplication. |
| **No separate context layer** | All data on AgenticFilesystem. Skills fetch context dynamically via search + direct-read. Configured deterministically in skill.md frontmatter. |
| **Research sources per pillar** | One doc per pillar. Avoids proliferation, keeps sources organized by topic. |
| **Monthly calendar documents** | One doc per month. Efficient rendering without assembling from individual events. |
| **Index documents** | `_index.json` manifests for deterministic filtering. Scales to ~10K items. Upgradeable to SQLite. |
| **Content pipeline lineage** | `parentIdeaId`/`parentConceptId` links. Concept → N posts (one per platform+contentType). Single namespace. |
| **Binary assets as separate files** | `assets/` namespace with manifests. AgenticFilesystem handles storage, extraction, pairing. |
| **Settings as 8 separate docs** | One per UI tab. Scoped saves, reduced conflicts, natural permission boundaries. |

---

## 12. Open Questions for Future Iterations

### Scaling & Performance
- At what scale (~10K+ items) should `_index.json` be sharded or graduated to SQLite?
- Should we add quarterly calendar rollups for cross-month views?
- What's the archival strategy for old ideas? Separate `_index-archived.json`?
- Should we add custom Qdrant payload indexes beyond `tenant_id`, `file_id`, `path`?

### Data Model
- Should skill.md definitions be versioned? How to handle schema migrations?
- At what point should production sub-objects (QA, packaging) be extracted from the content-item into separate documents?
- Could workspaces share custom skill configs (skill marketplace)?

### Collaboration & Concurrency
- How do concurrent edits to the same content item resolve? Optimistic locking?
- How do we ensure `_index.json` stays in sync if a write succeeds but the index update fails?

### Context Assembly
- How does the skill runner manage prompt token limits when assembling context?
- Should frequently-used context (brand voice, platform rules) be cached locally?
