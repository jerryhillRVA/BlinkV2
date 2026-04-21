# Content MVP — Integration Test Cases

## Prerequisites

- AFS running on `localhost:8000` with the `fuzzee-coffee` tenant present.
- API running on `localhost:3000` with `AGENTIC_FS_URL=http://localhost:8000` (unless the test explicitly unsets it, e.g. TC-17).
- Web app running on `localhost:4200`.
- Chrome with DevTools Network tab.
- `fuzzee-coffee` `content-items/` namespace is empty at the start of TC-1.
- `hive-collective` is a mock-only workspace (used when AFS is not configured).

### Clean-state purge (run before TC-1; rerun between runs as needed)

```bash
for fid in $(curl -s "http://localhost:8000/v1/fuzzee-coffee/dirs?namespace=content-items" | jq -r '.entries[] | .file_id'); do
  curl -s -X DELETE "http://localhost:8000/v1/fuzzee-coffee/files/$fid" > /dev/null
done
curl -s "http://localhost:8000/v1/fuzzee-coffee/dirs?namespace=content-items" | jq '.entries'
# Expected: []
```

## AFS API Reference

```bash
# List tenants
curl http://localhost:8000/admin/tenants

# List namespaces for a tenant
curl "http://localhost:8000/v1/{tenant}/namespaces"

# List files in a namespace
curl "http://localhost:8000/v1/{tenant}/dirs?namespace={namespace}"

# Batch retrieve file contents (preferred over single GET)
curl -X POST http://localhost:8000/v1/{tenant}/files/batch \
  -H 'Content-Type: application/json' \
  -d '{"file_ids":["<file_id>"],"include_content":true}'

# Delete a file
curl -X DELETE http://localhost:8000/v1/{tenant}/files/{file_id}
```

## Bash helpers

Source once per shell session:

```bash
fileId() {
  # $1 tenant, $2 namespace, $3 filename
  curl -s "http://localhost:8000/v1/$1/dirs?namespace=$2" \
    | jq -r ".entries[] | select(.name == \"$3\") | .file_id"
}

fetch() {
  # $1 tenant, $2 namespace, $3 filename — prints JSON content
  local fid
  fid=$(fileId "$1" "$2" "$3")
  [ -z "$fid" ] && echo "null" && return
  curl -s -X POST "http://localhost:8000/v1/$1/files/batch" \
    -H 'Content-Type: application/json' \
    -d "{\"file_ids\":[\"$fid\"],\"include_content\":true}" \
    | jq '.files[0].content'
}

listItemFiles() {
  # $1 tenant — prints c-*.json names
  curl -s "http://localhost:8000/v1/$1/dirs?namespace=content-items" \
    | jq -r '.entries[] | select(.name | test("^c-")) | .name'
}
```

---

## TC-1: Bootstrap — first create in empty `content-items` namespace

### Purpose

Verify that when `content-items/` does not yet exist on a tenant, creating the first idea via the UI creates both the item file and the primary index manifest.

### Preconditions

```bash
# Run the purge snippet above, then confirm
curl -s "http://localhost:8000/v1/fuzzee-coffee/dirs?namespace=content-items" | jq '.entries'
# Expected: []
```

### Steps

1. Open `http://localhost:4200/workspace/fuzzee-coffee/content`.
2. In the Ideas column, click the `+` button.
3. Enter title `TC1 bootstrap idea`, description `first idea ever`. Select the first pillar and first segment.
4. Click Save.

### Verification via AFS API

```bash
# 1. content-items namespace now exists
curl -s "http://localhost:8000/v1/fuzzee-coffee/namespaces" | jq '.namespaces | index("content-items")'
# Expected: non-null integer

# 2. Two files: the item and the index
curl -s "http://localhost:8000/v1/fuzzee-coffee/dirs?namespace=content-items" | jq '.entries | map(.name)'
# Expected: ["c-<uuid>.json", "_content-items-index.json"] (order may vary)

# 3. Item file contents
ITEM_NAME=$(listItemFiles fuzzee-coffee | head -n1)
fetch fuzzee-coffee content-items "$ITEM_NAME"

# 4. Index contents
fetch fuzzee-coffee content-items _content-items-index.json
```

