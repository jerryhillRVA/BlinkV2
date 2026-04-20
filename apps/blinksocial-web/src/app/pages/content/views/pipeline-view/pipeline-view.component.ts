import { Component, computed, EventEmitter, Output, inject, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PlatformIconComponent } from '../../../../shared/platform-icon/platform-icon.component';
import { expandPanel } from '../../../../core/animations/expand-panel.animation';
import type { ContentItem, ContentPillar, ContentView, ViewMode, SortField, SortOrder, PipelineColumn, ContentItemType } from '../../content.types';
import { PIPELINE_COLUMNS, STAGE_CONFIG, STATUS_CONFIG } from '../../content.constants';

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

  readonly items = input<ContentItem[]>([]);
  readonly pillars = input<ContentPillar[]>([]);
  @Output() navigateToStep = new EventEmitter<ContentView>();
  @Output() createItem = new EventEmitter<void>();
  @Output() createItemAs = new EventEmitter<ContentItemType>();

  readonly viewMode = signal<ViewMode>('kanban');
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
    this.items().forEach((i) => {
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
    let result = this.items();
    if (!this.showArchived()) {
      result = result.filter((i) => !i.archived);
    }
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
    return this.filteredItems().filter((item) => {
      if (col.stage && item.stage === col.stage && col.statuses.includes(item.status)) {
        return true;
      }
      if (!col.stage && col.statuses.includes(item.status)) {
        return true;
      }
      return false;
    });
  }

  getItemColumn(item: ContentItem): PipelineColumn | undefined {
    return this.columns.find((col) => {
      if (col.stage && item.stage === col.stage && col.statuses.includes(item.status)) return true;
      if (!col.stage && col.statuses.includes(item.status)) return true;
      return false;
    });
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
    this.showArchived.update((v) => !v);
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
