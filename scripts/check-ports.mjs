#!/usr/bin/env node
/**
 * Pre-flight port-availability check used by `npm start` (and useful as a
 * standalone helper). Reads API_PORT / WEB_PORT / API_E2E_PORT from env,
 * defaulting to 3000 / 4200 / 3001 respectively. Exits 0 when every
 * configured port is free; exits non-zero with a human-readable error
 * naming the offending PID, listener command, and worktree cwd when any
 * port is occupied.
 *
 * Replaces the previous broad `pkill -f 'nx serve blinksocial'` cleanup,
 * which silently killed every worktree's web/API server. Fail-fast keeps
 * concurrent worktrees safe — see docs/worktrees.md.
 *
 * Flags:
 *   --json                Emit a JSON array (one entry per occupied port)
 *                         instead of human-readable lines. Always non-zero
 *                         exit when occupied; zero exit + empty array when
 *                         all clear.
 *   --ports=<csv>         Override which ports to check. Values are taken
 *                         literally (e.g. --ports=3000,4200,3001). When
 *                         omitted, the env-driven trio is used.
 *
 * Exported helpers (`resolvePorts`, `inspectPort`, `runCheck`) are imported
 * by scripts/check-ports.spec.mjs to drive U-1, U-2, U-3 without spawning
 * a child process per assertion.
 */

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const DEFAULT_PORTS = Object.freeze({
  API_PORT: 3000,
  WEB_PORT: 4200,
  API_E2E_PORT: 3001,
});

/**
 * Resolve the trio of ports from a (possibly partial) env-like object.
 * Non-numeric / NaN values fall back to the documented defaults so a
 * malformed `.env` can't silently disable the check.
 */
export function resolvePorts(env = process.env) {
  const pick = (name) => {
    const raw = env[name];
    const parsed = raw == null || raw === '' ? NaN : Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_PORTS[name];
  };
  return {
    API_PORT: pick('API_PORT'),
    WEB_PORT: pick('WEB_PORT'),
    API_E2E_PORT: pick('API_E2E_PORT'),
  };
}

/**
 * Probe a single TCP port. Returns `{ free: true }` when nothing is
 * listening; otherwise `{ free: false, pid, command, cwd }` with whatever
 * detail `lsof` could surface. Falls back gracefully when `lsof` isn't on
 * PATH (returns free=true so we don't hard-block the developer's machine
 * — the OS bind attempt itself will surface the conflict downstream).
 *
 * The optional `runner` parameter lets tests inject a stub instead of
 * shelling out to lsof. Real callers omit it.
 */
export function inspectPort(port, runner = defaultRunner) {
  let raw;
  try {
    raw = runner(['-Fpcn', '-iTCP:' + port, '-sTCP:LISTEN']);
  } catch (err) {
    // lsof exits non-zero when nothing is listening — treat as free.
    if (err && typeof err === 'object' && 'status' in err && err.status === 1) {
      return { free: true };
    }
    // Tool missing / permission error — degrade to "free" rather than
    // blocking. The OS bind attempt is the ultimate authority.
    return { free: true };
  }
  if (!raw || !raw.trim()) return { free: true };

  // lsof -F output is one field per line, prefixed with a single char:
  //   p<pid>  c<command>  n<bind-addr:port>  ... etc.
  // Multiple processes are separated by another `p` line.
  const lines = raw.split('\n');
  let pid = null;
  let command = null;
  for (const line of lines) {
    if (!line) continue;
    const tag = line[0];
    const value = line.slice(1);
    if (tag === 'p') pid = Number(value);
    else if (tag === 'c' && command == null) command = value;
  }
  if (pid == null) return { free: true };

  let cwd = null;
  try {
    cwd = runner(['-a', '-p', String(pid), '-d', 'cwd', '-Fn']).split('\n')
      .find((line) => line.startsWith('n'))
      ?.slice(1) ?? null;
  } catch {
    cwd = null;
  }

  return { free: false, pid, command: command ?? 'unknown', cwd };
}

function defaultRunner(args) {
  return execFileSync('lsof', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
}

/**
 * Drive the full check. Returns `{ ok, occupied }`. `occupied` is an
 * array of `{ name, port, pid, command, cwd }` describing each conflict.
 * Side-effect-free apart from the lsof shell-outs; printing is left to
 * the CLI wrapper.
 */
export function runCheck({ env = process.env, ports, runner } = {}) {
  const resolved = resolvePorts(env);
  const targets = ports
    ? Array.isArray(ports)
      ? ports.map((p) => ({ name: '', port: Number(p) }))
      : Object.entries(ports).map(([name, port]) => ({ name, port }))
    : Object.entries(resolved).map(([name, port]) => ({ name, port }));

  const occupied = [];
  for (const { name, port } of targets) {
    if (!Number.isFinite(port) || port <= 0) continue;
    const result = inspectPort(port, runner);
    if (!result.free) {
      occupied.push({
        name,
        port,
        pid: result.pid,
        command: result.command,
        cwd: result.cwd,
      });
    }
  }
  return { ok: occupied.length === 0, occupied };
}

function parseArgs(argv) {
  const out = { json: false, ports: null };
  for (const arg of argv) {
    if (arg === '--json') out.json = true;
    else if (arg.startsWith('--ports=')) {
      out.ports = arg
        .slice('--ports='.length)
        .split(',')
        .map((p) => Number(p.trim()))
        .filter((n) => Number.isFinite(n) && n > 0);
    }
  }
  return out;
}

function formatOccupied(o) {
  const where = o.cwd ? ` (cwd: ${o.cwd})` : '';
  const label = o.name ? ` [${o.name}]` : '';
  return `port ${o.port}${label} is in use by PID ${o.pid} (${o.command})${where}`;
}

function main(argv) {
  const opts = parseArgs(argv);
  const result = runCheck({ ports: opts.ports });
  if (opts.json) {
    process.stdout.write(JSON.stringify(result.occupied, null, 2) + '\n');
  } else if (!result.ok) {
    for (const occ of result.occupied) {
      process.stderr.write(`✖ ${formatOccupied(occ)}\n`);
    }
    process.stderr.write(
      '\nFree the port (e.g. `kill <PID>`) or pick a different worktree port band — see docs/worktrees.md.\n',
    );
  }
  process.exit(result.ok ? 0 : 1);
}

const isDirect = (() => {
  try {
    return process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
  } catch {
    return false;
  }
})();
if (isDirect) {
  main(process.argv.slice(2));
}