### Expected Results

- Item file JSON:
  - `stage == "idea"`, `status == "draft"`
  - `title == "TC1 bootstrap idea"`, `description == "first idea ever"`
  - `pillarIds.length == 1`, `segmentIds.length == 1`
  - `createdAt` and `updatedAt` are ISO timestamps
  - `archived` absent or `false`
- Index file JSON:
  - `totalCount == 1`
  - `items[0].id` equals the item file's id
  - `items[0].stage == "idea"`, `items[0].status == "draft"`, `items[0].title == "TC1 bootstrap idea"`
  - `items[0].platform == null`, `items[0].contentType == null`, `items[0].parentIdeaId == null`, `items[0].parentConceptId == null`, `items[0].scheduledDate == null`
  - `items[0].pillarIds` and `segmentIds` match the item file
  - `items[0].archived` is `false` or absent
  - `lastUpdated` is ISO and `>= items[0].updatedAt`
- `_content-items-archive-index.json` is NOT present yet.

### Data Integrity Checks

- [ ] Item file parses as valid JSON.
- [ ] Index file parses as valid JSON.
- [ ] `items[0].id === <item-file>.id`.
- [ ] Every lean field on the index row equals the same field on the item file.
- [ ] `archived` absent or `false` on item file.
- [ ] `lastUpdated >= items[0].updatedAt`.

---

## TC-2: Create Idea — field-level verification

### Purpose

Create a second idea and verify every field in the item file and index row.

### Steps

1. In the Ideas column, click `+`.
2. Enter title `TC2 idea A`, description `idea-A description`. Pick two pillars (record their ids) and one segment. Save.

### Verification via AFS API

```bash
curl -s "http://localhost:8000/v1/fuzzee-coffee/dirs?namespace=content-items" | jq '.entries | map(.name)'

# Fetch both item files
for NAME in $(listItemFiles fuzzee-coffee); do
  echo "=== $NAME ==="
  fetch fuzzee-coffee content-items "$NAME"
done

fetch fuzzee-coffee content-items _content-items-index.json | jq '.items | length, .totalCount'
```

### Expected Results

- Two `c-*.json` files exist.
- The new item file has `stage="idea"`, `status="draft"`, title/description as entered, `pillarIds.length == 2`, `segmentIds.length == 1`, `tags == []`, ISO `createdAt == updatedAt`.
- Primary index now has `totalCount == 2`. The new item's index row has matching lean fields and nulls for platform/contentType/parentIdeaId/parentConceptId/scheduledDate.

### Data Integrity Checks

- [ ] Index `totalCount` equals count of `c-*.json` files.
- [ ] Each `c-*.json` file has a corresponding index row with matching `id`.
- [ ] No duplicate `id`s in the index.

---

## TC-3: Create Concept from existing Idea

### Purpose

Verify that creating a Concept with a `parentIdeaId` persists all concept-specific fields.

### Steps

1. From the Ideas column, use the "move to Concept" action (or create a new concept and select `parentIdeaId` from the UI) against the item created in TC-2.
2. Fill in:
   - Title `TC3 concept A`
   - Description `concept description`
   - Hook `These 5 breakfasts fight inflammation.`
   - Objective `education`
   - Key message `Anti-inflammatory eating starts at breakfast`
   - Angle `Science-backed, made simple`
   - Format notes `b-roll`
   - `claimsFlag` checked
   - Source link `https://example.com/claim`
   - Risk level `medium`
   - Target publish window start/end
   - Target platforms: `instagram / carousel`, `linkedin / ln-document`
   - CTA type `other`, text `Save this`
3. Save.

### Verification via AFS API

