# Claude Agile Team — Kanban workflow for Claude Code

A complete Kanban development workflow built as Claude Code skills and slash commands, wired to GitHub Issues + GitHub Projects V2. Each board column has a dedicated command; the ticket body and comments are the shared memory between stages.

```
  Backlog ──▶ Ready ──▶ In Progress ──▶ In QA ──▶ In Review ──▶ Done
     │          │            │             │           │           │
  /create    /design      /develop    /test or     /review      (merge)
  -ticket    -ticket                  /remediate   -ticket
                                      -ticket
```

This folder is checked into the repo. The actual installed copies live under `.claude/` (gitignored) — each teammate installs their own copy by following the instructions below. That keeps per-developer tweaks (bot assignee, commands, dev URL) out of everyone else's way.

---

## What gets installed

| File | Purpose |
|---|---|
| `.claude/kanban.config.json` | Project IDs, status option IDs, DoD commands, dev URL. Generated once per install from your GitHub Project V2. |
| `.claude/skills/github-projects/SKILL.md` | Projects V2 `gh` CLI + GraphQL helpers — used by every column-move command. |
| `.claude/skills/ticket-formatting/SKILL.md` | Markdown templates for issue body, design doc, test report, remediation note, review packet; plus the signature block every automated comment ends with. |
| `.claude/skills/ui-persistence-testing/SKILL.md` | Methodology for three-layer (UI ↔ API payload ↔ DB row) parity testing via the Claude for Chrome plugin. |
| `.claude/commands/*.md` | The 13 slash commands: `/create-ticket`, `/design-ticket`, `/refine-ticket`, `/develop`, `/test-ticket`, `/remediate-ticket`, `/review-ticket`, `/block-ticket`, `/unblock-ticket`, `/hotfix`, `/board-status`, `/help`, `/ticket-status`. |

Read `.claude/commands/help.md` after install for the full command reference and state-machine diagram.

---

## Quick install (for humans)

Paste this prompt to Claude Code, then answer the clarifying questions it asks:

> **Install the Kanban workflow using the instructions in `docs/claudeAgileTeam/README.md`. Run through the §Agent install instructions section step-by-step, asking me the questions it flags and waiting for my approval at the approval gate before creating any files.**

Claude will check prerequisites, ask you for your GitHub OWNER + PROJECT_NUMBER, generate the config, show it to you for approval, then copy the skills and commands into `.claude/`. Restart Claude Code when it's done so the new skills and slash commands are picked up.

---

## Prerequisites

Before install, confirm all of these:

1. **`gh` CLI** installed and authenticated (`gh auth status`).
2. **`jq`** installed (any version ≥ 1.6).
3. **`project` scope on the gh token.** Check `gh auth status` for `project` in `Token scopes`. If missing:
   ```bash
   gh auth refresh -s project,read:project
   ```
4. A **GitHub Project V2** attached to this repo, with a `Status` single-select field containing exactly these six options (case matters — see "Column naming" below):
   - `Backlog`
   - `Ready`
   - `In Progress`
   - `In QA`
   - `In Review`
   - `Done`
5. You know:
   - The **`OWNER`** of the project (`gh` user login for personal projects, org login for org projects).
   - The **`PROJECT_NUMBER`** — find it in the URL `https://github.com/users/<OWNER>/projects/<N>` (or `https://github.com/orgs/<OWNER>/projects/<N>`).

### Column naming

The command files hardcode these exact strings when moving tickets between columns:

| String in commands | Must match in Project V2 |
|---|---|
| `"Backlog"` | Backlog |
| `"Ready"` | Ready |
| `"In Progress"` | **In Progress** (capital P) |
| `"In QA"` | In QA |
| `"In Review"` | **In Review** (capital R) |
| `"Done"` | Done |

If your board uses different capitalization (e.g. `In progress`), either rename the columns in the Project V2 UI or edit the command files to match. `Status` is a single-select field lookup — any mismatch returns `null` and the column move silently fails.

---

## Agent install instructions

*This section is written as instructions for a Claude Code agent running in the repo root. A human teammate pastes the "Quick install" prompt above and this is what the agent follows.*

### Phase 1 — Prerequisite check (no writes)

Run each check and report results. **Stop and report if any fail.**

