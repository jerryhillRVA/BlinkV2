import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import type { Observable } from 'rxjs';
import { ContentStateService } from '../../content-state.service';
import {
  AI_SIMULATION_DELAY_MS,
  MAX_PILLARS_PER_ITEM,
} from '../../content.constants';
import type { ContentItem, ContentObjective, ContentStatus } from '../../content.types';
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
  readonly businessObjectives = this.state.businessObjectives;

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

  setTags(tags: string[]): void {
    const cleaned = tags
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    const deduped = Array.from(new Set(cleaned));
    this.persist({ tags: deduped });
  }

  setObjectiveId(id: string | undefined): void {
    this.persist({ objectiveId: id });
  }

  setSourceUrl(url: string): void {
    const trimmed = url.trim();
    this.persist({ sourceUrl: trimmed.length > 0 ? trimmed : undefined });
  }

  setStatus(status: ContentStatus): void {
    this.persist({ status });
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
  /**
   * Builds the new concept from the source idea and posts it to the server.
   * The returned observable emits the server-assigned item (authoritative id);
   * callers must subscribe before navigating so the route uses the real id.
   */
  advanceToConcept(): Observable<ContentItem> | null {
    const item = this.item();
    if (!item) return null;
    const selected = this.selectedOption();
    const now = new Date().toISOString();
    const concept: ContentItem = {
      // Placeholder id for the ContentItem shape; stripped on POST — the
      // server assigns the authoritative id and returns it in the response.
      id: generateId('c'),
      stage: 'concept',
      status: 'draft',
      parentIdeaId: item.id,
      title: item.title,
      description: selected?.description ?? item.description,
      pillarIds: selected
        ? mergeBounded(item.pillarIds, selected.pillarIds, MAX_PILLARS_PER_ITEM)
        : [...item.pillarIds],
      segmentIds: selected
        ? mergeUnique(item.segmentIds, selected.segmentIds)
        : [...item.segmentIds],
      createdAt: now,
      updatedAt: now,
      archived: false,
      ...(selected
        ? {
            hook: selected.angle,
            objective: selected.objective,
            cta: selected.cta,
            targetPlatforms: selected.targetPlatforms.map((t) => ({ ...t })),
          }
        : {}),
    };
    const firstTarget = selected?.targetPlatforms[0];
    if (firstTarget) {
      concept.platform = firstTarget.platform;
      concept.contentType = firstTarget.contentType;
    }
    return this.state.saveItem(concept);
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
