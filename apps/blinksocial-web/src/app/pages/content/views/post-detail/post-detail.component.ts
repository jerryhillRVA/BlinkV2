import {
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ContentStateService } from '../../content-state.service';
import { PostDetailStore } from './post-detail.store';
import { PostDetailHeaderComponent } from './components/post-detail-header.component';
import { ProductionStepsBarComponent } from './components/production-steps-bar.component';
import { BriefStepComponent } from './components/brief-step.component';
import { BriefContentConceptComponent } from './components/brief-content-concept.component';
import { DraftStepComponent } from './components/draft-step/draft-step.component';
import { PackagingStepComponent } from './components/packaging-step/packaging-step.component';
import { PostPreviewCardComponent } from './components/post-preview-card.component';
import { StepActionBarComponent } from './components/step-action-bar/step-action-bar.component';
import { ApproveScheduleStepComponent } from './components/approve-schedule-step/approve-schedule-step.component';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';
import { PostDetailScheduledComponent } from './components/terminal/post-detail-scheduled.component';
import { PostDetailPublishedComponent } from './components/terminal/post-detail-published.component';
import { DetailBackButtonComponent } from '../_shared/detail-back-button/detail-back-button.component';
import { ContentJourneyComponent } from '../idea-detail/components/content-journey.component';
import type { ContentItem } from '../../content.types';

@Component({
  selector: 'app-post-detail',
  imports: [
    PostDetailHeaderComponent,
    ProductionStepsBarComponent,
    BriefStepComponent,
    BriefContentConceptComponent,
    DraftStepComponent,
    PackagingStepComponent,
    PostPreviewCardComponent,
    StepActionBarComponent,
    ContentJourneyComponent,
    ApproveScheduleStepComponent,
    ConfirmDialogComponent,
    PostDetailScheduledComponent,
    PostDetailPublishedComponent,
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

  protected readonly businessObjectives = this.state.businessObjectives;

  @Input({ required: false }) set itemId(value: string | null | undefined) {
    if (value !== undefined) this.store.setItemId(value);
  }

  @Input() backLabel = 'Back to pipeline';

  @Output() back = new EventEmitter<void>();

  // ── Computeds ───────────────────────────────────────────────────────
  protected readonly parentConcept = computed<ContentItem | null>(() => {
    const conceptId = this.store.item()?.conceptId;
    if (!conceptId) return null;
    return this.state.items().find((i) => i.id === conceptId) ?? null;
  });

  // ── Post Preview sidebar inputs (Packaging step only) ───────────────
  // Caption comes from the active platform's packaging slot. Slides
  // wire-up against real asset uploads is a follow-up — for now, slides
  // resolves to an empty array and the preview falls back to coverAsset
  // / the "Media" placeholder. Mirrors PostPreview.tsx in the prototype.
  protected readonly previewCaption = computed<string>(() => {
    const platform = this.store.item()?.platform;
    if (platform === 'instagram') return this.store.instagramPackaging()?.caption ?? '';
    if (platform === 'tiktok') return this.store.tiktokPackaging()?.caption ?? '';
    return '';
  });

  protected readonly previewCoverAsset = computed<string | undefined>(() => {
    // The preview's <img src> needs a resolvable URL (data: URL today via
    // upload's FileReader; https:// AgenticFS URL once real persistence
    // lands). The display-only `coverAsset` filename is not src-able.
    const platform = this.store.item()?.platform;
    if (platform === 'instagram') return this.store.instagramPackaging()?.coverAssetUrl;
    return undefined;
  });

  /**
   * Expand/collapse state for `<app-post-preview-card>`. Lives on the
   * parent so it survives the `@switch` transition between Packaging
   * and Approve & Schedule — both render the card under their own
   * `<aside class="brief-side">`, which @switch destroys + re-creates
   * on every step change. Two-way bound via `[(expanded)]`.
   */
  protected readonly previewExpanded = signal(false);

  constructor() {
    // Hydrate the parent concept's full detail whenever it changes, so the
    // sidebar Content Concept card sees description / hook / objective /
    // platform / contentType (the index entry is too lite for those fields).
    effect(() => {
      const concept = this.parentConcept();
      if (concept?.id) {
        this.state.loadFullItem(concept.id);
      }
    });
  }

  /**
   * #140: open state for the Export Packet confirmation dialog.
   * Toggled by `onFinish` when the publishAction is `export-packet`;
   * confirm → `store.finishPost()`, cancel → reset.
   */
  /* v8 ignore next 1 — V8's function-call-throws branches on signal() declarations are unreachable */
  protected readonly exportConfirmOpen = signal(false);

  // ── Handlers ────────────────────────────────────────────────────────
  protected onBack(): void {
    this.back.emit();
  }

  /**
   * #140 Finish action. Routes to the confirm-dialog for export-packet,
   * direct-fires `store.finishPost()` otherwise. After a non-Draft
   * action lands the post in a terminal state, navigate back to the
   * pipeline view so the user sees the card in its new column.
   */
  protected onFinish(): void {
    const action = this.store.publishConfig().publishAction;
    if (action === 'export-packet') {
      this.exportConfirmOpen.set(true);
      return;
    }
    this.store.finishPost();
    if (action !== 'save-draft') {
      this.back.emit();
    }
  }

  protected onExportConfirmed(): void {
    this.exportConfirmOpen.set(false);
    this.store.finishPost();
    this.back.emit();
  }

  protected onExportCancelled(): void {
    this.exportConfirmOpen.set(false);
  }

  protected onTitleChange(v: string): void {
    this.store.updateTitle(v);
  }

  protected onBackToConcept(): void {
    const conceptId = this.store.item()?.conceptId;
    if (!conceptId) return;
    const workspaceId = this.route.snapshot.paramMap.get('id') ?? '';
    const n = this.store.liveSiblingPostCount();
    const msg =
      n > 0
        ? `Sending this concept back will permanently delete all ${n} post${n === 1 ? '' : 's'} under it. This cannot be undone. Continue?`
        : 'Sending this concept back will return it to the Ideas/Concepts pipeline. Continue?';
    if (!window.confirm(msg)) return;
    this.state.sendConceptBack(conceptId).subscribe({
      next: () => {
        this.router.navigate(['/workspace', workspaceId, 'content', conceptId]);
      },
      error: () => {
        // Failure leaves the user on the post detail; no toast wiring in scope.
      },
    });
  }

  protected onArchive(): void {
    this.store.archive();
    this.back.emit();
  }

  protected onUnarchive(): void {
    this.store.unarchive();
  }

  protected formatDate(iso: string | undefined): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
}