```bash
# Find the concept file
for NAME in $(listItemFiles fuzzee-coffee); do
  STAGE=$(fetch fuzzee-coffee content-items "$NAME" | jq -r '.stage')
  [ "$STAGE" = "concept" ] && CONCEPT_FILE=$NAME && break
done
echo "concept file: $CONCEPT_FILE"
fetch fuzzee-coffee content-items "$CONCEPT_FILE" > /tmp/concept.json
jq '{stage,status,parentIdeaId,title,hook,objective,keyMessage,angle,formatNotes,claimsFlag,sourceLinks,riskLevel,targetPublishWindow,targetPlatforms,cta}' /tmp/concept.json
fetch fuzzee-coffee content-items _content-items-index.json | jq '.items[] | select(.stage=="concept")'
```

### Expected Results

- `stage == "concept"`, `status == "in-progress"` (or `"draft"`, whichever the modal emits — document the actual value observed).
- `parentIdeaId` equals the idea's id from TC-2.
- Every concept-specific field entered above appears verbatim at the correct JSON path.
- `targetPlatforms` is an array of `{ platform, contentType, postId: null }` tuples in the order selected.
- Index row has lean fields only (no `hook`, `objective`, `cta`, `targetPlatforms` in the row).

### Data Integrity Checks

- [ ] Concept file parses.
- [ ] `parentIdeaId` points to an existing idea file.
- [ ] `targetPlatforms[*].postId` are null (no posts created yet).
- [ ] Index row's `parentIdeaId` equals file's `parentIdeaId`.

---

## TC-4: Create Post via production-brief path

### Purpose

Verify that creating a Post from the "+ Posts in Production" action persists stage/status and the full `production.brief` block.

### Steps

1. In the Posts in Production column, click `+`.
2. Fill in platform `instagram`, contentType `reel`, title `TC4 post`, description, pillar, segment, objective `engagement`, key message, CTA (type `follow`, text `Follow us`), tone preset `casual`, do/don't checklists.
3. Expand the platform rules: duration target `60`, hook type `outcome-first`, loop ending `true`.
4. Expand creative plan: hook `Your body shouldn't feel 80 when you're 40.`, story arc `hook-promise-sections-recap-cta`, music notes `Lo-fi ambient`.
5. Save. (If the flow asks to link a concept, pick the TC-3 concept as `parentConceptId`.)

### Verification via AFS API

```bash
for NAME in $(listItemFiles fuzzee-coffee); do
  STAGE=$(fetch fuzzee-coffee content-items "$NAME" | jq -r '.stage')
  [ "$STAGE" = "post" ] && POST_FILE=$NAME && break
done
fetch fuzzee-coffee content-items "$POST_FILE" > /tmp/post.json
jq '{stage,status,platform,contentType,parentConceptId,title}' /tmp/post.json
jq '.production.brief.strategy' /tmp/post.json
jq '.production.brief.platformRules' /tmp/post.json
jq '.production.brief.creativePlan' /tmp/post.json
jq '.production.brief.compliance' /tmp/post.json
```

### Expected Results

- `stage == "post"`, `status == "in-progress"`.
- `platform == "instagram"`, `contentType == "reel"`.
- `parentConceptId` equals the TC-3 concept's id (if linked).
- `production.brief.strategy` contains objective, audienceSegmentIds, pillarIds, keyMessage, ctaType, ctaText, tonePreset, doChecklist, dontChecklist exactly as entered.
- `production.brief.platformRules` has durationTarget/hookType/loopEnding.
- `production.brief.creativePlan` has hook/storyArc/musicNotes.

### Data Integrity Checks

- [ ] Index row has `stage == "post"`, `status == "in-progress"`, `platform == "instagram"`, `contentType == "reel"`, `parentConceptId` set, `scheduledDate == null`.
- [ ] No `production` block leaks into the index row.

---

## TC-5: Edit existing Idea

### Purpose

Editing an idea must replace the item file in place and update the same row in the primary index.

### Steps

1. Open the TC-2 idea detail page.
2. Change title to `TC2 idea A (edited)`, description to `edited desc`. Add a tag `edited-tag`. Save.

### Verification via AFS API

