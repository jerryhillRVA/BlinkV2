---
description: Generate a structured review packet for a ticket that's in In Review, posted as a PR comment. Helps the human reviewer focus on high-risk areas and verify AC coverage quickly.
argument-hint: <issue-number>
allowed-tools: Bash, Read, Glob, Grep, Edit, Write
---

Preparing review packet for ticket **#$ARGUMENTS**.

1. **Preconditions**:
   - Status is `In Review`. If it's earlier, suggest the correct command. If it's Done, report the merge commit.
   - Find the associated PR: `gh pr list --state open --search "#$ARGUMENTS in:body" --json number,url`.

2. **Gather inputs**:
   - Issue body (especially ACs and design).
   - PR diff: `gh pr diff <pr-num>`.
   - Latest test report comment on the issue.
   - Commit list on the PR.

3. **Build the review packet** using the template from the `ticket-formatting` skill. Be specific:
   - For each AC, cite the file and roughly the line or symbol that implements it.
   - Rank the top 3 highest-risk files/areas in the diff, with one-sentence justification each.
   - Walkthrough should be oriented to a reviewer, not a re-summary — lead with "why" and call out surprising choices.
   - Reviewer checklist starts from the AC list but adds risk-area spot checks.

4. **Post the packet as a PR comment** (not an issue comment — PR is where review happens):
   ```bash
   gh pr comment <pr-num> --body-file /tmp/review-packet.md
   ```

5. **Add the signature block**.

6. **Report back** with a link to the PR and the packet.
