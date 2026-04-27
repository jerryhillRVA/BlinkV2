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
import { StatusStepperComponent } from '../../components/status-stepper/status-stepper.component';
import type { ContentStatus } from '../../content.types';
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
import type { TargetPlatform } from './concept-detail.types';
import type { RiskLevelContract } from '@blinksocial/contracts';

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
    StatusStepperComponent,
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

  @Input() backLabel = 'Back to pipeline';

  @Output() back = new EventEmitter<void>();
  @Output() moved = new EventEmitter<{ created: ContentItem[]; workOnItemId: string | null }>();
  @Output() deleted = new EventEmitter<void>();
  @Output() archive = new EventEmitter<void>();
  @Output() unarchive = new EventEmitter<void>();
  @Output() duplicate = new EventEmitter<void>();
  @Output() copyLink = new EventEmitter<void>();

  protected readonly descriptionCount = computed(
    () => this.store.item()?.description.trim().length ?? 0,
  );

  protected readonly hookCount = computed(
    () => this.store.item()?.hook?.length ?? 0,
  );

  protected readonly ctaTextCount = computed(
    () => this.store.item()?.cta?.text.length ?? 0,
  );

  /** Over-max description is a hard error (red). */
  protected readonly descriptionInvalid = computed(
    () => this.descriptionCount() > this.descriptionMax,
  );

  /** Under-min description is a soft warning (amber), save still allowed. */
  protected readonly descriptionUnderMin = computed(() => {
    const len = this.descriptionCount();
    return len > 0 && len < this.descriptionMin;
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

  protected onToggleTarget(target: TargetPlatform): void {
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
    const created = this.store.moveToProduction();
    if (created.length > 0) {
      this.moved.emit({ created, workOnItemId: null });
    }
  }

  protected onDialogWorkOn(index: number): void {
    const created = this.store.moveToProduction();
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
    const item = this.store.item();
    if (!item) return;
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    this.store.deleteSelf();
    this.deleted.emit();
  }

  protected onArchive(): void {
    this.archive.emit();
  }

  protected onUnarchive(): void {
    this.unarchive.emit();
  }

  // Bound into the targets picker as a function input
  protected readonly isInProductionFn = (t: TargetPlatform): boolean =>
    this.store.isInProduction(t);

  // ── D-07 field handlers ─────────────────────────────────────────────
  protected readonly riskLevels: RiskLevelContract[] = ['low', 'medium', 'high'];

  protected onKeyMessageChange(v: string): void {
    this.store.setKeyMessage(v);
  }

  protected onAngleChange(v: string): void {
    this.store.setAngle(v);
  }

  protected formatNotesDisplay(): string {
    return (this.store.item()?.formatNotes ?? []).join(', ');
  }

  protected onFormatNotesChange(evt: Event): void {
    const raw = (evt.target as HTMLInputElement | null)?.value ?? '';
    this.store.setFormatNotes(raw.split(','));
  }

  protected onClaimsFlagChange(evt: Event): void {
    const checked = (evt.target as HTMLInputElement | null)?.checked ?? false;
    this.store.setClaimsFlag(checked);
  }

  protected sourceLinksDisplay(): string {
    return (this.store.item()?.sourceLinks ?? []).join('\n');
  }

  protected onSourceLinksChange(evt: Event): void {
    const raw = (evt.target as HTMLTextAreaElement | null)?.value ?? '';
    this.store.setSourceLinks(raw.split(/\r?\n/));
  }

  protected onRiskLevelChange(level: RiskLevelContract): void {
    const current = this.store.item()?.riskLevel;
    this.store.setRiskLevel(current === level ? undefined : level);
  }

  protected onPublishStartChange(evt: Event): void {
    const start = (evt.target as HTMLInputElement | null)?.value ?? '';
    const current = this.store.item()?.targetPublishWindow;
    this.store.setTargetPublishWindow({
      start: start || undefined,
      end: current?.end,
    });
  }

  protected onPublishEndChange(evt: Event): void {
    const end = (evt.target as HTMLInputElement | null)?.value ?? '';
    const current = this.store.item()?.targetPublishWindow;
    this.store.setTargetPublishWindow({
      start: current?.start,
      end: end || undefined,
    });
  }

  protected onObjectiveClick(id: string): void {
    const current = this.store.item()?.objectiveId;
    this.store.setObjectiveId(current === id ? undefined : id);
  }

  protected onStatusChange(status: ContentStatus): void {
    this.store.setStatus(status);
  }
}
