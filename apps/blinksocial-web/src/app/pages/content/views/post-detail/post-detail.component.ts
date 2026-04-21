import {
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PostDetailStore } from './post-detail.store';
import { PostDetailHeaderComponent } from './components/post-detail-header.component';
import { ProductionStepsBarComponent } from './components/production-steps-bar.component';
import { BriefStepComponent } from './components/brief-step.component';
import { BriefStatusSidebarComponent } from './components/brief-status-sidebar.component';
import { StepPlaceholderComponent } from './components/step-placeholder.component';

@Component({
  selector: 'app-post-detail',
  imports: [
    PostDetailHeaderComponent,
    ProductionStepsBarComponent,
    BriefStepComponent,
    BriefStatusSidebarComponent,
    StepPlaceholderComponent,
  ],
  providers: [PostDetailStore],
  templateUrl: './post-detail.component.html',
  styleUrl: './post-detail.component.scss',
})
export class PostDetailComponent {
  protected readonly store = inject(PostDetailStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  @Input({ required: false }) set itemId(value: string | null | undefined) {
    if (value !== undefined) this.store.setItemId(value);
  }

  @Output() back = new EventEmitter<void>();
  @Output() deleted = new EventEmitter<void>();

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

  protected onDuplicate(): void {
    const copy = this.store.duplicate();
    if (!copy) return;
    const workspaceId = this.route.snapshot.paramMap.get('id') ?? '';
    this.router.navigate(['/workspace', workspaceId, 'content', copy.id]);
  }

  protected onDelete(): void {
    this.store.deleteSelf();
    this.deleted.emit();
  }

  protected onApprove(): void {
    this.store.approveBrief();
  }

  protected onUnlock(): void {
    this.store.unlockBrief();
  }

  protected onContinueToBuilder(): void {
    this.store.setActiveStep('builder');
  }
}
