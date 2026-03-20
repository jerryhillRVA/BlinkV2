import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceSettingsStateService } from '../../workspace-settings-state.service';
import type { MilestoneTemplateContract, PhaseTemplateContract } from '@blinksocial/contracts';

const CONTENT_TYPE_NAMES: Record<string, string> = {
  VIDEO_SHORT_VERTICAL: 'Short Vertical Video (Reels / Shorts / TikTok)',
  VIDEO_LONG_HORIZONTAL: 'Long Horizontal Video (YouTube)',
  IMAGE_SINGLE: 'Single Image',
  IMAGE_CAROUSEL: 'Image Carousel',
  TEXT_POST: 'Text Post',
  LINK_POST: 'Link Post',
  DOCUMENT_CAROUSEL_PDF: 'Document Carousel (PDF)',
  STORY_FRAME_SET: 'Story Frame Set',
  LIVE_BROADCAST: 'Live Broadcast',
};

const MILESTONE_NAMES: Record<string, string> = {
  brief_due: 'Brief Due',
  draft_due: 'Draft Due',
  blueprint_due: 'Blueprint Due',
  assets_due: 'Assets Due',
  packaging_due: 'Packaging Due',
  qa_due: 'QA Due',
};

const PHASE_NAMES: Record<string, string> = {
  production_window: 'Production Window',
  review_window: 'Review Window',
};

@Component({
  selector: 'app-tab-calendar',
  imports: [CommonModule],
  templateUrl: './tab-calendar.component.html',
  styleUrl: './tab-calendar.component.scss',
})
export class TabCalendarComponent {
  protected readonly state = inject(WorkspaceSettingsStateService);

  selectedContentType = '';

  get settings() {
    return this.state.calendarSettings();
  }

  get contentTypes(): string[] {
    return this.settings ? Object.keys(this.settings.deadlineTemplates) : [];
  }

  get activeContentType(): string {
    if (this.selectedContentType && this.settings?.deadlineTemplates[this.selectedContentType]) {
      return this.selectedContentType;
    }
    return this.contentTypes[0] ?? '';
  }

  get milestones(): MilestoneTemplateContract[] {
    return this.settings?.deadlineTemplates[this.activeContentType]?.milestones ?? [];
  }

  get phases(): PhaseTemplateContract[] {
    return this.settings?.deadlineTemplates[this.activeContentType]?.phases ?? [];
  }

  get isDeadlinesEnabled(): boolean {
    return this.settings?.enableDeadlineTemplates !== false;
  }

  get isRemindersEnabled(): boolean {
    return this.settings?.enableReminders !== false;
  }

  contentTypeDisplayName(key: string): string {
    return CONTENT_TYPE_NAMES[key] ?? key;
  }

  milestoneDisplayName(type: string): string {
    return MILESTONE_NAMES[type] ?? type;
  }

  phaseDisplayName(type: string): string {
    return PHASE_NAMES[type] ?? type;
  }

  selectContentType(key: string): void {
    this.selectedContentType = key;
  }

