import { Injectable, computed, inject, signal } from '@angular/core';
import { ContentStateService } from '../../content-state.service';
import {
  CTA_TEXT_MAX_CHARS,
  DESCRIPTION_MAX_CHARS,
  DESCRIPTION_MIN_CHARS,
  KEY_MESSAGE_MAX_CHARS,
  MAX_PILLARS_PER_ITEM,
} from '../../content.constants';
import type {
  ContentItem,
  ContentObjective,
  ContentStatus,
  CtaType,
  TonePreset,
} from '../../content.types';
import { generateId, toggleArrayItem } from '../../content.utils';
import type {
  BriefValidationIssue,
  ProductionStep,
} from './post-detail.types';

/**
 * Scoped per PostDetailComponent. Mirrors ConceptDetailStore: all writes go
 * through persist() so the brief-approved write-lock lives in one place.
 */
@Injectable()
export class PostDetailStore {
  private readonly state = inject(ContentStateService);

  private readonly _itemId = signal<string | null>(null);

  readonly item = computed<ContentItem | null>(
    () => this.state.items().find((i) => i.id === this._itemId()) ?? null,
  );
  readonly pillars = this.state.pillars;
  readonly segments = this.state.segments;

  readonly activeStep = signal<ProductionStep>('brief');

  setItemId(id: string | null): void {
    this._itemId.set(id);
    this.activeStep.set('brief');
  }

  setActiveStep(step: ProductionStep): void {
    this.activeStep.set(step);
  }

  // ── field mutations ─────────────────────────────────────────────────
  updateTitle(title: string): void {
    const trimmed = title.trim();
    if (!trimmed) return;
    this.persist({ title: trimmed });
  }

  updateDescription(description: string): void {
    this.persist({ description });
  }

  setStatus(status: ContentStatus): void {
    this.persist({ status });
  }

  setObjective(v: ContentObjective | ''): void {
    this.persist({ objective: v === '' ? undefined : v });
  }

  setTonePreset(v: TonePreset | ''): void {
    this.persist({ tonePreset: v === '' ? undefined : v });
  }

  setKeyMessage(v: string): void {
    const trimmed = v.slice(0, KEY_MESSAGE_MAX_CHARS);
    this.persist({ keyMessage: trimmed.length > 0 ? trimmed : undefined });
  }

  togglePillar(id: string): void {
    const item = this.item();
    if (!item) return;
    const current = item.pillarIds;
    const already = current.includes(id);
    if (!already && current.length >= MAX_PILLARS_PER_ITEM) return;
    this.persist({ pillarIds: toggleArrayItem(current, id) });
  }

  toggleSegment(id: string): void {
    const item = this.item();
    if (!item) return;
    this.persist({ segmentIds: toggleArrayItem(item.segmentIds, id) });
  }

  setCtaType(v: CtaType | ''): void {
    if (v === '') {
      this.persist({ cta: undefined });
      return;
    }
    const existing = this.item()?.cta;
    this.persist({ cta: { type: v, text: existing?.text ?? '' } });
  }

  setCtaText(v: string): void {
    const item = this.item();
    if (!item?.cta) return;
    const trimmed = v.slice(0, CTA_TEXT_MAX_CHARS);
    this.persist({ cta: { type: item.cta.type, text: trimmed } });
  }

  // ── brief approval lifecycle ────────────────────────────────────────
  approveBrief(approvedBy = 'You'): void {
    const item = this.item();
    if (!item) return;
    this.state.saveItem({
      ...item,
      briefApproved: true,
      briefApprovedAt: new Date().toISOString(),
      briefApprovedBy: approvedBy,
      updatedAt: new Date().toISOString(),
    });
  }

  unlockBrief(): void {
    const item = this.item();
    if (!item) return;
    this.state.saveItem({
      ...item,
      briefApproved: false,
      briefApprovedAt: undefined,
      briefApprovedBy: undefined,
      updatedAt: new Date().toISOString(),
    });
  }

  // ── menu actions ────────────────────────────────────────────────────
  archive(): void {
    const item = this.item();
    if (!item) return;
    this.state.saveItem({
      ...item,
      archived: true,
      updatedAt: new Date().toISOString(),
    });
  }

  unarchive(): void {
    const item = this.item();
    if (!item) return;
    this.state.saveItem({
      ...item,
      archived: false,
      updatedAt: new Date().toISOString(),
    });
  }

