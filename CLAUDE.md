# Blink Social v2

## Project Structure

Nx monorepo with Angular 21 (frontend) and NestJS 11 (backend).

- `apps/blinksocial-web/` — Angular frontend
- `apps/blinksocial-web-e2e/` — Playwright E2E tests (frontend)
- `apps/blinksocial-api/` — NestJS backend API
- `apps/blinksocial-api-e2e/` — Jest E2E tests (API)
- `libs/blinksocial-contracts/` — Shared TypeScript interfaces/DTOs (e.g., `HealthResponse`)
- `libs/blinksocial-core/` — Shared utilities (e.g., `formatTimestamp()`)

### Shared Library Imports

Use workspace path aliases, not relative paths:

```typescript
import { HealthResponse } from '@blinksocial/contracts';
import { formatTimestamp } from '@blinksocial/core';
```

### Common Commands 
!! Always use nvm "nvm use" to manage npm versions (may be in ~/.nvm)

```bash
npm start                                          # Serve API + web concurrently
npm run start:api                                   # Serve API only
npx nx serve blinksocial-web                        # Serve web only
npx nx test blinksocial-web -- --watch=false         # Frontend unit tests + coverage
npx nx lint blinksocial-web                         # Frontend lint
npx nx e2e blinksocial-web-e2e                      # Frontend E2E tests (Playwright)
npx nx affected -t lint --base=HEAD                 # Lint affected projects
npx nx affected -t test --base=HEAD -- --watch=false # Test affected projects
npx nx build blinksocial-web                        # Frontend production build
npx nx build blinksocial-api                        # API production build
```

---

## Angular Frontend (`blinksocial-web`)

### Standalone Components (no NgModules)

This project uses **standalone components exclusively**. Do NOT create NgModules (`@NgModule`).

- Angular 19+ defaults to `standalone: true` — do NOT add `standalone: true` explicitly, it's unnecessary
- Each component manages its own dependencies via the `imports` array in `@Component()`
- Lazy loading uses `loadComponent`, NOT `loadChildren` with modules
- Bootstrap uses `bootstrapApplication()` with an `ApplicationConfig`, NOT `platformBrowser().bootstrapModule()`

### Component File Convention

Every component MUST have four separate files:

- `*.component.ts` — class with `templateUrl` and `styleUrl` (no inline templates or styles)
- `*.component.html` — template
- `*.component.scss` — styles (SCSS, not CSS)
- `*.component.spec.ts` — unit tests

### Component Organization

- `app/layout/` — layout components (header, footer)
- `app/pages/` — routed page components
- Feature-specific child components live under their parent (e.g., `pages/dashboard/workspace-card/`)

### Routing

Routes are defined in `app.routes.ts` using `loadComponent` for lazy loading:

```typescript
{
  path: '',
  loadComponent: () =>
    import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
}
```

### Frontend Testing

This project follows a **three-tier testing strategy** — unit tests (mocked), integration tests (real), and E2E tests. When adding or modifying frontend functionality, write tests at all applicable tiers.

- **Unit tests**: Vitest via `@angular/build:unit-test` executor. These are the majority of tests and use mocks for services/HTTP.
- `vitest/globals` provides `describe`, `it`, `expect`, `vi` without imports
- Tests use `TestBed.configureTestingModule({ imports: [MyComponent] })` (standalone components go in `imports`, not `declarations`)
- **Coverage**: 90% threshold on statements, branches, functions, and lines (enforced by `@vitest/coverage-v8` — configured in `project.json`, fails the test run when not met)
- **E2E tests**: Playwright (`apps/blinksocial-web-e2e/src/`) — validates full user flows across browsers

### E2E Test Organization

E2E specs are organized by component/page area — one spec file per area, NOT one monolithic file:

- `header.spec.ts` — app header/navbar (layout)
- `dashboard.spec.ts` — dashboard page (welcome header, workspace grid, cards)
- `footer.spec.ts` — app footer (layout)
- `theme.spec.ts` — theme switching and persistence

When adding a new page or component, create a corresponding `<feature>.spec.ts` file. Mirror the component organization (layout files for layout components, page-named files for page components).

### Pre-Commit Hooks

Husky runs on every commit via `.husky/pre-commit`:

1. `nx affected -t lint` — lints only changed projects (fast fail)
2. `nx affected -t test -- --watch=false` — runs unit tests (mocked) and integration tests (real, skipped if external service unavailable)
3. `nx affected -t e2e` — runs E2E tests (Playwright for web, Jest for API)

This means every commit is validated against lint rules, coverage thresholds, integration contracts, and E2E acceptance tests. If any step fails, the commit is blocked.

---

## NestJS API (`blinksocial-api`)

### Module Organization

Feature-based vertical slicing — one module per feature:

- `app/app.module.ts` — root module, imports all feature modules
- `health/` — health check endpoint (`GET /api/health`)
- `angular-ssr/` — Angular SSR integration middleware (must be imported last in AppModule — it's a catch-all)

### API Conventions

- All API routes are prefixed with `/api/` (e.g., `/api/health`)
- Controllers use `@Controller('api/<feature>')` for route prefixes
- Use shared `@blinksocial/contracts` interfaces for request/response types
- The Angular SSR middleware skips `/api/*` routes automatically

### Module Pattern

Each feature module contains its own controller, service, and related files:

```
feature/
├── feature.module.ts       # @Module declaration
├── feature.controller.ts   # Route handlers
└── feature.service.ts      # Business logic (when needed)
```

### Middleware

- Middleware is applied via `NestModule.configure()` using `MiddlewareConsumer`
- The `AngularSsrMiddleware` is a catch-all that renders Angular pages for non-API routes
- **Express 5**: This project uses Express 5 with `path-to-regexp` v8. Use `/{*path}` for wildcard routes, NOT `/**` (Express 4 syntax). See `apps/blinksocial-web/src/server.ts` for the correct pattern.

### Configuration

- Environment variables read directly via `process.env['VAR_NAME']`
- Default port: `3000`
- See `.env.example` for available variables

### API Testing

This project uses a **three-tier testing strategy**. When adding or modifying functionality, write tests at all applicable tiers:

1. **Unit tests (mocked)** — Fast, comprehensive, mock external dependencies. Use `@nestjs/testing` `Test.createTestingModule()` with mock providers for services like `AgenticFilesystemService`, `UserService`, etc. These form the majority of tests and run on every commit.

2. **Integration tests (real)** — A small set of tests that validate real external service contracts (e.g., AgenticFilesystem API). Must be **idempotent** — clean up all created artifacts in `afterAll`. Use `describe.skip` when the external service is unavailable (e.g., `AGENTIC_FS_URL` not set) so they skip gracefully. See `agentic-filesystem.integration.spec.ts` for the pattern.

3. **E2E tests** — Jest with SWC transpiler (`apps/blinksocial-api-e2e/`). Tests use `axios` for HTTP requests against a running server. Global setup waits for port 3000 to be available; global teardown kills it.

All three tiers run at commit time via Husky pre-commit hooks (`nx affected -t test` and `nx affected -t e2e`). The combination of mocked unit tests, real integration tests, and full E2E tests provides high confidence that changes work correctly at every level.

### Build

- Webpack with `@nx/webpack` NxAppWebpackPlugin (target: `node`)
- TypeScript compiler with `experimentalDecorators` and `emitDecoratorMetadata` enabled
- Output: `apps/blinksocial-api/dist/`

---

## Design System (Theming)

This project uses Angular Material M3 theming with a custom CSS custom property layer. **All new UI components MUST use `var(--blink-*)` tokens for colors** — never hardcode hex/rgb values in component SCSS.

### Architecture

- `app/core/theme/theme.service.ts` — Signal-based `ThemeService` (light/dark toggle, localStorage persistence, SSR-safe)
- `app/core/theme/_blink-theme.scss` — M3 theme definitions (`$light-theme`, `$dark-theme`)
- `app/core/theme/_blink-tokens.scss` — App-level semantic CSS custom properties (`--blink-*`)
- `styles.scss` — Applies theme + tokens globally based on `html[data-theme]` attribute
- `index.html` — Inline `<script>` reads localStorage before hydration to prevent theme flash

### Using the Design System in Components

In component SCSS, always use `var(--blink-*)` tokens:

```scss
// CORRECT
.my-card {
  background: var(--blink-surface);
  color: var(--blink-on-surface);
  border: 1px solid var(--blink-outline-variant);
  box-shadow: var(--blink-shadow-sm);
}
.my-button {
  color: var(--blink-brand-primary);
  &:hover { background: var(--blink-brand-primary-hover-bg); }
}

// WRONG — never hardcode colors
.my-card { background: white; color: #333; }
```

### Available Token Categories

- **Brand**: `--blink-brand-primary`, `--blink-brand-gradient`, `--blink-brand-primary-hover-bg`, `--blink-brand-primary-light-bg`, `--blink-brand-primary-lighter-bg`, `--blink-brand-primary-lightest-bg`
- **Surfaces**: `--blink-surface`, `--blink-surface-dim`, `--blink-surface-container`, `--blink-surface-container-low`, `--blink-surface-variant`, `--blink-surface-hover`
- **Text**: `--blink-on-surface`, `--blink-on-surface-strong`, `--blink-on-surface-medium`, `--blink-on-surface-muted`, `--blink-on-surface-label`, `--blink-on-surface-secondary`, `--blink-on-surface-tertiary`, `--blink-on-surface-faint`
- **Borders**: `--blink-outline`, `--blink-outline-variant`, `--blink-outline-dashed`
- **Shadows**: `--blink-shadow-sm`, `--blink-shadow-md`, `--blink-shadow-lg`
- **Icons**: `--blink-icon-purple`, `--blink-icon-green`, `--blink-icon-blue`, `--blink-icon-orange` (each has a `-bg` variant)
- **Typography** (M3-aligned scale): `--blink-display-large` (57px), `--blink-display-medium` (45px), `--blink-display-small` (36px), `--blink-headline-large` (32px), `--blink-headline-medium` (28px), `--blink-headline-small` (24px), `--blink-title-large` (22px), `--blink-title-medium` (16px), `--blink-title-small` (14px), `--blink-body-large` (18px), `--blink-body-medium` (14px), `--blink-body-small` (12px), `--blink-label-large` (14px), `--blink-label-medium` (12px), `--blink-label-small` (11px). **Use `var(--blink-*)` typography tokens for font sizes** — never hardcode px values in component SCSS.
- **Tooltip**: `--blink-tooltip-bg`, `--blink-tooltip-text`

To add new tokens, add them to both `light-tokens` and `dark-tokens` mixins in `_blink-tokens.scss`.

### ThemeService Usage

```typescript
import { ThemeService } from '../../core/theme/theme.service';

// In a component:
protected readonly themeService = inject(ThemeService);

// In template:
// {{ themeService.isDark() }} — reactive computed signal
// (click)="themeService.toggleTheme()" — toggle light↔dark
```

---

## Brand

- Logo: Lucide `Video` icon, coral `#d94e33` on white rounded square
- Header gradient: `linear-gradient(to right, #E8533F, #F26B4C)`
- Brand text: "BLINK" (not "BLINK SOCIAL")
- Dashboard icon: Lucide `LayoutGrid` (4 squares), stroke `#d94e33` on `rgba(217,78,51,0.1)` background
