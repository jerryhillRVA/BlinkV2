---
description: Mark a ticket as blocked, recording the reason and the blocking dependency. Adds a "blocked" label (creates it if needed) and posts an explanatory comment.
argument-hint: <issue-number> <reason — required>
allowed-tools: Bash, Read, Edit, Write
---

Blocking **#$ARGUMENTS**.

1. Parse: first token is the issue number; everything after is the reason (must be non-empty).
2. Ensure a `blocked` label exists: `gh label create blocked --color FBCA04 --description "Work paused pending external dependency" 2>/dev/null || true`
3. Apply it: `gh issue edit <n> --add-label blocked`.
4. Post a comment:
   ```markdown
   ## 🚧 Blocked

   **Reason**: <reason>
   **Blocked at column**: <current status>
   **Expected unblock signal**: <ask user if not obvious from reason>
   ```
   Plus signature.
5. Do not change the ticket's column. A blocked ticket stays where it was so WIP is still visible.
6. Print a summary listing all currently-blocked tickets so the user has context.
