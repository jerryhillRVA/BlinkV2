import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InlineEditComponent } from '../../../../../shared/inline-edit/inline-edit.component';
import {
  DropdownComponent,
  type DropdownOption,
} from '../../../../../shared/dropdown/dropdown.component';
import { PlatformIconComponent } from '../../../../../shared/platform-icon/platform-icon.component';
import { PostDetailStore } from '../post-detail.store';
import {
  CTA_TEXT_MAX_CHARS,
  CTA_TYPES,
  DESCRIPTION_MAX_CHARS,
  DESCRIPTION_MIN_CHARS,
  KEY_MESSAGE_MAX_CHARS,
  MAX_PILLARS_PER_ITEM,
  OBJECTIVE_OPTIONS,
  PLATFORM_CONTENT_TYPES,
  PLATFORM_OPTIONS,
  TONE_PRESETS,
} from '../../../content.constants';
import type {
  ContentObjective,
  CtaType,
  TonePreset,
} from '../../../content.types';

@Component({
  selector: 'app-brief-step',
  imports: [
    FormsModule,
    InlineEditComponent,
    DropdownComponent,
    PlatformIconComponent,
  ],
  templateUrl: './brief-step.component.html',
  styleUrl: './brief-step.component.scss',
})
export class BriefStepComponent {
  protected readonly store = inject(PostDetailStore);

  protected readonly descriptionMin = DESCRIPTION_MIN_CHARS;
  protected readonly descriptionMax = DESCRIPTION_MAX_CHARS;
  protected readonly keyMessageMax = KEY_MESSAGE_MAX_CHARS;
  protected readonly ctaTextMax = CTA_TEXT_MAX_CHARS;
  protected readonly maxPillars = MAX_PILLARS_PER_ITEM;

  protected readonly objectiveOptions = OBJECTIVE_OPTIONS;

  protected readonly toneDropdown: DropdownOption[] = [
    { value: '', label: 'Select tone (optional)' },
    ...TONE_PRESETS.map((o) => ({ value: o.value, label: o.label })),
  ];

  protected readonly ctaDropdown: DropdownOption[] = [
    { value: '', label: 'None' },
    ...CTA_TYPES.map((o) => ({ value: o.value, label: o.label })),
  ];

  protected readonly descriptionCount = computed(
    () => this.store.item()?.description.trim().length ?? 0,
  );

  protected readonly descriptionInvalid = computed(() => {
    const len = this.descriptionCount();
    return len > 0 && !this.store.descriptionInRange();
  });

  protected readonly keyMessageCount = computed(
    () => this.store.item()?.keyMessage?.length ?? 0,
  );

  protected readonly ctaTextCount = computed(
    () => this.store.item()?.cta?.text.length ?? 0,
  );

  protected readonly pillarsAtLimit = computed(
    () => (this.store.item()?.pillarIds.length ?? 0) >= this.maxPillars,
  );

  protected readonly locked = computed(() => !!this.store.item()?.briefApproved);

  protected platformLabel(): string | null {
    const p = this.store.item()?.platform;
    if (!p) return null;
    return PLATFORM_OPTIONS.find((o) => o.value === p)?.label ?? null;
  }

  protected contentTypeLabel(): string | null {
    const item = this.store.item();
    const p = item?.platform;
    const ct = item?.contentType;
    if (!p || !ct) return null;
    return (
      PLATFORM_CONTENT_TYPES[p].find((o) => o.value === ct)?.label ?? null
    );
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

  protected onKeyMessageChange(v: string): void {
    this.store.setKeyMessage(v);
  }

  protected onTonePresetChange(v: string): void {
    this.store.setTonePreset((v as TonePreset) || '');
  }

  protected onSetCtaType(v: string): void {
    this.store.setCtaType((v as CtaType) || '');
  }

  protected onCtaTextChange(v: string): void {
    this.store.setCtaText(v);
  }

  protected onKeyMessageAssist(): void {
    if (this.locked()) return;
    this.store.setKeyMessage(
      'This campaign focuses on empowering users to take control of their workflows with seamless, intuitive tools.',
    );
  }
}
