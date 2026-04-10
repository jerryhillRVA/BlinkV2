import { Injectable, inject, signal, computed } from '@angular/core';
import { forkJoin, catchError, of } from 'rxjs';
import { WorkspaceSettingsApiService } from '../workspace-settings/workspace-settings-api.service';
import { MockDataService } from '../../core/mock-data/mock-data.service';
import type {
  ContentItemContract,
  ContentPillarContract,
  AudienceSegmentContract,
  BrandVoiceSettingsContract,
} from '@blinksocial/contracts';
import type { ContentItem, ContentPillar, AudienceSegment, ContentStatus, ContentStage, ContentView } from './content.types';
import { getMockDataForWorkspace } from './content.mock-data';

@Injectable()
export class ContentStateService {
  private readonly api = inject(WorkspaceSettingsApiService);
  private readonly mockData = inject(MockDataService);

  readonly workspaceId = signal('');
  readonly loading = signal(false);
  readonly saving = signal(false);

  readonly items = signal<ContentItem[]>([]);
  readonly pillars = signal<ContentPillar[]>([]);
  readonly segments = signal<AudienceSegment[]>([]);

  readonly stepCounts = computed<Record<ContentView, number>>(() => {
    const all = this.items();
    return {
      overview: all.length,
      strategy: 0,
      production: all.filter(
        (i) =>
          i.status === 'in-progress' ||
          (i.stage === 'concept' && i.status === 'draft')
      ).length,
      review:
        all.filter((i) => i.status === 'review').length +
        all.filter((i) => i.status === 'scheduled').length,
      performance: all.filter((i) => i.status === 'published').length,
    };
  });

  loadAll(workspaceId: string): void {
    this.workspaceId.set(workspaceId);
    this.loading.set(true);

    forkJoin({
      contentItems: this.api
        .getNamespaceEntities<ContentItemContract>(workspaceId, 'content-items')
        .pipe(catchError(() => of([] as ContentItemContract[]))),
      brandVoice: this.api
        .getSettings<BrandVoiceSettingsContract & {
          contentPillars?: ContentPillarContract[];
          audienceSegments?: AudienceSegmentContract[];
        }>(workspaceId, 'brand-voice')
        .pipe(catchError(() => of(null))),
    }).subscribe({
      next: (data) => {
        const hasRealContent = data.contentItems && data.contentItems.length > 0;
        const mock = getMockDataForWorkspace(workspaceId);

        // Content items
        if (hasRealContent) {
          this.items.set(data.contentItems as ContentItem[]);
          this.mockData.markReal('content-items');
        } else {
          this.items.set(mock.items);
        }

        // Pillars and segments: only use API data when content items are also
        // real, so pillarIds in items always match the pillar list.
        if (hasRealContent) {
          const apiPillars = data.brandVoice?.contentPillars ?? [];
          this.pillars.set(
            apiPillars.length > 0
              ? apiPillars.map((p) => ({ id: p.id, name: p.name, description: p.description, color: p.color }))
              : mock.pillars
          );

          const apiSegments = data.brandVoice?.audienceSegments ?? [];
          this.segments.set(
            apiSegments.length > 0
              ? apiSegments.map((s) => ({ id: s.id, name: s.name, description: s.description ?? '' }))
              : mock.segments
          );
        } else {
          this.pillars.set(mock.pillars);
          this.segments.set(mock.segments);
        }

        this.loading.set(false);
      },
      error: () => {
        const mock = getMockDataForWorkspace(workspaceId);
        this.items.set(mock.items);
        this.pillars.set(mock.pillars);
        this.segments.set(mock.segments);
        this.loading.set(false);
      },
    });
  }

  saveItem(item: ContentItem): void {
    this.items.update((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists) {
        return prev.map((i) => (i.id === item.id ? item : i));
      }
      return [item, ...prev];
    });
  }

  deleteItem(id: string): void {
    this.items.update((prev) => prev.filter((i) => i.id !== id));
  }

  updateStatus(id: string, status: ContentStatus): void {
    this.items.update((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, status, updatedAt: new Date().toISOString() }
          : i
      )
    );
  }

  advanceStage(id: string): void {
    this.items.update((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const nextStage: ContentStage | null =
          i.stage === 'idea'
            ? 'concept'
            : i.stage === 'concept'
              ? 'post'
              : null;
        if (!nextStage) return i;
        return { ...i, stage: nextStage, updatedAt: new Date().toISOString() };
      })
    );
  }
}
