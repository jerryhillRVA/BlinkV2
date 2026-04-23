---
description: Clear the blocked state on a ticket and note what resolved the block.
argument-hint: <issue-number> [resolution note]
allowed-tools: Bash, Edit, Write
---

Unblocking **#$ARGUMENTS**.

1. Confirm the ticket has the `blocked` label; if not, note that and exit cleanly.
2. Remove the label: `gh issue edit <n> --remove-label blocked`.
3. Post a comment:
   ```markdown
   ## ✅ Unblocked

   **Resolution**: <note from $ARGUMENTS or "see above">
   Resuming from column: <current status>
   ```
   Plus signature.
4. Suggest the next command based on the current column (e.g. "Run `/design-ticket <n>` to continue" if in Backlog).