  duplicate(): ContentItem | null {
    const item = this.item();
    if (!item) return null;
    const now = new Date().toISOString();
    const copy: ContentItem = {
      ...item,
      id: generateId('c'),
      title: `${item.title} (copy)`,
      archived: false,
      briefApproved: false,
      briefApprovedAt: undefined,
      briefApprovedBy: undefined,
      createdAt: now,
      updatedAt: now,
    };
    this.state.saveItem(copy);
    return copy;
  }

  deleteSelf(): void {
    const item = this.item();
    if (!item) return;
    this.state.deleteItem(item.id);
  }

  // ── validation ──────────────────────────────────────────────────────
  readonly titleValid = computed(
    () => (this.item()?.title?.trim().length ?? 0) > 0,
  );

  readonly descriptionInRange = computed(() => {
    const len = this.item()?.description?.trim().length ?? 0;
    return len >= DESCRIPTION_MIN_CHARS && len <= DESCRIPTION_MAX_CHARS;
  });

  readonly platformValid = computed(() => {
    const p = this.item()?.platform;
    return !!p && p !== 'tbd';
  });

  readonly contentTypeValid = computed(() => !!this.item()?.contentType);

  readonly objectiveValid = computed(() => !!this.item()?.objective);

  readonly keyMessageValid = computed(() => {
    const km = this.item()?.keyMessage?.trim() ?? '';
    return km.length > 0 && km.length <= KEY_MESSAGE_MAX_CHARS;
  });

  readonly pillarsValid = computed(() => {
    const n = this.item()?.pillarIds?.length ?? 0;
    return n >= 1 && n <= MAX_PILLARS_PER_ITEM;
  });

  readonly segmentsValid = computed(
    () => (this.item()?.segmentIds?.length ?? 0) >= 1,
  );

  readonly ctaValid = computed(() => {
    const cta = this.item()?.cta;
    if (!cta) return true;
    const text = cta.text.trim();
    return text.length > 0 && text.length <= CTA_TEXT_MAX_CHARS;
  });

  readonly errors = computed<BriefValidationIssue[]>(() => {
    const out: BriefValidationIssue[] = [];
    if (!this.titleValid()) out.push({ field: 'title', label: 'Title is required' });
    if (!this.descriptionInRange())
      out.push({
        field: 'description',
        label: `Description must be ${DESCRIPTION_MIN_CHARS}–${DESCRIPTION_MAX_CHARS} characters`,
      });
    if (!this.platformValid())
      out.push({ field: 'platform', label: 'Platform is required' });
    if (!this.contentTypeValid())
      out.push({ field: 'contentType', label: 'Content type is required' });
    if (!this.objectiveValid())
      out.push({ field: 'objective', label: 'Content goal is required' });
    if (!this.keyMessageValid())
      out.push({ field: 'keyMessage', label: 'Key message is required' });
    if (!this.pillarsValid())
      out.push({
        field: 'pillars',
        label: `Pick 1–${MAX_PILLARS_PER_ITEM} content pillars`,
      });
    if (!this.segmentsValid())
      out.push({ field: 'segments', label: 'Pick at least one audience segment' });
    if (!this.ctaValid())
      out.push({ field: 'cta', label: 'CTA type has no text' });
    return out;
  });

  readonly warnings = computed<BriefValidationIssue[]>(() => {
    const out: BriefValidationIssue[] = [];
    const km = this.item()?.keyMessage ?? '';
    if (km.length >= KEY_MESSAGE_MAX_CHARS - 20 && km.length <= KEY_MESSAGE_MAX_CHARS) {
      out.push({
        field: 'keyMessage',
        label: 'Key message is near the max length',
      });
    }
    const pillarCount = this.item()?.pillarIds?.length ?? 0;
    if (pillarCount === MAX_PILLARS_PER_ITEM) {
      out.push({
        field: 'pillars',
        label: 'Pillar limit reached — focus may suffer',
      });
    }
    return out;
  });

  readonly requiredFieldsTotal = 8; // title/description/platform/content-type/objective/key-message/pillars/segments

  readonly requiredFieldsDone = computed(() => {
    let done = 0;
    if (this.titleValid()) done++;
    if (this.descriptionInRange()) done++;
    if (this.platformValid()) done++;
    if (this.contentTypeValid()) done++;
    if (this.objectiveValid()) done++;
    if (this.keyMessageValid()) done++;
    if (this.pillarsValid()) done++;
    if (this.segmentsValid()) done++;
    return done;
  });

  readonly canApprove = computed(() => this.errors().length === 0);

  // ── internal ────────────────────────────────────────────────────────
  private persist(patch: Partial<ContentItem>): void {
    const item = this.item();
    if (!item) return;
    if (item.briefApproved) return;
    const next: ContentItem = {
      ...item,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    this.state.saveItem(next);
  }
}
