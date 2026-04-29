/**
 * Plain-Node test for playwright.config.ts (env-gated webServer behavior).
 * Run via:
 *
 *   node apps/blinksocial-web-e2e/playwright.config.spec.mjs
 *
 * Covers AC I-2 from issue #76: reuseExistingServer is false unless
 * E2E_REUSE_SERVER=true.
 *
 * Reading the config requires a TS toolchain, so this spec drives the
 * same env→boolean projection that the config file uses (one-line
 * predicate kept in sync with the config; the config also exports it
 * implicitly through the module). The config file's behavior is asserted
 * by inspecting the literal predicate via grep — single source of truth
 * still lives in the config, the spec just locks the contract.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';

const configPath = new URL('./playwright.config.ts', import.meta.url).pathname;
const source = fs.readFileSync(configPath, 'utf8');

let passed = 0;
function it(label, fn) {
  try {
    fn();
    passed += 1;
    process.stdout.write(`  ✓ ${label}\n`);
  } catch (err) {
    process.stderr.write(`  ✗ ${label}\n${err.stack || err}\n`);
    process.exit(1);
  }
}

process.stdout.write('playwright.config.ts (env-driven webServer)\n');

it('declares reuseExistingServer via the E2E_REUSE_SERVER env predicate', () => {
  // The single source of truth: a literal `=== 'true'` check on the env.
  // Anything else (e.g. `Boolean(process.env...)`) would yield true for
  // any non-empty string — the bug we're guarding against.
  assert.match(
    source,
    /process\.env\[['"]E2E_REUSE_SERVER['"]\]\s*===\s*['"]true['"]/,
    'reuseExistingServer must be derived from a strict E2E_REUSE_SERVER==="true" check',
  );
});

it('the predicate evaluates to false when E2E_REUSE_SERVER is unset or unrelated', () => {
  const fn = (val) => val === 'true';
  assert.equal(fn(undefined), false);
  assert.equal(fn(''), false);
  assert.equal(fn('yes'), false);
  assert.equal(fn('1'), false);
  assert.equal(fn('TRUE'), false); // case-sensitive on purpose
});

it('the predicate evaluates to true only on the literal string "true"', () => {
  const fn = (val) => val === 'true';
  assert.equal(fn('true'), true);
});

it('webServer URLs are derived from the same envs the dev scripts honor', () => {
  // Cross-check: BASE_URL falls back to localhost:${WEB_PORT||4200},
  // and API_BASE_URL falls back to localhost:${API_PORT||3000}.
  assert.match(source, /process\.env\[['"]WEB_PORT['"]\]\s*\|\|\s*['"]4200['"]/);
  assert.match(source, /process\.env\[['"]API_PORT['"]\]\s*\|\|\s*['"]3000['"]/);
  assert.match(
    source,
    /process\.env\[['"]BASE_URL['"]\]\s*\|\|\s*`http:\/\/localhost:\$\{webPort\}`/,
  );
  assert.match(
    source,
    /process\.env\[['"]API_BASE_URL['"]\]\s*\|\|\s*`http:\/\/localhost:\$\{apiPort\}`/,
  );
});

it('webServer wires API via PORT env (NestJS bootstrap) and web via --port', () => {
  // The API doesn't accept --port (its main.ts reads PORT from env);
  // the web dev server does. The config has to honor both shapes.
  assert.match(source, /PORT:\s*apiPort/);
  assert.match(source, /blinksocial-web:serve --port=\$\{webPort\}/);
});

process.stdout.write(`\nOK — ${passed} assertions\n`);
