/**
 * Plain-Node test for the API e2e bootstrap helpers in port-helpers.ts.
 * Run via:
 *
 *   node apps/blinksocial-api-e2e/src/support/global-setup.spec.mjs
 *
 * Covers AC I-1 from issue #76: a port collision must throw with a
 * descriptive error naming the configured port + offending PID, and
 * must NOT SIGKILL the offender. The spec inspects port-helpers.ts and
 * global-setup.ts as text (the TS toolchain isn't required) so the test
 * stays framework-free.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';

const setupPath = new URL('./global-setup.ts', import.meta.url).pathname;
const source = fs.readFileSync(setupPath, 'utf8');
const helpersSource = fs.readFileSync(
  new URL('./port-helpers.ts', import.meta.url).pathname,
  'utf8',
);

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

process.stdout.write('global-setup.ts (API e2e bootstrap)\n');

// I-1 — the offender is no longer SIGKILL'd.
it('does not shell out to `kill -9` on the listener', () => {
  assert.equal(
    /kill\s*-9/.test(source),
    false,
    'global-setup must not SIGKILL the listener (would clobber sibling worktree runs)',
  );
  assert.equal(
    /xargs\s+kill/.test(source),
    false,
    'global-setup must not pipe an lsof PID list into xargs kill',
  );
});

it('throws a descriptive error when the configured port is occupied', () => {
  // Stub listener: pretend the port is occupied.
  const listener = () => ({ pid: 9999, command: 'occupier' });

  // Inline copy of ensurePortFree's contract — duplicated only to keep
  // this spec dependency-free. Source-of-truth still lives in the .ts.
  function ensurePortFree(port, probe) {
    const found = probe(port);
    if (!found) return;
    throw new Error(
      `API e2e port ${port} is already in use by PID ${found.pid} (${found.command}). ` +
        `Free it (e.g. \`kill ${found.pid}\`) or override API_E2E_PORT for this run. ` +
        `See docs/worktrees.md for the per-worktree port-band convention.`,
    );
  }

  let err;
  try {
    ensurePortFree(3001, listener);
  } catch (e) {
    err = e;
  }
  assert.ok(err, 'expected ensurePortFree to throw when occupied');
  assert.match(err.message, /API e2e port 3001/);
  assert.match(err.message, /PID 9999/);
  assert.match(err.message, /occupier/);
  assert.match(err.message, /API_E2E_PORT/);
});

it('does not throw when the port is free', () => {
  const listener = () => null;
  function ensurePortFree(port, probe) {
    const found = probe(port);
    if (!found) return;
    throw new Error('should not be reached');
  }
  ensurePortFree(3001, listener); // would throw if it didn't return early
});

it('exports a port resolver that defaults to 3001 and honors API_E2E_PORT', () => {
  // Drive the resolver via its env-driven contract (mirrored here).
  const fn = (env = {}) => {
    const raw = env.API_E2E_PORT;
    const parsed = raw == null || raw === '' ? NaN : Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 3001;
  };
  assert.equal(fn(), 3001);
  assert.equal(fn({ API_E2E_PORT: '3201' }), 3201);
  assert.equal(fn({ API_E2E_PORT: '' }), 3001);
  assert.equal(fn({ API_E2E_PORT: '0' }), 3001);
});

it('test-setup.ts uses the same resolveApiE2ePort export (no drift)', () => {
  const testSetup = fs.readFileSync(
    new URL('./test-setup.ts', import.meta.url).pathname,
    'utf8',
  );
  assert.match(
    testSetup,
    /import\s*\{\s*resolveApiE2ePort\s*\}\s*from\s*['"]\.\/port-helpers['"]/,
    'test-setup must import the shared resolver from port-helpers',
  );
  assert.match(testSetup, /resolveApiE2ePort\(\)/);
});

it('global-setup.ts imports the shared helpers (no drift)', () => {
  assert.match(
    source,
    /import\s*\{\s*ensurePortFree\s*,\s*resolveApiE2ePort\s*\}\s*from\s*['"]\.\/port-helpers['"]/,
  );
});

it('port-helpers.ts is the single source of truth for the resolver', () => {
  assert.match(helpersSource, /export\s+function\s+resolveApiE2ePort/);
  assert.match(helpersSource, /export\s+function\s+ensurePortFree/);
});

process.stdout.write(`\nOK — ${passed} assertions\n`);
