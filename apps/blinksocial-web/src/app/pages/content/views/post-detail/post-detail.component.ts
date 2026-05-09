import {
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ContentStateService } from '../../content-state.service';
import { PostDetailStore } from './post-detail.store';
import { PostDetailHeaderComponent } from './components/post-detail-header.component';
import { ProductionStepsBarComponent } from './components/production-steps-bar.component';
import { BriefStepComponent } from './components/brief-step.component';
import { BriefContentConceptComponent } from './components/brief-content-concept.component';
import { VariationChipsComponent } from './components/variation-chips.component';
import { StepPlaceholderComponent } from './components/step-placeholder.component';
import { DetailBackButtonComponent } from '../_shared/detail-back-button/detail-back-button.component';
import type { ContentItem } from '../../content.types';

@Component({
  selector: 'app-post-detail',
  imports: [
    PostDetailHeaderComponent,
    ProductionStepsBarComponent,
    BriefStepComponent,
    BriefContentConceptComponent,
    VariationChipsComponent,
    StepPlaceholderComponent,
    DetailBackButtonComponent,
  ],
  providers: [PostDetailStore],
  templateUrl: './post-detail.component.html',
  styleUrl: './post-detail.component.scss',
})
export class PostDetailComponent {
  protected readonly store = inject(PostDetailStore);
  private readonly state = inject(ContentStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  @Input({ required: false }) set itemId(value: string | null | undefined) {
    if (value !== undefined) this.store.setItemId(value);
  }

  @Input() backLabel = 'Back to pipeline';

  @Output() back = new EventEmitter<void>();
  @Output() deleted = new EventEmitter<void>();

  // ── Computeds ───────────────────────────────────────────────────────
  protected readonly siblings = computed<ContentItem[]>(() => {
    const item = this.store.item();
    if (!item?.conceptId) return [];
    return this.state
      .items()
      .filter((i) => i.conceptId === item.conceptId && i.stage === 'post');
  });

  protected readonly parentConcept = computed<ContentItem | null>(() => {
    const conceptId = this.store.item()?.conceptId;
    if (!conceptId) return null;
    return this.state.items().find((i) => i.id === conceptId) ?? null;
  });

  // ── Handlers ────────────────────────────────────────────────────────
  protected onBack(): void {
    this.back.emit();
  }

  protected onTitleChange(v: string): void {
    this.store.updateTitle(v);
  }

  protected onBackToConcept(): void {
    const conceptId = this.store.item()?.conceptId;
    if (!conceptId) return;
    const workspaceId = this.route.snapshot.paramMap.get('id') ?? '';
    this.router.navigate(['/workspace', workspaceId, 'content', conceptId]);
  }

  protected onOpenSibling(id: string): void {
    const workspaceId = this.route.snapshot.paramMap.get('id') ?? '';
    this.router.navigate(['/workspace', workspaceId, 'content', id]);
  }

  protected onArchive(): void {
    this.store.archive();
    this.back.emit();
  }

  protected onUnarchive(): void {
    this.store.unarchive();
  }

  protected onDuplicate(): void {
    const copy = this.store.duplicate();
    if (!copy) return;
    const workspaceId = this.route.snapshot.paramMap.get('id') ?? '';
    this.router.navigate(['/workspace', workspaceId, 'content', copy.id]);
  }

  protected onDelete(): void {
    const item = this.store.item();
    const label = item?.title ? `"${item.title}"` : 'this post';
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;
    this.store.deleteSelf();
    this.deleted.emit();
  }
}
