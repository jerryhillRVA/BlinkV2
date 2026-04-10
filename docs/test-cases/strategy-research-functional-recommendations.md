# Strategy & Research — Feature Recommendation Report

**Date:** 2026-04-10
**Context:** Gaps identified during integration testing of the Strategy & Research pages against AFS-backed workspaces.

---

## Priority 1 — Must Fix (Onboarding Pipeline Gaps)

### 1. Hydrate channel-strategy.json from active platforms during onboarding

**Gap:** When a user enables platforms in Step 5 (Platform Configuration), the onboarding creates `platforms.json` with the active platform list but does NOT create corresponding entries in `channel-strategy.json`. This means every new workspace arrives at the Channel Strategy view showing an empty platform picker — requiring the user to re-select platforms they already chose.

**Recommendation:**
- During workspace creation (the API handler that processes the onboarding session), iterate over active platforms from `platforms.json` and generate a `channels` array in `channel-strategy.json` with scaffold entries:
  ```json
  {
    "platform": "instagram",
    "active": true,
    "role": "",
    "primaryContentTypes": [],
    "toneAdjustment": "",
    "postingCadence": "",
    "primaryAudience": "",
    "primaryGoal": "",
    "notes": ""
  }
  ```
- This ensures the Channel Strategy view immediately shows editable platform accordions after onboarding.
- For pre-existing workspaces missing `channel-strategy.json`, add a migration or lazy-initialization that reads `platforms.json` and generates channel entries on first strategy page load.

---

### 2. Populate default content mix categories during onboarding

**Gap:** `_content-mix.json` is created with `"targets": []` during onboarding. The Content Mix view shows 0% with no sliders. The "Reset to Defaults" button also fails to populate defaults.

**Recommendation:**
- During workspace creation, populate `_content-mix.json` with the 5 standard categories:
  ```json
  {
    "targets": [
      { "category": "educational", "label": "Educational", "targetPercent": 35, "color": "#4CAF50", "description": "Informative content that teaches your audience" },
      { "category": "entertaining", "label": "Entertaining", "targetPercent": 25, "color": "#FF9800", "description": "Fun, engaging content that builds connection" },
      { "category": "community", "label": "Community", "targetPercent": 20, "color": "#2196F3", "description": "Content that fosters audience interaction" },
      { "category": "promotional", "label": "Promotional", "targetPercent": 15, "color": "#9C27B0", "description": "Product or service focused content" },
      { "category": "trending", "label": "Trending", "targetPercent": 5, "color": "#F44336", "description": "Timely content tied to current trends" }
    ]
  }
  ```
- Fix the "Reset to Defaults" button in the Content Mix view to apply these same defaults when clicked.

---

### 3. Generate meaningful audience segment descriptions during onboarding

**Gap:** The onboarding wizard only collects segment names (Step 4 instructs "Keep this simple — just names for now"). The backend then saves `description` as a copy of `name`, violating the `description !== name` contract.

**Recommendation:**
- **Option A (Minimal):** Set `description` to an empty string or `null` during onboarding. The Audience view in Strategy pages should handle null/empty descriptions gracefully (e.g., show "No description yet — edit to add one").
- **Option B (AI-enhanced):** After onboarding, use the AI suggestion system to auto-generate a one-line description for each segment based on the workspace purpose and segment name. This can be done asynchronously.
- **Option C (UI change):** Add an optional description field below each segment name in the onboarding wizard Step 4. Keep it optional to maintain simplicity.

---

## Priority 2 — Should Fix (UX Polish)

### 4. Add visual selection state to platform picker buttons

**Gap:** In the Channel Strategy empty state, the platform toggle buttons (Instagram, TikTok, etc.) have no visual distinction between selected and unselected states.

**Recommendation:**
- Add CSS for selected state: filled background color, checkmark icon, or border highlight.
- Example: selected platforms get `background: var(--blink-brand-primary-light-bg); border-color: var(--blink-brand-primary);` styling.

---

### 5. Add toast/snackbar notifications on save operations

**Gap:** Save operations (mission statement, voice attributes, vocabulary, competitors) succeed silently with no visual feedback. Users have no way to know their changes were saved without checking DevTools.

**Recommendation:**
- Implement a lightweight toast/snackbar component that displays "Saved successfully" for 2-3 seconds after each successful PUT request.
- Use Angular Material's `MatSnackBar` or a custom toast component following the `--blink-*` design system tokens.

---

### 6. Show Step 7 (Review) before workspace creation

**Gap:** The onboarding wizard appears to skip Step 7 (Review) and navigates directly to the dashboard after Step 6.

**Recommendation:**
- Verify if Step 7 is implemented but auto-submitting, or if it's not rendered at all.
- If missing, add a review summary page showing all entered data across the 6 steps with a "Create Workspace" confirmation button.

---

## Priority 3 — Nice to Have (Future Enhancements)

### 7. Add progress bar visualization to Business Objectives strip

The objectives strip shows status labels ("On Track") but no visual progress indicator. Adding a slim progress bar (currentValue/target ratio) would make the strip more actionable at a glance.

### 8. Add "General Audience" fallback in Channel Strategy audience dropdown

TC-6 item 13 specifies a "General Audience" fallback option when no audience segments exist. Currently, the dropdown only shows workspace segments with no fallback for workspaces that haven't defined segments yet.

### 9. Lazy-create missing namespaces for pre-existing workspaces

Pre-existing workspaces like `fuzzee-coffee` are missing `research-sources` and some other namespaces. The state service should create these namespaces lazily on first write, or the strategy page load should initialize them.

### 10. Content Strategy step audience chips should be selectable per-pillar

Currently in the onboarding wizard, the Target Audience section shows all segments as non-interactive chips. Consider making them selectable per-pillar to define which audiences each content pillar targets.

---

## Summary Matrix

| # | Recommendation | Priority | Effort | Impact |
|---|----------------|----------|--------|--------|
| 1 | Hydrate channel-strategy from platforms | P1 | Medium | High — eliminates duplicate work |
| 2 | Populate default content mix | P1 | Low | High — provides immediate value |
| 3 | Fix segment description != name | P1 | Low | Medium — data integrity |
| 4 | Platform picker visual state | P2 | Low | Medium — UX clarity |
| 5 | Toast notifications on save | P2 | Low | Medium — user confidence |
| 6 | Show Review step before creation | P2 | Medium | Medium — user confidence |
| 7 | Progress bars in objectives strip | P3 | Low | Low — visual polish |
| 8 | General Audience fallback | P3 | Low | Low — edge case |
| 9 | Lazy-create namespaces | P3 | Medium | Low — backward compat |
| 10 | Selectable audience chips in onboarding | P3 | Medium | Low — future enhancement |
