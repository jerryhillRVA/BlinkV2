/**
 * Plain-Node test for proxy.conf.js (no Nx executor — the file is dev-server
 * config, not part of the Angular build). Run via:
 *
 *   node apps/blinksocial-web/proxy.conf.spec.mjs
 *
 * Covers AC U-4 from issue #76.
 */

import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const proxyPath = new URL('./proxy.conf.js', import.meta.url).pathname;

function loadProxy(envOverrides) {
  // Reset the cached module so each call sees a fresh evaluation against
  // the env we just mutated.
  delete require.cache[require.resolve(proxyPath)];
  const previous = {};
  for (const key of Object.keys(envOverrides)) {
    previous[key] = process.env[key];
    if (envOverrides[key] === undefined) delete process.env[key];
    else process.env[key] = envOverrides[key];
  }
  try {
    return require(proxyPath);
  } finally {
    for (const key of Object.keys(previous)) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
}

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

process.stdout.write('proxy.conf.js\n');

it('defaults /api to localhost:3000 when API_PORT is unset', () => {
  const cfg = loadProxy({ API_PORT: undefined });
  assert.equal(cfg['/api'].target, 'http://localhost:3000');
});

it('honors API_PORT for /api', () => {
  const cfg = loadProxy({ API_PORT: '3101' });
  assert.equal(cfg['/api'].target, 'http://localhost:3101');
});

it('falls back to 3000 when API_PORT is non-numeric', () => {
  const cfg = loadProxy({ API_PORT: 'oops' });
  assert.equal(cfg['/api'].target, 'http://localhost:3000');
});

it('keeps changeOrigin and secure for every entry', () => {
  const cfg = loadProxy({});
  for (const key of ['/api', '/v1', '/admin']) {
    assert.equal(cfg[key].changeOrigin, true, `${key} changeOrigin`);
    assert.equal(cfg[key].secure, false, `${key} secure`);
  }
});

process.stdout.write(`\nOK — ${passed} assertions\n`);
