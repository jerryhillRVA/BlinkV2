import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ContentStateService } from '../../content-state.service';
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

  protected readonly stateService = inject(ContentStateService);

  protected readonly workspaceId = signal('');
  protected readonly itemId = signal<string | null>(null);

  protected readonly item = computed<ContentItem | null>(
    () => this.stateService.items().find((i) => i.id === this.itemId()) ?? null,
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
      });
  }

  protected goBack(): void {
    this.router.navigate(['/workspace', this.workspaceId(), 'content']);
  }

  protected onArchive(): void {
    const it = this.item();
    if (!it) return;
    this.stateService.saveItem({
      ...it,
      archived: true,
      updatedAt: new Date().toISOString(),
    });
    this.goBack();
  }

  protected onDuplicate(): void {
    const it = this.item();
    if (!it) return;
    const copy: ContentItem = {
      ...it,
      id: `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      title: `${it.title} (copy)`,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.stateService.saveItem(copy);
    this.router.navigate(['/workspace', this.workspaceId(), 'content', copy.id]);
  }

  protected onCopyLink(): void {
    const url = `${window.location.origin}/workspace/${this.workspaceId()}/content/${this.item()?.id ?? ''}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {
        /* v8 ignore next */
      });
    }
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
}