```bash
# Record the item's file_id and pre-edit updatedAt
ITEM_NAME=<TC-2 item name>
BEFORE=$(fetch fuzzee-coffee content-items "$ITEM_NAME" | jq -r '.updatedAt')

# After save:
fetch fuzzee-coffee content-items "$ITEM_NAME" | jq '{title,description,tags,createdAt,updatedAt}'
AFTER=$(fetch fuzzee-coffee content-items "$ITEM_NAME" | jq -r '.updatedAt')
[ "$AFTER" \> "$BEFORE" ] && echo "updatedAt bumped" || echo "NOT bumped"

fetch fuzzee-coffee content-items _content-items-index.json | jq '.items[] | select(.id=="'"${ITEM_NAME%.json}"'") | {title,updatedAt}'
fetch fuzzee-coffee content-items _content-items-index.json | jq '.lastUpdated'
```

### Expected Results

- Item file's title/description/tags reflect the edit.
- `updatedAt > createdAt` and newer than BEFORE.
- Corresponding index row has the new title and updated `updatedAt`.
- Index `lastUpdated` is newer than BEFORE.

### Data Integrity Checks

- [ ] File count in `content-items/` unchanged (no new file created for edit).
- [ ] Only one index row matches the item id.
- [ ] All other index rows untouched.

---

## TC-6: Edit Concept `targetPlatforms` array

### Purpose

Adding and removing `targetPlatforms` entries must persist.

### Steps

1. Open the TC-3 concept detail.
2. Add a target platform `facebook / fb-feed-post`. Save.
3. Remove the `linkedin / ln-document` entry. Save.

### Verification via AFS API

```bash
CONCEPT_NAME=<TC-3 concept name>
fetch fuzzee-coffee content-items "$CONCEPT_NAME" | jq '.targetPlatforms'
```

### Expected Results

- After step 2: three entries (instagram/carousel, linkedin/ln-document, facebook/fb-feed-post) in the order added.
- After step 3: two entries (instagram/carousel, facebook/fb-feed-post).
- `postId` remains null on every entry (no posts auto-created).

### Data Integrity Checks

- [ ] Array preserves insertion order.
- [ ] No duplicate platform/contentType pairs.

---

## TC-7: Edit Post full production fields

### Purpose

Every production-tab field typed into the UI must land at the correct JSON path in the item file.

### Steps

1. Open the TC-4 post detail.
2. Fill in each section:
   - Outputs: postCopy, script, hook, hashtags (`#test`, `#mvp`), mentions (`@x`), ctaLine.
   - Blueprint: add 3 units (hook, value, cta), set `formatCoherenceConfirmed`, `logicalProgressionConfirmed`, `accessibilityPlanConfirmed` all to true; aspectRatio `9:16`, runtimeSeconds `60`, unitCountTarget `3`.
   - Assets: add one master upload `video-final.mp4` with size and addedAt.
   - Packaging: publishAction `schedule`, visibility `public`, scheduleAt ISO, title, packagedCopy, keywords (`morning routine`, `mobility`).
   - QA: add 3 checklist items in groups `brand`, `accessibility`, `links`; add approvals `brand-reviewer` (approved) and `publisher` (pending); qaNotes `ready for publish`.
   - Activity: add events `status`, `approval`, `asset`, `qa`, `packaging`; one decisionLog entry.
3. Save.

### Verification via AFS API

```bash
POST_NAME=<TC-4 post name>
fetch fuzzee-coffee content-items "$POST_NAME" > /tmp/post.json

jq '.production.outputs | {postCopy,script,hook,hashtags,mentions,ctaLine}' /tmp/post.json
jq '.production.outputs.blueprintData | {units,formatCoherenceConfirmed,logicalProgressionConfirmed,accessibilityPlanConfirmed,aspectRatio,runtimeSeconds,unitCountTarget}' /tmp/post.json
jq '.production.outputs.assetsData.masterUploads' /tmp/post.json
jq '.production.outputs.packagingData' /tmp/post.json
jq '.production.outputs.qaData | {humanChecklist,approvals,qaNotes}' /tmp/post.json
jq '.production.outputs.activityData | {events,decisionLog}' /tmp/post.json
```

