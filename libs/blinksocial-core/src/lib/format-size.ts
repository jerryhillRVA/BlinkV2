/**
 * Format a byte count into a short human-readable string.
 *
 * Uses binary IEC units (1024 base) but presents them with the more familiar
 * SI labels — `KB`, `MB`, `GB`. Values < 1 KB are printed as whole bytes
 * with a `B` suffix.
 *
 * Rounding rules:
 *   - 0–999 bytes → integer + ` B` (e.g. `512 B`)
 *   - >= 1 KB    → 1 decimal place when under 100, else integer (e.g.
 *     `1.5 KB`, `12.3 MB`, `512 MB`).
 *
 * Negative or non-finite inputs return `'0 B'`.
 */
export function formatSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }

  if (bytes < 1024) {
    return `${Math.round(bytes)} B`;
  }

  const units = ['KB', 'MB', 'GB', 'TB'] as const;
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const formatted = value < 100 ? value.toFixed(1) : Math.round(value).toString();
  return `${formatted} ${units[unitIndex]}`;
}