  previewDate(offsetDays: number): string {
    const ref = new Date(2026, 3, 30); // Apr 30
    ref.setDate(ref.getDate() + offsetDays);
    return ref.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // --- Toggle handlers ---

  toggleEnableDeadlines(): void {
    const current = this.state.calendarSettings();
    if (!current) return;
    this.state.calendarSettings.set({
      ...current,
      enableDeadlineTemplates: !this.isDeadlinesEnabled,
    });
  }

  toggleAutoCreate(): void {
    const current = this.state.calendarSettings();
    if (!current) return;
    this.state.calendarSettings.set({
      ...current,
      autoCreateOnPublish: !current.autoCreateOnPublish,
    });
  }

  toggleEnableReminders(): void {
    const current = this.state.calendarSettings();
    if (!current) return;
    this.state.calendarSettings.set({
      ...current,
      enableReminders: !this.isRemindersEnabled,
    });
  }

  toggleReminder(key: string): void {
    const current = this.state.calendarSettings();
    if (!current) return;
    const rs = current.reminderSettings as unknown as Record<string, boolean>;
    this.state.calendarSettings.set({
      ...current,
      reminderSettings: { ...current.reminderSettings, [key]: !rs[key] },
    });
  }

  // --- Milestone CRUD ---

  addMilestone(): void {
    const current = this.state.calendarSettings();
    if (!current) return;
    const key = this.activeContentType;
    const template = current.deadlineTemplates[key];
    if (!template) return;
    const newMs: MilestoneTemplateContract = {
      milestoneType: 'draft_due',
      offsetDays: -1,
      required: false,
    };
    this.updateTemplate(key, {
      ...template,
      milestones: [...template.milestones, newMs],
    });
  }

  removeMilestone(index: number): void {
    const current = this.state.calendarSettings();
    if (!current) return;
    const key = this.activeContentType;
    const template = current.deadlineTemplates[key];
    if (!template) return;
    this.updateTemplate(key, {
      ...template,
      milestones: template.milestones.filter((_, i) => i !== index),
    });
  }

  updateMilestoneOffset(index: number, value: number): void {
    const current = this.state.calendarSettings();
    if (!current) return;
    const key = this.activeContentType;
    const template = current.deadlineTemplates[key];
    if (!template) return;
    const milestones = template.milestones.map((m, i) =>
      i === index ? { ...m, offsetDays: value } : m
    );
    this.updateTemplate(key, { ...template, milestones });
  }

  toggleMilestoneRequired(index: number): void {
    const current = this.state.calendarSettings();
    if (!current) return;
    const key = this.activeContentType;
    const template = current.deadlineTemplates[key];
    if (!template) return;
    const milestones = template.milestones.map((m, i) =>
      i === index ? { ...m, required: !m.required } : m
    );
    this.updateTemplate(key, { ...template, milestones });
  }

  // --- Phase CRUD ---

  addPhase(): void {
    const current = this.state.calendarSettings();
    if (!current) return;
    const key = this.activeContentType;
    const template = current.deadlineTemplates[key];
    if (!template) return;
    const newPhase: PhaseTemplateContract = {
      phaseType: 'production_window',
      startOffsetDays: -7,
      endOffsetDays: -3,
      required: false,
    };
    this.updateTemplate(key, {
      ...template,
      phases: [...template.phases, newPhase],
    });
  }

  removePhase(index: number): void {
    const current = this.state.calendarSettings();
    if (!current) return;
    const key = this.activeContentType;
    const template = current.deadlineTemplates[key];
    if (!template) return;
    this.updateTemplate(key, {
      ...template,
      phases: template.phases.filter((_, i) => i !== index),
    });
  }

  updatePhaseStart(index: number, value: number): void {
    const current = this.state.calendarSettings();
    if (!current) return;
    const key = this.activeContentType;
    const template = current.deadlineTemplates[key];
    if (!template) return;
    const phases = template.phases.map((p, i) =>
      i === index ? { ...p, startOffsetDays: value } : p
    );
    this.updateTemplate(key, { ...template, phases });
  }

  updatePhaseEnd(index: number, value: number): void {
    const current = this.state.calendarSettings();
    if (!current) return;
    const key = this.activeContentType;
    const template = current.deadlineTemplates[key];
    if (!template) return;
    const phases = template.phases.map((p, i) =>
      i === index ? { ...p, endOffsetDays: value } : p
    );
    this.updateTemplate(key, { ...template, phases });
  }

  togglePhaseRequired(index: number): void {
    const current = this.state.calendarSettings();
    if (!current) return;
    const key = this.activeContentType;
    const template = current.deadlineTemplates[key];
    if (!template) return;
    const phases = template.phases.map((p, i) =>
      i === index ? { ...p, required: !p.required } : p
    );
    this.updateTemplate(key, { ...template, phases });
  }

  private updateTemplate(key: string, template: { milestones: MilestoneTemplateContract[]; phases: PhaseTemplateContract[] }): void {
    const current = this.state.calendarSettings();
    if (!current) return;
    this.state.calendarSettings.set({
      ...current,
      deadlineTemplates: {
        ...current.deadlineTemplates,
        [key]: template,
      },
    });
  }
}
