# E2E Test Catalog

This document is a living inventory of the end-to-end (E2E) test suites in this repo: what they cover, how they're organized, and exactly which test cases live in each spec file.

The project follows a three-tier testing strategy (unit / integration / E2E) — see [CLAUDE.md](../CLAUDE.md) for the broader testing philosophy. E2E tests run at commit time via Husky pre-commit hooks (`nx affected -t e2e`) and form the outermost guardrail: full user flows in a real browser (Playwright) and full HTTP round-trips against a booted API process (Jest + axios).

## 1. Top-line summary

| Suite | Framework | Spec files | Test cases | Active | Skipped |
|---|---|---:|---:|---:|---:|
| Web E2E (`apps/blinksocial-web-e2e`) | Playwright | 18 | 198 | 197 | 1 |
| API E2E (`apps/blinksocial-api-e2e`) | Jest + SWC + axios | 2 | 5 | 5 | 0 |
| **Total** | | **20** | **203** | **202** | **1** |

### Per-suite breakdown by category

**Web E2E by category**

| Category | Specs | Tests |
|---|---:|---:|
| Layout & chrome | 3 | 12 |
| Dashboard & workspaces | 3 | 47 |
| Onboarding | 3 | 17 |
| Content lifecycle (Idea / Concept / Post) | 4 | 71 |
| Calendar | 1 | 17 |
| Strategy & Research | 1 | 12 |
| Profile & admin | 2 | 16 |
| Cross-cutting | 1 | 6 |
| **Total** | **18** | **198** |

**Web E2E by spec**

| Spec | Category | Tests |
|---|---|---:|
| [header.spec.ts](../apps/blinksocial-web-e2e/src/header.spec.ts) | Layout & chrome | 5 |
| [footer.spec.ts](../apps/blinksocial-web-e2e/src/footer.spec.ts) | Layout & chrome | 2 |
| [theme.spec.ts](../apps/blinksocial-web-e2e/src/theme.spec.ts) | Layout & chrome | 5 |
| [dashboard.spec.ts](../apps/blinksocial-web-e2e/src/dashboard.spec.ts) | Dashboard & workspaces | 17 |
| [new-workspace.spec.ts](../apps/blinksocial-web-e2e/src/new-workspace.spec.ts) | Dashboard & workspaces | 14 |
| [workspace-settings.spec.ts](../apps/blinksocial-web-e2e/src/workspace-settings.spec.ts) | Dashboard & workspaces | 16 |
| [onboard.spec.ts](../apps/blinksocial-web-e2e/src/onboard.spec.ts) | Onboarding | 13 |
| [onboard-revision-error.spec.ts](../apps/blinksocial-web-e2e/src/onboard-revision-error.spec.ts) | Onboarding | 2 |
| [onboarding-business-name-fidelity.spec.ts](../apps/blinksocial-web-e2e/src/onboarding-business-name-fidelity.spec.ts) | Onboarding | 2 |
| [content.spec.ts](../apps/blinksocial-web-e2e/src/content.spec.ts) | Content lifecycle | 10 |
| [idea-detail.spec.ts](../apps/blinksocial-web-e2e/src/idea-detail.spec.ts) | Content lifecycle | 23 |
| [concept-detail.spec.ts](../apps/blinksocial-web-e2e/src/concept-detail.spec.ts) | Content lifecycle | 15 |
| [post-detail.spec.ts](../apps/blinksocial-web-e2e/src/post-detail.spec.ts) | Content lifecycle | 23 |
| [calendar.spec.ts](../apps/blinksocial-web-e2e/src/calendar.spec.ts) | Calendar | 17 |
| [strategy-research.spec.ts](../apps/blinksocial-web-e2e/src/strategy-research.spec.ts) | Strategy & Research | 12 |
| [profile-settings.spec.ts](../apps/blinksocial-web-e2e/src/profile-settings.spec.ts) | Profile & admin | 12 |
| [team-password-reset.spec.ts](../apps/blinksocial-web-e2e/src/team-password-reset.spec.ts) | Profile & admin | 4 |
| [detail-back-button.spec.ts](../apps/blinksocial-web-e2e/src/detail-back-button.spec.ts) | Cross-cutting | 6 |

**API E2E by spec**

| Spec | Endpoint group | Tests |
|---|---|---:|
| [blinksocial-api.spec.ts](../apps/blinksocial-api-e2e/src/blinksocial-api/blinksocial-api.spec.ts) | Health, workspace settings (GET) | 3 |
| [workspaces.spec.ts](../apps/blinksocial-api-e2e/src/blinksocial-api/workspaces.spec.ts) | Workspaces (POST) | 2 |

---

## 2. Web E2E — `apps/blinksocial-web-e2e/`

### 2.1 Stack & configuration

Defined in [playwright.config.ts](../apps/blinksocial-web-e2e/playwright.config.ts).

- **Framework**: Playwright (`@playwright/test`) on top of the Nx preset.
- **Browsers**: Chromium, Firefox, WebKit (Desktop only).
- **Base URL**: `http://localhost:4200` — override with `BASE_URL` env var.
- **API base URL**: `http://localhost:3000` — override with `API_BASE_URL` env var.
- **Dev servers**: Playwright boots both `blinksocial-api` (port 3000 by default) and `blinksocial-web` (port 4200 by default) via the `webServer` config. `reuseExistingServer` defaults to `false` to prevent one worktree's Playwright run from silently binding to another worktree's server — opt in with `E2E_REUSE_SERVER=true`.
- **Workers**: 2 locally, 1 on CI. Lower worker count stabilises Angular SSR under concurrent load.
- **Timeout**: 60s per test (SSR routes can take >30s for first paint).
- **Trace**: collected on first retry.
- **Reporters**: `list` + `html` (HTML report never auto-opens).

