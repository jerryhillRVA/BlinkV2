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
import type {
  PrimaryCtaContract,
  ProductionBriefContract,
  PublishingModeContract,
} from '@blinksocial/contracts';
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

  setOwner(ownerId: string): void {
    this.persist({ owner: ownerId.trim() || null });
  }

  setObjective(v: ContentObjective | ''): void {
    this.persist({ objective: v === '' ? undefined : v });
  }

  setTonePreset(v: TonePreset | ''): void {
    this.persist({ tonePreset: v === '' ? undefined : v });
  }

  setKeyMessage(v: string): void {
    // Cap to max but DO persist an empty string when the user clears the
    // field — `keyMessage: undefined` would be dropped by JSON.stringify
    // on the PUT body and the mock API would merge the old value back in,
    // making the field's text "reappear" after a delete + space + delete.
    const capped = v.slice(0, KEY_MESSAGE_MAX_CHARS);
    this.persist({ keyMessage: capped });
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

  // ── brief sub-field setters (production.brief) ─────────────────────
  readonly brief = computed<ProductionBriefContract | undefined>(
    () => this.item()?.production?.brief,
  );

  readonly referenceLinks = computed<string[]>(
    () => this.brief()?.referenceLinks ?? [],
  );
  readonly dueDate = computed<string | undefined>(() => this.brief()?.dueDate);
  readonly campaignName = computed<string | undefined>(
    () => this.brief()?.campaignName,
  );
  readonly publishingMode = computed<PublishingModeContract | undefined>(
    () => this.brief()?.publishingMode,
  );
  readonly primaryCta = computed<PrimaryCtaContract | undefined>(
    () => this.brief()?.primaryCta,
  );
  readonly approvalNote = computed<string>(
    () => this.brief()?.approvalNote ?? '',
  );

  readonly paidBoosted = computed(
    () => this.publishingMode() === 'PAID_BOOSTED',
  );

  readonly pastDueDate = computed(() => {
    const d = this.dueDate();
    if (!d) return false;
    const date = new Date(d);
    if (isNaN(date.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date.getTime() < today.getTime();
  });

  setReferenceLinks(links: string[]): void {
    this.persistBrief({ referenceLinks: links });
  }

  addReferenceLink(url: string): void {
    const trimmed = url.trim();
    if (!trimmed) return;
    this.persistBrief({ referenceLinks: [...this.referenceLinks(), trimmed] });
  }

  removeReferenceLink(index: number): void {
    const next = this.referenceLinks().filter((_, i) => i !== index);
    this.persistBrief({ referenceLinks: next });
  }

  setDueDate(v: string): void {
    this.persistBrief({ dueDate: v.trim() || undefined });
  }

  setCampaignName(v: string): void {
    this.persistBrief({ campaignName: v.trim() || undefined });
  }

  setPublishingMode(v: PublishingModeContract | undefined): void {
    this.persistBrief({ publishingMode: v });
  }

  setPrimaryCta(v: PrimaryCtaContract | undefined): void {
    this.persistBrief({ primaryCta: v });
  }

  togglePrimaryCta(v: PrimaryCtaContract): void {
    this.setPrimaryCta(this.primaryCta() === v ? undefined : v);
  }

  setApprovalNote(v: string): void {
    this.persistBrief({ approvalNote: v.length > 0 ? v : undefined });
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
    const now = new Date().toISOString();
    this.state.saveItem({
      ...item,
      briefApproved: false,
      briefApprovedAt: undefined,
      briefApprovedBy: undefined,
      production: {
        ...item.production,
        brief: { ...(item.production?.brief ?? {}), unlockedAt: now },
      },
      updatedAt: now,
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

  readonly ctaTypeValid = computed(() => !!this.item()?.cta?.type);

  readonly ownerValid = computed(() => {
    const owner = this.item()?.owner;
    return !!owner && owner.trim().length > 0;
  });

  // Brief approval list — only the fields the post-detail brief actually
  // edits. Title / Description / Platform / Content Type / Content Goal /
  // Pillars / Audience are all set during the concept stage and locked here,
  // so they don't belong in the brief's Required-to-approve list. Mirrors
  // the prototype's BriefBuilder errors at lines 453-458.
  readonly errors = computed<BriefValidationIssue[]>(() => {
    const out: BriefValidationIssue[] = [];
    if (!this.keyMessageValid())
      out.push({ field: 'keyMessage', label: 'Key message is required' });
    if (!this.ownerValid())
      out.push({ field: 'owner', label: 'Owner is required' });
    if (!this.ctaTypeValid())
      out.push({ field: 'ctaType', label: 'CTA type is required' });
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

  // Patch a sub-key on production.brief, gated by the same write-lock.
  private persistBrief(patch: Partial<ProductionBriefContract>): void {
    const item = this.item();
    if (!item) return;
    if (item.briefApproved) return;
    const nextBrief: ProductionBriefContract = {
      ...(item.production?.brief ?? {}),
      ...patch,
    };
    const next: ContentItem = {
      ...item,
      production: { ...item.production, brief: nextBrief },
      updatedAt: new Date().toISOString(),
    };
    this.state.saveItem(next);
  }
}
