import { Component, DestroyRef, EventEmitter, Input, Output, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { InlineEditComponent } from '../../../../shared/inline-edit/inline-edit.component';
import { IdeaDetailStore } from './idea-detail.store';
import { IdeaDetailHeaderComponent } from './components/idea-detail-header.component';
import { ConceptOptionsPanelComponent } from './components/concept-options-panel.component';
import { ContentJourneyComponent } from './components/content-journey.component';
import { DetailBackButtonComponent } from '../_shared/detail-back-button/detail-back-button.component';
import { StatusStepperComponent } from '../../components/status-stepper/status-stepper.component';
import { TooltipComponent } from '../../../../shared/tooltip/tooltip.component';
import { MAX_PILLARS_PER_ITEM } from '../../content.constants';
import type { ContentStatus } from '../../content.types';

@Component({
  selector: 'app-idea-detail',
  imports: [
    FormsModule,
    InlineEditComponent,
    IdeaDetailHeaderComponent,
    ConceptOptionsPanelComponent,
    ContentJourneyComponent,
    DetailBackButtonComponent,
    StatusStepperComponent,
    TooltipComponent,
  ],
  providers: [IdeaDetailStore],
  templateUrl: './idea-detail.component.html',
  styleUrl: './idea-detail.component.scss',
})
export class IdeaDetailComponent {
  protected readonly store = inject(IdeaDetailStore);
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: false }) set itemId(value: string | null | undefined) {
    if (value !== undefined) this.store.setItemId(value);
  }

  @Input() backLabel = 'Back to pipeline';

  protected readonly maxPillars = MAX_PILLARS_PER_ITEM;

  @Output() back = new EventEmitter<void>();
  /** Emits the newly-created concept's id once the idea→concept advance completes. */
  @Output() advance = new EventEmitter<string>();
  @Output() archive = new EventEmitter<void>();
  @Output() unarchive = new EventEmitter<void>();
  @Output() duplicate = new EventEmitter<void>();
  @Output() copyLink = new EventEmitter<void>();

  protected readonly pillarsAtLimit = computed(
    () => (this.store.item()?.pillarIds.length ?? 0) >= this.maxPillars,
  );

  // Mirrors the prototype: hide objectives whose statement is empty/whitespace.
  protected readonly validObjectives = computed(() =>
    this.store
      .businessObjectives()
      .filter((o) => o.statement.trim().length > 0),
  );

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

  protected truncateStatement(s: string): string {
    return s.length > 50 ? s.slice(0, 50) + '…' : s;
  }

  protected isPillarSelected(id: string): boolean {
    return this.store.item()?.pillarIds.includes(id) ?? false;
  }

  protected togglePillar(id: string): void {
    if (!this.isPillarSelected(id) && this.pillarsAtLimit()) return;
    this.store.togglePillar(id);
  }

  protected isSegmentSelected(id: string): boolean {
    return this.store.item()?.segmentIds.includes(id) ?? false;
  }

  protected onBack(): void {
    this.back.emit();
  }

  protected onAdvance(): void {
    const save$ = this.store.advanceToConcept();
    if (!save$) return;
    save$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((saved) => this.advance.emit(saved.id));
  }

  protected onArchive(): void {
    this.archive.emit();
  }

  protected onUnarchive(): void {
    this.unarchive.emit();
  }

  protected onDuplicate(): void {
    this.duplicate.emit();
  }

  protected onCopyLink(): void {
    this.copyLink.emit();
  }

  protected onTitleChange(v: string): void {
    this.store.updateTitle(v);
  }

  protected onDescriptionChange(v: string): void {
    this.store.updateDescription(v);
  }

  protected onHookChange(v: string): void {
    this.store.updateHook(v);
  }

  protected onObjectiveClick(id: string): void {
    const current = this.store.item()?.objectiveId;
    this.store.setObjectiveId(current === id ? undefined : id);
  }

  protected onStatusChange(status: ContentStatus): void {
    this.store.setStatus(status);
  }
}
