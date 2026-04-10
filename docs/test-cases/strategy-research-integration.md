# Strategy & Research Page — AFS Integration Test Cases

## Prerequisites
- AFS running on `localhost:8000`
- API running on `localhost:3000` with `AGENTIC_FS_URL=http://localhost:8000`
- Web app running on `localhost:4200`
- Chrome browser with DevTools Network tab available
- `fuzzee-coffee` workspace exists in AFS (onboarded prior to this work)
- `hive-collective` is a mock workspace (used when AFS is not configured)

## AFS API Reference
```bash
# List tenants
curl http://localhost:8000/admin/tenants

# List namespaces for a tenant
curl http://localhost:8000/v1/{tenantId}/namespaces

# List files in a namespace
curl http://localhost:8000/v1/{tenantId}/dirs?namespace={namespace}

# Retrieve file content (batch)
curl -X POST http://localhost:8000/v1/{tenantId}/files/batch \
  -H 'Content-Type: application/json' \
  -d '{"file_ids": ["<file_id>"]}'
```

---

## TC-1: Onboard New Workspace (AFS running)

### Steps
1. Navigate to `http://localhost:4200/new-workspace` or start onboarding via the dashboard
2. Enter a workspace name (e.g., "Test Wellness Co")
3. Complete the discovery conversation through all 7 sections:
   - Business Overview
   - Brand & Voice
   - Audience
   - Competitors
   - Content Strategy
   - Channels & Capacity
   - Expectations & Goals
4. Click "Generate Blueprint" when the agent indicates readiness
5. Review the blueprint and click "Create Workspace"
6. Complete the wizard form and finalize

### Verification via AFS API
```bash
# 1. Find the new tenant
curl http://localhost:8000/admin/tenants | jq '.tenants[] | select(. | contains("test-wellness"))'

# 2. Verify settings files exist
curl "http://localhost:8000/v1/test-wellness-co/dirs?namespace=settings"

# Expected files: general.json, brand-voice.json, business-objectives.json,
# channel-strategy.json, platforms.json, skills.json, brand-positioning.json,
# calendar.json, notifications.json, security.json

# 3. Verify namespace directories
curl "http://localhost:8000/v1/test-wellness-co/dirs?namespace=content-pillars"
# Expected: {pillarId}.json files + _content-mix.json

curl "http://localhost:8000/v1/test-wellness-co/dirs?namespace=audience-segments"
# Expected: {segmentId}.json files + _audience-insights.json

curl "http://localhost:8000/v1/test-wellness-co/dirs?namespace=research-sources"
# Expected: may be empty for new workspaces (populated later)

curl "http://localhost:8000/v1/test-wellness-co/dirs?namespace=competitor-insights"
# Expected: may be empty for new workspaces (populated later)
```

### Expected Results
- All settings files created with data from the blueprint
- Content pillars and audience segments created as individual files in their namespaces
- `_content-mix.json` exists in `content-pillars/` with 5 default categories totaling 100%
- `channel-strategy.json` has `channels` array populated with platform entries from onboarding (not empty)
- `brand-voice.json` has populated `voiceAttributes` array (not empty) and `toneByContext` array (not empty)
- Each audience segment file has a `description` field that is NOT identical to the `name` field
- Workspace appears in the dashboard with "active" status

### Data Integrity Checks (BUG-01, BUG-02, BUG-04, BUG-05)
- [ ] `channel-strategy.json` → `channels` array has >= 1 entry with `platform`, `active`, `role` fields
- [ ] `content-pillars/_content-mix.json` → `targets` array has 5 entries with percentages summing to 100
- [ ] `brand-voice.json` → `voiceAttributes` array has >= 1 entry with `id`, `label`, `description`
- [ ] `brand-voice.json` → `toneByContext` array has >= 1 entry with `id`, `context`, `tone`, `example`
- [ ] Each `audience-segments/seg-X.json` → `description` !== `name`
- [ ] Content Strategy step shows audience chips from user's actual audience segments (not hardcoded "Engineers, Founders")

---

## TC-2: Validate Blueprint Data on Research Pages (AFS running)

### Steps
1. Navigate to `http://localhost:4200/workspace/{tenantId}/strategy`
2. Click through each sidebar view and verify data matches the blueprint:

