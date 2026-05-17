import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, effect, inject } from '@angular/core';
import { ContentStateService } from '../../pages/content/content-state.service';
import type { ContentItem } from '../../pages/content/content.types';

/**
 * #140: silently auto-transitions `status='scheduled'` items whose
 * `scheduledAt` has passed to `status='published'` with a freshly
 * stamped `publishedAt`. `isExported` is preserved.
 *
 * Two wake signals:
 *  1. A signal-driven `effect()` re-evaluates on every `items()` emission.
 *  2. A 60-second `setInterval` heartbeat catches boundary crossings
 *     during a long-running session where the cache isn't refreshing.
 *
 * No toast is emitted — silent transition per spec §2.
 */
@Injectable({ providedIn: 'root' })
export class PublishTransitionService {
  private readonly state = inject(ContentStateService);
  private readonly platformId = inject(PLATFORM_ID);
  private timerHandle: ReturnType<typeof setInterval> | undefined;

  /**
   * Call once at app boot (from `AppComponent`'s constructor).
   * Idempotent; safe to call multiple times — only the first call
   * installs the heartbeat.
   */
  start(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.timerHandle !== undefined) return;

    // Reactive: re-evaluate whenever the items signal emits.
    effect(() => this.checkAndFlip(this.state.items()));

    // Heartbeat: catches a scheduledAt boundary crossing during a long
    // session with no other signal activity.
    this.timerHandle = setInterval(
      () => this.checkAndFlip(this.state.items()),
      60_000,
    );
  }

  /**
   * Test/teardown helper — clears the heartbeat. Production code
   * doesn't call this; the service lives for the app's lifetime.
   */
  stop(): void {
    if (this.timerHandle !== undefined) {
      clearInterval(this.timerHandle);
      this.timerHandle = undefined;
    }
  }

  /**
   * Pure function — exported for unit-test injection. Walks the items
   * array, finds any past-due `scheduled` items, and persists the
   * transition through `state.saveItem`.
   */
  checkAndFlip(items: ReadonlyArray<ContentItem>): void {
    const now = Date.now();
    for (const item of items) {
      if (item.status !== 'scheduled') continue;
      if (!item.scheduledAt) continue;
      const t = new Date(item.scheduledAt).getTime();
      if (Number.isNaN(t) || t > now) continue;
      const transitionedAt = new Date().toISOString();
      this.state.saveItem({
        ...item,
        status: 'published',
        publishedAt: transitionedAt,
        // isExported intentionally NOT touched — preserve the flag.
        updatedAt: transitionedAt,
      });
    }
  }
}
