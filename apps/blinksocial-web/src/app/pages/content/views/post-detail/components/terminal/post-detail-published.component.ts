import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ToastService } from '../../../../../../core/toast/toast.service';
import { ContentStateService } from '../../../../content-state.service';
import type { ContentItem } from '../../../../content.types';
import { BriefContentConceptComponent } from '../brief-content-concept.component';
import { PostDetailHeaderComponent } from '../post-detail-header.component';
import { PostPreviewCardComponent } from '../post-preview-card.component';
import { ContentJourneyComponent } from '../../../idea-detail/components/content-journey.component';
import { DetailBackButtonComponent } from '../../../_shared/detail-back-button/detail-back-button.component';
import { PostDetailStore } from '../../post-detail.store';
import { LivePostLinkCardComponent } from './live-post-link-card.component';
import { PerformanceCardComponent } from './performance-card.component';

/**
 * #146: Published-status detail shell. Left column carries read-only
 * Hook + Description + Live Post Link card + Performance card. Right
 * sidebar carries PostPreview + Content Concept + Published Date
 * (read-only) + Content Journey + Timestamps. Header is the
 * Published-variant pipeline badge with the optional Exported chip.
 *
 * Menu actions:
 *  - View Live Post (if `livePostUrl` set) → window.open
 *  - Download Export → mock toast
 *  - Archive → store.archive() + emit back
 */
@Component({
  selector: 'app-post-detail-published',
  imports: [
    PostDetailHeaderComponent,
    PostPreviewCardComponent,
    BriefContentConceptComponent,
    ContentJourneyComponent,
    DetailBackButtonComponent,
    LivePostLinkCardComponent,
    PerformanceCardComponent,
  ],
  templateUrl: './post-detail-published.component.html',
  styleUrl: './post-detail-published.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostDetailPublishedComponent {
  protected readonly store = inject(PostDetailStore);
  private readonly state = inject(ContentStateService);
  private readonly toast = inject(ToastService);
  private readonly platformId = inject(PLATFORM_ID);

  @Input() backLabel = 'Back to pipeline';
  @Input() parentConcept: ContentItem | null = null;
  @Input() previewCaption = '';
  @Input() previewCoverAsset: string | undefined;

  /**
   * #146: terminal shells default to expanded so the post preview is
   * visible immediately — matches the prototype reference.
   */
  /* v8 ignore next 1 — V8's function-call-throws branches on signal() declarations are unreachable */
  protected readonly previewExpanded = signal(true);

  @Output() back = new EventEmitter<void>();

  protected readonly businessObjectives = this.state.businessObjectives;

  protected readonly item = computed<ContentItem | null>(() => this.store.item());

  protected onBack(): void {
    this.back.emit();
  }

  protected onLivePostUrlChange(url: string): void {
    this.store.setLivePostUrl(url);
  }

  protected onViewLivePost(): void {
    const url = this.item()?.livePostUrl;
    if (!url) return;
    if (!isPlatformBrowser(this.platformId)) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  protected onDownloadExport(): void {
    this.toast.showSuccess('Export downloaded.');
  }

  protected onArchive(): void {
    this.store.archive();
    this.back.emit();
  }

  protected onPerformanceRefresh(): void {
    this.toast.showSuccess('Performance data refreshed.');
  }

  protected formatPublishedAt(iso: string | undefined): string {
    if (!iso) return '— pending post link';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '— pending post link';
    return d.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  protected formatDate(iso: string | undefined): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
}
