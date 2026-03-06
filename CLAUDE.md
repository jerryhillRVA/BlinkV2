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

- **Unit tests**: Vitest via `@angular/build:unit-test` executor
- `vitest/globals` provides `describe`, `it`, `expect`, `vi` without imports
- Tests use `TestBed.configureTestingModule({ imports: [MyComponent] })` (standalone components go in `imports`, not `declarations`)
- **Coverage**: 90% threshold on statements, branches, functions, and lines (enforced by `@vitest/coverage-v8` — configured in `project.json`, fails the test run when not met)
- **E2E tests**: Playwright (`apps/blinksocial-web-e2e/src/`)

### E2E Test Organization

E2E specs are organized by component/page area — one spec file per area, NOT one monolithic file:

- `header.spec.ts` — app header/navbar (layout)
- `dashboard.spec.ts` — dashboard page (welcome header, workspace grid, cards)
- `footer.spec.ts` — app footer (layout)

When adding a new page or component, create a corresponding `<feature>.spec.ts` file. Mirror the component organization (layout files for layout components, page-named files for page components).

### Pre-Commit Hooks

Husky runs on every commit via `.husky/pre-commit`:

1. `nx affected -t lint` — lints only changed projects (fast fail)
2. `nx affected -t test -- --watch=false` — runs tests with coverage enforcement

This means every commit is automatically validated against lint rules and 90% coverage thresholds. If either fails, the commit is blocked.

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

- **E2E tests**: Jest with SWC transpiler (`apps/blinksocial-api-e2e/`)
- Tests use `axios` for HTTP requests against a running server
- Global setup waits for port 3000 to be available; global teardown kills it
- **Unit tests**: Use `@nestjs/testing` `Test.createTestingModule()` (not yet implemented)

### Build

- Webpack with `@nx/webpack` NxAppWebpackPlugin (target: `node`)
- TypeScript compiler with `experimentalDecorators` and `emitDecoratorMetadata` enabled
- Output: `apps/blinksocial-api/dist/`

---

## Brand

- Logo: Lucide `Video` icon, coral `#d94e33` on white rounded square
- Header gradient: `linear-gradient(to right, #E8533F, #F26B4C)`
- Brand text: "BLINK" (not "BLINK SOCIAL")
- Dashboard icon: Lucide `LayoutGrid` (4 squares), stroke `#d94e33` on `rgba(217,78,51,0.1)` background
