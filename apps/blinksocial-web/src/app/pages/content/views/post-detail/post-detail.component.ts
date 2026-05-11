import {
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  effect,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ContentStateService } from '../../content-state.service';
import { PostDetailStore } from './post-detail.store';
import { PostDetailHeaderComponent } from './components/post-detail-header.component';
import { ProductionStepsBarComponent } from './components/production-steps-bar.component';
import { BriefStepComponent } from './components/brief-step.component';
import { BriefContentConceptComponent } from './components/brief-content-concept.component';
import { DraftStepComponent } from './components/draft-step/draft-step.component';
import { StepActionBarComponent } from './components/step-action-bar/step-action-bar.component';
import { StepPlaceholderComponent } from './components/step-placeholder.component';
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
    StepActionBarComponent,
    ContentJourneyComponent,
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
