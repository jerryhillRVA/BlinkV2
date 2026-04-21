import { Component, EventEmitter, Input, Output, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InlineEditComponent } from '../../../../shared/inline-edit/inline-edit.component';
import { IdeaDetailStore } from './idea-detail.store';
import { IdeaDetailHeaderComponent } from './components/idea-detail-header.component';
import { ConceptOptionsPanelComponent } from './components/concept-options-panel.component';
import { ContentJourneyComponent } from './components/content-journey.component';
import { MAX_PILLARS_PER_ITEM } from '../../content.constants';

@Component({
  selector: 'app-idea-detail',
  imports: [
    FormsModule,
    InlineEditComponent,
    IdeaDetailHeaderComponent,
    ConceptOptionsPanelComponent,
    ContentJourneyComponent,
  ],
  providers: [IdeaDetailStore],
  templateUrl: './idea-detail.component.html',
  styleUrl: './idea-detail.component.scss',
})
export class IdeaDetailComponent {
  protected readonly store = inject(IdeaDetailStore);

  @Input({ required: false }) set itemId(value: string | null | undefined) {
    if (value !== undefined) this.store.setItemId(value);
  }

  protected readonly maxPillars = MAX_PILLARS_PER_ITEM;

  @Output() back = new EventEmitter<void>();
  @Output() advance = new EventEmitter<void>();
  @Output() archive = new EventEmitter<void>();
  @Output() duplicate = new EventEmitter<void>();
  @Output() copyLink = new EventEmitter<void>();

  protected readonly pillarsAtLimit = computed(
    () => (this.store.item()?.pillarIds.length ?? 0) >= this.maxPillars,
  );

  protected formatDate(iso: string | undefined): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
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
    this.store.advanceToConcept();
    this.advance.emit();
  }

  protected onArchive(): void {
    this.archive.emit();
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
}
