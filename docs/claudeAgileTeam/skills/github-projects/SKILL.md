---
name: github-projects
description: Use when any task touches a GitHub Projects V2 board — reading a board's items, finding tickets by status, adding issues to a project, or moving tickets between columns (Backlog, Ready, In progress, In QA, In Review, Done). Covers both `gh` CLI shortcuts and the GraphQL calls required for operations the CLI doesn't expose directly. Triggers on any mention of the Kanban board, column moves, or project item IDs.
---

# GitHub Projects V2 operations

All project operations read IDs from `.claude/kanban.config.json`. Do not hardcode IDs.

```bash
# Load config
CONFIG=$(cat .claude/kanban.config.json)
OWNER=$(echo "$CONFIG" | jq -r '.owner')
PROJECT_NUMBER=$(echo "$CONFIG" | jq -r '.number')
PROJECT_ID=$(echo "$CONFIG" | jq -r '.projectId')
STATUS_FIELD_ID=$(echo "$CONFIG" | jq -r '.statusField.id')

# Get a status option's ID by column name (e.g. "In progress")
status_option_id() {
  echo "$CONFIG" | jq -r --arg n "$1" '.statusField.options[$n]'
}
```

## Common operations

### Find a ticket's project item ID by issue number

```bash
find_item_id() {
  local issue_num=$1
  gh project item-list $PROJECT_NUMBER --owner $OWNER --format json --limit 200 \
    | jq -r --argjson n $issue_num '.items[] | select(.content.number == $n) | .id'
}
```

### List tickets in a given column

```bash
list_by_status() {
  local status="$1"
  gh project item-list $PROJECT_NUMBER --owner $OWNER --format json --limit 200 \
    | jq -r --arg s "$status" '.items[] | select(.status == $s) | {n: .content.number, title: .content.title}'
}
```

### Move a ticket to a column

```bash
move_ticket() {
  local issue_num=$1
  local target_status="$2"  # e.g. "In progress"
  local item_id=$(find_item_id $issue_num)
  local option_id=$(status_option_id "$target_status")
  gh project item-edit \
    --id "$item_id" \
    --project-id "$PROJECT_ID" \
    --field-id "$STATUS_FIELD_ID" \
    --single-select-option-id "$option_id"
}
```

### Add an issue to the project (for newly created tickets)

```bash
add_issue_to_project() {
  local issue_url=$1
  gh project item-add $PROJECT_NUMBER --owner $OWNER --url "$issue_url"
}
```

### Read a ticket's current status

```bash
get_status() {
  local issue_num=$1
  gh project item-list $PROJECT_NUMBER --owner $OWNER --format json --limit 200 \
    | jq -r --argjson n $issue_num '.items[] | select(.content.number == $n) | .status'
}
```

## Pre-flight guard

Before any state transition, verify the ticket is in the expected source column. Refuse with a clear message if not.

```bash
require_status() {
  local issue_num=$1
  local expected=$2
  local actual=$(get_status $issue_num)
  if [ "$actual" != "$expected" ]; then
    echo "ERROR: Ticket #$issue_num is in '$actual', expected '$expected'. Refusing to proceed."
    exit 1
  fi
}
```

## Claim/lock via assignee

```bash
assign_to_bot() {
  local issue_num=$1
  local bot=$(echo "$CONFIG" | jq -r '.botAssignee')
  [ -z "$bot" ] && bot=$(gh api user --jq .login)
  # Refuse if already assigned to someone else
  local current=$(gh issue view $issue_num --json assignees --jq '.assignees[0].login // ""')
  if [ -n "$current" ] && [ "$current" != "$bot" ]; then
    echo "ERROR: #$issue_num already assigned to $current. Refusing to proceed."
    exit 1
  fi
  gh issue edit $issue_num --add-assignee "$bot" >/dev/null
}
```
