import { Component, EventEmitter, Input, Output, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InlineEditComponent } from '../../../../shared/inline-edit/inline-edit.component';
import { DropdownComponent, DropdownOption } from '../../../../shared/dropdown/dropdown.component';
import { ConceptDetailStore } from './concept-detail.store';
import { ConceptDetailHeaderComponent } from './components/concept-detail-header.component';
import { ProductionTargetsPickerComponent } from './components/production-targets-picker.component';
import { MoveToProductionDialogComponent } from './components/move-to-production-dialog.component';
import { ContentJourneyComponent } from '../idea-detail/components/content-journey.component';
import {
  CTA_TEXT_MAX_CHARS,
  CTA_TYPES,
  DESCRIPTION_MAX_CHARS,
  DESCRIPTION_MIN_CHARS,
  HOOK_MAX_CHARS,
  MAX_PILLARS_PER_ITEM,
  OBJECTIVE_OPTIONS,
} from '../../content.constants';
import type {
  ContentItem,
  ContentObjective,
  CtaType,
} from '../../content.types';
import type { ProductionTarget } from './concept-detail.types';

@Component({
  selector: 'app-concept-detail',
  imports: [
    DatePipe,
    FormsModule,
    InlineEditComponent,
    DropdownComponent,
    ConceptDetailHeaderComponent,
    ProductionTargetsPickerComponent,
    MoveToProductionDialogComponent,
    ContentJourneyComponent,
  ],
  providers: [ConceptDetailStore],
  templateUrl: './concept-detail.component.html',
  styleUrl: './concept-detail.component.scss',
})
export class ConceptDetailComponent {
  protected readonly store = inject(ConceptDetailStore);

  protected readonly maxPillars = MAX_PILLARS_PER_ITEM;
  protected readonly descriptionMin = DESCRIPTION_MIN_CHARS;
  protected readonly descriptionMax = DESCRIPTION_MAX_CHARS;
  protected readonly hookMax = HOOK_MAX_CHARS;
  protected readonly ctaTextMax = CTA_TEXT_MAX_CHARS;

  protected readonly objectiveOptions = OBJECTIVE_OPTIONS;

  protected readonly ctaDropdown: DropdownOption[] = [
    { value: '', label: 'None' },
    ...CTA_TYPES.map((o) => ({ value: o.value, label: o.label })),
  ];

  @Input({ required: true }) set itemId(value: string | null) {
    this.store.setItemId(value);
  }

  @Output() back = new EventEmitter<void>();
  @Output() moved = new EventEmitter<{ created: ContentItem[]; workOnItemId: string | null }>();
  @Output() deleted = new EventEmitter<void>();

  protected readonly descriptionCount = computed(
    () => this.store.item()?.description.trim().length ?? 0,
  );

  protected readonly hookCount = computed(
    () => this.store.item()?.hook?.length ?? 0,
  );

  protected readonly ctaTextCount = computed(
    () => this.store.item()?.cta?.text.length ?? 0,
  );

  protected readonly descriptionInvalid = computed(() => {
    const len = this.descriptionCount();
    return len > 0 && !this.store.descriptionInRange();
  });

  protected readonly pillarsAtLimit = computed(
    () => (this.store.item()?.pillarIds.length ?? 0) >= this.maxPillars,
  );

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

  protected isObjective(v: ContentObjective): boolean {
    return this.store.item()?.objective === v;
  }

  protected setObjective(v: ContentObjective): void {
    this.store.setObjective(v);
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

  protected onAssistDescription(): void {
    this.store.assistDescription();
  }

  protected onAssistHook(): void {
    this.store.assistHook();
  }

  protected onToggleTarget(target: ProductionTarget): void {
    this.store.toggleProductionTarget(target.platform, target.contentType);
  }

  protected onSetCtaType(value: string): void {
    this.store.setCtaType((value as CtaType) || '');
  }

  protected onCtaTextChange(v: string): void {
    this.store.setCtaText(v);
  }

  protected onMoveClick(): void {
    this.store.openMoveDialog();
  }

  protected onDialogAddAll(): void {
    const created = this.store.moveToProduction({ keepConcept: false, workOnIndex: null });
    if (created.length > 0) {
      this.moved.emit({ created, workOnItemId: null });
    }
  }

  protected onDialogAddAllKeep(): void {
    const created = this.store.moveToProduction({ keepConcept: true, workOnIndex: null });
    if (created.length > 0) {
      this.moved.emit({ created, workOnItemId: null });
    }
  }

  protected onDialogWorkOn(index: number): void {
    const created = this.store.moveToProduction({ keepConcept: true, workOnIndex: index });
    const workOnItemId = created[index]?.id ?? null;
    if (created.length > 0) {
      this.moved.emit({ created, workOnItemId });
    }
  }

  protected onDialogCancel(): void {
    this.store.closeMoveDialog();
  }

  protected onBack(): void {
    this.back.emit();
  }

  protected onDemote(): void {
    this.store.demoteToIdea();
  }

  protected onDelete(): void {
    if (!this.store.item()) return;
    this.store.deleteSelf();
    this.deleted.emit();
  }

  // Bound into the targets picker as a function input
  protected readonly isInProductionFn = (t: ProductionTarget): boolean =>
    this.store.isInProduction(t);
}
