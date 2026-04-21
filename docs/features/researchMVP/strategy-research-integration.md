# Strategy & Research Page — Integration Test Cases

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
3. Complete the wizard form through all 7 steps:
   - Strategic Foundation (workspace name, purpose, mission)
   - Business Objectives (category, statement, target, unit, timeframe)
   - Brand & Voice (positioning, brand description, tone tags)
   - Audience Segments (name, demographics)
   - Platform Config (enabled platforms, default platform, max ideas/month)
   - Content Strategy (pillars with themes, audience mappings, platforms)
   - Agents/Skills
4. Click "Create Workspace" / finalize

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
- All settings files created with data from the wizard
- Content pillars and audience segments created as individual files in their namespaces
- `_content-mix.json` exists in `content-pillars/` with 5 default categories totaling 100%
- `channel-strategy.json` has `channels` array populated with platform entries from onboarding (not empty)
- `brand-voice.json` has populated `voiceAttributes` array (not empty)
- Each audience segment file has a `description` field that is NOT identical to the `name` field
- Workspace appears in the dashboard with "active" status

### Data Integrity Checks
- [ ] `channel-strategy.json` -> `channels` array has >= 1 entry with `platform`, `active`, `role` fields
- [ ] `content-pillars/_content-mix.json` -> `targets` array has 5 entries with percentages summing to 100
- [ ] `brand-voice.json` -> `voiceAttributes` array has >= 1 entry with `id`, `label`, `description`
- [ ] Each `audience-segments/seg-X.json` -> `description` !== `name`
- [ ] Content Strategy step shows audience chips from user's actual audience segments (not hardcoded names)

---

## TC-2: State Service Loads All Domains on Page Entry

### Steps
1. Navigate to `http://localhost:4200/workspace/{tenantId}/strategy`
2. Open DevTools Network tab before navigating

### Expected Network Requests (parallel via forkJoin)
- [ ] `GET /api/workspaces/{id}/settings/brand-voice` -> 200
- [ ] `GET /api/workspaces/{id}/settings/business-objectives` -> 200
- [ ] `GET /api/workspaces/{id}/settings/channel-strategy` -> 200
- [ ] `GET /api/workspaces/{id}/content-mix` -> 200
- [ ] `GET /api/workspaces/{id}/audience-insights` -> 200
- [ ] `GET /api/workspaces/{id}/research-sources` -> 200
- [ ] `GET /api/workspaces/{id}/competitor-insights` -> 200

### Expected UI
- [ ] Sidebar renders 3 sections: Strategy, Research, Content Tools
- [ ] Strategy section: Brand Voice & Tone, Strategic Pillars, Audience, Channel Strategy, Content Mix
- [ ] Research section: Research Sources, Competitor Deep Dive
- [ ] Content Tools section visible in sidebar (Content Repurposer, Series Builder, A/B Analyzer, SEO & Hashtags -- mocked only, not tested here)
- [ ] Objectives strip visible at top with business objectives
- [ ] Default view (Brand Voice) loads without errors

### Mapper Integrity
- [ ] No console errors about missing fields or undefined properties
- [ ] Brand voice data populates mission, attributes, vocabulary
- [ ] Pillars from `brand-voice` response hydrate correctly (name, description, color, goals)
- [ ] Segments from `brand-voice` response hydrate correctly (name, description, journeyStages)

---

## TC-3: Brand Voice & Tone View

### Brand Voice Structure
The view has 3 sub-components: Voice Mission, Voice Attributes (Brand Personality), Vocabulary Guide.
No longer has Tone Shifts or Platform Nuances sections (removed in Figma redesign).

### Voice Mission
1. [ ] Mission statement textarea renders (empty or populated)
2. [ ] Type a mission statement -> Click "Save Mission" -> Verify toast appears
3. [ ] Reload page -> Verify mission text persisted
4. [ ] Click "Draft Mission" (AI) -> Verify spinner, then text populates
5. [ ] Save drafted mission -> Verify persisted to `settings/brand-voice.json` field `missionStatement`

