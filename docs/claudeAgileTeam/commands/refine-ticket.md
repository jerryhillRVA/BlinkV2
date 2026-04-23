---
description: Update an existing ticket's scope, acceptance criteria, or design with new information. Handles scope changes that arrive after design is done without requiring the ticket to be reset to Backlog.
argument-hint: <issue-number> [description of what's changing]
allowed-tools: Bash, Read, Edit, Write
---

Refining ticket **#$ARGUMENTS**.

1. Read the current issue body and recent comments.
2. Confirm with the user what specifically is changing: scope / ACs / design / test plan.
3. Make the edits in place to the issue body, preserving existing content not affected by the change.
4. Post a comment documenting the change with a "Before → After" diff-style bullet list, so reviewers see exactly what shifted and why.
5. Add a signature block.
6. If the ticket is already In Progress or later, warn the user that downstream work may need adjustment, and list the specific files/TCs likely affected based on what changed.

Do not move the ticket between columns; refinement can happen at any stage.
