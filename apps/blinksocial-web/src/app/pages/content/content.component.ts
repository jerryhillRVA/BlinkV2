import { Component, inject, signal, DestroyRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PipelineViewComponent } from './views/pipeline-view/pipeline-view.component';
import { StrategyStubComponent } from './views/strategy-stub/strategy-stub.component';
import { ProductionStubComponent } from './views/production-stub/production-stub.component';
import { ReviewStubComponent } from './views/review-stub/review-stub.component';
import { PerformanceStubComponent } from './views/performance-stub/performance-stub.component';
import { ContentCreateModalComponent } from './views/content-create/content-create-modal.component';
import type { ContentView, ContentCreatePayload, IdeaPayload, ContentItemType } from './content.types';
import { ContentStateService } from './content-state.service';
import { buildContentItem } from './content.utils';

@Component({
  selector: 'app-content',
  imports: [
    PipelineViewComponent,
    StrategyStubComponent,
    ProductionStubComponent,
    ReviewStubComponent,
    PerformanceStubComponent,
    ContentCreateModalComponent,
  ],
  providers: [ContentStateService],
  templateUrl: './content.component.html',
  styleUrl: './content.component.scss',
})
export class ContentComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly stateService = inject(ContentStateService);
  workspaceId = '';
  readonly activeView = signal<ContentView>('overview');
  readonly transitioning = signal(false);
  readonly showCreate = signal(false);
  readonly createInitialType = signal<ContentItemType | undefined>(undefined);

  constructor() {
    let isFirst = true;
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const id = params.get('id') ?? '';
        if (id !== this.workspaceId) {
          this.workspaceId = id;
          this.activeView.set('overview');

          if (isFirst) {
            // First load — no transition needed, page-enter CSS handles it
            isFirst = false;
            this.stateService.loadAll(id);
          } else {
            // Workspace switch — replay entrance animation
            this.transitioning.set(true);
            setTimeout(() => {
              this.stateService.loadAll(id);
              this.transitioning.set(false);
            }, 0);
          }
        }
      });
  }

  setActiveView(view: ContentView): void {
    if (view === 'strategy') {
      this.router.navigate(['/workspace', this.workspaceId, 'strategy']);
      return;
    }
    this.activeView.set(view);
  }

  openCreate(type?: ContentItemType): void {
    this.createInitialType.set(type);
    this.showCreate.set(true);
  }

  closeCreate(): void {
    this.showCreate.set(false);
    this.createInitialType.set(undefined);
  }

  onCreateSave(payload: ContentCreatePayload): void {
    this.stateService.saveItem(buildContentItem(payload)).subscribe();
    this.closeCreate();
  }

  onCreateSaveMany(payloads: IdeaPayload[]): void {
    for (const payload of payloads) {
      this.stateService.saveItem(buildContentItem(payload)).subscribe();
    }
    this.closeCreate();
  }

  onMoveToProduction(payload: ContentCreatePayload): void {
    // First save the in-progress concept, but keep the modal open so the user
    // can fill in the additional production-required fields revealed by the form.
    this.stateService.saveItem(buildContentItem(payload)).subscribe();
  }

  onCreateConcept(payload: IdeaPayload): void {
    // Persist the Idea now; the form itself switches to Concept mode and keeps
    // the modal open so the user continues shaping the same item.
    this.stateService.saveItem(buildContentItem(payload)).subscribe();
  }

  onDraftAssets(payload: ContentCreatePayload): void {
    this.stateService.saveItem(buildContentItem(payload)).subscribe();
    this.closeCreate();
    this.setActiveView('production');
  }
}
