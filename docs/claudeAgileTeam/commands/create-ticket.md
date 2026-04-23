---
description: Create a new ticket in the Backlog. Inspects the repo, checks related issues, asks clarifying questions until acceptance criteria are testable, then creates the issue and adds it to the project.
argument-hint: [optional short description of the work]
allowed-tools: Bash, Read, Glob, Grep, Edit, Write
---

You are creating a new ticket. Initial user input: **$ARGUMENTS**

Follow this sequence strictly. Stop and ask the user whenever you need information you can't reasonably infer.

1. **Load config** — read `.claude/kanban.config.json`. If missing, tell the user to run setup from the design doc.

2. **Understand the repo**:
   - Read `README.md`, `package.json` (or equivalent), and any `ARCHITECTURE.md` / `docs/` top-level files.
   - Run `git log --oneline -20` to see recent direction.
   - Use `glob` to map top-level source structure.

3. **Check for related work**:
   - `gh issue list --search "<keywords from $ARGUMENTS>" --state all --limit 20`
   - Read the titles/bodies of the top 3 most-relevant matches. If one looks like a near-duplicate, surface it to the user before proceeding.

4. **Ask clarifying questions until ACs are testable**. Minimum checklist before creating the ticket:
   - What's the user-visible outcome?
   - Who is the user (role, context)?
   - What's the smallest shippable version?
   - Are there non-functional requirements (perf, a11y, i18n, mobile)?
   - Any data model changes implied?
   - Anything explicitly out of scope?

   Ask all questions in one message where possible. Accept "N/A" or "you decide" as answers; don't stall.

5. **Draft the issue body** using the issue template from the `ticket-formatting` skill. Show it to the user and ask for confirmation or edits before creating.

6. **Create the issue and add to project** once confirmed:
   ```bash
   ISSUE_URL=$(gh issue create --title "<title>" --body-file /tmp/new-ticket.md)
   ```
   Then invoke the `github-projects` skill's `add_issue_to_project` helper. New items default to the first column in GitHub Projects; verify it landed in Backlog and move it if not.

7. **Report back** with the issue number, URL, and a one-line summary.

Do **not** assign the ticket. Do **not** create a branch. That's `/develop`'s job.