```bash
gh --version             # must succeed
gh auth status           # must show authenticated + token scopes including `project`
jq --version             # must succeed (≥1.6)
git rev-parse --git-dir  # must succeed (we're inside a git repo)
test -d docs/claudeAgileTeam/skills && test -d docs/claudeAgileTeam/commands && echo "template present"
```

If `project` is missing from token scopes, tell the user to run `gh auth refresh -s project,read:project` and pause until they confirm it's done.

### Phase 2 — Gather info from the user

Ask the user (via `AskUserQuestion` when available, otherwise a single consolidated text question):

1. **`OWNER`** — their GitHub user or org login that owns the Kanban Project V2.
2. **`PROJECT_NUMBER`** — the integer from the project URL.
3. **`botAssignee`** — the GitHub login `/develop` will assign tickets to as a claim lock. Default: the authenticated user (`gh api user --jq .login`). Solo devs should just use their own login.
4. **Five DoD commands** for this repo — lint, typecheck, test, coverage, dev. Suggest reasonable defaults based on `package.json` scripts and any `CLAUDE.md` conventions, then confirm.
5. **`appBaseUrl`** — where the dev server serves the user-facing UI (e.g. `http://localhost:4200` for an Angular workspace, `http://localhost:3000` for a single-port app).
6. **`dbInspectCommand`** — optional. A shell command that, given `--query "..."`, returns rows as JSON. Enables DB parity checks in `/test-ticket`. If the user doesn't have one yet, leave it `""` and note that `/test-ticket` will skip DB checks.

### Phase 3 — Generate `.claude/kanban.config.json`

Run (substituting `$OWNER` and `$PROJECT_NUMBER` literally):

```bash
mkdir -p .claude

gh project view $PROJECT_NUMBER --owner $OWNER --format json > /tmp/kanban_proj.json
gh project field-list $PROJECT_NUMBER --owner $OWNER --format json > /tmp/kanban_fields.json

jq -n \
  --arg owner "$OWNER" \
  --argjson number $PROJECT_NUMBER \
  --slurpfile p /tmp/kanban_proj.json \
  --slurpfile f /tmp/kanban_fields.json \
  '{
    owner: $owner,
    number: $number,
    projectId: $p[0].id,
    statusField: ($f[0].fields[] | select(.name == "Status") | {
      id: .id,
      options: (.options | map({name, value: .id}) | from_entries)
    }),
    botAssignee: "<from Phase 2>",
    defaultBranch: "main",
    devCommand: "<from Phase 2>",
    lintCommand: "<from Phase 2>",
    typeCheckCommand: "<from Phase 2>",
    testCommand: "<from Phase 2>",
    coverageCommand: "<from Phase 2>",
    appBaseUrl: "<from Phase 2>",
    dbInspectCommand: "<from Phase 2 or \"\">",
    wipLimit: 5
  }' > .claude/kanban.config.json
```

> ⚠️ **Known trap:** the `jq` expression **must** use `map({name, value: .id})`, not `map({name, id})`. `from_entries` reads the `.value` key — using `.id` silently produces `null` for every option ID and column moves fail at runtime. Verify with `jq '.statusField.options' .claude/kanban.config.json` that every value is a real hex string.

### Phase 4 — Approval gate

Show the generated `.claude/kanban.config.json` to the user. Specifically call out:

- Are all six status option IDs non-null? (`jq -e '[.statusField.options[] | select(. == null)] | length == 0' .claude/kanban.config.json`)
- Do the option *names* match what the commands expect? Expected: `Backlog`, `Ready`, `In Progress`, `In QA`, `In Review`, `Done`. Report any mismatch so the user can either rename columns in the Project V2 UI (then re-run `gh project field-list` + the `jq` step) or decide to patch the command files.
- Are the DoD commands right for this repo?

**Wait for explicit "proceed" / "approved" from the user before Phase 5.**

### Phase 5 — Copy skills and commands

```bash
mkdir -p .claude/skills .claude/commands
cp -r docs/claudeAgileTeam/skills/github-projects .claude/skills/
cp -r docs/claudeAgileTeam/skills/ticket-formatting .claude/skills/
cp -r docs/claudeAgileTeam/skills/ui-persistence-testing .claude/skills/
cp docs/claudeAgileTeam/commands/*.md .claude/commands/
```

### Phase 6 — Verify