### Voice Attributes (Brand Personality)
6. [ ] Existing attributes render as cards (label, description, do/don't examples)
7. [ ] Click "Add Attribute" -> Fill label, description, DO example, DON'T example -> Save
8. [ ] Verify toast, verify attribute persisted in `brand-voice.json` -> `voiceAttributes` array
9. [ ] Edit an existing attribute inline -> Save -> Verify updated in AFS
10. [ ] Delete an attribute -> Verify removed from AFS
11. [ ] Reload -> Verify all changes persisted

### Vocabulary Guide
12. [ ] Add a word to "Preferred" list -> Verify immediately saved (toast)
13. [ ] Add a word to "Avoid" list -> Verify immediately saved (toast)
14. [ ] Remove a preferred word -> Verify removed from `vocabulary.preferred` in AFS
15. [ ] Remove an avoid word -> Verify removed from `vocabulary.avoid` in AFS
16. [ ] Click "Generate Vocabulary" (AI) -> Verify mock words populate and save

### Cross-Navigation Persistence
17. [ ] Add a voice attribute -> Navigate to Strategic Pillars -> Navigate back to Brand Voice
18. [ ] Verify the attribute is still present (state service retained it)

---

## TC-4: Strategic Pillars View

### Pillar Management
1. [ ] Pillar cards render from loaded data (name, description, color indicator)
2. [ ] Click "Add Pillar" -> Fill name, description, select color -> Save
3. [ ] Verify new pillar card appears and file created in `content-pillars/` namespace
4. [ ] Edit an existing pillar -> Change name/description -> Save -> Verify updated in AFS
5. [ ] Delete a pillar -> Verify file removed from namespace

### Goal Management
6. [ ] Click "Add Goal" on a pillar -> Set metric, target, unit, period -> Save
7. [ ] Verify `goals` array in pillar file updated
8. [ ] Goal summary appears on the pillar card (metric, progress bar)
9. [ ] Delete a goal -> Verify removed

### Audience Segments Display
10. [ ] Audience segments from state service display correctly on pillars
11. [ ] Segment checkboxes reflect loaded data

### Content Distribution Analysis
12. [ ] Click "Analyze" -> Verify platform split uses workspace active channels
13. [ ] Verify platform names match channel strategy (not hardcoded)

### AI Features
14. [ ] Click "AI Suggest Pillars" -> Verify mock pillars generate and save

---

## TC-5: Audience View

### Segment Management
1. [ ] Segment cards render from loaded data (name, description)
2. [ ] Click "Add Segment" -> Fill name, description -> Save
3. [ ] Verify new segment file in `audience-segments/` namespace
4. [ ] Edit an existing segment -> Change description -> Save -> Verify

### Journey Stage Mapping
5. [ ] Open journey stage editor on a segment
6. [ ] Fill stages (Awareness, Consideration, Conversion, Retention) with goals, content types, hook angles
7. [ ] Save -> Verify `journeyStages` array in segment file

### State Service Sync
8. [ ] After adding a segment, navigate to Channel Strategy
9. [ ] Expand a platform -> Verify new segment appears in Primary Audience dropdown
10. [ ] Navigate back to Audience -> Verify segment still present

---

## TC-6: Channel Strategy View

### Empty State / Platform Picker
1. [ ] Navigate to a workspace with empty `channel-strategy.json` (channels: [])
2. [ ] Verify platform picker UI is shown (not blank page)
3. [ ] Select 3 platforms (e.g., Instagram, TikTok, YouTube)
4. [ ] Click "Initialize Channels" -> Verify 3 platform accordions appear
5. [ ] Verify `channel-strategy.json` in AFS has 3 entries

### Channel Editing
6. [ ] Expand a platform accordion -> Edit Role field -> Blur -> Verify saved
7. [ ] Change Posting Cadence -> Verify saved
8. [ ] Toggle content type chips (select/deselect) -> Verify `primaryContentTypes` updated
9. [ ] Edit Tone Adjustment textarea -> Verify saved
10. [ ] Edit Strategy Notes textarea -> Verify saved

### Dynamic Audience Dropdown
11. [ ] Click Primary Audience dropdown on any platform
12. [ ] Verify options are workspace audience segment names (from state service), not hardcoded
13. [ ] If no segments exist, verify fallback "General Audience" option

### Goal Dropdown
14. [ ] Click Primary Goal dropdown -> Verify standard options (Awareness, Engagement, etc.)
15. [ ] Select a goal -> Save -> Verify in AFS

### Active Toggle
16. [ ] Toggle Active switch off -> Save -> Verify `active: false` in AFS
17. [ ] Toggle back on -> Save -> Verify `active: true`

### AI Generate
18. [ ] Click "AI Generate All Strategies" -> Verify spinner, then all channels populated
19. [ ] Verify all fields filled with generated content
20. [ ] Click individual "AI Generate" on one platform -> Verify only that platform updated

---

## TC-7: Content Mix View

### Slider Management
1. [ ] Sliders render for each content category (5 default)
2. [ ] Adjust a slider -> Verify total updates
3. [ ] Verify total shows percentage and balanced/unbalanced status

### Custom Categories
4. [ ] Click "Add Category" -> Enter name and description -> Add
5. [ ] Verify new slider row appears
6. [ ] Verify saved to `content-pillars/_content-mix.json`
7. [ ] Remove a custom category -> Verify removed from AFS

### AI Features
8. [ ] Click "AI Suggest Mix" -> Verify percentages distributed evenly across ALL categories
9. [ ] Verify custom categories included in distribution

### Persistence
10. [ ] Adjust sliders -> Reload page -> Verify values persisted

---

## TC-8: Research Sources View

### Source Display
1. [ ] Source cards render from loaded data (title, URL, type badge, relevance score, pillar chips)
2. [ ] Empty state message shown when no sources exist

### Filtering
3. [ ] Filter by pillar dropdown populated with workspace pillar names
4. [ ] Select a pillar -> Verify only matching sources shown
5. [ ] Select "All Pillars" -> Verify all sources shown

### Manual Source Entry
6. [ ] Click "Add Source" -> Verify add form appears
7. [ ] Fill title, URL, type, relevance, select pillar tags, summary
8. [ ] Click "Add Source" -> Verify source card appears
9. [ ] Verify file created in `research-sources/` namespace

### AI Discover
10. [ ] Click "AI Discover Sources" -> Verify spinner and loading card
11. [ ] Wait for completion -> Verify new sources appear
12. [ ] Verify sources saved to AFS

### Actions
13. [ ] Click "Create Idea" on a source -> Verify placeholder behavior
14. [ ] Click "Start Production" on a source -> Verify placeholder behavior

---

## TC-9: Competitor Deep Dive View

### Competitor Display
1. [ ] Competitor cards render from loaded data (name, platform icon, content type, topic, relevancy badge, frequency)
2. [ ] Empty state: "No competitors yet" message with users icon

### Add Competitor (Slim Form)
3. [ ] Click "Add Competitor" -> Verify slim form (name + platform dropdown only)
4. [ ] Enter name, select platform -> Click "Save"
5. [ ] Verify card appears with TBD defaults (contentType, topic, relevancy=Medium, frequency=Unknown)
6. [ ] Verify saved to `competitor-insights/` namespace

### Delete Flow
7. [ ] Click delete icon on a competitor -> Verify inline confirm appears ("Delete" / "Cancel")
8. [ ] Click "Cancel" -> Verify competitor remains
9. [ ] Click delete again -> Click "Delete" -> Verify competitor removed from UI and AFS

### Intel System
10. [ ] Find a competitor without intel -> Verify "Generate Intel" button
11. [ ] Click "Generate Intel" -> Verify spinner, intel panel auto-opens
12. [ ] After generation: Verify intel sections render (Positioning, Content Strategy, Gaps & Opportunities, AI Recommended Actions)
13. [ ] Verify "Last updated" timestamp shown
14. [ ] Click "View Intel" / "Hide Intel" toggle -> Verify panel opens/closes
15. [ ] Click "Refresh Intel" on a single competitor -> Verify timestamp updates
16. [ ] Click "Create Idea" on a recommended action -> Verify placeholder behavior

### Find Competitors (AI)
17. [ ] Click "Find Competitors" -> Verify spinner
18. [ ] Wait for completion -> Verify new competitor prepended to list
19. [ ] Verify competitor saved to AFS

### Refresh All
20. [ ] Click "Refresh All" -> Verify loading card with spinner
21. [ ] Wait for completion -> Verify all competitors with intel have updated timestamps

---

## TC-10: Business Objectives Strip

### Display
1. [ ] Objectives render in horizontal strip at top of page
2. [ ] Each objective shows category, statement, target, unit, timeframe
3. [ ] Progress bar reflects `currentValue / target` ratio
4. [ ] Status label shown (on-track, at-risk, behind, achieved)

### Editing
5. [ ] Open edit panel -> Verify "Add Objective" button present
6. [ ] Add a new objective -> Fill category, statement, target=10000, unit=followers, timeframe
7. [ ] Save -> Verify in `settings/business-objectives.json`
8. [ ] Set Current Value to 3500 -> Save -> Verify `currentValue: 3500` in AFS
9. [ ] Change Status dropdown to "At Risk" -> Save -> Verify `status: "at-risk"`
10. [ ] Verify progress bar shows 35% (3500/10000)
11. [ ] Verify up to 6 objectives can be added
12. [ ] Remove an objective -> Save -> Verify removed

---

## TC-11: Graceful Defaults for Pre-Existing Workspaces (AFS running)

### Steps
1. Navigate to `http://localhost:4200/workspace/fuzzee-coffee/strategy`
2. Verify each view renders without errors:

#### Expected Empty/Default States
- [ ] Brand Voice: Empty mission field, no attributes, empty vocabulary lists
- [ ] Strategic Pillars: Pillar cards from onboarding data (if any), or empty state
- [ ] Audience: Segment cards from onboarding data (if any), or empty state
- [ ] Channel Strategy: Platform picker when channels are empty, OR accordions if channels exist
- [ ] Content Mix: Default slider values or empty state
- [ ] Research Sources: "No sources found for the selected filter." empty state
- [ ] Competitor Deep Dive: "No competitors yet" empty state with users icon

3. [ ] Add data to one section (e.g., add a mission statement) -> Save
4. [ ] Reload page -> Verify saved data persists
5. [ ] Verify via AFS API that the new file was created in the fuzzee-coffee tenant
6. [ ] No console errors during any navigation

---

## TC-12: Mock Fallback (no AFS -- run last)

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
- [ ] Brand Voice: Mission statement populated, 4 voice attributes (Empowering, Knowledgeable but Accessible, Warm & Inclusive, Honest & Real)
- [ ] Vocabulary Guide: Preferred and avoid word lists populated
- [ ] Strategic Pillars: 5 pillars from contentPillars in brand-voice mock
- [ ] Audience: 5 segments (Active 40s, Thriving 50s, Yoga Enthusiasts, Fitness Beginners, Holistic Health Seekers)
- [ ] Channel Strategy: 5 platform entries (Instagram, TikTok, YouTube, Facebook active; LinkedIn inactive)
- [ ] Content Mix: 5 categories totaling 100% (Educational 35%, Entertaining 25%, Community 20%, Promotional 15%, Trending 5%)
- [ ] Research Sources: 6 sources with relevance scores
- [ ] Competitor Deep Dive: 5 competitors with intel data (Yoga with Adriene, Move with Nicole, etc.)
- [ ] Business Objectives: 3 objectives in the strip

3. [ ] Verify mock indicators appear where applicable
4. [ ] Attempt to save an edit -> Verify no errors thrown (data echoed back gracefully)
5. [ ] Verify no 500 errors in browser DevTools Network tab

### Teardown
```bash
# Re-set AGENTIC_FS_URL in your .env
# Restart the API server
# Restart AFS if stopped
```

---

## TC-13: AFS Data Contract Validation (AFS running)

### Full Data Integrity Check
After completing persistence tests, run a comprehensive validation:

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

- `brand-voice.json`: `brandVoiceDescription` (string), `voiceAttributes` (array of {id, label, description, doExample, dontExample}), `toneByContext` (array of {id, context, tone, example}), `platformToneAdjustments` (array of {platform, adjustment}), `vocabulary` ({preferred: string[], avoid: string[]})
- `business-objectives.json`: array of {id, category, statement, target, unit, timeframe, currentValue?, status?}
- `channel-strategy.json`: `channels` (array of {platform, active, role, primaryContentTypes, toneAdjustment, postingCadence, primaryAudience, primaryGoal, notes})
- `_content-mix.json`: `targets` (array of {category, label, targetPercent, color, description})
- `_audience-insights.json`: `insights` (array of {segmentId, interests, painPoints, peakActivityTimes, preferredPlatforms, contentPreferences})
- Each `{pillarId}.json`: id, name, description, color, goals[]?, objectiveIds[]?
- Each `{segmentId}.json`: id, name, description (description != name), journeyStages[]?, demographics?, interests?, painPoints?
- Each `{sourceId}.json`: id, title, url, type, relevance, pillarIds, summary, discoveredAt
- Each `{insightId}.json`: id, competitor, platform, contentType, topic, relevancyLevel, frequency, insight, intel?

---

## TC-14: Cross-View Data Flow

These tests verify that data changes in one view correctly propagate to other views via the centralized state service.

### Audience -> Channel Strategy
1. [ ] Add a new audience segment named "New Testers" in Audience view
2. [ ] Navigate to Channel Strategy -> Expand any platform -> Open Primary Audience dropdown
3. [ ] Verify "New Testers" appears as an option

### Channel Strategy -> Content Distribution
4. [ ] In Channel Strategy, toggle LinkedIn to active
5. [ ] Navigate to Strategic Pillars -> Run Content Distribution Analysis
6. [ ] Verify LinkedIn appears in the platform split

### Objectives -> Strategic Pillars
7. [ ] Add a business objective in the objectives strip
8. [ ] Navigate to Strategic Pillars -> Open objective linking on a pillar
9. [ ] Verify new objective available for linking

### Pillars -> Research Sources
10. [ ] Add a content pillar named "Test Pillar"
11. [ ] Navigate to Research Sources -> Open filter dropdown -> Verify "Test Pillar" appears

---

## TC-15: Save Operation Verification

Verify each save operation hits the correct API endpoint and persists correctly.

### Settings-Based Saves (PUT /api/workspaces/:id/settings/:tab)
| Domain | Tab | Save Method |
|--------|-----|-------------|
| Brand Voice | brand-voice | saveBrandVoice() |
| Objectives | business-objectives | saveObjectives() |
| Pillars | brand-voice (includes contentPillars) | savePillars() |
| Segments | general (includes audienceSegments) | saveSegments() |
| Channel Strategy | channel-strategy | saveChannelStrategy() |

### Namespace Entity Saves (PUT /api/workspaces/:id/:namespace)
| Domain | Namespace | Save Method |
|--------|-----------|-------------|
| Research Sources | research-sources | saveResearchSources() |
| Competitor Insights | competitor-insights | saveCompetitorInsights() |

### Namespace Aggregate Saves (PUT /api/workspaces/:id/:path)
| Domain | Path | Save Method |
|--------|------|-------------|
| Content Mix | content-mix | saveContentMix() |
| Audience Insights | audience-insights | saveAudienceInsights() |

### Verification Steps
For each save type, open DevTools Network tab:
1. [ ] Make an edit in the UI
2. [ ] Verify the correct PUT request fires with expected payload
3. [ ] Verify 200 response
4. [ ] Reload page -> Verify data loads back correctly
5. [ ] Verify via AFS API that the file was updated

---

## TC-16: Error Handling & Edge Cases

### Network Errors
1. [ ] Kill the API server -> Navigate to strategy page -> Verify graceful error (no white screen)
2. [ ] Restore API -> Reload -> Verify data loads

### Empty Data
3. [ ] Create a workspace with minimal onboarding data (skip optional fields)
4. [ ] Navigate to strategy page -> Verify all views render without errors
5. [ ] Verify empty states shown where appropriate (no blank sections)

### Rapid Navigation
6. [ ] Click rapidly between sidebar views -> Verify no race conditions or stale data
7. [ ] Verify only one view renders at a time (no overlapping components)

### Large Data Sets
8. [ ] Add 10+ research sources -> Verify list renders performantly
9. [ ] Add 10+ competitor insights -> Verify grid renders performantly
10. [ ] Add 6 objectives (maximum) -> Verify "Add" button disabled at limit

### Concurrent Edits
11. [ ] Open two tabs to the same workspace strategy page
12. [ ] Edit brand voice in tab 1, save
13. [ ] Reload tab 2 -> Verify tab 2 shows updated data

### Dirty State Tracking
14. [ ] Make an edit to any domain (don't save)
15. [ ] Verify `isDirty` state is true (if exposed in UI)
16. [ ] Save -> Verify dirty state clears
