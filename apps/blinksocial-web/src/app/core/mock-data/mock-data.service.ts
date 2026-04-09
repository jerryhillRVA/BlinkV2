import { Injectable, computed, signal } from '@angular/core';

/**
 * Tracks which feature areas are still rendering mock data.
 *
 * Components that read from `MOCK_*` constants should bind their host
 * class to `mockData.isMock('<feature>')`. The global CSS rule for
 * `.is-mock-source .has-mock-data::after` then renders the `※` indicator
 * for every `has-mock-data` element inside that subtree. When a feature
 * is wired to the real Agentic Filesystem path, call `markReal('<feature>')`
 * (or remove its key from the initial map) and every marker beneath that
 * component disappears automatically with no template changes.
 */
@Injectable({ providedIn: 'root' })
export class MockDataService {
  private readonly state = signal<Record<string, boolean>>({
    'brand-voice': true,
    'audience': true,
    'strategic-pillars': true,
    'channel-strategy': true,
    'content-mix': true,
    'research-sources': true,
    'competitor-deep-dive': true,
    'content-repurposer': true,
    'series-builder': true,
    'ab-analyzer': true,
    'seo-hashtags': true,
    'business-objectives': true,
  });

  /** Reactive snapshot of the mock-feature map. */
  readonly snapshot = computed(() => this.state());

  isMock(feature: string): boolean {
    return this.state()[feature] ?? false;
  }

  /** Mark a feature as backed by real data. The marker disappears immediately. */
  markReal(feature: string): void {
    this.state.update((s) => ({ ...s, [feature]: false }));
  }

  /** Re-mark a feature as mock (useful in tests / dev toggling). */
  markMock(feature: string): void {
    this.state.update((s) => ({ ...s, [feature]: true }));
  }
}
