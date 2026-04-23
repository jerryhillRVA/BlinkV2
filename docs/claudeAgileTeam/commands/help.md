---
description: Print a guide to the Kanban workflow commands, the state machine, and common flows. First stop for anyone new to the system or looking up what command to run.
argument-hint: (none)
allowed-tools: Bash, Read
---

Print the guide below. Before printing, check whether `.claude/kanban.config.json` exists:
- If **missing**, prepend a prominent banner: "⚠️ Workflow not yet configured. Run the setup from §2 of the design doc before using any other command."
- If **present**, omit the banner.

Do not modify any tickets or files. This is read-only.

---

# Kanban workflow — command guide

A Kanban-driven development loop running against GitHub Issues + GitHub Projects. Each column has a dedicated command; the ticket body and comments are the shared memory between stages.

## State machine

```
  Backlog ──▶ Ready ──▶ In Progress ──▶ In QA ──▶ In Review ──▶ Done
     │          │            │             │           │           │
  /create    /design      /develop    /test or     /review      (merge)
  -ticket    -ticket                  /remediate   -ticket
                                      -ticket
```

Anywhere: `/refine-ticket`, `/block-ticket`, `/unblock-ticket`, `/ticket-status`
Emergency: `/hotfix` (creates + jumps straight to In Progress)
Reporting: `/board-status`, `/help`

## Commands by purpose

### Creation & planning
| Command | Stage transition | Purpose |
|---|---|---|
| `/create-ticket [desc]` | → Backlog | Ask clarifying questions, write testable ACs, create issue |
| `/design-ticket <n>` | Backlog → Ready | Produce design doc + test plan in issue body |
| `/refine-ticket <n> [what]` | any (no move) | Update scope / ACs / design mid-flight |

### Execution
| Command | Stage transition | Purpose |
|---|---|---|
| `/develop [n]` | Ready → In QA | Branch, implement, DoD gate, push |
| `/test-ticket <n>` | In QA → In Review (if clean) | Execute TCs, validate UI ↔ API ↔ DB parity |
| `/remediate-ticket <n>` | stays In QA | Fix defects from latest test report |
| `/review-ticket <n>` | In Review (no move) | Post structured review packet on PR |

### Flow control
| Command | Stage transition | Purpose |
|---|---|---|
| `/block-ticket <n> <reason>` | any (no move) | Add blocked label + reason; ticket stays in column |
| `/unblock-ticket <n> [note]` | any (no move) | Clear blocked state |
| `/hotfix <desc>` | → In Progress | Compressed path for production bugs (skips design, not test/review) |

### Operational
| Command | Purpose |
|---|---|
| `/help` | This guide |
| `/ticket-status <n>` | Detailed state of one ticket + suggested next command |
| `/board-status` | Whole-board snapshot: WIP, aging, blockers, rough cycle times |

## Common flows

### Happy path
```
/create-ticket → /design-ticket → /develop → /test-ticket
  → (clean) → /review-ticket → human merges PR → Done
```

### Defect-found path
```
/test-ticket (defects) → /remediate-ticket → /test-ticket
  → (still defects?) → /remediate-ticket → /test-ticket
  → (clean) → /review-ticket → human merges PR → Done
```

### Hotfix path
```
/hotfix → /test-ticket → (clean) → /review-ticket → human merges PR → Done
```
A hotfix skips the Backlog → Ready design phase but **not** the QA or review phases.

## Architecture (short version)

Commands are thin wrappers; reusable logic lives in three skills under `.claude/skills/`:

- **github-projects** — Projects V2 GraphQL + `gh` CLI helpers. Used by every command that moves a ticket between columns.
- **ticket-formatting** — Templates for issue body, design doc, test report, remediation, review packet. Defines the agent-signature block required on every automated comment.
- **ui-persistence-testing** — Methodology for three-layer (UI ↔ API payload ↔ DB row) parity testing via Claude for Chrome.

Config lives in `.claude/kanban.config.json`: project IDs, branch conventions, lint/test commands, DB inspection command.

## Conventions

- **Branches**: `feature/<n>-<slug>` (or `hotfix/<n>-<slug>`)
- **Commits**: Conventional Commits with `Refs #<n>` trailer
- **Comments**: Every automated comment ends with a signature — command, commit SHA, timestamp
- **Assignee as lock**: `/develop` assigns the ticket to a configured bot account; other commands refuse if someone else is assigned

## Getting unstuck

- **Not sure what to do next on a ticket?** → `/ticket-status <n>`
- **What's going on across the whole board?** → `/board-status`
- **Scope changed mid-flight?** → `/refine-ticket <n>`
- **Blocked on something external?** → `/block-ticket <n> <reason>`
- **DoD gate or dev server failed during `/develop`?** → the command stops cleanly and leaves a comment listing what failed; fix the underlying issue locally and re-run `/develop <n>` to resume.
- **Tests finding the same defect every run?** → the root cause is probably deeper than the patch site; read the full design test plan and trace the field end-to-end before the next `/remediate-ticket`.
