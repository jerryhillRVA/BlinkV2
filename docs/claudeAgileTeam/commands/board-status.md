---
description: Print a snapshot of the Kanban board — tickets in each column, WIP counts, blocked items, and rough cycle times for recently-completed work.
argument-hint: (none)
allowed-tools: Bash, Read
---

Printing board status.

1. Load config, pull all project items: `gh project item-list $PROJECT_NUMBER --owner $OWNER --format json --limit 500`.

2. **Column snapshot** — for each column (Backlog, Ready, In Progress, In QA, In Review, Done), list up to 10 tickets with number and title. Cap Done at 5 most recent.

3. **WIP metrics**:
   - Count per column.
   - Read `wipLimit` from config. Flag if `In Progress + In QA + In Review` exceeds it.

4. **Blocked tickets**: list anything with the `blocked` label regardless of column.

5. **Cycle-time sketch** (approximate):
   - For the last 5 Done tickets, compute `closed_at - created_at` from `gh issue view`. It's a rough proxy; don't oversell the precision.
   - Flag any ticket >14 days old still not Done.

6. **Aging alerts**: any ticket in In QA or In Review for >3 days. These are where tickets tend to rot.

7. Format the output as a single clean markdown table-plus-lists. Keep it to one screen's worth.
