---
description: Fast-path a production bug through a compressed workflow — skips Backlog/Ready, creates ticket already in In Progress on a hotfix branch, but still enforces the DoD gate and test+review cycle.
argument-hint: <short description of the bug>
allowed-tools: Bash, Read, Glob, Grep, Edit, Write
---

Creating hotfix for: **$ARGUMENTS**

1. **Create the issue** with a compressed template (no separate design phase; design lives inline with the fix). Title prefix: `[hotfix] `. Add labels `hotfix`, `priority:high`.

2. **Add to project, move directly to In Progress.**

3. **Branch**: `hotfix/<issue>-<slug>` from `defaultBranch`.

4. **Implement the fix**. Commit: `fix: <description>` with `Refs #<issue>`.

5. **DoD gate** — same as `/develop`, step 6. Non-negotiable even for hotfixes.

6. **Push and move to In QA.** Comment with what was fixed and why it was a hotfix (what broke in production).

7. Recommend `/test-ticket <n>` next. The rest of the workflow is identical — a hotfix still gets tested, reviewed, and merged by a human.

> Hotfixes skip the Backlog→Ready design phase but **not** the QA/review phases. If a hotfix is urgent enough to skip review, that's a judgment call for a human, not an automated command.
