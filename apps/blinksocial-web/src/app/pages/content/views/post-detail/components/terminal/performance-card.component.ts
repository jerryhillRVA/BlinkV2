import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import type { ContentMetricsContract, PlatformContract } from '@blinksocial/contracts';
import { IconComponent } from '../../../../../../shared/icons/icon.component';
import { METRIC_LABELS, PERFORMANCE_ROWS } from './performance-card.constants';

interface MetricRow {
  key: keyof ContentMetricsContract;
  label: string;
  value: number | undefined;
  display: string;
}

/**
 * #146: Performance card on the Published detail screen. Renders
 * platform-specific metric rows per spec §6, with three states:
 *  - `metrics === undefined`: empty-state copy.
 *  - explicit-zero values: render `0` (not `—`).
 *  - populated: `toLocaleString()` for counts, `%` for engagementRate.
 *
 * Manual refresh button in the header. Mock behavior — emits a
 * `(refresh)` event that the parent wires to a toast.
 */
@Component({
  selector: 'app-performance-card',
  imports: [IconComponent],
  templateUrl: './performance-card.component.html',
  styleUrl: './performance-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerformanceCardComponent {
  /* v8 ignore next 3 — V8's function-call-throws branches on input()/output() declarations are unreachable */
  readonly metrics = input<ContentMetricsContract | undefined>(undefined);
  readonly platform = input<PlatformContract | null | undefined>(undefined);
  readonly refresh = output<void>();

  protected readonly hasMetrics = computed<boolean>(() => this.metrics() !== undefined);

  protected readonly rows = computed<ReadonlyArray<MetricRow>>(() => {
    const platform = this.platform();
    if (!platform) return [];
    const keys = PERFORMANCE_ROWS[platform];
    const m = this.metrics();
    return keys.map((key) => {
      const value = m?.[key];
      return {
        key,
        label: METRIC_LABELS[key],
        value,
        display: formatMetric(key, value),
      };
    });
  });

  protected onRefreshClick(): void {
    this.refresh.emit();
  }
}

/** Pure formatter — locale-aware counts; percentage for engagementRate. */
function formatMetric(
  key: keyof ContentMetricsContract,
  value: number | undefined,
): string {
  if (value === undefined) return '—';
  if (key === 'engagementRate') {
    // Spec §6 shows "4.2%" for 0.042. Use 1 fractional digit by default.
    return `${(value * 100).toFixed(1)}%`;
  }
  return value.toLocaleString();
}