### Expected Results

Each query returns the values typed into the UI.

### Data Integrity Checks

- [ ] Arrays preserve UI order (units, hashtags, humanChecklist, events).
- [ ] Every scalar matches exactly.
- [ ] Index row for this post contains ONLY the lean field set.

---

## TC-8: Status transitions (draft → in-progress → review → scheduled → published)

### Purpose

Each status change updates both the item file and the index row.

### Steps

1. Pick the TC-2 idea. Advance its status step-by-step (`draft → in-progress → review → scheduled → published`) via the detail page or kanban drag.

### Verification via AFS API

After each transition:

```bash
ITEM_NAME=<item>
fetch fuzzee-coffee content-items "$ITEM_NAME" | jq '{status,updatedAt}'
fetch fuzzee-coffee content-items _content-items-index.json | jq '.items[] | select(.id=="'"${ITEM_NAME%.json}"'") | {status,updatedAt}'
```

### Expected Results

- Both file and index row reflect the new status after every transition.
- `updatedAt` is strictly monotonically increasing.
- `lastUpdated` on the index bumps on every transition.

### Data Integrity Checks

- [ ] File status == Index row status at each point.

---

## TC-9: Stage advance (idea → concept → post)

### Purpose

Stage transitions persist on file and index.

### Steps

1. Create a fresh idea TC9-idea.
2. Use the "Convert to Concept" action. Confirm promptly.
3. Use the "Convert to Post" action.

### Verification via AFS API

After each step:

```bash
fetch fuzzee-coffee content-items "$ITEM_NAME" | jq '{stage,status,updatedAt}'
fetch fuzzee-coffee content-items _content-items-index.json | jq '.items[] | select(.id=="'"${ITEM_NAME%.json}"'") | {stage,status,updatedAt}'
```

### Expected Results

- Stage transitions land in both places.
- `updatedAt` bumps each time.

### Data Integrity Checks

- [ ] Stage in file == Stage in index row after each step.
- [ ] If stage is promoted, the new fields (e.g. `hook`, `objective` on concept promotion) are initialized or empty, not undefined.

---

## TC-10: Archive from kanban — primary → archive index move

### Purpose

Archiving moves the index entry from primary → archive, sets `archived: true` on the item file, and bumps both indexes.

### Preconditions

Pick any active item (e.g. TC-2 idea). Snapshot both indexes' `totalCount` and `lastUpdated`.

### Steps

1. Open the item detail page.
2. Click Archive. Confirm the dialog.
3. Navigate back to the kanban.

### Verification via AFS API

```bash
ITEM_NAME=<item>
ID=${ITEM_NAME%.json}

fetch fuzzee-coffee content-items "$ITEM_NAME" | jq '{archived,updatedAt}'
fetch fuzzee-coffee content-items _content-items-index.json | jq '.items | map(.id) | index("'"$ID"'")'
fetch fuzzee-coffee content-items _content-items-archive-index.json | jq '.items | map(.id) | index("'"$ID"'")'
fetch fuzzee-coffee content-items _content-items-index.json | jq '{totalCount,lastUpdated}'
fetch fuzzee-coffee content-items _content-items-archive-index.json | jq '{totalCount,lastUpdated}'
```

### Expected Results

- `item.archived == true` and `item.updatedAt` newer than the pre-archive snapshot.
- Primary index no longer lists the id; `totalCount` decreased by 1; `lastUpdated` refreshed.
- Archive index now lists the id exactly once with `archived: true`; `totalCount` increased by 1; `lastUpdated` refreshed.

### Data Integrity Checks

- [ ] Primary `items | map(.id) | index("$ID")` returns null.
- [ ] Archive `items | map(.id) | index("$ID")` returns a non-null integer.
- [ ] Archive row's fields equal the item file's lean subset.
- [ ] `primary.totalCount + archive.totalCount` equals the count of `c-*.json` files in the namespace.
- [ ] `archived` flag on every archive-index row is `true`.

---

## TC-11: Show Archived filter

### Purpose

