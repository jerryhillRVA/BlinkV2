---
description: Fix all outstanding defects from the latest test run on an In QA ticket, push to the feature branch, and comment remediation notes.
argument-hint: <issue-number>
allowed-tools: Bash, Read, Glob, Grep, Edit, Write
---

Remediating ticket **#$ARGUMENTS**.

1. **Preconditions**:
   - Status is `In QA`. Abort otherwise.
   - Check out the feature branch: `git fetch && git checkout <branch> && git pull`.

2. **Find the latest test report**: most recent comment titled "Test report — run N". Parse the Defects section.

3. **For each defect**:
   - Read the associated TC, evidence, and suspected cause.
   - Investigate — read the code, confirm the actual root cause (don't just patch symptoms).
   - Fix with a focused commit: `fix(scope): <defect title>` with `Refs #<issue>` and `Fixes D<n>`.
   - After each fix, run the relevant narrow test locally (unit test if one exists, otherwise note that it'll be re-verified in the next `/test-ticket` run).

4. **Run the full DoD gate** (lint, typecheck, unit tests, coverage, secret scan) — same gate as `/develop`, step 6. If any fail, stop and report.

5. **Push**: `git push`.

6. **Comment remediation summary** using the template from the `ticket-formatting` skill. One line per defect with root cause and commit SHA.

7. **Leave the ticket in In QA**. Tell the user to run `/test-ticket <n>` for the next verification run.
