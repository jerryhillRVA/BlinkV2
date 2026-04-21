import { Component, EventEmitter, Input, Output, effect, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DropdownComponent, DropdownOption } from '../../../../shared/dropdown/dropdown.component';
import { ContentCreateStore } from './content-create.store';
import { CONTENT_TYPE_OPTIONS } from '../../content.constants';
import { IdeaSectionComponent } from './sections/idea-section.component';
import { ConceptSectionComponent } from './sections/concept-section.component';
import { BriefSectionComponent } from './sections/brief-section.component';
import type {
  AudienceSegment,
  ContentCreatePayload,
  ContentPillar,
  ContentItemType,
  IdeaPayload,
} from '../../content.types';

@Component({
  selector: 'app-content-create-form',
  imports: [
    FormsModule,
    DropdownComponent,
    IdeaSectionComponent,
    ConceptSectionComponent,
    BriefSectionComponent,
  ],
  providers: [ContentCreateStore],
  templateUrl: './content-create-form.component.html',
  styleUrl: './content-create-form.component.scss',
})
export class ContentCreateFormComponent implements OnInit {
  protected readonly store = inject(ContentCreateStore);

  @Input({ required: true }) set pillars(value: ContentPillar[]) {
    this._pillars = value;
    this.store.setContext(this._pillars, this._segments);
  }
  @Input({ required: true }) set segments(value: AudienceSegment[]) {
    this._segments = value;
    this.store.setContext(this._pillars, this._segments);
  }
  @Input() initialType?: ContentItemType;
  private _pillars: ContentPillar[] = [];
  private _segments: AudienceSegment[] = [];

  ngOnInit(): void {
    if (this.initialType) {
      this.store.setType(this.initialType);
    }
  }

  @Output() saveContent = new EventEmitter<ContentCreatePayload>();
  @Output() saveMany = new EventEmitter<IdeaPayload[]>();
  @Output() moveToProduction = new EventEmitter<ContentCreatePayload>();
  @Output() draftAssets = new EventEmitter<ContentCreatePayload>();
  @Output() createConcept = new EventEmitter<IdeaPayload>();
  @Output() cancelCreate = new EventEmitter<void>();

  protected readonly typeDropdown: DropdownOption[] = CONTENT_TYPE_OPTIONS.map(
    (o) => ({
      value: o.value,
      label: o.label,
      iconPaths: o.iconPaths,
      iconColor: o.iconColor,
    }),
  );

  protected readonly state = this.store.state;

  constructor() {
    // When an AI generation completes mid-edit and the user has changed the title
    // or objective, keep store context synced (not strictly needed here, just a placeholder for future).
    effect(() => this.state());
  }

  protected modalTitle(): string {
    const t = this.state().type;
    if (t === 'production-brief') return 'Create Production Brief';
    if (t === 'concept') return 'Create Concept';
    return 'Create New Content';
  }

  protected modalDescription(): string {
    return 'Add a new idea or concept to your content pipeline';
  }

  protected setType(v: string): void {
    this.store.setType(v as ContentItemType);
  }

  protected onCancel(): void {
    this.cancelCreate.emit();
  }

  protected onSaveClick(): void {
    const payload = this.store.buildPayloadForCurrentMode();
    if (Array.isArray(payload)) {
      this.saveMany.emit(payload as IdeaPayload[]);
    } else {
      this.saveContent.emit(payload);
    }
  }

  protected onMoveToProductionClick(): void {
    // Set production mode flag, then validate, then emit
    this.store.patch({ isProductionMode: true });
    if (!this.store.canMoveToProduction()) {
      // reset the flag if not valid yet — the footer button will re-enable when valid
      return;
    }
    const payload = this.store.buildConceptPayload();
    this.moveToProduction.emit(payload);
  }

  protected onDraftAssetsClick(): void {
    this.draftAssets.emit(this.store.buildBriefPayload());
  }

  protected onCreateConceptClick(): void {
    // Emit the idea payload for the parent to persist, then switch this modal
    // into the Concept flow so the user can continue shaping the same item.
    // `setType` preserves title/description/pillars, matching the figma flow.
    const payload = this.store.buildIdeaPayload();
    this.createConcept.emit(payload);
    this.store.setType('concept');
  }

  protected readonly saveButtonLabel = (): string => {
    const s = this.state();
    // Idea manual mode is handled by the dedicated `showCreateConcept()` footer branch;
    // this label function only services fallback paths (idea generate, concept, brief).
    if (s.type === 'idea') {
      return 'Add Selected to Pipeline';
    }
    if (s.type === 'concept') {
      return s.isProductionMode ? 'Complete Production' : 'Save Concept';
    }
    return 'Save Production Brief';
  };

  protected showMoveToProduction(): boolean {
    const s = this.state();
    return s.type === 'concept' && s.conceptAiGenerated && !s.isProductionMode;
  }

  protected showDraftAssets(): boolean {
    return this.state().type === 'production-brief';
  }

  protected showCreateConcept(): boolean {
    const s = this.state();
    return s.type === 'idea' && s.ideaMode === 'manual';
  }

  protected canSave(): boolean {
    return this.store.canSave();
  }

  protected canMoveToProduction(): boolean {
    return this.store.productionValid();
  }

  protected canDraftAssets(): boolean {
    return this.store.canDraftAssets();
  }
}
