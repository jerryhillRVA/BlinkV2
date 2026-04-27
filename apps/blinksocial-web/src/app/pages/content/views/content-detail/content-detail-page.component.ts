import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ContentStateService } from '../../content-state.service';
import { ToastService } from '../../../../core/toast/toast.service';
import { IdeaDetailComponent } from '../idea-detail/idea-detail.component';
import { ConceptDetailComponent } from '../concept-detail/concept-detail.component';
import { PostDetailComponent } from '../post-detail/post-detail.component';
import type { ContentItem } from '../../content.types';

@Component({
  selector: 'app-content-detail-page',
  imports: [IdeaDetailComponent, ConceptDetailComponent, PostDetailComponent],
  providers: [ContentStateService],
  templateUrl: './content-detail-page.component.html',
  styleUrl: './content-detail-page.component.scss',
})
export class ContentDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);

  protected readonly stateService = inject(ContentStateService);

  protected readonly workspaceId = signal('');
  protected readonly itemId = signal<string | null>(null);
  protected readonly from = signal<string | null>(null);

  protected readonly item = computed<ContentItem | null>(
    () => this.stateService.items().find((i) => i.id === this.itemId()) ?? null,
  );

  protected readonly backLabel = computed(() =>
    this.from() === 'calendar' ? 'Back to calendar' : 'Back to pipeline',
  );

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const id = params.get('id') ?? '';
        const itemId = params.get('itemId') ?? '';
        this.workspaceId.set(id);
        this.itemId.set(itemId || null);
        if (
          this.stateService.workspaceId() !== id ||
          this.stateService.items().length === 0
        ) {
          this.stateService.loadAll(id);
        }
        if (itemId) {
          this.stateService.loadFullItem(itemId);
        }
      });

    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((qp) => {
        this.from.set(qp.get('from'));
      });
  }

  private collectCalendarQueryParams(): Record<string, string> {
    const qp = this.route.snapshot.queryParamMap;
    const out: Record<string, string> = {};
    const from = qp.get('from');
    const view = qp.get('calendarView');
    const cursor = qp.get('calendarCursor');
    if (from) out['from'] = from;
    if (view) out['calendarView'] = view;
    if (cursor) out['calendarCursor'] = cursor;
    return out;
  }

  protected goBack(): void {
    const qp = this.route.snapshot.queryParamMap;
    if (qp.get('from') === 'calendar') {
      const queryParams: Record<string, string> = {};
      const view = qp.get('calendarView');
      const cursor = qp.get('calendarCursor');
      if (view) queryParams['calendarView'] = view;
      if (cursor) queryParams['calendarCursor'] = cursor;
      this.router.navigate(['/workspace', this.workspaceId(), 'calendar'], {
        queryParams,
      });
      return;
    }
    this.router.navigate(['/workspace', this.workspaceId(), 'content']);
  }

  protected onArchive(): void {
    const it = this.item();
    if (!it) return;
    this.stateService.archive(it.id).subscribe(() => this.goBack());
  }

  protected onUnarchive(): void {
    const it = this.item();
    if (!it) return;
    this.stateService.unarchive(it.id).subscribe();
  }

  /** Preserves from/calendarView/calendarCursor so Back from the duplicate still returns to Calendar. */
  protected onDuplicate(): void {
    const it = this.item();
    if (!it) return;
    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = it;
    const draft = {
      ...rest,
      title: `${it.title} (copy)`,
      archived: false,
    } as ContentItem;
    this.stateService.saveItem(draft).subscribe((saved) => {
      const queryParams = this.collectCalendarQueryParams();
      const extras = Object.keys(queryParams).length > 0 ? { queryParams } : undefined;
      this.router.navigate(
        ['/workspace', this.workspaceId(), 'content', saved.id],
        extras,
      );
    });
  }

  protected onCopyLink(): void {
    const url = `${window.location.origin}/workspace/${this.workspaceId()}/content/${this.item()?.id ?? ''}`;
    if (!navigator.clipboard) {
      this.toast.showError('Clipboard not available');
      return;
    }
    navigator.clipboard
      .writeText(url)
      .then(() => this.toast.showSuccess('Link copied to clipboard'))
      .catch(() => this.toast.showError('Failed to copy link'));
  }

  protected onMoved(event: {
    created: ContentItem[];
    workOnItemId: string | null;
  }): void {
    if (event.workOnItemId) {
      this.router.navigate([
        '/workspace',
        this.workspaceId(),
        'content',
        event.workOnItemId,
      ]);
    } else {
      this.goBack();
    }
  }

  protected onDeleted(): void {
    this.goBack();
  }

  /** Preserves from/calendarView/calendarCursor so Back from the new concept still returns to Calendar. */
  protected onAdvancedToConcept(conceptId: string): void {
    const queryParams = this.collectCalendarQueryParams();
    const extras = Object.keys(queryParams).length > 0 ? { queryParams } : undefined;
    this.router.navigate(
      ['/workspace', this.workspaceId(), 'content', conceptId],
      extras,
    );
  }
}