### 2.2 Helpers & fixtures

#### [src/helpers/login.ts](../apps/blinksocial-web-e2e/src/helpers/login.ts)
- `mockAuthenticatedUser(page)` — stubs `GET /api/auth/status` to return an authenticated admin user with two workspaces: `hive-collective` and `booze-kills`. Must be called **before** `page.goto()` so the route intercept is active when Angular's auth check fires on load.
- `mockAuthenticatedUserNoWorkspaces(page)` — same shape but with an empty `workspaces[]`. Used to verify the workspace nav hides on non-workspace routes (issue #23).

#### [src/helpers/content-mocks.ts](../apps/blinksocial-web-e2e/src/helpers/content-mocks.ts)
- `IDEA_ENTRY`, `CONCEPT_ENTRY` — minimal hive-collective pipeline-index fixtures for the Idea / Concept stages.
- `POST_DETAIL_PROD1` — full Post detail fixture including the production brief (strategy, platform rules, creative plan, compliance).
- `mockHiveContent(page, options?)` — single setup call that installs JSON mocks for the workspace content + brand-voice endpoints:
  - `GET/PUT/PATCH/POST /api/workspaces/:ws/content-items/:id` — detail CRUD with **echo-back merge persistence** so a PUT body is merged into the in-memory record and reflected on subsequent GETs (avoids stale reads after a write).
  - `GET /api/workspaces/:ws/content-items/index` and `/archive-index`
  - `GET /api/workspaces/:ws/settings/brand-voice` and `/settings/business-objectives`

#### [src/helpers/draft-mocks.ts](../apps/blinksocial-web-e2e/src/helpers/draft-mocks.ts)
- `approvedPostEntry({ id, title, platform, contentType })` — factory for an index entry whose brief has been approved (production step = `draft`).
- `approvedPostDetail({ ... })` — paired detail factory. Used by the Production Draft tests in `post-detail.spec.ts` to drive every platform/contentType branch of the draft builder factory.

### 2.3 Per-spec drill-downs

#### [header.spec.ts](../apps/blinksocial-web-e2e/src/header.spec.ts) — 5 tests

`describe('Header')`

| # | ID | Test name | What it validates |
|---:|---|---|---|
| 1 | — | `should display brand icon with SVG` | The header renders the brand `<svg>` icon. |
| 2 | — | `should display "BLINK" brand text` | Header brand wordmark is the literal "BLINK" (not "BLINK SOCIAL"). |
| 3 | — | `should display user name and role` | User name + role pill are visible in the header. |
| 4 | — | `should display avatar with "BA" initials` | Avatar circle shows the user's initials. |
| 5 | — | `should show profile menu with logout when avatar is clicked` | Clicking the avatar opens the dropdown menu and surfaces the Logout item. |

#### [footer.spec.ts](../apps/blinksocial-web-e2e/src/footer.spec.ts) — 2 tests

`describe('Footer')`

| # | ID | Test name | What it validates |
|---:|---|---|---|
| 1 | — | `should display copyright text` | Footer renders copyright content. |
| 2 | — | `should be visible` | Footer is present in the DOM and visible on the dashboard. |

#### [theme.spec.ts](../apps/blinksocial-web-e2e/src/theme.spec.ts) — 5 tests

`describe('Theme')`

| # | ID | Test name | What it validates |
|---:|---|---|---|
| 1 | — | `should default to data-theme="light"` | `<html data-theme>` defaults to `light` on first paint. |
| 2 | — | `should have a theme toggle button in the header` | Toggle is rendered in the header. |
| 3 | — | `should switch to dark on toggle click, then back to light` | Toggle round-trips light → dark → light. |
| 4 | — | `should change body background in dark mode` | Computed `<body>` background-color differs between light and dark themes (theme actually applies, not just the attribute). |
| 5 | — | `should persist theme across reload` | Selected theme survives `page.reload()` via localStorage. |

#### [dashboard.spec.ts](../apps/blinksocial-web-e2e/src/dashboard.spec.ts) — 17 tests

Describe blocks: `Page Background`, `Dashboard Background`, `Welcome Header`, `Workspace Grid`, `New Workspace Card`, `Workspace Cards`

| # | ID | Test name | What it validates |
|---:|---|---|---|
| 1 | — | `should have the correct page background color` | Computed page background uses the expected token. |
| 2 | — | `should have a decorative background glow` | Decorative gradient/glow element renders behind dashboard content. |
| 3 | — | `should have a header icon` | Welcome header icon is present. |
| 4 | — | `should display "Welcome to Blink Social"` | Welcome heading text matches exactly. |
| 5 | — | `should display the subtitle about content strategy` | Subtitle copy renders. |
| 6 | — | `should center the header text` | Welcome block is centered. |
| 7 | — | `should have new workspace card as first child` | New-workspace card is the first item in the grid. |
| 8 | — | `should have exactly 2 workspace cards` | Mock auth returns 2 workspaces; grid renders exactly 2 cards. |
| 9 | — | `should have a plus circle` | New-workspace card shows the plus-circle CTA icon. |
| 10 | — | `should display "New Workspace" label` | CTA label text. |
| 11 | — | `should display description text` | Helper description text under the CTA. |
| 12 | — | `should change button border color on hover` | Border colour changes on hover (computed style probe). |
| 13 | — | `should display workspace names in headers` | Each workspace card shows its workspace name. |
| 14 | — | `should have globe watermark SVGs` | Decorative globe watermark renders per card. |
| 15 | — | `should have QUICK ACCESS labels` | "QUICK ACCESS" label appears on every card. |
| 16 | — | `should have 4 quick access items per card` | Each card has exactly 4 quick-access items. |
| 17 | — | `should have "Go to Workspace" links` | Each card has a "Go to Workspace" link. |

#### [new-workspace.spec.ts](../apps/blinksocial-web-e2e/src/new-workspace.spec.ts) — 14 tests

Describe blocks: `New Workspace Navigation`, `New Workspace Wizard`

| # | ID | Test name | What it validates |
|---:|---|---|---|
| 1 | — | `should navigate to wizard when "Use the setup wizard" is clicked` | Entry point from dashboard → wizard. |
| 2 | — | `should show step indicator with 7 steps` | Stepper renders 7 nodes. |
| 3 | — | `should default to step 1 (Foundation)` | First step is active on landing. |
| 4 | — | `should show "Back to Home" button` | Back-to-home affordance is visible. |
| 5 | — | `should show page title` | Wizard page title renders. |
| 6 | — | `should not advance from step 1 without workspace name` | Validation gate: blank workspace name blocks Next. |
| 7 | — | `should advance to step 2 when Next is clicked with valid name` | Valid name lets the wizard progress. |
| 8 | — | `should not advance from step 2 without an objective statement` | Validation gate: objective is required on step 2. |
| 9 | — | `should not advance from step 4 without a segment name` | Validation gate: at least one named segment on step 4. |
| 10 | — | `should return to step 1 when Back is clicked after advancing` | Back from step 2 → step 1. |
| 11 | — | `should allow Back from step 7 to step 6` | Back is enabled on the final step. |
| 12 | — | `should navigate to dashboard when "Back to Home" is clicked` | Bail-out exit returns to `/`. |
| 13 | — | `should show "Finish" on step 7 and navigate to dashboard` | Finish CTA copy on last step + post-finish navigation. |
| 14 | — | `should show toast error when API returns validation error` | 400 from `POST /api/workspaces` surfaces as a toast. |

#### [workspace-settings.spec.ts](../apps/blinksocial-web-e2e/src/workspace-settings.spec.ts) — 16 tests

Describe blocks: `Workspace Settings Navigation`, `Workspace Settings Page`, `Workspace Settings Tab Navigation`, `Workspace Settings Save`

| # | ID | Test name | What it validates |
|---:|---|---|---|
| 1 | — | `should navigate from dashboard to settings when "Go to Workspace" is clicked` | Card CTA → settings page. |
| 2 | — | `should navigate back to dashboard when header logo is clicked` | Logo is a Home link from settings. |
| 3 | — | `should display "Workspace Settings" title` | Page title. |
| 4 | — | `should display subtitle` | Page subtitle. |
| 5 | — | `should have 7 tab buttons` | Settings tab row has 7 tabs. |
| 6 | — | `should default to General tab active` | General tab is active on landing. |
| 7 | — | `should display general settings fields` | General tab renders its form fields. |
| 8 | — | `should have a save button` | Save action is present. |
| 9 | — | `should have blurred background image` | Decorative blurred image is on the page. |
| 10 | — | `should switch to Platforms tab` | Tab click switches content. |
| 11 | — | `should switch to Agents tab` | Tab click switches content. |
| 12 | — | `should switch to Team tab` | Tab click switches content. |
| 13 | — | `should switch to Notifications tab` | Tab click switches content. |
| 14 | — | `should switch to Calendar tab` | Tab click switches content. |
| 15 | — | `should switch to Security tab` | Tab click switches content. |
| 16 | — | `should call API when save button is clicked` | Save fires a `PUT` to the settings endpoint with the form payload. |

#### [onboard.spec.ts](../apps/blinksocial-web-e2e/src/onboard.spec.ts) — 13 tests

Describe blocks: `Dashboard Onboard Card`, `Onboard Page`, `Onboard Page - chat rendering (#89)`, `Onboard Page - Non-admin user`

| # | ID | Test name | What it validates |
|---:|---|---|---|
| 1 | — | `should show the Onboard New Workspace card` | Dashboard surfaces the onboarding entry-point card. |
| 2 | — | `should navigate to /onboard when card is clicked` | Card click routes to `/onboard`. |
| 3 | — | `should show the page header` | Page header renders. |
| 4 | — | `should display the initial agent message` | First agent message is in the chat transcript. |
| 5 | — | `should show 7 section progress steps` | Section progress component has 7 steps. |
| 6 | — | `should have a back button that navigates to dashboard` | Back button routes to `/`. |
| 7 | — | `should send a message and receive agent reply` | User send → user bubble appears immediately, agent reply lands (total 3 messages). |
| 8 | — | `should send message on Enter key` | Enter inside the input fires send (parity with the button). |
| 9 | — | `should disable send button when input is empty` | Send is disabled when the input is empty. |
| 10 | TC-1 | `renders markdown (bold, italic, lists, code) in agent bubble` | Agent bubble runs markdown through the renderer rather than displaying raw asterisks. |
| 11 | TC-2 | `truncated JSON envelope debris never reaches the user` | Truncated/partial JSON envelopes are filtered out of the rendered chat text. |
| 12 | TC-3 | `XSS smoke — <script> in agent output does not execute or render` | XSS guard: agent-injected `<script>` is sanitised, not executed. |
| 13 | — | `should redirect non-admin users away from /onboard` | Non-admin users are redirected off the onboard route. |

#### [onboard-revision-error.spec.ts](../apps/blinksocial-web-e2e/src/onboard-revision-error.spec.ts) — 2 tests

`describe('Onboarding revision regen error handling (#88)')`

| # | ID | Test name | What it validates |
|---:|---|---|---|
| 1 | TC-1 | `revision regen 422 surfaces inline chat-error, preserves prior Blueprint, and dismisses cleanly` | A 422 from the revision regen endpoint shows an inline chat-error bubble (not a full banner), keeps the previously-generated Blueprint visible, and dismisses cleanly when the user closes it. |
| 2 | TC-3 | `first-time generation 422 surfaces full-width banner, not chat-error` | A 422 *before* a Blueprint has been generated shows the full-width banner instead — the inline chat-error is only for revision flows. |

#### [onboarding-business-name-fidelity.spec.ts](../apps/blinksocial-web-e2e/src/onboarding-business-name-fidelity.spec.ts) — 2 tests

`describe('Onboarding businessName fidelity (#72)')`

| # | ID | Test name | What it validates |
|---:|---|---|---|
| 1 | TC-1 | `rendered Blueprint shows the discovery businessName in every slot and never the substituted name` | The user-supplied business name from discovery appears verbatim in every Blueprint slot — no LLM-substituted drift name leaks through. |
| 2 | TC-2 | `workspace setup wizard pre-fills the workspace name from discovery, not from any drifted value` | Wizard resume reads the discovery businessName, not a downstream drifted value. |

#### [content.spec.ts](../apps/blinksocial-web-e2e/src/content.spec.ts) — 10 tests

`describe('Content Page — type picker + drawer')`

| # | ID | Test name | What it validates |
|---:|---|---|---|
| 1 | — | `clicking New Content opens the type picker (drawer not yet visible)` | Picker opens; drawer does not auto-mount yet. |
| 2 | — | `picker shows three options with the correct labels` | Picker labels match expected three options. |
| 3 | — | `clicking outside the picker dismisses it without opening the drawer` | Outside click closes picker only. |
| 4 | — | `Esc dismisses the picker without opening the drawer` | Esc closes picker only. |
| 5 | — | `selecting Concept opens the drawer with type pre-set, locks body scroll` | Concept selection opens drawer with `type=concept` and locks `<body>` scroll. |
| 6 | — | `Idea quick-add adds a card to the Ideas column` | Idea path adds a card straight to the Ideas column without opening the drawer. |
| 7 | — | `Esc dismisses the drawer` | Esc closes the open drawer. |
| 8 | — | `X button dismisses the drawer` | Close-X dismisses the drawer. |
| 9 | — | `Production Brief drawer shows Draft Assets + Save Brief in footer` | Production Brief drawer footer surfaces both CTAs. |
| 10 | — | `column rename: "Posts in Production" absent, "Post Builder" present` | Verifies the column copy rename from "Posts in Production" → "Post Builder". |

#### [idea-detail.spec.ts](../apps/blinksocial-web-e2e/src/idea-detail.spec.ts) — 23 tests (22 active, 1 skipped)

Describe blocks: `Idea detail page`, `Idea detail header typography`, `Idea detail right column (#106)`

| # | ID | Test name | What it validates |
|---:|---|---|---|
| 1 | — | `clicking an Idea card navigates to the detail route and renders the layout` | Pipeline → idea detail navigation; main layout panels render. |
| 2 | — | `Back button returns to the pipeline board` | Back button restores the pipeline route. |
| 3 | — | `inline-editing the title commits the new value` | Inline edit on title commits and persists. |
| 4 | — | `Generate Concept Options reveals 6 option cards after loading` | "Generate Concept Options" produces 6 option cards. |
| 5 | — | `Concept CTA navigates to the Concept detail page` | Concept CTA on an option card routes to the new Concept detail. |
| 6 | — | `title (.inline-edit-display.detail-title) renders at 20px and weight 700` | Title typography token (20px / 700) is in effect. |
| 7 | — | `description textarea matches prototype: permanent (always visible), borderless, gray focus ring, 88px min, 14px / 1.625, prototype placeholder` | Description textarea matches the spec: permanent, borderless, gray focus ring, 88 px min-height, 14 px / 1.625 line-height, exact placeholder copy. |
| 8 | TC-1 / TC-3 / TC-5 | `empty-objectives state — order, no Tags panel, prototype warning copy` | Empty-objectives state: panel order, Tags panel is removed, prototype warning copy matches. |
| 9 | TC-2 | `strategy card structure — single panel, three sections, asterisks, tooltips` | Strategy card is one panel with three sections, required-field asterisks, and tooltips. |
| 10 | TC-4 | `chip selection persists — UI toggles, PUT body carries objectiveId, post-reload state stable` | Chip toggle reflects in UI, the PUT request body carries `objectiveId`, state survives a reload. |
| 11 | TC-6 | `vertical Content Journey on stage=idea (current=idea)` | Vertical journey component is in `stage=idea` / `current=idea` configuration. |
| 12 | TC-7 | `vertical Content Journey on stage=concept (covered by unit test)` | **Skipped** — covered by unit spec. |
| 13 | TC-8 | `timestamps card has no header, two clock-icon rows, prototype date format` | Timestamps card layout matches the prototype (no header, two clock rows, specific date format). |
| 14 | TC-9 | `mobile parity at 375px — sidebar reflows, new panels do not overflow` | At 375 px viewport, sidebar reflows and new panels don't overflow. |
| 15 | TC-10 | `dark theme parity — toggle, no hardcoded white flashes, brand stays coral` | Dark-theme toggle: no hardcoded `#fff` flashes, brand coral preserved. |
| 16 | TC-11 | `section header icons render in muted gray, not coral` | Section header icons use muted gray token, not coral. |
| 17 | TC-12 | `stage badge is rounded-rect with no uppercase transform` | Stage badge shape + casing: rounded-rect, no `text-transform: uppercase`. |
| 18 | TC-13 | `pillar chips drop the dot and use pillar.color tint when selected` | Pillar chips lose the leading dot and tint with `pillar.color` when selected. |
| 19 | TC-14 | `audience chips use --blink-segment-* tokens when selected` | Audience chips use `--blink-segment-*` tokens on selection. |
| 20 | TC-15 | `tooltip sits flush right of the section label, not floated to the panel edge` | Tooltip anchor is flush-right of the section label. |
| 21 | TC-16 | `dark theme parity — section icons stay muted, segment chip uses dark blue tokens` | Dark-theme parity for section icons and selected segment chips. |
| 22 | TC-17 | `no "(max N)" hint, no upper-bound cap on pillar selection` | Pillar selection has no max-N hint and no upper-bound cap. |
| 23 | TC-18 | `hover border = pillar.color on pillars; segment-text on audience` | Hover border colour: `pillar.color` on pillar chips, `--blink-segment-text` on audience chips. |

#### [concept-detail.spec.ts](../apps/blinksocial-web-e2e/src/concept-detail.spec.ts) — 15 tests

Describe blocks: `Concept detail page`, `Concept detail right column (#110)`

| # | ID | Test name | What it validates |
|---:|---|---|---|
| 1 | — | `clicking a Concept card routes to the detail URL and renders header + key panels` | Pipeline → concept detail routing; header and key panels render. |
| 2 | — | `Move to Production CTA enables after required fields are valid` | "Move to Production" CTA is gated by the required-field state. |
| 3 | — | `dialog "Add all to Production Queue" returns to the pipeline board` | The Add-all dialog choice routes back to the pipeline. |
| 4 | — | `dialog "Add all" retains the concept card in the Concepts column` | After "Add all", the source concept card remains in the Concepts column. |
| 5 | — | `dialog "Work on one" navigates to the created post URL` | "Work on one" navigates to the newly-created post detail. |
| 6 | — | `Back button returns to the pipeline board` | Back button returns to the pipeline. |
| 7 | — | `Send back to Idea demotes the concept to the Ideas column` | Send-back-to-Idea cascade moves the concept back to Ideas. |
| 8 | TC-1 | `right-column DOM order — BizObj → Pillars → Audience → Content Journey, no Tags or Timestamps label` | Right-column section order is fixed and Tags / Timestamps-labels panels are removed. |
| 9 | TC-2 | `section header icons are gray, not coral` | Section header icons use the gray token. |
| 10 | TC-3 | `stage badge is rounded-rect with no uppercase transform` | Stage badge shape + casing. |
| 11 | TC-4 | `pillar selected uses pillar.color tint (chromium-only)` | Pillar selection tint matches `pillar.color`. Chromium-only (computed-style assertions). |
| 12 | TC-5 | `no upper-bound cap on pillar selection` | No max-N cap on pillar selection. |
| 13 | TC-6 | `Description and Hook are permanent textareas with the new copy` | Description + Hook are permanent textareas (not edit-on-click) with the new placeholder copy. |
| 14 | TC-7 | `status stepper is visible but visually de-emphasized (compact wrapper)` | Status stepper sits inside a compact / de-emphasised wrapper. |
| 15 | TC-8 | `hover border on pillar = pillar.color; on segment = segment-text (chromium-only)` | Hover-border colour parity on pillar / audience chips. Chromium-only. |

#### [post-detail.spec.ts](../apps/blinksocial-web-e2e/src/post-detail.spec.ts) — 23 tests

Describe blocks: `Post detail page`, `Production Brief (#112)`, `Production Draft (#114)`, `Send back to Concept menu visibility (#121)`

| # | ID | Test name | What it validates |
|---:|---|---|---|
| 1 | — | `clicking an In-Production card lands on /content/<id> with Brief active` | Pipeline → post detail routing lands on the Brief step. |
| 2 | — | `Back button returns to the pipeline board` | Back button. |
| 3 | Brief TC-1 | `page header shows Production badge with Clapperboard icon, no status stepper` | Brief header: Production badge + Clapperboard icon, status stepper removed. |
| 4 | Brief TC-2 | `production-steps bar has 4 steps (Brief / Draft / Packaging / Approve & Schedule)` | Production-steps bar renders exactly 4 steps with the expected labels. |
| 5 | Brief TC-3 | `Goal & Message card has Key Message label, AI Assist sibling, and a textarea` | Goal & Message card structure. |
| 6 | Brief TC-4 | `Reference Links — Enter adds a row; × removes it` | Reference Links list grows on Enter and shrinks on the × delete button. |
| 7 | Brief TC-5 | `Ownership & Timeline shows Owner + Due Date — no Paid & Boosted toggle, no Campaign Name field (post-prototype trim)` | Ownership & Timeline retains Owner + Due Date only; the Paid & Boosted toggle and Campaign Name field are gone. |
| 8 | Brief TC-6 | `CTA SelectGrid renders 8 pills; selection moves between pills` | CTA grid has 8 pills and selection moves on click. |
| 9 | Brief TC-7 | `Brief Status approve toggle (skips when canApprove is false on the seeded fixture)` | Brief approval toggle. Skips when the seeded fixture's `canApprove` is `false`. |
| 10 | Brief TC-8 | `sidebar Content Concept card renders locked summary with NO Edit Concept link` | Sidebar concept card is a locked summary; "Edit Concept" link is intentionally absent. |
| 11 | Draft TC-11 | `landing step is derived from production.productionStep — approved + draft persisted lands directly on Draft (no manual click)` | Production landing step honours persisted `production.productionStep` — an approved brief with `productionStep=draft` lands directly on Draft. |
| 12 | Draft TC-12 | `Continue from Draft persists productionStep="packaging" so reload lands on Packaging` | Continue from Draft persists `productionStep="packaging"`; reload lands on Packaging. |
| 13 | Draft TC-1 | `factory routes (instagram,reel)→VIDEO, (youtube,long-form)→VIDEO_LONG, (instagram,feed-post)→IMAGE_SINGLE` | Draft factory routing: platform + contentType pair determines the canonical builder. |
| 14 | Draft TC-2 | `VIDEO builder — hook + ≥1 shot enables Continue, click advances to Packaging` | VIDEO builder validation gate + advance. |
| 15 | Draft TC-3 | `VIDEO_LONG builder — sequence block with description enables Continue` | VIDEO_LONG validation gate. |
| 16 | Draft TC-4 | `IMAGE_SINGLE builder — hook + image attached enables Continue` | IMAGE_SINGLE validation gate. |
| 17 | Draft TC-5 | `CAROUSEL builder — hook + ≥2 slides with headlines enables Continue` | CAROUSEL validation gate. |
| 18 | Draft TC-6 | `TEXT builder — caption alone enables Continue` | TEXT validation gate. |
| 19 | Draft TC-7 | `Unsupported canonical (story) shows the placeholder + disabled Continue with aria-disabled` | Story canonical falls back to placeholder + `aria-disabled` Continue. |
| 20 | Draft TC-8 | `VIDEO persistence round-trip survives reload` | VIDEO builder state survives a full reload (PUT echo-back persisting). |
| 21 | Draft TC-9 | `Keyboard-only path through VIDEO builder — Tab through, Enter activates Continue` | Keyboard-only accessibility: Tab order + Enter on Continue. |
| 22 | Draft TC-10 | `Continue button gating reflects required-field state in real-time` | Continue button enables/disables live as required fields are filled. |
| 23 | #121 TC-1 | `kebab menu shows "Send back to Concept" when payload omits conceptId` | Kebab menu falls back to the conceptId alias on cache ingress so the "Send back to Concept" action is offered even when the API response omits `conceptId` directly. |

#### [calendar.spec.ts](../apps/blinksocial-web-e2e/src/calendar.spec.ts) — 17 tests

Describe blocks: `Calendar — navigation entry points`, `Calendar — page interactions`, `Calendar — peek card placement`, `Calendar — content round-trip in mock mode`

| # | ID | Test name | What it validates |
|---:|---|---|---|
| 1 | TC1 | `header Calendar tab navigates to the calendar page with Month default` | Header tab → calendar route in Month default. |
| 2 | TC2 | `workspace-card Calendar quick-access navigates to the calendar page` | Dashboard quick-access entry → calendar. |
| 3 | TC3 | `Calendar tab has active state on /workspace/:id/calendar` | Tab active-state on the calendar route. |
| 4 | TC4 | `view switcher cycles Month → Week → Day → List → Month` | View switcher cycles through all four views. |
| 5 | TC5 | `Prev advances month header; Today returns to the reference month` | Prev/Today navigation updates the header and resets. |
| 6 | TC6 | `toggling a platform filter narrows visible events` | Platform filter toggles affect visible events. |
| 7 | TC7 | `upcoming panel shows overdue entry with a text+icon severity badge` | Upcoming panel surfaces an overdue badge with both icon + text. |
| 8 | TC8 | `clicking a publish pill deep-links to content detail with ?tab=packaging` | Publish pill links to `/content/<id>?tab=packaging`. |
| 9 | TC9 | `event pill uses themeable var(--blink-*) tokens (theme toggle changes computed color)` | Event pill uses `var(--blink-*)` so the computed colour changes with the theme. |
| 10 | TC13 | `hovering a Saturday-column chip keeps the peek card inside the viewport` | Right-edge guard: Saturday-column chip's peek card stays inside the viewport. |
| 11 | TC14 | `hovering a mid-week chip preserves right-of-anchor placement` | Mid-week chip: peek card is positioned to the right of the anchor. |
| 12 | TC15 | `bottom-row Saturday chip keeps the peek card inside the viewport vertically` | Bottom-edge guard: the peek card flips/clamps vertically. |
| 13 | TC16 | `peek card background uses themeable tokens after positioning change` | Background still resolves through `var(--blink-*)` after the placement adjustment. |
| 14 | TC10 (booze-kills) | `TC10 (booze-kills) calendar event click resolves to a populated content detail page` | Parametrized round-trip fixture #1: clicking a calendar event opens a populated detail page. |
| 15 | TC10 (hive-collective) | `TC10 (hive-collective) calendar event click resolves to a populated content detail page` | Parametrized round-trip fixture #2: same flow, second workspace. |
| 16 | TC11 | `calendar → detail → Back returns to Calendar (round-trip)` | Full round-trip: calendar → detail → Back returns to the calendar (and not the pipeline). |
| 17 | TC12 | `calendar restores Week view + cursor when query params are present` | Calendar restores the prior view + cursor from `?view=week&...` query params. |

#### [strategy-research.spec.ts](../apps/blinksocial-web-e2e/src/strategy-research.spec.ts) — 12 tests

`describe('Strategy & Research Page')`

| # | ID | Test name | What it validates |
|---:|---|---|---|
| 1 | — | `should display the strategy page layout` | Page shell renders. |
| 2 | — | `should display sidebar with 4 sections` | Sidebar has 4 section groupings. |
| 3 | — | `should display 12 sidebar navigation items` | Sidebar has 12 leaf items total. |
| 4 | — | `should highlight Brand Voice as default active view` | Default active view is Brand Voice. |
| 5 | — | `should display objectives strip` | Objectives strip is rendered above content. |
| 6 | — | `should switch views when clicking sidebar items` | Clicking a sidebar item swaps the content view. |
| 7 | — | `should update active sidebar highlight on navigation` | Sidebar active-highlight follows the current view. |
| 8 | — | `should open Influencer Marketing with Discovery tab by default` | Influencer Marketing defaults to the Discovery sub-tab. |
| 9 | — | `should switch between Influencer Marketing sub-tabs` | Discovery / Shortlist / Campaigns sub-tabs switch. |
| 10 | — | `should render Discovery context strip and Find Influencers controls` | Discovery tab renders the context strip + Find Influencers controls. |
| 11 | — | `should show empty state on Shortlist tab when no influencers added` | Shortlist empty state. |
| 12 | — | `should show empty state on Campaigns tab when none tracked` | Campaigns empty state. |

#### [profile-settings.spec.ts](../apps/blinksocial-web-e2e/src/profile-settings.spec.ts) — 12 tests

Describe blocks: `Profile Settings Page`, `Profile Menu Navigation`, `Profile Settings — Workspace Nav` (#23)

| # | ID | Test name | What it validates |
|---:|---|---|---|
| 1 | — | `should display "Profile Settings" heading` | Page heading. |
| 2 | — | `should display subtitle` | Page subtitle. |
| 3 | — | `should display Profile card with fields` | Profile card with display-name / email / role / workspace-access fields. |
| 4 | — | `should display Change Password card` | Change Password card. |
| 5 | — | `should have password input fields` | Password inputs (current / new / confirm). |
| 6 | — | `should have Change Password button` | Submit button. |
| 7 | — | `should navigate to profile settings from header menu` | Header menu → `/profile-settings`. |
| 8 | — | `should show Logout in profile menu` | Logout item is present in the menu. |
| 9 | — | `should close menu when clicking outside` | Outside click dismisses the menu. |
| 10 | #23 | `should show workspace selector and the workspace nav tabs on /profile-settings` | Workspace selector + nav tabs are visible on the profile settings page when the user has workspaces. |
| 11 | #23 | `should navigate to /workspace/:id/content when Content tab is clicked` | Content tab routes to that workspace's content page. |
| 12 | #23 | `should hide workspace selector and tabs when user has no workspaces` | When `workspaces[]` is empty, the selector + tabs hide. |

#### [team-password-reset.spec.ts](../apps/blinksocial-web-e2e/src/team-password-reset.spec.ts) — 4 tests

`describe('Admin password reset (Teams tab)')`

| # | ID | Test name | What it validates |
|---:|---|---|---|
| 1 | — | `admin resets a teammate's password and sees the temp-password banner` | Happy path: admin triggers reset, sees the temp-password banner. |
| 2 | — | `Cancel closes the dialog without firing the reset request` | Cancel skips the API call. |
| 3 | — | `shows the server error inline when the request fails` | Server error renders inline in the dialog. |
| 4 | — | `reset button is hidden on the bootstrap admin row even when other admin rows exist` | Bootstrap admin row never shows a reset button (self-reset / lockout guard). |

#### [detail-back-button.spec.ts](../apps/blinksocial-web-e2e/src/detail-back-button.spec.ts) — 6 tests

`describe('Detail back button — ?from=calendar aria-label flip (#46)')`

| # | ID | Test name | What it validates |
|---:|---|---|---|
| 1 | — | `Idea detail: aria-label is "Back to pipeline" by default` | Idea detail default back-button label. |
| 2 | — | `Idea detail: aria-label flips to "Back to calendar" when from=calendar` | `?from=calendar` flips the label on Idea detail. |
| 3 | — | `Concept detail: aria-label flips to "Back to calendar" when from=calendar` | `?from=calendar` flips the label on Concept detail. |
| 4 | — | `Post detail: aria-label flips to "Back to calendar" when from=calendar` | `?from=calendar` flips the label on Post detail. |
| 5 | — | `Post detail: aria-label is "Back to pipeline" by default` | Post detail default back-button label. |
| 6 | — | `Concept detail: aria-label is "Back to pipeline" by default` | Concept detail default back-button label. |

---

## 3. API E2E — `apps/blinksocial-api-e2e/`

### 3.1 Stack & configuration

Defined in [jest.config.cts](../apps/blinksocial-api-e2e/jest.config.cts).

- **Framework**: Jest, configured via `.cts` (CommonJS-typed) config.
- **Transformer**: `@swc/jest` reading [.spec.swcrc](../apps/blinksocial-api-e2e/.spec.swcrc) (ES2017, TS + decorators, source maps).
- **Test environment**: `node`.
- **HTTP client**: `axios`, baseURL set in `test-setup.ts`.
- **Display name**: `blinksocial-api-e2e`.
- **Coverage output**: `test-output/jest/coverage`.
- **Port resolution**: shared helper [resolveApiE2ePort](../apps/blinksocial-api-e2e/src/support/port-helpers.ts:10). Default `3001` (intentionally not `3000`, which the web-e2e webServer owns). Override via `API_E2E_PORT`.

### 3.2 Bootstrap & teardown

**[global-setup.ts](../apps/blinksocial-api-e2e/src/support/global-setup.ts)** — runs once before all tests:
1. Resolve port via `resolveApiE2ePort()`.
2. Probe via `ensurePortFree(port)` ([port-helpers.ts:55](../apps/blinksocial-api-e2e/src/support/port-helpers.ts:55)). If something is already listening, throw with the offending PID + command so the developer can kill it themselves — **never SIGKILL it**, because a sibling worktree's e2e run could be the holder. See [docs/worktrees.md](worktrees.md) for the per-worktree port-band convention.
3. Spawn `node apps/blinksocial-api/dist/main.js` with `PORT=<resolved>` and `AGENTIC_FS_URL=''` (mock mode — bootstrap login creates the admin user).
4. Stash the child process on `globalThis.__SERVER_PROCESS__`.
5. `waitForPortOpen(port)` before letting tests run.

**[test-setup.ts](../apps/blinksocial-api-e2e/src/support/test-setup.ts)** — runs once per test file, before the suite:
1. Set `axios.defaults.baseURL = http://<host>:<port>`.
2. `POST /api/auth/login` with `blinkadmin@blinksocial.com / blinksocial`.
3. Extract the `Set-Cookie` session cookie and set it as `axios.defaults.headers.common['Cookie']` so every subsequent request is authenticated automatically.

**[global-teardown.ts](../apps/blinksocial-api-e2e/src/support/global-teardown.ts)** — `.kill()` the stashed server process.

### 3.3 Per-spec drill-downs

#### [blinksocial-api.spec.ts](../apps/blinksocial-api-e2e/src/blinksocial-api/blinksocial-api.spec.ts) — 3 tests

Describe blocks: `GET /api/health`, `GET /api/workspaces/:id/settings/:tab`

| # | ID | Test name | What it validates |
|---:|---|---|---|
| 1 | — | `should return status ok` | `GET /api/health` returns 200 with `{ status: 'ok', service: 'blinksocial-api' }`. |
| 2 | — | `should return settings for a mock workspace` | `GET /api/workspaces/hive-collective/settings/general` returns 200 with a `workspaceName` property. |
| 3 | — | `should return 404 for unknown workspace` | `GET /api/workspaces/unknown/settings/general` returns 404. |

#### [workspaces.spec.ts](../apps/blinksocial-api-e2e/src/blinksocial-api/workspaces.spec.ts) — 2 tests

`describe('POST /api/workspaces')`

| # | ID | Test name | What it validates |
|---:|---|---|---|
| 1 | — | `should return 201 with valid payload` | `POST /api/workspaces` with a full payload (`general`, `platforms`, `brandVoice`, `contentPillars`, `audienceSegments`, `skills`) returns 201 with `workspaceName`, `status='active'`, and auto-generated `id` + `createdAt`. |
| 2 | — | `should return 400 with missing workspaceName` | `POST /api/workspaces` with an empty `general` object returns 400 with `message === 'Validation failed'`. |

---

## 4. How to run

```bash
# All web E2E (all 3 browsers)
npx nx e2e blinksocial-web-e2e

# Single browser
npx nx e2e blinksocial-web-e2e -- --project=chromium

# One test by name (Playwright --grep matches the title)
npx nx e2e blinksocial-web-e2e -- --grep "TC-13"

# All API E2E
npx nx e2e blinksocial-api-e2e
```

Both suites also run automatically on every commit via Husky pre-commit hooks (`nx affected -t e2e`), per [CLAUDE.md](../CLAUDE.md). The feedback policy is **green on the branch before push — no "pre-existing" carve-outs**.

When two worktrees run E2E at once, port collisions are *fail-fast* (not auto-resolved) — see [docs/worktrees.md](worktrees.md).

---

## 5. Maintenance

This document is hand-curated. When you add or remove a spec / test:

1. Update the matching per-spec drill-down table (test name verbatim, what-it-validates line).
2. Update the spec's row in the **Per-suite breakdown by category** table (count + total).
3. Update the **Top-line summary** at the top.

Keep the table format consistent (`# | ID | Test name | What it validates`). For tests with no ticket / TC id, use `—`.