Toggling the filter swaps the data source between primary and archive indexes.

### Steps

1. On the kanban, with "Show Archived" off, confirm the archived item from TC-10 is NOT visible.
2. Open the Filter panel and enable "Show Archived".
3. Confirm only archived items are visible. Active items disappear.
4. Turn "Show Archived" off. Confirm active items return and archived items disappear.

### Verification via Network tab

- Step 2 triggers `GET /api/workspaces/fuzzee-coffee/content-items/archive-index` once.
- Step 4 does NOT re-fetch — state service already has both signals.

### Expected Results

- Kanban content matches whichever index signal is active.
- No 500 or 404 errors.

### Data Integrity Checks

- [ ] Client does NOT apply a `!archived` filter on the primary signal — it's already pre-filtered server-side.
- [ ] Toggling the filter does not mutate AFS state.

---

## TC-12: Unarchive

### Purpose

Unarchiving reverses the move: row returns to primary, item file `archived: false`.

### Steps

1. With "Show Archived" on, open the TC-10 archived item.
2. Click Unarchive. Confirm.
3. Toggle "Show Archived" off and verify the item is visible in its original column.

### Verification via AFS API

```bash
fetch fuzzee-coffee content-items "$ITEM_NAME" | jq '{archived,updatedAt}'
fetch fuzzee-coffee content-items _content-items-index.json | jq '.items | map(.id) | index("'"$ID"'")'
fetch fuzzee-coffee content-items _content-items-archive-index.json | jq '.items | map(.id) | index("'"$ID"'")'
```

### Expected Results

- `item.archived == false` and `item.updatedAt` bumped.
- Primary index has the id; archive index does not.

### Data Integrity Checks

- [ ] Row does not appear in both indexes.
- [ ] Primary `totalCount` increased by 1; archive `totalCount` decreased by 1.

---

## TC-13: Delete content item

### Purpose

Deleting removes the item file AND the entry from whichever index held it.

### Steps

1. Choose an active item (not the one tied to concepts/posts if the UI blocks deletion of parents).
2. Click Delete on the detail page. Confirm.

### Verification via AFS API

```bash
curl -s "http://localhost:8000/v1/fuzzee-coffee/dirs?namespace=content-items" | jq '.entries | map(.name)'
# Expected: the item's c-<id>.json is NOT in the list

fetch fuzzee-coffee content-items _content-items-index.json | jq '.items | map(.id) | index("'"$ID"'")'
# Expected: null
```

### Expected Results

- Item file gone from AFS.
- Entry removed from its index; `totalCount` decreased; `lastUpdated` refreshed.

### Data Integrity Checks

- [ ] No dangling index row referencing a non-existent file.
- [ ] File count equals index total count across both indexes.

---

## TC-14: Kanban label rename

### Purpose

The middle column label shows "Posts in Production", not "In Production".

### Steps

1. Open `http://localhost:4200/workspace/fuzzee-coffee/content`.
2. Inspect the kanban columns.

### Expected Results

- The third column's heading reads `Posts in Production` (the count suffix like `(2)` may append).
- The other column labels are unchanged: `Ideas`, `Concepts`, `Review & Schedule`, `Published`.

### Data Integrity Checks

- [ ] Grep the source for `'In Production'` — only the rename commit should have touched that string in `content.constants.ts`.

---

## TC-15: Filter panel (pillar, platform, content type, search)

### Purpose

Client-side filters over the index-sourced data behave correctly.

### Steps

1. Seed a variety of ideas/concepts/posts covering multiple pillars, platforms, and content types.
2. Open the Filter panel. Select a single pillar. Confirm only items tagged with that pillar remain.
3. Add a platform filter. Confirm the intersection.
4. Add a content type filter. Confirm the intersection.
5. Type a search term matching at least one remaining item's title. Confirm filter narrows.
6. Click "Clear all".

### Expected Results

- Each filter narrows the visible set correctly.
- Clearing all filters restores the full active set.
- No AFS calls fire during filter operations (all client-side on the already-loaded index signal).

### Data Integrity Checks

