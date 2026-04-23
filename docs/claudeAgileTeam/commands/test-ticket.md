---
description: Execute the design's test plan against an In QA ticket using Claude for Chrome. Validates UI ↔ API ↔ DB parity. Promotes to In Review and creates a PR if clean; keeps it In QA and files a defect report if not.
argument-hint: <issue-number>
allowed-tools: Bash, Read, Edit, Write, mcp__chrome
---

Testing ticket **#$ARGUMENTS**.

Invoke the `ui-persistence-testing` skill for the methodology. This command is the orchestration wrapper.

1. **Preconditions**:
   - Status is `In QA` (via `github-projects` skill). Abort otherwise.
   - Feature branch exists: derive from ticket title + number; `git fetch && git checkout <branch> && git pull`.

2. **Determine test run number**: look at existing comments on the ticket, find the highest "Test report — run N" number, use `N+1`.

3. **Bring up the app**:
   - If `appBaseUrl` already responds: reuse.
   - Else: start `devCommand` in background. Wait up to 60s for URL to respond. If it doesn't come up, file that as a blocker defect and stop.

4. **Read the design's test plan** from the issue body. Build a working list of TCs.

5. **Execute each TC** via Claude for Chrome, following the `ui-persistence-testing` skill's three-layer assertion model. For each TC capture:
   - Screenshots at key steps
   - Network request/response JSON for the relevant API call(s)
   - DB query results (via `dbInspectCommand`)
   - Post-refresh UI state

6. **Classify defects** using the severity rubric. Any UI↔API↔DB mismatch is at least Major.

7. **Build the test report** using the template from the `ticket-formatting` skill, including the parity table. Post it as a comment on the ticket.

8. **Promotion decision**:
   - **Zero blockers and zero majors** → promote:
     - Move ticket to `In Review`.
     - Create PR: `gh pr create --base <defaultBranch> --head <branch> --title "<issue title> (#<n>)" --body-file /tmp/pr-body.md`
     - PR body: reference the issue with `Closes #<n>`, summarize the implementation, link to the most recent test report comment, include the AC checklist.
     - Post a short comment on the issue: "All tests passed on run <N>. Moved to In Review and opened PR #<pr>."
     - Recommend the user run `/review-ticket <n>` to generate the review packet.
   - **Any blockers or majors** → stay In QA:
     - Do not create a PR.
     - Defect details are already in the test report comment.
     - Recommend the user run `/remediate-ticket <n>`.

9. **Leave the dev server running** for the next test iteration or remediate cycle.