#### Brand Voice & Tone
- [ ] Content Mission Statement populated from blueprint's `brandVoice.contentMission`
- [ ] Brand Personality attributes populated from blueprint's `brandVoice.voiceAttributes` (not empty)
- [ ] Tone Shifts table populated with context entries (not empty)
- [ ] Platform Nuances fields visible for **active platforms only** (inactive platforms hidden)
- [ ] Vocabulary Guide sections visible (Use/Avoid)

#### Strategic Pillars
- [ ] Pillar cards match blueprint's `contentPillars` (name, description, color)
- [ ] "Add Goal" link present on each card without goals
- [ ] Goal summaries shown inline on cards with goals (metric, current/target, unit, progress bar)
- [ ] Content Distribution Analysis section visible

#### Audience
- [ ] Segment cards match blueprint's `audienceProfiles` (name, description — description is NOT name)
- [ ] Customer Journey accordion present on each card
- [ ] AI Analyze Audience section visible

#### Channel Strategy
- [ ] Platform accordions present (not an empty page) for each onboarded channel
- [ ] If channels were populated during onboarding: each expanded platform shows Role, Posting Cadence, Primary Audience, Primary Goal, Content Types, Tone Adjustment, Strategy Notes
- [ ] Primary Audience dropdown shows workspace-specific audience segment names (not hardcoded wellness personas)
- [ ] If channels are empty: platform picker UI shown with "Initialize Channels" button

#### Content Mix
- [ ] Sliders present for each content category (5 default categories)
- [ ] Total shows 100% (balanced)
- [ ] Actual vs Target comparison section visible
- [ ] "Add Category" button present for custom categories

#### Research Sources
- [ ] Source cards displayed (or empty state if no sources yet)
- [ ] Filter by pillar dropdown populated with pillar names
- [ ] "Add Source" button present for manual entry
- [ ] AI Discover Sources button present

#### Competitor Deep Dive
- [ ] Competitor cards displayed (or empty state message: "No competitors yet") when none exist
- [ ] Each card shows: name, platform, content type, topic, frequency, relevancy badge
- [ ] AI Competitor Scan button present
- [ ] Add Competitor button present

### AFS Cross-Verification
For each view, retrieve the corresponding AFS file and compare values:
```bash
# List settings files to find file_ids
curl "http://localhost:8000/v1/{tenantId}/dirs?namespace=settings"
# Find brand-voice.json file_id from the response, then:
curl -X POST http://localhost:8000/v1/{tenantId}/files/batch \
  -H 'Content-Type: application/json' \
  -d '{"file_ids": ["<brand-voice-file-id>"]}'
```

---

## TC-3: Update Fields and Validate Persistence (AFS running)

For each step: make the edit in the UI, save, reload the page, and verify the change persisted. Then verify via AFS API.

### Brand Voice & Tone
1. [ ] Edit mission statement text -> Save Mission -> Reload -> Verify text persisted
2. [ ] Click "Add Attribute" -> Fill in label, description, DO/DON'T examples -> Save -> Verify in `settings/brand-voice.json` (should persist independently without clicking Save Mission)
3. [ ] Edit an existing attribute -> Save -> Verify updated in AFS
4. [ ] Delete an attribute -> Verify removed from AFS
5. [ ] Click "Add Context" in Tone Shifts -> Fill context/tone/example -> Save -> Verify in AFS (independent persistence)
6. [ ] Edit a tone context row -> Save -> Verify
7. [ ] Delete a tone context row -> Verify removed from AFS
8. [ ] Type in a Platform Nuance field (e.g., Instagram tone notes) -> Tab out (blur) -> Verify saved to `platformToneAdjustments` in AFS
9. [ ] Add a word to "Use These Words" -> Verify immediately saved to `vocabulary.preferred` in AFS
10. [ ] Add a word to "Avoid These Words" -> Verify immediately saved to `vocabulary.avoid` in AFS
11. [ ] Verify toast notifications appear for each sub-section save action

### Strategic Pillars
12. [ ] Click "Add Pillar" -> Fill name, description, select color -> Save -> Verify new file in `content-pillars/` namespace
13. [ ] Edit an existing pillar (click to open modal) -> Change name/description -> Save -> Verify file updated
14. [ ] Click "Add Goal" on a pillar -> Set metric, target, unit, period -> Save -> Verify `goals` array in pillar file
15. [ ] Verify goal summary appears inline on the pillar card after adding
16. [ ] Delete a pillar -> Save -> Verify file removed from namespace
17. [ ] Run Content Distribution Analysis -> Verify platform split uses workspace's active channels (not hardcoded Pinterest)

