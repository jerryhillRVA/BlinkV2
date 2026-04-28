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
   - **Any files / screenshots / wireframes to attach?** (paths, dropped images, or globs)

   Ask all questions in one message where possible. Accept "N/A" or "you decide" as answers; don't stall.

   **Auto-collect attachments.** Before posing the attachments question, scan `$ARGUMENTS` and the conversation so far for: images dropped by the user, absolute paths that resolve to existing files, and explicit globs (e.g. `./shots/*.png`). Treat those as implicit attachments — list them back to the user under the question instead of re-asking, and ask only for a one-line description per file. Anything new the user adds in the answer is appended to that list.

5. **Draft the issue body** using the issue template from the `ticket-formatting` skill. If there are attachments, include the `## Attachments` section in the draft using file basenames + the user-supplied descriptions (the URL columns will be filled in step 6). Show the draft to the user and ask for confirmation or edits **before** any bytes leave the machine — they may want to drop or rename attachments.

6. **Upload attachments, then create the issue and add to project** once confirmed:
   ```bash
   # For each accepted attachment, call the upload_attachment helper documented in the
   # ticket-formatting skill (see "Attachments — canonical format and uploader") with a
   # short slug derived from the ticket title. Capture the echoed browser_download_url and
   # splice it into /tmp/new-ticket.md, replacing the placeholder for that attachment.
   for path in "${ATTACHMENTS[@]}"; do
     url=$(upload_attachment "$path" "$TITLE_SLUG")
     # substitute placeholder ![<basename>](pending) / [📎 <basename>](pending) → real URL
   done

   ISSUE_URL=$(gh issue create --title "<title>" --body-file /tmp/new-ticket.md)
   ```
   Release-asset URLs are stable from first upload, so no follow-up `gh issue edit` is needed once the issue is created. Then invoke the `github-projects` skill's `add_issue_to_project` helper. New items default to the first column in GitHub Projects; verify it landed in Backlog and move it if not.

7. **Report back** with the issue number, URL, and a one-line summary.

Do **not** assign the ticket. Do **not** create a branch. That's `/develop`'s job.
