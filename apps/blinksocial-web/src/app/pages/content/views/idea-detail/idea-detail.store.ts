import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { ContentStateService } from '../../content-state.service';
import {
  AI_SIMULATION_DELAY_MS,
  MAX_PILLARS_PER_ITEM,
} from '../../content.constants';
import type { ContentItem, ContentObjective } from '../../content.types';
import { generateId, safeTimeout, toggleArrayItem } from '../../content.utils';
import { generateConceptOptions } from './idea-detail.ai';
import type { ConceptOption } from './idea-detail.types';

/**
 * Scoped per IdeaDetailComponent. All mutations go through `persist()`
 * so swapping in a debounced / API-backed saver is a single-line change.
 */
@Injectable()
export class IdeaDetailStore {
  private readonly state = inject(ContentStateService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _itemId = signal<string | null>(null);

  readonly item = computed<ContentItem | null>(
    () => this.state.items().find((i) => i.id === this._itemId()) ?? null,
  );
  readonly pillars = this.state.pillars;
  readonly segments = this.state.segments;

  readonly conceptOptions = signal<ConceptOption[] | null>(null);
  readonly isGeneratingOptions = signal(false);
  readonly selectedOptionId = signal<string | null>(null);

  readonly selectedOption = computed<ConceptOption | null>(() => {
    const id = this.selectedOptionId();
    if (!id) return null;
    return this.conceptOptions()?.find((o) => o.id === id) ?? null;
  });

  // ── context wiring ──────────────────────────────────────────────────
  setItemId(id: string | null): void {
    this._itemId.set(id);
    // Reset AI state when the item changes.
    this.conceptOptions.set(null);
    this.isGeneratingOptions.set(false);
    this.selectedOptionId.set(null);
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

  setObjectiveId(id: string | undefined): void {
    this.persist({ objectiveId: id });
  }

  setSourceUrl(url: string): void {
    const trimmed = url.trim();
    this.persist({ sourceUrl: trimmed.length > 0 ? trimmed : undefined });
  }

  setScheduledAt(iso: string | null): void {
    this.persist({ scheduledAt: iso ?? undefined });
  }

  // ── AI actions ──────────────────────────────────────────────────────
  generateOptions(): void {
    if (this.isGeneratingOptions()) return;
    this.conceptOptions.set(null);
    this.selectedOptionId.set(null);
    this.isGeneratingOptions.set(true);
    safeTimeout(
      () => {
        this.conceptOptions.set(generateConceptOptions(this.pillars(), this.segments()));
        this.isGeneratingOptions.set(false);
      },
      AI_SIMULATION_DELAY_MS,
      this.destroyRef,
    );
  }

  regenerate(): void {
    this.conceptOptions.set(null);
    this.selectedOptionId.set(null);
    this.generateOptions();
  }

  selectOption(id: string | null): void {
    this.selectedOptionId.update((current) => (current === id ? null : id));
  }

  // ── lifecycle ───────────────────────────────────────────────────────
  advanceToConcept(): ContentItem | null {
    const item = this.item();
    if (!item) return null;
    const selected = this.selectedOption();
    const patch: Partial<ContentItem> = { stage: 'concept', status: 'draft' };
    if (selected) {
      patch.hook = selected.angle;
      patch.description = selected.description;
      patch.objective = selected.objective;
      patch.cta = selected.cta;
      const mergedPillars = mergeBounded(item.pillarIds, selected.pillarIds, MAX_PILLARS_PER_ITEM);
      patch.pillarIds = mergedPillars;
      patch.segmentIds = mergeUnique(item.segmentIds, selected.segmentIds);
      const firstTarget = selected.productionTargets[0];
      if (firstTarget) {
        patch.platform = firstTarget.platform;
        patch.contentType = firstTarget.contentType;
      }
    }
    this.persist(patch);
    return this.item();
  }

  archive(): void {
    this.persist({ archived: true });
  }

  duplicate(): ContentItem | null {
    const item = this.item();
    if (!item) return null;
    const now = new Date().toISOString();
    const copy: ContentItem = {
      ...item,
      id: generateId('c'),
      title: `${item.title} (copy)`,
      stage: 'idea',
      status: 'draft',
      archived: false,
      createdAt: now,
      updatedAt: now,
    };
    this.state.saveItem(copy);
    return copy;
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

function mergeUnique<T>(a: readonly T[], b: readonly T[]): T[] {
  const set = new Set<T>(a);
  for (const x of b) set.add(x);
  return Array.from(set);
}

function mergeBounded<T>(a: readonly T[], b: readonly T[], limit: number): T[] {
  const merged = mergeUnique(a, b);
  return merged.slice(0, limit);
}

// The `ContentObjective` union is only used for narrowing the patch type on
// advanceToConcept; re-exported to keep the call sites self-describing.
export type { ContentObjective };
