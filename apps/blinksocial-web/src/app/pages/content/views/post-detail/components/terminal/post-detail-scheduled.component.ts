import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
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
import { ScheduledDateCardComponent } from './scheduled-date-card.component';

/**
 * #146: Scheduled-status detail shell. Read-heavy view of an approved
 * post awaiting its publish date. Header is the Scheduled-variant
 * pipeline badge; left column is read-only Hook + Description; right
 * sidebar carries PostPreview + Content Concept + editable Scheduled
 * Date card + Content Journey + Timestamps.
 *
 * Menu actions wire to:
 *  - Edit          → `store.revertToInProgress()` (flips status + navigates to qa)
 *  - Download Export → toast (mock; #145 wires real generation)
 *  - Archive       → `store.archive()` + emit back
 */
@Component({
  selector: 'app-post-detail-scheduled',
  imports: [
    PostDetailHeaderComponent,
    PostPreviewCardComponent,
    BriefContentConceptComponent,
    ContentJourneyComponent,
    DetailBackButtonComponent,
    ScheduledDateCardComponent,
  ],
  templateUrl: './post-detail-scheduled.component.html',
  styleUrl: './post-detail-scheduled.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostDetailScheduledComponent {
  protected readonly store = inject(PostDetailStore);
  private readonly state = inject(ContentStateService);
  private readonly toast = inject(ToastService);

  @Input() backLabel = 'Back to pipeline';
  @Input() parentConcept: ContentItem | null = null;
  @Input() previewCaption = '';
  @Input() previewCoverAsset: string | undefined;

  /* v8 ignore next 1 — V8's function-call-throws branches on signal() declarations are unreachable */
  protected readonly previewExpanded = signal(false);

  @Output() back = new EventEmitter<void>();

  protected readonly businessObjectives = this.state.businessObjectives;

  protected readonly item = computed<ContentItem | null>(() => this.store.item());

  protected onBack(): void {
    this.back.emit();
  }

  protected onScheduledAtChange(local: string): void {
    this.store.setPublishScheduledAt(local);
  }

  protected onEdit(): void {
    this.store.revertToInProgress();
    // Note: revertToInProgress() flips status to 'in-progress' which
    // takes the user out of this shell — post-detail.component's outer
    // status @switch falls through to the production-step shell. No
    // explicit navigation needed.
  }

  protected onDownloadExport(): void {
    this.toast.showSuccess('Export downloaded.');
  }

  protected onArchive(): void {
    this.store.archive();
    this.back.emit();
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
