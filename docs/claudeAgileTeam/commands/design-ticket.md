---
description: Take a Backlog ticket and produce a detailed design + test plan inside its description, then move it to Ready.
argument-hint: <issue-number>
allowed-tools: Bash, Read, Glob, Grep, Edit, Write
---

Ticket to design: **#$ARGUMENTS**

1. **Preconditions** (use the `github-projects` skill):
   - Ticket is in `Backlog`. If not, abort with a clear message.
   - Read current issue body — don't overwrite acceptance criteria, only add to the body.

2. **Explore the relevant code** before proposing a design:
   - Identify likely affected modules with `grep` / `glob`.
   - Read the actual files. Do not design against imagined file structure.

3. **Identify unknowns**. If anything required by the design section (data model, API shape, UI affordance, security concern) isn't clear from the ticket + code, ask the user *before* writing the design. Cap it at one round of questions.

4. **Produce the design** using the design-doc template from the `ticket-formatting` skill. Pay particular attention to:
   - **Test plan**: each TC must be specific enough that `/test-ticket` can execute it mechanically — include concrete steps, expected UI state, expected API call, expected persisted fields.
   - **Risks**: at least scan for security, migration reversibility, and blast-radius on existing features.

5. **Show the design to the user for approval**. Don't persist it yet.

6. **On approval**:
   - Append the `## Design` section to the issue body via `gh issue edit $ARGUMENTS --body-file /tmp/updated-body.md`.
   - Move the ticket to `Ready` via the `github-projects` skill.
   - Post a **one-line** comment: `Design complete, moved to Ready. See \`## Design\` in issue body.` plus signature. No summary or restatement — the design is already in the issue body.

7. **Report back** with the final design summary and confirmation of the move.