- [ ] Filter state does NOT mutate AFS.
- [ ] Counts in column headers update reactively.

---

## TC-16: Concurrency / refresh

### Purpose

Changes made via the UI survive a hard reload.

### Steps

1. Create a fresh idea and edit its description.
2. Reload the page (`Cmd+R`).

### Expected Results

- The idea is visible in Ideas column with its updated description.
- No console errors.

### Verification via AFS API

Same checks as TC-5 after the reload: file content matches UI.

### Data Integrity Checks

- [ ] Index and file agree.
- [ ] No cached stale state in the UI after reload.

---

## TC-17: Mock fallback (AGENTIC_FS_URL unset)

### Purpose

All read paths and the page render with mock data when AFS is not configured. Writes must not throw and must echo back without persisting.

### Setup

```bash
# Stop the API server.
# In apps/blinksocial-api/.env, comment out or unset AGENTIC_FS_URL.
# Restart: npm run start:api
```

### Steps

1. Navigate to `http://localhost:4200/workspace/hive-collective/content`.
2. Confirm the kanban renders three items from `apps/blinksocial-api/src/mocks/data/hive-collective/content-items/` (idea1, concept1, post1).
3. Toggle "Show Archived" on. Confirm the list is empty and no 500s fire. (The mock archive-index file is an empty envelope.)
4. Toggle off.
5. Click "+ New Content" and create an Idea. Confirm the UI accepts the input and the item appears in the kanban for the session.
6. Reload the page. Confirm the created item is NOT present (mock mode only echoes).
7. Open DevTools → Network tab. Confirm `GET /api/workspaces/hive-collective/content-items/index` returns 200 with mock payload.
8. Confirm the frontend `※` mock indicator still appears on content-items features until real data is returned.

### Teardown

```bash
# Re-set AGENTIC_FS_URL in apps/blinksocial-api/.env.
# Restart API.
```

### Expected Results

- No 500 responses.
- No console errors.
- Mock items visible; archive filter returns empty gracefully.
- Create action echoes; reload clears the in-session item.

### Data Integrity Checks

- [ ] All network responses are 200s.
- [ ] AFS is not contacted (since `AGENTIC_FS_URL` is unset).
- [ ] Mock data files on disk are unchanged after the session.

---

## TC-18: Index integrity audit (curl-only)

### Purpose

An end-to-end audit that both indexes and item files are consistent.

### Steps

Run the script below after any TC that mutates state.

```bash
TENANT=fuzzee-coffee

FILES=$(curl -s "http://localhost:8000/v1/$TENANT/dirs?namespace=content-items" \
  | jq -r '.entries[] | select(.name | test("^c-")) | .name' | sort)

PRIMARY_IDS=$(fetch "$TENANT" content-items _content-items-index.json | jq -r '.items[].id' | sort)
ARCHIVE_IDS=$(fetch "$TENANT" content-items _content-items-archive-index.json | jq -r '.items[].id' 2>/dev/null | sort)

# (1) Union of index ids == file ids
ALL_INDEX=$(echo -e "$PRIMARY_IDS\n$ARCHIVE_IDS" | grep -v '^$' | sort -u)
FILE_IDS=$(echo "$FILES" | sed 's/\.json$//' | sort)
diff <(echo "$ALL_INDEX") <(echo "$FILE_IDS")
# Expected: no output (identical)

# (2) No id appears in both indexes
comm -12 <(echo "$PRIMARY_IDS") <(echo "$ARCHIVE_IDS")
# Expected: no output

# (3) Every archive-index row has archived==true in its item file
for ID in $ARCHIVE_IDS; do
  ARCH=$(fetch "$TENANT" content-items "$ID.json" | jq -r '.archived')
  [ "$ARCH" = "true" ] || echo "MISMATCH: $ID file.archived=$ARCH"
done

# (4) Every primary-index row has archived!=true in its item file
for ID in $PRIMARY_IDS; do
  ARCH=$(fetch "$TENANT" content-items "$ID.json" | jq -r '.archived // false')
  [ "$ARCH" = "true" ] && echo "MISMATCH: $ID in primary but file.archived=true"
done

# (5) totalCount fields match items.length
fetch "$TENANT" content-items _content-items-index.json | jq '.totalCount == (.items | length)'
fetch "$TENANT" content-items _content-items-archive-index.json | jq '.totalCount == (.items | length)'
```

