# Concurrent agent worktrees

This repo supports 3–5 agents running tasks in parallel against separate `git worktree` checkouts. Per-agent port bands, fail-fast tooling, and an integration worktree pattern keep concurrent runs from silently interfering.

This doc captures the bootstrap flow, the port allocation table, the integration-worktree pattern, the coordination rules for shared resources, and the recovery snippets when something goes sideways.

---

## Bootstrap (one-time per worktree)

```bash
# Pick a slug for the work — usually <prefix>/<task-id> (e.g. feature/76).
WORKTREE_SLUG=feature/76
WORKTREE_DIR=../blinksocial-v2-${WORKTREE_SLUG##*/}

git worktree add "$WORKTREE_DIR" -b "$WORKTREE_SLUG" HEAD
cd "$WORKTREE_DIR"
nvm use
npm ci
cp .env.example .env
$EDITOR .env   # set API_PORT / WEB_PORT / API_E2E_PORT per the table below
```

The `.env` edit is the only step that varies between agents. Everything else (lockfile, schema, mock fixtures) is shared with the canonical checkout.

---

## Port allocation

| Agent | `API_PORT` | `WEB_PORT` | `API_E2E_PORT` | Notes |
| --- | ---: | ---: | ---: | --- |
| **canon (integration)** | 3000 | 4200 | 3001 | Default; runs the full pre-merge build/test/e2e on canonical ports. |
| Agent 1 | 3101 | 4201 | 3201 | Implementation worktrees stay in the 31xx / 42xx / 32xx bands. |
| Agent 2 | 3102 | 4202 | 3202 | |
| Agent 3 | 3103 | 4203 | 3203 | |

`scripts/check-ports.mjs` (run automatically as `prestart`) probes the trio for your worktree and exits non-zero with the offending PID, listener command, and cwd if any port is occupied. The same trio drives Playwright's `webServer` (`apps/blinksocial-web-e2e/playwright.config.ts`) and the API e2e bootstrap (`apps/blinksocial-api-e2e/src/support/port-helpers.ts`), so the dev server, web e2e, and API e2e of a single worktree can never drift onto different ports.

`BASE_URL` / `API_BASE_URL` derive from `WEB_PORT` / `API_PORT` when unset, so editing `.env` is sufficient — you don't have to set the URL forms by hand.

---

## Integration-worktree pattern

Implementation work happens in per-agent worktrees on bands 31xx / 42xx / 32xx. Merge / acceptance work happens in **one dedicated integration worktree** on canonical ports (3000 / 4200 / 3001), which is also the worktree the merge bot or human runs `nx run-many` and the full `nx e2e` against before pushing to `main`.

Why: the canonical port band matches what CI assumes and what the dev `.env` defaults to. Cross-worktree merges that need to drive the *real* test suite shouldn't have to remember to override env vars.

---

## Coordination rules

Some files are shared between worktrees because they share the underlying `node_modules` / lockfile / mock data, and concurrent edits will conflict. Treat these as **serialized resources**:

- **`package.json` + `package-lock.json`** — only one agent should add or upgrade dependencies at a time. Land the change on `main` first; other worktrees rebase before continuing.
- **`libs/blinksocial-contracts/`** — shared contract; coordinate ownership of any in-flight schema change before kicking off parallel work that touches the same contract.
- **`apps/blinksocial-api/src/mocks/`** and **`storage_reference/`** — shared mock data. Concurrent edits to the same fixture will collide; pick one agent to land the change.

Everything else (page-level Angular work, NestJS feature modules, e2e specs scoped to a single feature) is safe to run in parallel.

---

## Recovery — "my port is in use, who owns it?"

When `scripts/check-ports.mjs` reports a conflict, the message includes the listener PID and (on macOS / Linux) the working directory of that process. Walk up from there:

```bash
# The script already prints these — but if you need them by hand:
lsof -nP -iTCP:$API_PORT -sTCP:LISTEN              # which PID owns API_PORT?
ps -p <PID> -o pid,user,command,wd                 # what cwd / cmd / user?
kill <PID>                                          # safe; SIGTERM, not -9
```

If the offender is a stale Nx serve from your own worktree, `kill <PID>` is fine. If the offender is a sibling worktree's running server, **don't** kill it — pick a different port band in your `.env` and retry.

`npm run check-ports` is the same probe but exit-aware; useful as a quick "is my band free right now?" check.

---

## Privileged-port dev server (port 80)

`npm run devServer` runs the web on port 80 via `sudo`. This path is **singleton** — only one worktree at a time can hold port 80, and the script is gated behind `BLINK_DEV_SUDO=1` to prevent it being invoked accidentally from a parallel worktree. The error message names the gate so the next agent knows what's blocking them.

The privileged path exists for LAN / device demos; for everyday work, prefer `npm start` on the per-worktree `WEB_PORT`.

---

## Notes

- **Nx cache (`.nx/cache/`).** Shared across worktrees because Nx is content-hashed; collisions are benign. If you see a stale build in your worktree, `nx reset` clears it.
- **`reuseExistingServer` is now off by default.** Playwright's web e2e config used to default to `true`, which let one worktree silently bind to another worktree's running server and validate the wrong code. Opt back in only when you've confirmed the running server is yours: `E2E_REUSE_SERVER=true npx nx e2e blinksocial-web-e2e`.
- **Stale processes from a prior session.** If a dev server crashed without releasing its port, the recovery snippet above is the canonical fix. The codebase no longer issues blanket `pkill -f 'nx serve blinksocial'` cleanups (which used to kill *every* worktree's server), so stale processes from your own work need to be cleaned up explicitly.

---

## Two-worktree smoke (matches the AC verification step in #76)

```bash
# Worktree A:
git worktree add ../blinksocial-v2-a -b chore/76-a HEAD && cd $_
nvm use && npm ci && cp .env.example .env
# Set API_PORT=3101 WEB_PORT=4201 API_E2E_PORT=3201 in .env.
npm start &
npx nx e2e blinksocial-web-e2e &
npx nx e2e blinksocial-api-e2e &

# Worktree B (separate shell):
git worktree add ../blinksocial-v2-b -b chore/76-b HEAD && cd $_
nvm use && npm ci && cp .env.example .env
# Set API_PORT=3102 WEB_PORT=4202 API_E2E_PORT=3202 in .env.
npm start &
npx nx e2e blinksocial-web-e2e &
npx nx e2e blinksocial-api-e2e &
```

Expected: one `nx serve` per role per worktree (`ps aux | grep -E '(nx serve|node apps/blinksocial-api/dist)'`), both Playwright runs drive their own `webServer`, both API e2e runs bind their own `API_E2E_PORT`, zero cross-kills.

Negative path: if you start Worktree B with Worktree A's port band, `npm start`'s `prestart` (or the API e2e `global-setup`) prints the offending PID + cwd from Worktree A and exits non-zero. Worktree A keeps running untouched.
