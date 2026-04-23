---
description: Analyze one ticket's current state across board, branch, and PR; summarize progress; recommend the exact next command to run. Read-only.
argument-hint: <issue-number>
allowed-tools: Bash, Read
---

Analyzing ticket **#$ARGUMENTS**. This command must not modify anything — no edits, no comments, no column moves.

1. **Sanity checks**:
   - Verify `.claude/kanban.config.json` exists. If not, tell the user to run setup.
   - `gh issue view $ARGUMENTS --json number,title,state,body,labels,assignees,comments,createdAt,closedAt,updatedAt` — if it errors, report the issue doesn't exist and stop.

2. **Board column**: use the `github-projects` skill's `get_status` helper.

3. **Infer lifecycle milestones** from the issue body and comments:
   - **Design done?** → issue body contains a `## Design` heading.
   - **Last test run number** → scan comments for titles matching `Test report — run N`; take the max.
   - **Last test run result** → parse that comment's summary line (pass/fail, defect counts by severity).
   - **Last remediation run number** → same logic against `Remediation — run N`.
   - **DoD gate failure?** → any recent `/develop` comment mentioning "gate failed" or listing lint/typecheck/test failures.
   - **Review packet posted?** → PR has a comment whose body contains `## Review packet`.

4. **Branch state** (only relevant if column is In Progress or later; derive branch name as `feature/<n>-<slug of title>` or `hotfix/<n>-<slug>` if labeled `hotfix`):
   - `git ls-remote --heads origin <branch> 2>/dev/null` — does it exist?
   - If yes: `git fetch origin <branch>` then `git log --oneline origin/<defaultBranch>..origin/<branch>` for commit count + last commit timestamp.

5. **PR state** (only relevant if In Review or Done):
   - `gh pr list --state all --head <branch> --json number,state,isDraft,mergedAt,url --limit 5`
   - Pick the most recent (should only be one).

6. **Age in current column**: find the most recent comment that announces a column move (e.g. "Moved to In QA", "Starting development", "All tests passed on run N. Moved to In Review"). Compute `now - that_timestamp` in days. If no such comment exists, fall back to `updatedAt`.

7. **Decide the suggested next action.** First matching row wins:

   | Condition | Suggested next action |
   |---|---|
   | Has `blocked` label | Resolve the block externally, then run `/unblock-ticket <n>` |
   | Backlog, no `## Design` in body | `/design-ticket <n>` |
   | Backlog, has `## Design` in body | ⚠️ Anomaly: design is in body but ticket not moved to Ready. Investigate — possibly `/design-ticket` failed before the column move |
   | Ready | `/develop <n>` |
   | In Progress, no remote branch | `/develop <n>` (fresh start) |
   | In Progress, branch exists, last `/develop` comment says DoD gate failed | Fix the listed gate failures locally, then `/develop <n>` to resume |
   | In Progress, branch exists, no "Moved to In QA" comment yet | `/develop <n>` (resume — last run may not have completed) |
   | In QA, no test report comment yet | `/test-ticket <n>` |
   | In QA, latest test report has blockers or majors | `/remediate-ticket <n>` |
   | In QA, latest test report is clean | ⚠️ Anomaly: clean report but still In QA (should have auto-promoted). Re-run `/test-ticket <n>` — likely the promotion step failed |
   | In Review, no review packet comment on PR | `/review-ticket <n>` |
   | In Review, review packet posted | Waiting on human reviewer. No command needed. |
   | Done, or issue closed with a linked merged PR | Done. Merged in PR <url>. No action. |
   | Issue closed but not in Done column | ⚠️ Anomaly: closed outside the workflow. Investigate before reopening. |

8. **Emit the report** exactly in this shape:

   ```markdown
   ## Ticket #<n> — <title>

   | | |
   |---|---|
   | Column | <status> (<N> day(s)) |
   | Assignee | <login or "—"> |
   | Labels | <comma-list or "—"> |
   | Branch | <branch> — <M> commit(s), last push <X ago> · or "not created" |
   | PR | #<pr-num> <state> · or "none" |

   ### Progress
   - [<x or space>] Ticket created
   - [<x or space>] Design complete
   - [<x or space>] Implementation pushed
   - [<x or space>] Test runs: <N> (latest: <clean | K defects>)
   - [<x or space>] Review packet posted
   - [<x or space>] Merged

   ### Recent activity (last 5 events)
   - <time ago> — <what happened (derived from comment title or commit subject)>
   - ...

   ### Outstanding
   - <bullet for each unchecked item above, phrased as a concrete thing that needs to happen>

   ### ▶ Suggested next action
   **`<exact command>`**

   <one-sentence rationale tying the suggestion to the outstanding items>

   ### Warnings
   <only include if any apply>
   - Stale: ticket has been in <column> for <N> days (>3 day threshold).
   - Blocked: <reason from blocker comment>.
   - Anomaly: <what's inconsistent>.
   ```

9. Keep the full output under one screen where possible. If there are many comments, summarize in "Recent activity" rather than listing them all.