### Expected Results

All five checks produce no mismatch output; queries 5a/5b print `true`.

### Data Integrity Checks

- [ ] Check 1 — file set == union of index ids.
- [ ] Check 2 — no overlap between indexes.
- [ ] Check 3 — archive rows match `archived: true`.
- [ ] Check 4 — primary rows match not-archived.
- [ ] Check 5 — `totalCount` fields match.

---

## TC-19: Field-level production persistence

### Purpose

Assert every field shown in the UI's production editor is stored at the correct JSON path with matching values.

### Steps

1. Create a new post via `+ Posts in Production` with platform `instagram`, contentType `reel`, objective `engagement`, keyMessage `mobility matters`, CTA type `follow`, text `Follow us`.
2. Open the post's detail page. Fill every production field group (brief strategy, platformRules, creativePlan, compliance; outputs: postCopy, script, hook, hashtags, mentions, ctaLine; blueprintData units and flags; assetsData masterUploads; packagingData; qaData checklist and approvals; activityData events and decisionLog).
3. Save.

### Verification via AFS API

```bash
ITEM_NAME=<post c-<uuid>.json>
fetch fuzzee-coffee content-items "$ITEM_NAME" > /tmp/item.json

# Top-level
jq '{stage,status,platform,contentType,title,objective,keyMessage,cta}' /tmp/item.json

# Brief
jq '.production.brief.strategy' /tmp/item.json
jq '.production.brief.platformRules' /tmp/item.json
jq '.production.brief.creativePlan' /tmp/item.json
jq '.production.brief.compliance' /tmp/item.json

# Outputs
jq '.production.outputs | {postCopy,script,hook,hashtags,mentions,ctaLine,hookBank,scriptVersions}' /tmp/item.json

# Blueprint
jq '.production.outputs.blueprintData | {structurePattern,units,engagementDrivers,formatCoherenceConfirmed,logicalProgressionConfirmed,accessibilityPlanConfirmed,aspectRatio,runtimeSeconds,unitCountTarget,captionsStrategy,altTextStrategy,motionSafety}' /tmp/item.json

# Assets
jq '.production.outputs.assetsData | {masterUploads,creativeVariants,sourceFiles,checklistOverrides}' /tmp/item.json

# Packaging
jq '.production.outputs.packagingData | {publishAction,visibility,scheduleAt,title,packagedCopy,keywords,destinationUrl,utmSource,utmMedium,utmCampaign}' /tmp/item.json

# QA
jq '.production.outputs.qaData | {humanChecklist,approvals,qaNotes,fixAssignee,auditTrail,approved}' /tmp/item.json

# Activity
jq '.production.outputs.activityData | {events,decisionLog}' /tmp/item.json

# Index row for this post (must be lean)
ID=${ITEM_NAME%.json}
fetch fuzzee-coffee content-items _content-items-index.json | jq '.items[] | select(.id=="'"$ID"'")'
```

### Expected Results

Each query returns exactly what was typed in the UI. Strings match verbatim; arrays preserve order; booleans match.

### Data Integrity Checks

- [ ] Every scalar matches the UI input.
- [ ] Arrays (units, hashtags, humanChecklist, events, approvals) preserve UI order.
- [ ] `stage == "post"`, `status == "in-progress"` (or as selected).
- [ ] `updatedAt > createdAt`.
- [ ] The index row for the post contains ONLY the lean field set (`id`, `stage`, `status`, `title`, `platform`, `contentType`, `pillarIds`, `segmentIds`, `owner`, `parentIdeaId`, `parentConceptId`, `scheduledDate`, `archived`, `createdAt`, `updatedAt`) — no `production`, `description`, `hook`, `tags`, or `cta` in the row.
