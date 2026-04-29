import { execFileSync } from 'child_process';

/**
 * Resolve the API e2e port from env. Default 3001 to avoid colliding
 * with the web-e2e webServer (which uses 3000). Single source of truth
 * for both global-setup.ts (which spawns the server on this port) and
 * test-setup.ts (which configures axios). Without this shared resolver
 * the two halves of the bootstrap could drift on the port number.
 */
export function resolveApiE2ePort(env: NodeJS.ProcessEnv = process.env): number {
  const raw = env.API_E2E_PORT;
  const parsed = raw == null || raw === '' ? NaN : Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3001;
}

/**
 * Probe `port` for an existing listener and return its PID + command, or
 * null when nothing is bound. Uses lsof in the same shape as
 * scripts/check-ports.mjs. Tests inject a stub via `ensurePortFree`'s
 * second arg; the default runner uses lsof.
 */
export function probeListener(
  port: number,
): { pid: number; command: string } | null {
  try {
    const raw = execFileSync(
      'lsof',
      ['-Fpc', `-iTCP:${port}`, '-sTCP:LISTEN'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    );
    if (!raw.trim()) return null;
    let pid: number | null = null;
    let command = 'unknown';
    for (const line of raw.split('\n')) {
      if (!line) continue;
      if (line[0] === 'p') pid = Number(line.slice(1));
      else if (line[0] === 'c' && command === 'unknown') command = line.slice(1);
    }
    return pid != null ? { pid, command } : null;
  } catch {
    // lsof exits 1 when nothing is listening, or isn't installed —
    // either way: treat as "free" and let the actual bind attempt
    // surface a real conflict.
    return null;
  }
}

/**
 * Throws when `port` is occupied. The thrown error contains the
 * configured port and the offending PID + command so a developer can
 * fix the conflict in one shell line. Replaces the previous
 * "lsof | xargs kill -9" cleanup which would SIGKILL whatever owned
 * the port — including a sibling worktree's e2e run.
 */
export function ensurePortFree(
  port: number,
  listener: (port: number) => { pid: number; command: string } | null = probeListener,
): void {
  const found = listener(port);
  if (found) {
    throw new Error(
      `API e2e port ${port} is already in use by PID ${found.pid} (${found.command}). ` +
        `Free it (e.g. \`kill ${found.pid}\`) or override API_E2E_PORT for this run. ` +
        `See docs/worktrees.md for the per-worktree port-band convention.`,
    );
  }
}