```bash
# All 17 files present?
ls .claude/kanban.config.json
ls .claude/skills/github-projects/SKILL.md
ls .claude/skills/ticket-formatting/SKILL.md
ls .claude/skills/ui-persistence-testing/SKILL.md
ls .claude/commands/{create-ticket,design-ticket,refine-ticket,develop,test-ticket,remediate-ticket,review-ticket,block-ticket,unblock-ticket,hotfix,board-status,help,ticket-status}.md

# Config structurally valid?
jq -e '.projectId and .statusField.id and (.statusField.options | length >= 6) and ([.statusField.options[] | select(. == null)] | length == 0)' .claude/kanban.config.json
```

Report any missing files or failed assertion.

### Phase 7 — Tell the user to restart

Print:

> ✅ **Install complete.** Restart Claude Code so the new skills and slash commands are picked up, then run `/help` to see the command guide and `/board-status` to confirm the Projects V2 integration works.

---

## Per-project customization

`.claude/kanban.config.json` is the single source of tunables. After install you can edit it freely; commands read it fresh on every invocation.

| Field | What to change it for |
|---|---|
| `botAssignee` | Switch to a team bot account (e.g. `my-org-bot`) if multiple humans run `/develop` against the same repo and you want the assignee to reflect "claimed by automation" rather than a specific person. Empty → fall back to the authenticated user. |
| `defaultBranch` | `master` instead of `main`, or a long-lived integration branch. |
| `devCommand` | The exact command that starts the app for UI testing. For Nx workspaces, often `npm start` or `npx nx serve <project>`. |
| `lintCommand` | Used in the `/develop` and `/remediate-ticket` DoD gate. Use the affected-only variant when available for speed (e.g. `npx nx affected -t lint --base=HEAD`). |
| `typeCheckCommand` | Some stacks have no dedicated typecheck — fall back to a build (e.g. `npx nx build <project>`) which surfaces template-type errors a lint can't catch. |
| `testCommand` | Non-watch mode is required since the DoD gate runs to completion. |
| `coverageCommand` | Optional. If your test runner enforces coverage via config (vitest threshold, jest `--coverageThreshold`), point this at the test command — the threshold failure will trip the gate. |
| `appBaseUrl` | The URL `/test-ticket` drives via Claude for Chrome. The **user-facing** port, not the API port. |
| `dbInspectCommand` | Any command returning rows as JSON — e.g. `psql -h localhost -d myapp -t -A -F$'\t' -c`, or a wrapper script. If empty, `/test-ticket` skips DB parity and does UI↔API checks only. |
| `wipLimit` | `/board-status` warns when `In Progress + In QA + In Review` exceeds this. Tune to your team size. |

---

## Known issues & workarounds

### `jq from_entries` gotcha

Already covered above. **Do not** use `map({name, id}) | from_entries` — it produces `null` values. Always `map({name, value: .id}) | from_entries`.

### Column naming mismatch

The commands hardcode `"In Progress"` (capital P) and `"In Review"` (capital R). If your Project V2 was created with GitHub's default columns (`In Progress`, `In review`) or with fully lowercase names, the mismatch will surface as silent failures when `/test-ticket` tries to promote to In Review, or `/develop` tries to move to In Progress.

Either:
1. Rename the columns in the Project V2 UI to match exactly, **or**
2. Patch the command files — find every `"In Progress"` / `"In Review"` string and replace with your project's casing. Affected files: `develop.md`, `hotfix.md`, `test-ticket.md`, `review-ticket.md`, `refine-ticket.md`, `board-status.md`, `ticket-status.md`, `help.md`.

### Skill files reference "In progress" in comments

The `github-projects` skill has `"In progress"` (lowercase p) in two inline code comments. These are documentation only — the actual executed string comes from whatever a command passes to `status_option_id` / `move_ticket` / `require_status`. Safe to leave as-is.

---

## Updating an installed copy

When changes land in `docs/claudeAgileTeam/` (new command, skill tweak, prose fix), re-run the install's Phase 5 + Phase 6 steps — they overwrite the files in `.claude/`. Your `.claude/kanban.config.json` is not touched.

If you've locally modified any skill or command file, those changes will be clobbered — keep local tweaks isolated to `kanban.config.json`, or propose them upstream by PR'ing `docs/claudeAgileTeam/`.

---

## Uninstalling

```bash
rm -rf .claude/kanban.config.json .claude/skills .claude/commands
```

Leaves any other `.claude/*` content (settings, permissions) untouched.
