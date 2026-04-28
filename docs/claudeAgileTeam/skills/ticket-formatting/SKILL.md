---
name: ticket-formatting
description: Use whenever writing ticket bodies, design docs, test reports, or comments on GitHub issues in this Kanban workflow. Provides the canonical markdown structure for each artifact type, the agent-signature block required on every automated comment, and conventions for linking tickets, commits, and test runs. Trigger on any request to create, update, or comment on a ticket.
---

# Ticket and comment formatting standards

## Brevity preference

**Keep automated comments short.** A comment should be scannable in 5–10 seconds. One paragraph + a short bullet list is the target shape. Avoid dumping commit lists, long file:line tables, or restating the design — anyone who needs that detail will open the issue body or the PR diff.

**Keep commit messages short.** Use a single Conventional Commit subject line plus a `Refs #<n>` trailer. Reserve a commit body (more than 3 lines) for commits where the "why" genuinely isn't obvious from the diff. Avoid HEREDOCs longer than ~10 lines in `git commit -m` — long HEREDOCs can hang or mis-escape in some shells.

## Every automated comment ends with a signature block

```markdown
— `/command-name` · <UTC date>
```

Use a short em-dash line, not a horizontal rule. Include `commit <sha-short>` only when the command produced code. Use UTC ISO date (`2026-04-23`) — no timestamp needed.

## Attachments — canonical format and uploader

Any artifact that benefits from screenshots, wireframes, payload dumps, or design assets uses this format. **Omit the section entirely when there are no attachments — never emit an empty header.**

### Markdown format

```markdown
## Attachments

### <filename or short label>
*<one-line description — what it is, why it matters>*

<!-- images render inline: -->
![<alt text>](<browser_download_url>)

<!-- non-images render as a download link: -->
[📎 <filename>](<browser_download_url>)
```

Stack multiple attachments as repeated `### <label>` blocks. When attachments belong to a sub-item (e.g. a single defect inside a test report), nest the heading one level deeper and label it `Attachments` rather than emitting a fresh `## Attachments` top-level heading.

### Hosting — the `ticket-attachments` release

GitHub strips inline data URIs from rendered bodies, so file bytes are hosted on a dedicated GitHub Release tagged `ticket-attachments`. The release is auto-created on first use; subsequent uploads append. The release tag is hardcoded — no `kanban.config.json` field. Auth uses the existing `gh auth` token; no extra scope is required beyond what `gh issue create` already needs.

The release is **not** part of the project's semver release stream — it's a stable bucket whose only purpose is to hold issue/PR attachment bytes. Do not delete it.

### Uploader helper (`upload_attachment`)

```bash
upload_attachment() {
  # Usage: upload_attachment <local-path> <label-slug>
  #   <label-slug> is a short identifier (e.g. "issue-42" or a slug from the ticket title)
  #   used to keep asset names readable. Echo the resulting browser_download_url to stdout.
  local local_path="$1"
  local label_slug="$2"

  [ -f "$local_path" ] || { echo "upload_attachment: no such file: $local_path" >&2; return 1; }

  # Idempotent: ensure the attachment-store release exists.
  if ! gh release view ticket-attachments >/dev/null 2>&1; then
    gh release create ticket-attachments \
      --title "Ticket attachments" \
      --notes "Attachment store for tickets — do not delete." >/dev/null
  fi

  # Collision-proof asset name: <slug>-<sha8>-<basename>.
  # Re-uploading the same bytes produces the same sha8, so the URL is stable.
  local sha8 base unique
  sha8=$(sha256sum "$local_path" | cut -c1-8)
  base=$(basename "$local_path")
  unique="${label_slug}-${sha8}-${base}"

  # gh release upload supports `<file>#<display-name>` to rename the asset on upload.
  gh release upload ticket-attachments "${local_path}#${unique}" --clobber >/dev/null

  gh api "repos/{owner}/{repo}/releases/tags/ticket-attachments" \
    --jq ".assets[] | select(.name == \"${unique}\") | .browser_download_url"
}
```

Callers pipe each accepted attachment through this helper, capture the echoed URL, and splice it into the body before `gh issue create` / `gh issue comment` / `gh issue edit`. Because URLs are stable on first upload, no second-pass `gh issue edit` is needed to fix attachment links.

### Auto-detecting attachments in user input

Commands that gather attachments (`/create-ticket`, `/test-ticket`, `/remediate-ticket`, `/review-ticket`) should treat the following as **implicit attachments** — no need to re-ask:

- Image files dropped into the conversation by the user.
- Absolute paths in user messages that resolve to existing files (e.g. `/Users/.../wireframe.png`, `~/Downloads/spec.pdf`).
- Glob expansions the user explicitly types (e.g. `./screenshots/*.png`).

Always show the resolved attachment list **inside the draft body** for user confirmation **before** any bytes leave the machine, so the user can prune or correct labels and descriptions.

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

## Attachments
<see "Attachments — canonical format and uploader" above; omit this heading entirely when there are no attachments>
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
<embed wireframes/mockups using the canonical Attachments format above>

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
- **Suspected cause**: <file:line if known>

##### Attachments
<screenshots, payload dumps, DB rows — see canonical Attachments format above; omit this subsection when none>

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

- **D1** — <one-line root cause> (`<sha>`)
- **D2** — ...

## Attachments
<see canonical Attachments format above; omit this heading entirely when there are no attachments>

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

### Supporting attachments
<see canonical Attachments format above; omit this subsection when none>

<signature block>
```
