import { Component, computed, input, output } from '@angular/core';
import { IconComponent } from '../../../../../shared/icons/icon.component';
import { PlatformIconComponent } from '../../../../../shared/platform-icon/platform-icon.component';
import type { ContentItem } from '../../../content.types';

/**
 * #140 Publish Flow — Scheduled card variant.
 *
 * Renders title, content-type chip, Clock icon + formatted `scheduledAt`,
 * platform, pillar tags, a "Ready to publish" indicator, and (when
 * `isExported`) the gray Exported pill. Drops brief/draft/packaging
 * progress affordances — those steps are done.
 */
@Component({
  selector: 'app-pipeline-card-scheduled',
  imports: [IconComponent, PlatformIconComponent],
  templateUrl: './pipeline-card-scheduled.component.html',
  styleUrl: './pipeline-card-scheduled.component.scss',
})
export class PipelineCardScheduledComponent {
  /* v8 ignore next 3 — V8's function-call-throws branches on input()/output() declarations are unreachable */
  readonly item = input.required<ContentItem>();
  readonly pillarNames = input<ReadonlyArray<{ id: string; name: string }>>([]);
  readonly opened = output<void>();

  protected readonly scheduledLabel = computed(() => {
    const iso = this.item().scheduledAt;
    if (!iso) return 'No date set';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return 'No date set';
    return d.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  });

  protected readonly pillarsForItem = computed(() => {
    const ids = this.item().pillarIds ?? [];
    const map = new Map(this.pillarNames().map((p) => [p.id, p.name]));
    return ids.map((id) => map.get(id)).filter((n): n is string => !!n);
  });

  /** #146: warning for Export-Packet-scheduled items still missing a URL. */
  protected readonly showWarning = computed<boolean>(
    () => !!this.item().isExported && !this.item().livePostUrl,
  );
  protected readonly warningTooltip = 'Add post link to enable performance tracking.';

  protected onCardClick(): void {
    this.opened.emit();
  }
}
