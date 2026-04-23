---
name: ticket-formatting
description: Use whenever writing ticket bodies, design docs, test reports, or comments on GitHub issues in this Kanban workflow. Provides the canonical markdown structure for each artifact type, the agent-signature block required on every automated comment, and conventions for linking tickets, commits, and test runs. Trigger on any request to create, update, or comment on a ticket.
---

# Ticket and comment formatting standards

## Every automated comment ends with a signature block

```markdown
---
<sub>🤖 posted by `/command-name` · commit `<sha-short>` · <UTC timestamp></sub>
```

Omit `commit` for commands that don't produce code. Use UTC ISO-8601 (date portion is fine: `2026-04-23`).

## Issue body template (emitted by `/create-ticket`)

```markdown
## Summary
<one-paragraph problem statement>

## Context
<why now; links to related issues/PRs/docs>

## Acceptance criteria
- [ ] <testable criterion 1>
- [ ] <testable criterion 2>
...

## Out of scope
- <things explicitly not included>

## Notes
<open questions, decisions deferred, assumptions>
```

## Design doc (appended to issue body by `/design-ticket`, under a `## Design` heading)

```markdown
## Design

### Approach
<high-level approach in 2–4 sentences>

### Data model changes
<schema diffs, migration notes, or "none">

### API changes
<new/changed endpoints, request/response shapes, or "none">

### UI changes
<affected screens, components, wireframe sketch or description, or "none">

### Risks & mitigations
| Risk | Likelihood | Mitigation |
|---|---|---|
| ... | L/M/H | ... |

### Test plan
#### Unit tests
- [ ] <case>
#### Integration tests
- [ ] <case>
#### UI + persistence tests (executed by `/test-ticket`)
- [ ] **TC-1** — <n>
  - Steps: <click/type>
  - Expected UI: <visible state>
  - Expected API call: `POST /x { field: value }`
  - Expected persisted row: `table=x, col=val`
- [ ] **TC-2** — ...

### Rollout
<feature flag? migration order? monitoring to add?>
```

## Test report comment (posted by `/test-ticket`)

```markdown
## Test report — run <N>

**Result**: ✅ All passed  |  ❌ <X> defects found

### Summary
| Test case | Result | Notes |
|---|---|---|
| TC-1 | ✅ | |
| TC-2 | ❌ | UI shows `null` where DB has `"active"` |

### Defects
#### D1 — <short title>
- **Severity**: blocker / major / minor
- **Test case**: TC-2
- **Steps to reproduce**: …
- **Expected**: …
- **Actual**: …
- **Evidence**: <screenshot path, DB query result, API payload>
- **Suspected cause**: <file:line if known>

### UI ↔ API ↔ DB parity
| Field | UI | API payload | DB row | Match |
|---|---|---|---|---|
| name | "foo" | "foo" | "foo" | ✅ |
| tags | ["a","b"] | ["a","b"] | `["a"]` | ❌ |

<signature block>
```

## Remediation comment (posted by `/remediate-ticket`)

```markdown
## Remediation — run <N>

Addressed defects from test run <N-1>:

- **D1** (<title>) — fixed in `<sha>`. Root cause: <one line>.
- **D2** — ...

Changed files: `src/a.ts`, `src/b.ts`
Ready for re-test.

<signature block>
```

## Review packet (posted by `/review-ticket` as a PR comment)

```markdown
## Review packet

### What this PR does
<2-sentence summary grounded in the issue>

### Acceptance criteria coverage
- [x] AC-1 — covered by `src/foo.ts:42`, test `TC-1`
- [x] AC-2 — covered by ...

### Highest-risk areas (review these first)
1. `src/auth/session.ts` — changes to token refresh logic
2. Migration `2026_04_23_add_tags.sql` — not reversible

### Diff walkthrough
- `src/a.ts` — <what changed and why>
- ...

### Reviewer checklist
- [ ] AC-1..N actually satisfied per linked evidence
- [ ] No secrets / credentials in diff
- [ ] Migration is safe for production data volume
- [ ] Error paths covered, not just happy path

### Linked artifacts
- Issue: #<n>
- Latest test report: <link to comment>

<signature block>
```