### Audience
18. [ ] Click "Add Segment" -> Fill name, description -> Save -> Verify new file in `audience-segments/` namespace
19. [ ] Edit an existing segment -> Change description -> Save -> Verify file updated
20. [ ] Click "Map Journey" on a segment -> Fill journey stages -> Save -> Verify `journeyStages` in segment file
21. [ ] Run "AI Analyze Audience" -> Verify insights appear and can be saved to `_audience-insights.json`

### Channel Strategy
22. [ ] If channels are empty: use platform picker to select platforms -> Click "Initialize Channels" -> Verify channels appear in accordions and in `settings/channel-strategy.json`
23. [ ] Expand a platform accordion -> Edit Role field -> Save -> Verify in `settings/channel-strategy.json`
24. [ ] Change Posting Cadence -> Save -> Verify
25. [ ] Toggle content type chips (e.g., select/deselect "Stories") -> Save -> Verify `primaryContentTypes` array
26. [ ] Edit Tone Adjustment textarea -> Save -> Verify
27. [ ] Edit Strategy Notes textarea -> Save -> Verify
28. [ ] Change Primary Audience dropdown -> Verify options are workspace audience segments -> Save -> Verify
29. [ ] Change Primary Goal dropdown -> Save -> Verify
30. [ ] Toggle Active switch off -> Save -> Verify `active: false`
31. [ ] Toggle Active switch back on -> Save -> Verify `active: true`

### Content Mix
32. [ ] Drag a category slider to change percentage -> Save -> Verify in `content-pillars/_content-mix.json`
33. [ ] Verify total still shows 100% and "Balanced" status
34. [ ] Click "Reset to Defaults" -> Verify sliders reset -> Save -> Verify
35. [ ] Click "Add Category" -> Enter custom category name and description -> Add -> Verify new entry in `_content-mix.json`
36. [ ] Click "AI Suggest Mix" -> Verify percentages distributed evenly across ALL categories (including custom ones)

### Research Sources
37. [ ] Click "AI Discover Sources" -> Wait for sources to appear -> Save -> Verify files in `research-sources/` namespace
38. [ ] Verify each source file has: id, title, url, type, relevance, pillarIds, summary, discoveredAt
39. [ ] Click "Add Source" -> Fill title, URL, type, relevance, select pillar tags, summary -> Add -> Verify file created in `research-sources/` namespace

### Competitor Deep Dive
40. [ ] Click "Add Competitor" -> Fill competitor name, platform, content type, topic, relevancy, frequency -> Add -> Verify file in `competitor-insights/` namespace
41. [ ] Verify added competitor does NOT show "Pending analysis..." as insight text
42. [ ] Click "AI Competitor Scan" -> Wait for results -> Verify 3 new competitor entries appear and are saved to AFS
43. [ ] Click "Run Teardown" on a competitor -> Verify competitor removed

### Business Objectives
44. [ ] Click "Edit" -> Verify "Add Objective" button present (up to 6 objectives supported)
45. [ ] Click "Add Objective" -> Fill category, statement, target, unit, timeframe -> Save -> Verify in `settings/business-objectives.json`
46. [ ] Edit an existing objective -> Change target value -> Save -> Verify
47. [ ] Change Status dropdown (e.g., "At Risk") -> Save -> Verify `status` field updated in AFS
48. [ ] Enter a Current Value -> Save -> Verify `currentValue` field present in AFS
49. [ ] Remove an objective -> Save -> Verify removed from array

---

## TC-4: AFS API Validation (AFS running)

### Full Data Integrity Check
After completing TC-3, run a comprehensive validation:

