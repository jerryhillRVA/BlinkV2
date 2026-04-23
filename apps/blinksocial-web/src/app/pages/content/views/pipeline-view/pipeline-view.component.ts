import { Component, PLATFORM_ID, computed, EventEmitter, Output, inject, signal, input } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PlatformIconComponent } from '../../../../shared/platform-icon/platform-icon.component';
import { expandPanel } from '../../../../core/animations/expand-panel.animation';
import { ContentStateService } from '../../content-state.service';
import type { ContentItem, ContentPillar, ContentView, ViewMode, SortField, SortOrder, PipelineColumn, ContentItemType } from '../../content.types';
import { PIPELINE_COLUMNS, STAGE_CONFIG, STATUS_CONFIG } from '../../content.constants';

const VIEW_MODE_STORAGE_KEY = 'blink-content-view-mode';

/**
 * Pipeline column match rule. A column can filter by:
 *   - stage only (e.g. Ideas, Concepts) — any status in that stage shows up
 *   - stage + specific statuses (reserved for future use)
 *   - status only (e.g. In Production, Review, Published — any stage)
 * An empty `statuses` array means "any status in this stage".
 */
function matchesColumn(item: ContentItem, col: PipelineColumn): boolean {
  const anyStatus = col.statuses.length === 0;
  if (col.stage) {
    if (item.stage !== col.stage) return false;
    return anyStatus || col.statuses.includes(item.status);
  }
  return anyStatus || col.statuses.includes(item.status);
}

@Component({
  selector: 'app-pipeline-view',
  imports: [CommonModule, PlatformIconComponent],
  animations: [expandPanel],
  templateUrl: './pipeline-view.component.html',
  styleUrl: './pipeline-view.component.scss',
})
export class PipelineViewComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly stateService = inject(ContentStateService, { optional: true });
  private readonly platformId = inject(PLATFORM_ID);

  readonly items = input<ContentItem[]>([]);
  readonly pillars = input<ContentPillar[]>([]);

  private readonly sourceItems = computed<ContentItem[]>(() => {
    const svc = this.stateService;
    if (svc) {
      return this.showArchived() ? svc.archivedItems() : svc.activeItems();
    }
    // Fallback (input-driven): segregate by archived flag client-side.
    const all = this.items();
    return this.showArchived()
      ? all.filter((i) => i.archived)
      : all.filter((i) => !i.archived);
  });
  @Output() navigateToStep = new EventEmitter<ContentView>();
  @Output() createItem = new EventEmitter<void>();
  @Output() createItemAs = new EventEmitter<ContentItemType>();

  readonly viewMode = signal<ViewMode>(this.loadViewMode());
  readonly searchQuery = signal('');
  readonly sortField = signal<SortField>('updatedAt');
  readonly sortOrder = signal<SortOrder>('desc');
  readonly showFilterPanel = signal(false);
  readonly filterPillars = signal<string[]>([]);
  readonly filterPlatforms = signal<string[]>([]);
  readonly filterContentTypes = signal<string[]>([]);
  readonly showArchived = signal(false);

  readonly columns = PIPELINE_COLUMNS;
  readonly stageConfig = STAGE_CONFIG;
  readonly statusConfig = STATUS_CONFIG;
  readonly platforms = ['instagram', 'tiktok', 'youtube', 'facebook', 'linkedin'];

  readonly availableContentTypes = computed(() => {
    const types = new Set<string>();
    this.sourceItems().forEach((i) => {
      if (i.contentType) types.add(i.contentType);
    });
    return Array.from(types).sort();
  });

  readonly activeFilterCount = computed(
    () =>
      this.filterPillars().length +
      this.filterPlatforms().length +
      this.filterContentTypes().length
  );

  readonly filteredItems = computed(() => {
    let result = this.sourceItems();
    const query = this.searchQuery().toLowerCase();
    if (query) {
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(query) ||
          i.description.toLowerCase().includes(query)
      );
    }
    const fp = this.filterPillars();
    if (fp.length > 0) {
      result = result.filter((i) => fp.some((p) => i.pillarIds.includes(p)));
    }
    const fplat = this.filterPlatforms();
    if (fplat.length > 0) {
      result = result.filter(
        (i) => i.platform && fplat.includes(i.platform)
      );
    }
    const fct = this.filterContentTypes();
    if (fct.length > 0) {
      result = result.filter(
        (i) => i.contentType && fct.includes(i.contentType)
      );
    }
    return result;
  });

  readonly sortedItems = computed(() => {
    const items = [...this.filteredItems()];
    const field = this.sortField();
    const order = this.sortOrder();
    items.sort((a, b) => {
      const aVal = a[field] ?? '';
      const bVal = b[field] ?? '';
      const cmp = String(aVal).localeCompare(String(bVal));
      return order === 'asc' ? cmp : -cmp;
    });
    return items;
  });

  getColumnItems(columnId: string): ContentItem[] {
    const col = this.columns.find((c) => c.id === columnId);
    if (!col) return [];
    return this.filteredItems().filter((item) => matchesColumn(item, col));
  }

  getItemColumn(item: ContentItem): PipelineColumn | undefined {
    return this.columns.find((col) => matchesColumn(item, col));
  }

  getPillarName(id: string): string {
    return this.pillars().find((p) => p.id === id)?.name ?? '';
  }

  openItem(item: ContentItem): void {
    const workspaceId = this.route.snapshot.paramMap.get('id') ?? '';
    this.router.navigate(['/workspace', workspaceId, 'content', item.id]);
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
      } catch {
        /* localStorage blocked (e.g., private mode) — fail silently */
      }
    }
  }

  private loadViewMode(): ViewMode {
    if (!isPlatformBrowser(this.platformId)) return 'kanban';
    try {
      const v = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      return v === 'list' || v === 'kanban' ? v : 'kanban';
    } catch {
      return 'kanban';
    }
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  toggleSort(field: SortField): void {
    if (this.sortField() === field) {
      this.sortOrder.set(this.sortOrder() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortOrder.set('desc');
    }
  }

  toggleFilterPanel(): void {
    this.showFilterPanel.update((v) => !v);
  }

  toggleFilterPillar(id: string): void {
    this.filterPillars.update((arr) =>
      arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]
    );
  }

  toggleFilterPlatform(id: string): void {
    this.filterPlatforms.update((arr) =>
      arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]
    );
  }

  toggleFilterContentType(id: string): void {
    this.filterContentTypes.update((arr) =>
      arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]
    );
  }

  clearAllFilters(): void {
    this.filterPillars.set([]);
    this.filterPlatforms.set([]);
    this.filterContentTypes.set([]);
  }

  toggleShowArchived(): void {
    const next = !this.showArchived();
    this.showArchived.set(next);
    if (next) {
      this.stateService?.loadArchiveIndex();
    }
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
