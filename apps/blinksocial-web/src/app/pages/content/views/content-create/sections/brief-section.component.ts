import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DropdownComponent, DropdownOption } from '../../../../../shared/dropdown/dropdown.component';
import { ContentCreateStore } from '../content-create.store';
import {
  CTA_TEXT_MAX_CHARS,
  CTA_TYPES,
  KEY_MESSAGE_MAX_CHARS,
  MAX_PILLARS_PER_ITEM,
  OBJECTIVE_OPTIONS,
  PLATFORM_CONTENT_TYPES,
  PLATFORM_OPTIONS,
  TONE_PRESETS,
} from '../../../content.constants';
import type {
  ContentObjective,
  ContentType,
  CtaType,
  Platform,
  TonePreset,
} from '../../../content.types';

@Component({
  selector: 'app-brief-section',
  imports: [FormsModule, DropdownComponent],
  templateUrl: './brief-section.component.html',
  styleUrl: './brief-section.component.scss',
})
export class BriefSectionComponent {
  protected readonly store = inject(ContentCreateStore);

  protected readonly state = this.store.state;
  protected readonly pillars = this.store.pillars;
  protected readonly segments = this.store.segments;

  protected readonly keyMessageMax = KEY_MESSAGE_MAX_CHARS;
  protected readonly ctaTextMax = CTA_TEXT_MAX_CHARS;
  protected readonly maxPillars = MAX_PILLARS_PER_ITEM;

  protected readonly pillarsAtLimit = computed(
    () => this.state().pillarIds.length >= this.maxPillars,
  );

  protected readonly platformDropdown: DropdownOption[] = PLATFORM_OPTIONS.map(
    (o) => ({
      value: o.value,
      label: o.label,
      platformIcon: o.value,
    }),
  );

  protected readonly objectiveDropdown: DropdownOption[] = OBJECTIVE_OPTIONS.map(
    (o) => ({ value: o.value, label: o.label }),
  );

  protected readonly toneDropdown: DropdownOption[] = [
    { value: '', label: 'Select tone (optional)' },
    ...TONE_PRESETS.map((o) => ({ value: o.value, label: o.label })),
  ];

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

  protected readonly keyMessageCount = computed(() => this.state().keyMessage.length);
  protected readonly ctaTextCount = computed(() => this.state().ctaText.length);

  protected onTitleChange(v: string): void {
    this.store.patch({ title: v });
  }

  protected onDescriptionChange(v: string): void {
    this.store.patch({ description: v });
  }

  protected onKeyMessageChange(v: string): void {
    this.store.patch({ keyMessage: v.slice(0, this.keyMessageMax) });
  }

  protected onCtaTextChange(v: string): void {
    this.store.patch({ ctaText: v.slice(0, this.ctaTextMax) });
  }

  protected setPlatform(v: string): void {
    this.store.setPlatform(v as Platform | '');
  }

  protected setContentType(v: string): void {
    this.store.patch({ contentType: v as ContentType });
  }

  protected setObjective(v: string): void {
    this.store.patch({ objective: v as ContentObjective });
  }

  protected setTone(v: string): void {
    this.store.patch({ tonePreset: (v as TonePreset) || '' });
  }

  protected setCtaType(v: string): void {
    this.store.patch({ ctaType: (v as CtaType) || '' });
  }

  protected toggleSegment(id: string): void {
    this.store.toggleSegment(id);
  }

  protected isSegmentSelected(id: string): boolean {
    return this.state().segmentIds.includes(id);
  }

  protected isPillarSelected(id: string): boolean {
    return this.state().pillarIds.includes(id);
  }

  protected togglePillar(id: string): void {
    if (!this.isPillarSelected(id) && this.pillarsAtLimit()) return;
    this.store.togglePillar(id);
  }
}