```bash
TENANT="<your-test-tenant-id>"

# 1. List all namespaces
curl -s "http://localhost:8000/v1/$TENANT/namespaces" | jq '.namespaces'

# 2. List files in each namespace
echo "=== Settings ==="
curl -s "http://localhost:8000/v1/$TENANT/dirs?namespace=settings" | jq '.entries[] | .name'

echo "=== Content Pillars ==="
curl -s "http://localhost:8000/v1/$TENANT/dirs?namespace=content-pillars" | jq '.entries[] | .name'

echo "=== Audience Segments ==="
curl -s "http://localhost:8000/v1/$TENANT/dirs?namespace=audience-segments" | jq '.entries[] | .name'

echo "=== Research Sources ==="
curl -s "http://localhost:8000/v1/$TENANT/dirs?namespace=research-sources" | jq '.entries[] | .name'

echo "=== Competitor Insights ==="
curl -s "http://localhost:8000/v1/$TENANT/dirs?namespace=competitor-insights" | jq '.entries[] | .name'
```

### Contract Validation
For each file, verify the JSON structure matches the contract:

- `brand-voice.json` must have: `brandVoiceDescription` (string), `voiceAttributes` (array of {id, label, description, doExample, dontExample}), `toneByContext` (array of {id, context, tone, example}), `platformToneAdjustments` (array of {platform, adjustment}), `vocabulary` ({preferred: string[], avoid: string[]})
- `business-objectives.json` must be an array of: {id, category, statement, target, unit, timeframe, currentValue?, status?}
- `channel-strategy.json` must have: `channels` (array of {platform, active, role, primaryContentTypes, toneAdjustment, postingCadence, primaryAudience, primaryGoal, notes})
- `_content-mix.json` must have: `targets` (array of {category, label, targetPercent, color, description})
- `_audience-insights.json` must have: `insights` (array of {segmentId, interests, painPoints, peakActivityTimes, preferredPlatforms, contentPreferences})
- Each `{pillarId}.json` must have: id, name, description, color, and optional goals[], objectiveIds[]
- Each `{segmentId}.json` must have: id, name, description (description != name), and optional journeyStages[], demographics, interests, painPoints
- Each `{sourceId}.json` must have: id, title, url, type, relevance, pillarIds, summary, discoveredAt
- Each `{insightId}.json` must have: id, competitor, platform, contentType, topic, relevancyLevel, frequency, insight

---

## TC-5: Graceful Defaults for Pre-Existing Workspaces (AFS running)

### Steps
1. Navigate to `http://localhost:4200/workspace/fuzzee-coffee/strategy`
2. Verify each view renders without errors:

#### Expected Empty States
- [ ] Brand Voice: Empty mission statement field, no attributes, no tone contexts, empty platform nuance fields, empty vocabulary lists
- [ ] Strategic Pillars: Pillar cards from onboarding data shown (if any), or empty state
- [ ] Audience: Segment cards from onboarding data shown (if any), or empty state
- [ ] Channel Strategy: Platform picker shown when channels are empty (with "Initialize Channels" button), OR platform accordions if channels exist
- [ ] Content Mix: Default slider values or empty state
- [ ] Research Sources: "No sources found for the selected filter." empty state
- [ ] Competitor Deep Dive: "No competitors yet" empty state message (not blank gray area)

3. [ ] Add data to one section (e.g., add a mission statement) -> Save
4. [ ] Reload the page -> Verify the saved data persists
5. [ ] Verify via AFS API that the new file was created in the fuzzee-coffee tenant

---

## TC-6: Mock Fallback (no AFS — run last)

### Setup
```bash
# Stop the AFS service
# Unset AGENTIC_FS_URL in your .env or environment
# Restart the API server
```

### Steps
1. Navigate to `http://localhost:4200/workspace/hive-collective/strategy`
2. Verify each view renders with mock data:

#### Expected Mock Data
- [ ] Brand Voice: Mission statement populated, 4 voice attributes (Empowering, Knowledgeable but Accessible, Warm & Inclusive, Honest & Real), 4 tone contexts, platform nuance fields
- [ ] Strategic Pillars: 5 pillars (from contentPillars in brand-voice mock)
- [ ] Audience: 5 segments (Active 40s, Thriving 50s, Yoga Enthusiasts, Fitness Beginners, Holistic Health Seekers)
- [ ] Channel Strategy: 5 platform entries (Instagram, TikTok, YouTube, Facebook active; LinkedIn inactive)
- [ ] Content Mix: 5 categories totaling 100% (Educational 35%, Entertaining 25%, Community 20%, Promotional 15%, Trending 5%)
- [ ] Research Sources: 6 sources with relevance scores
- [ ] Competitor Deep Dive: 5 competitors (Yoga with Adriene, Move with Nicole, etc.)
- [ ] Business Objectives: 3 objectives in the strip

