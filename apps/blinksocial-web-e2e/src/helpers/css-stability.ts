import { Locator, expect } from '@playwright/test';

/**
 * Wait for a CSS property on `locator` to stop changing (i.e. CSS
 * transitions / animations have settled). Reads `prop` repeatedly and
 * returns the final stable value.
 *
 * Replaces `await page.waitForTimeout(N)` patterns that fixed N to "past
 * the transition" — fragile when transitions take longer than expected
 * on slower machines or under CPU contention. This polls instead, so it
 * adapts to the actual transition speed.
 *
 * @param locator      The element to inspect
 * @param prop         CSS property to read (e.g. 'border-top-color')
 * @param settleMs     Two consecutive reads `settleMs` apart that produce
 *                     the same value count as "settled" (default 80ms)
 * @param timeoutMs    Overall timeout cap; throws if value never settles
 *                     within this window (default 2000ms)
 */
export async function waitForCssToSettle(
  locator: Locator,
  prop: string,
  settleMs = 80,
  timeoutMs = 2000,
): Promise<string> {
  let last: string | null = null;
  let lastChangedAt = Date.now();
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const current = await locator.evaluate(
      (el, p) => getComputedStyle(el).getPropertyValue(p),
      prop,
    );
    if (current !== last) {
      last = current;
      lastChangedAt = Date.now();
    } else if (Date.now() - lastChangedAt >= settleMs) {
      return current;
    }
    await new Promise((r) => setTimeout(r, 25));
  }
  throw new Error(
    `waitForCssToSettle: CSS property "${prop}" did not stabilize within ${timeoutMs}ms (last value: ${last})`,
  );
}
