import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { ContentStateService } from '../../content-state.service';
import {
  AI_ASSIST_DELAY_MS,
  CTA_TEXT_MAX_CHARS,
  DESCRIPTION_MAX_CHARS,
  DESCRIPTION_MIN_CHARS,
  HOOK_MAX_CHARS,
  MAX_PILLARS_PER_ITEM,
} from '../../content.constants';
import type {
  ContentItem,
  ContentObjective,
  ContentType,
  CtaType,
  Platform,
} from '../../content.types';
import { generateId, safeTimeout, toggleArrayItem } from '../../content.utils';
import { assistDescriptionFor, assistHookFor } from './concept-detail.ai';
import type { MoveToProductionOptions, ProductionTarget } from './concept-detail.types';

/**
 * Scoped per ConceptDetailComponent. Follows the same persist() chokepoint as
 * IdeaDetailStore so a later debounce / API call is a single-site change.
 */
@Injectable()
export class ConceptDetailStore {
  private readonly state = inject(ContentStateService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _itemId = signal<string | null>(null);

  readonly item = computed<ContentItem | null>(
    () => this.state.items().find((i) => i.id === this._itemId()) ?? null,
  );
  readonly pillars = this.state.pillars;
  readonly segments = this.state.segments;

  readonly isAssistingDescription = signal(false);
  readonly isAssistingHook = signal(false);
  readonly moveDialogOpen = signal(false);

  // ── context wiring ──────────────────────────────────────────────────
  setItemId(id: string | null): void {
    this._itemId.set(id);
    this.isAssistingDescription.set(false);
    this.isAssistingHook.set(false);
    this.moveDialogOpen.set(false);
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

  updateHook(hook: string): void {
    const trimmed = hook.trim();
    this.persist({ hook: trimmed.length > 0 ? trimmed : undefined });
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

  setObjective(v: ContentObjective | ''): void {
    this.persist({ objective: v === '' ? undefined : v });
  }

  setObjectiveId(id: string | undefined): void {
    this.persist({ objectiveId: id });
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

  toggleProductionTarget(platform: Platform, contentType: ContentType): void {
    const item = this.item();
    if (!item) return;
    const current = item.productionTargets ?? [];
    const idx = current.findIndex(
      (t) => t.platform === platform && t.contentType === contentType,
    );
    const next =
      idx >= 0
        ? current.filter((_, i) => i !== idx)
        : [...current, { platform, contentType }];
    this.persist({ productionTargets: next });
  }

  // ── AI actions ──────────────────────────────────────────────────────
  assistDescription(): void {
    const item = this.item();
    if (!item || this.isAssistingDescription()) return;
    this.isAssistingDescription.set(true);
    safeTimeout(
      () => {
        this.persist({
          description: assistDescriptionFor(item.title, item.objective ?? ''),
        });
        this.isAssistingDescription.set(false);
      },
      AI_ASSIST_DELAY_MS,
      this.destroyRef,
    );
  }

  assistHook(): void {
    const item = this.item();
    if (!item || this.isAssistingHook()) return;
    this.isAssistingHook.set(true);
    safeTimeout(
      () => {
        this.persist({
          hook: assistHookFor(item.title, item.objective ?? ''),
        });
        this.isAssistingHook.set(false);
      },
      AI_ASSIST_DELAY_MS,
      this.destroyRef,
    );
  }

  // ── validation ──────────────────────────────────────────────────────
  readonly titleValid = computed(() => (this.item()?.title?.trim().length ?? 0) > 0);

  readonly descriptionInRange = computed(() => {
    const len = this.item()?.description?.trim().length ?? 0;
    return len >= DESCRIPTION_MIN_CHARS && len <= DESCRIPTION_MAX_CHARS;
  });

  readonly hookInRange = computed(() => {
    const hook = this.item()?.hook?.trim() ?? '';
    return hook.length > 0 && hook.length <= HOOK_MAX_CHARS;
  });

  readonly pillarsInRange = computed(() => {
    const n = this.item()?.pillarIds?.length ?? 0;
    return n >= 1 && n <= MAX_PILLARS_PER_ITEM;
  });

  readonly hasObjective = computed(() => !!this.item()?.objective);

  readonly hasTargets = computed(() => (this.item()?.productionTargets?.length ?? 0) > 0);

  readonly ctaValid = computed(() => {
    const cta = this.item()?.cta;
    if (!cta) return true;
    const text = cta.text.trim();
    return text.length > 0 && text.length <= CTA_TEXT_MAX_CHARS;
  });

  readonly canMoveToProduction = computed(
    () =>
      this.titleValid() &&
      this.descriptionInRange() &&
      this.hookInRange() &&
      this.pillarsInRange() &&
      this.hasObjective() &&
      this.hasTargets() &&
      this.ctaValid(),
  );

  // ── lifecycle ───────────────────────────────────────────────────────
  openMoveDialog(): void {
    if (!this.canMoveToProduction()) return;
    this.moveDialogOpen.set(true);
  }

  closeMoveDialog(): void {
    this.moveDialogOpen.set(false);
  }

  /**
   * Creates one `stage: 'post'` item per production target. When
   * `keepConcept` is false (the default) the concept item itself is removed
   * from the board so the user sees the card transition cleanly into
   * In Production cards. When `workOnIndex` is set, the indexed post item is
   * the one the page should navigate to.
   *
   * Returns the created post items (in target order). Returns [] if the
   * concept is missing, invalid, or has no targets.
   */
  moveToProduction(opts: MoveToProductionOptions): ContentItem[] {
    const item = this.item();
    if (!item || !this.canMoveToProduction()) return [];
    const targets = item.productionTargets ?? [];
    if (targets.length === 0) return [];

    const now = new Date().toISOString();
    const created: ContentItem[] = targets.map((t) => ({
      ...item,
      id: generateId('c'),
      conceptId: item.id,
      parentConceptId: item.id,
      parentIdeaId: item.parentIdeaId,
      stage: 'post',
      status: 'in-progress',
      platform: t.platform,
      contentType: t.contentType,
      productionTargets: undefined,
      createdAt: now,
      updatedAt: now,
    }));
    for (const post of created) {
      this.state.saveItem(post);
    }
    if (!opts.keepConcept) {
      this.state.deleteItem(item.id);
    }
    this.moveDialogOpen.set(false);
    return created;
  }

  demoteToIdea(): void {
    this.persist({
      stage: 'idea',
      status: 'draft',
      productionTargets: undefined,
    });
  }

  archive(): void {
    this.persist({ archived: true });
  }

  deleteSelf(): void {
    const item = this.item();
    if (!item) return;
    this.state.deleteItem(item.id);
  }

  duplicate(): ContentItem | null {
    const item = this.item();
    if (!item) return null;
    const now = new Date().toISOString();
    const copy: ContentItem = {
      ...item,
      id: generateId('c'),
      title: `${item.title} (copy)`,
      stage: 'concept',
      status: 'draft',
      archived: false,
      createdAt: now,
      updatedAt: now,
    };
    this.state.saveItem(copy);
    return copy;
  }

  /**
   * Checks whether the given target is already represented by an existing
   * post item that references this concept (same platform + contentType).
   * Used by the targets picker to disable already-in-production combos.
   */
  isInProduction(target: ProductionTarget): boolean {
    const item = this.item();
    if (!item) return false;
    return this.state.items().some(
      (i) =>
        i.stage === 'post' &&
        i.conceptId === item.id &&
        i.platform === target.platform &&
        i.contentType === target.contentType,
    );
  }

  // ── internal ────────────────────────────────────────────────────────
  private persist(patch: Partial<ContentItem>): void {
    const item = this.item();
    if (!item) return;
    const next: ContentItem = {
      ...item,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    this.state.saveItem(next);
  }
}