3. [ ] Verify mock indicators (if present) appear on sections
4. [ ] Attempt to save an edit -> Verify no errors thrown (data echoed back gracefully)
5. [ ] Verify no 500 errors in browser DevTools Network tab

### Teardown
```bash
# Re-set AGENTIC_FS_URL in your .env
# Restart the API server
# Restart AFS if stopped
```

---

## TC-7: New Feature End-to-End Flows

### Brand Voice Independent Persistence
1. [ ] Navigate to Brand Voice view
2. [ ] Add a voice attribute -> Verify toast "Voice attribute saved" appears
3. [ ] Navigate to Strategic Pillars view (leave Brand Voice)
4. [ ] Navigate back to Brand Voice -> Verify the attribute is still present (persisted to AFS, not lost)
5. [ ] Repeat for: tone context, vocabulary word, platform nuance

### Channel Strategy Platform Initialization
6. [ ] Navigate to a workspace with empty channel-strategy.json
7. [ ] Verify platform picker is shown (not blank page)
8. [ ] Select 3 platforms -> Click "Initialize Channels"
9. [ ] Verify 3 platform accordions appear
10. [ ] Verify `channel-strategy.json` in AFS has 3 channel entries
11. [ ] Run "AI Generate All Strategies" -> Verify all 3 channels populated

### Dynamic Audience Dropdown
12. [ ] Navigate to Channel Strategy with populated channels
13. [ ] Expand a platform accordion -> Click Primary Audience dropdown
14. [ ] Verify options match workspace audience segment names (not "Active 40s", "Thriving 50s" etc.)

### Research Source Manual Entry
15. [ ] Navigate to Research Sources
16. [ ] Click "Add Source" -> Fill all fields including pillar tags
17. [ ] Click "Add Source" button -> Verify source card appears
18. [ ] Verify source file created in `research-sources/` namespace in AFS
19. [ ] Filter by a pillar -> Verify the new source appears/hides correctly based on pillar tags

### Competitor AI Scan
20. [ ] Navigate to Competitor Deep Dive (empty state)
21. [ ] Verify empty state message "No competitors yet" is shown
22. [ ] Click "AI Competitor Scan" -> Wait for completion
23. [ ] Verify 3 competitor cards appear with populated data (not placeholder "Pending analysis...")
24. [ ] Verify competitor files created in `competitor-insights/` namespace in AFS
25. [ ] Click "Run Teardown" on one competitor -> Verify removed from UI and AFS

### Custom Content Mix Category
26. [ ] Navigate to Content Mix
27. [ ] Click "Add Category" -> Enter name "Behind The Scenes" and description
28. [ ] Click "Add" -> Verify new slider row appears
29. [ ] Adjust the new category's slider to 10%
30. [ ] Click "AI Suggest Mix" -> Verify percentages distributed across ALL categories (including custom one)
31. [ ] Verify `_content-mix.json` includes the custom category entry

### Business Objectives Status Tracking
32. [ ] Open Business Objectives edit panel
33. [ ] Add a new objective -> Set category, statement, target=10000, unit=followers
34. [ ] Set Current Value to 3500
35. [ ] Change Status to "At Risk"
36. [ ] Save -> Verify `currentValue: 3500` and `status: "at-risk"` in AFS
37. [ ] Verify progress bar on the objective card reflects 35% (3500/10000)
38. [ ] Verify up to 6 objectives can be added (not capped at 4)

### Platform Nuances Active-Only Filter
39. [ ] Navigate to Brand Voice -> Platform Nuances section
40. [ ] Verify only active platforms from channel strategy are shown
41. [ ] If LinkedIn is inactive in channel strategy, verify it does NOT appear in Platform Nuances
42. [ ] Navigate to Channel Strategy -> Toggle LinkedIn to active -> Save
43. [ ] Navigate back to Platform Nuances -> Verify LinkedIn now appears

### Content Distribution Dynamic Platforms
44. [ ] Navigate to Strategic Pillars -> Content Distribution Analysis
45. [ ] Enter posts per week -> Run analysis
46. [ ] Verify platform split uses workspace's active channels (not hardcoded Pinterest)
47. [ ] Verify platform names match what's in channel strategy
