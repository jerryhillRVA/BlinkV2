---
description: Pick up a Ready ticket, implement it on a feature branch, run the Definition-of-Done gate, and move it to In QA on success.
argument-hint: [issue-number — optional; if omitted, takes top of Ready]
allowed-tools: Bash, Read, Glob, Grep, Edit, Write
---

Developing ticket **$ARGUMENTS** (empty = auto-pick top of Ready).

1. **Select ticket**:
   - If `$ARGUMENTS` given: verify status is `Ready`, else abort.
   - If empty: list Ready tickets via `github-projects` skill, pick the first one, confirm with user before proceeding.

2. **Claim the ticket**:
   - `assign_to_bot` from the `github-projects` skill. Abort if already assigned to someone else.
   - Move to `In Progress`.
   - Post a comment: "Starting development." with signature.

3. **Set up the branch**:
   - Branch name: `feature/<issue>-<kebab-slug-of-title>` (truncate slug to 40 chars).
   - Check if branch already exists remotely (`git ls-remote --heads origin <branch>`):
     - **If yes**: fetch it, check it out, tell the user we're resuming.
     - **If no**: create from `defaultBranch` after `git fetch && git pull`.
   - `git status` — must be clean before starting. If not, abort with the dirty files listed.

4. **Read the full ticket body** including the design section. This is your spec. Do not start coding without it.

5. **Implement**:
   - Make changes per the design. Commit in logical chunks with Conventional Commits:
     - `feat(scope): short description` / `fix(...)`  / `refactor(...)` / `test(...)` / `docs(...)`
     - Each commit body ends with `Refs #<issue>`.
   - Keep the AC checklist in mind; check each item off mentally (or in a scratch file) as implementation progresses.

6. **Definition-of-Done gate** — run from project root, all must pass:
   - `lintCommand` → must be clean
   - `typeCheckCommand` → must be clean
   - `testCommand` → must be clean; new/changed code should have tests per design
   - `coverageCommand` (if defined) → coverage must not decrease by more than 1% vs `defaultBranch`
   - Secret scan: `git diff $defaultBranch...HEAD | grep -E "(password|secret|token|api[_-]?key)\s*[:=]" -i` — manually inspect hits
   - If any gate fails, **do not push**. Post a comment listing what failed, leave the ticket in In Progress, and stop.

7. **Push and report**:
   - `git push -u origin <branch>`
   - Post a comment with:
     - Summary of what was implemented
     - List of commits (short SHA + message)
     - Which ACs are believed satisfied and where (`file:line` anchors)
     - Anything deferred / worth flagging for QA
     - Signature with the HEAD commit SHA
   - Move ticket to `In QA`.

8. **Do not create a PR.** That happens after `/test-ticket` confirms clean.
