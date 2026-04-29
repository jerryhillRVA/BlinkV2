/**
 * Plain-Node test driver for scripts/check-ports.mjs (no dependency on Nx
 * test executors — this script lives outside any project). Run via:
 *
 *   node scripts/check-ports.spec.mjs
 *
 * Covers ACs U-1, U-2, U-3 from issue #76. Exits non-zero on first failure.
 */

import assert from 'node:assert/strict';
import { resolvePorts, inspectPort, runCheck } from './check-ports.mjs';

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

process.stdout.write('check-ports.mjs\n');

// U-3: env resolution + defaults.
it('reads API_PORT / WEB_PORT / API_E2E_PORT from env', () => {
  const ports = resolvePorts({
    API_PORT: '3101',
    WEB_PORT: '4201',
    API_E2E_PORT: '3201',
  });
  assert.deepEqual(ports, { API_PORT: 3101, WEB_PORT: 4201, API_E2E_PORT: 3201 });
});

it('falls back to 3000 / 4200 / 3001 when env is unset', () => {
  assert.deepEqual(resolvePorts({}), {
    API_PORT: 3000,
    WEB_PORT: 4200,
    API_E2E_PORT: 3001,
  });
});

it('falls back when env values are non-numeric or zero', () => {
  assert.deepEqual(
    resolvePorts({ API_PORT: 'nope', WEB_PORT: '0', API_E2E_PORT: '' }),
    { API_PORT: 3000, WEB_PORT: 4200, API_E2E_PORT: 3001 },
  );
});

// U-1: all-free path.
it('runCheck returns { ok: true } when every port is free', () => {
  // Stub lsof: throw with status=1 like the real "no process" exit.
  const runner = () => {
    const e = new Error('no listener');
    e.status = 1;
    throw e;
  };
  const result = runCheck({ env: {}, runner });
  assert.equal(result.ok, true);
  assert.deepEqual(result.occupied, []);
});

// U-2: occupied path surfaces PID + command (+ cwd when available).
it('runCheck reports PID + command + cwd when a port is occupied', () => {
  const lsofResponses = [
    'p4242\nctest-server\nn127.0.0.1:3000\n',
    'p4242\nn/Users/someone/worktree-a\n',
    // Other ports — empty (free) — runner throws with status=1.
  ];
  let call = 0;
  const runner = (args) => {
    // Detect "cwd lookup" calls by the -d flag.
    if (args.includes('-d')) return lsofResponses[1];
    if (call >= lsofResponses.length / 1) {
      const e = new Error('no listener');
      e.status = 1;
      throw e;
    }
    return lsofResponses[call++];
  };

  // Override defaults via explicit ports so we can target a single port.
  const result = runCheck({
    ports: { API_PORT: 3000 },
    runner,
  });
  assert.equal(result.ok, false);
  assert.equal(result.occupied.length, 1);
  const occ = result.occupied[0];
  assert.equal(occ.port, 3000);
  assert.equal(occ.pid, 4242);
  assert.equal(occ.command, 'test-server');
  assert.equal(occ.cwd, '/Users/someone/worktree-a');
});

// U-2 supplemental — port discovery via inspectPort directly.
it('inspectPort treats lsof exit status 1 as "free"', () => {
  const runner = () => {
    const e = new Error();
    e.status = 1;
    throw e;
  };
  assert.deepEqual(inspectPort(3000, runner), { free: true });
});

it('inspectPort handles missing lsof gracefully (free)', () => {
  const runner = () => {
    throw new Error('lsof not found');
  };
  assert.deepEqual(inspectPort(3000, runner), { free: true });
});

process.stdout.write(`\nOK — ${passed} assertions\n`);
