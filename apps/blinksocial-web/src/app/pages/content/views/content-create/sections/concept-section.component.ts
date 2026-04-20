import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DropdownComponent, DropdownOption } from '../../../../../shared/dropdown/dropdown.component';
import { ContentCreateStore } from '../content-create.store';
import {
  CTA_TYPES,
  DESCRIPTION_MAX_CHARS,
  DESCRIPTION_MIN_CHARS,
  HOOK_MAX_CHARS,
  MAX_PILLARS_PER_ITEM,
  OBJECTIVE_OPTIONS,
  PLATFORM_CONTENT_TYPES,
  PLATFORM_OPTIONS,
  CTA_TEXT_MAX_CHARS,
} from '../../../content.constants';
import type { ContentObjective, ContentType, CtaType, Platform } from '../../../content.types';

@Component({
  selector: 'app-concept-section',
  imports: [FormsModule, DropdownComponent],
  templateUrl: './concept-section.component.html',
  styleUrl: './concept-section.component.scss',
})
export class ConceptSectionComponent {
  protected readonly store = inject(ContentCreateStore);

  protected readonly state = this.store.state;
  protected readonly pillars = this.store.pillars;
  protected readonly segments = this.store.segments;

  protected readonly maxPillars = MAX_PILLARS_PER_ITEM;
  protected readonly descriptionMin = DESCRIPTION_MIN_CHARS;
  protected readonly descriptionMax = DESCRIPTION_MAX_CHARS;
  protected readonly hookMax = HOOK_MAX_CHARS;
  protected readonly ctaTextMax = CTA_TEXT_MAX_CHARS;

  protected readonly objectiveButtons = OBJECTIVE_OPTIONS;

  protected readonly objectiveDropdown: DropdownOption[] = OBJECTIVE_OPTIONS.map(
    (o) => ({ value: o.value, label: o.label }),
  );

  protected readonly platformDropdown: DropdownOption[] = PLATFORM_OPTIONS.map(
    (o) => ({
      value: o.value,
      label: o.label,
      platformIcon: o.value,
    }),
  );

  protected readonly ctaDropdown: DropdownOption[] = [
    { value: '', label: 'None' },
    ...CTA_TYPES.map((o) => ({ value: o.value, label: o.label })),
  ];

  protected readonly contentTypeDropdown = computed<DropdownOption[]>(() => {
    const platform = this.state().platform;
    if (!platform || platform === 'tbd') return [];
    return PLATFORM_CONTENT_TYPES[platform].map((t) => ({
      value: t.value,
      label: t.label,
    }));
  });

  protected readonly pillarsAtLimit = computed(
    () => this.state().pillarIds.length >= this.maxPillars,
  );

  protected readonly descriptionCount = computed(
    () => this.state().description.trim().length,
  );

  protected readonly hookCount = computed(() => this.state().hook.length);

  protected readonly ctaTextCount = computed(() => this.state().ctaText.length);

  // --- events --------------------------------------------------------------
  protected onTitleChange(v: string): void {
    this.store.patch({ title: v });
  }

  protected onDescriptionChange(v: string): void {
    this.store.patch({ description: v });
  }

  protected onHookChange(v: string): void {
    this.store.patch({ hook: v.slice(0, this.hookMax) });
  }

  protected onCtaTextChange(v: string): void {
    this.store.patch({ ctaText: v.slice(0, this.ctaTextMax) });
  }

  protected togglePillar(id: string): void {
    this.store.togglePillar(id);
  }

  protected toggleSegment(id: string): void {
    this.store.toggleSegment(id);
  }

  protected setObjectiveButton(o: ContentObjective): void {
    this.store.patch({ objective: o });
  }

  protected setObjectiveDropdown(v: string): void {
    this.store.patch({ objective: v as ContentObjective });
  }

  protected setPlatform(v: string): void {
    this.store.setPlatform(v as Platform | '');
  }

  protected setContentType(v: string): void {
    this.store.patch({ contentType: v as ContentType });
  }

  protected setCtaType(v: string): void {
    this.store.patch({ ctaType: (v as CtaType | '') || '', ctaText: v === '' ? '' : this.state().ctaText });
  }

  protected generateConcept(): void {
    this.store.generateConcept();
  }

  protected assistHook(): void {
    this.store.assistHook();
  }

  protected assistDescription(): void {
    this.store.assistDescription();
  }

  protected fillManually(): void {
    this.store.patch({ conceptAiGenerated: true, conceptFilledByAI: false });
  }

  protected backToPregen(): void {
    this.store.patch({ conceptAiGenerated: false, conceptFilledByAI: false });
  }

  protected isPillarSelected(id: string): boolean {
    return this.state().pillarIds.includes(id);
  }

  protected isSegmentSelected(id: string): boolean {
    return this.state().segmentIds.includes(id);
  }

  protected togglePillarIfAllowed(id: string): void {
    if (!this.isPillarSelected(id) && this.pillarsAtLimit()) return;
    this.togglePillar(id);
  }
}
