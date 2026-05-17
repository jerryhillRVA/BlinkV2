import { Component, computed, input, output } from '@angular/core';
import { IconComponent } from '../../../../../shared/icons/icon.component';
import { PlatformIconComponent } from '../../../../../shared/platform-icon/platform-icon.component';
import type { ContentItem } from '../../../content.types';

const WARNING_TOOLTIP = 'Add post link to enable performance tracking.';

/**
 * #140 Publish Flow — Published card variant.
 *
 * Renders title, content-type chip, CheckCircle + green Published badge,
 * formatted `publishedAt`, platform, pillar tags, and a placeholder
 * performance teaser. When `isExported`, also renders the gray
 * Exported pill (additive, not a replacement).
 */
@Component({
  selector: 'app-pipeline-card-published',
  imports: [IconComponent, PlatformIconComponent],
  templateUrl: './pipeline-card-published.component.html',
  styleUrl: './pipeline-card-published.component.scss',
})
export class PipelineCardPublishedComponent {
  /* v8 ignore next 3 — V8's function-call-throws branches on input()/output() declarations are unreachable */
  readonly item = input.required<ContentItem>();
  readonly pillarNames = input<ReadonlyArray<{ id: string; name: string }>>([]);
  readonly opened = output<void>();

  protected readonly publishedLabel = computed(() => {
    const iso = this.item().publishedAt;
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
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

  /** #146: warning when Export-Packet published item still has no URL. */
  protected readonly showWarning = computed<boolean>(
    () => !!this.item().isExported && !this.item().livePostUrl,
  );
  protected readonly warningTooltip = WARNING_TOOLTIP;

  /**
   * #146: thumbnail source — per-platform cover field. Per-platform
   * packaging shapes differ; the post-#116 contract uses `coverAsset`
   * on IG/TT/FB and `thumbnail` on YouTube. Falls back to null when
   * no cover is set; template renders the platform-icon placeholder.
   */
  protected readonly thumbnailUrl = computed<string | null>(() => {
    const platform = this.item().platform;
    if (!platform) return null;
    const pkg = this.item().production?.packaging as
      | Record<string, { coverAsset?: string; coverAssetUrl?: string; thumbnail?: string }>
      | undefined;
    const slot = pkg?.[platform];
    if (!slot) return null;
    return slot.coverAssetUrl ?? slot.coverAsset ?? slot.thumbnail ?? null;
  });

  protected onCardClick(): void {
    this.opened.emit();
  }
}
