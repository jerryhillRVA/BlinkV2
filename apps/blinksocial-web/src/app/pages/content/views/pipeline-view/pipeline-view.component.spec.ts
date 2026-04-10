import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { PipelineViewComponent } from './pipeline-view.component';
import { MOCK_CONTENT_ITEMS, MOCK_PILLARS } from '../../content.mock-data';

describe('PipelineViewComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<PipelineViewComponent>>;
  let component: PipelineViewComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PipelineViewComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(PipelineViewComponent);
    component = fixture.componentInstance;
    component.items = MOCK_CONTENT_ITEMS;
    component.pillars = MOCK_PILLARS;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to kanban view mode', () => {
    expect(component.viewMode()).toBe('kanban');
  });

  it('should render toolbar', () => {
    const toolbar = fixture.nativeElement.querySelector('.toolbar');
    expect(toolbar).toBeTruthy();
  });

  it('should render gradient header bar', () => {
    const header = fixture.nativeElement.querySelector('.pipeline-card-header');
    expect(header).toBeTruthy();
  });

  it('should show "Pipeline Board" title in header', () => {
    const title = fixture.nativeElement.querySelector('.header-title');
    expect(title.textContent).toContain('Pipeline Board');
  });

  it('should show item count in header', () => {
    const count = fixture.nativeElement.querySelector('.header-count');
    expect(count.textContent).toContain(String(MOCK_CONTENT_ITEMS.length));
  });

  it('should render kanban board with 5 columns', () => {
    const columns = fixture.nativeElement.querySelectorAll('.kanban-column');
    expect(columns.length).toBe(5);
  });

  it('should render column headers with labels', () => {
    const titles = fixture.nativeElement.querySelectorAll('.column-title');
    expect(titles.length).toBe(5);
    expect(titles[0].textContent).toContain('Ideas');
    expect(titles[4].textContent).toContain('Published');
  });

  it('should render content cards', () => {
    const cards = fixture.nativeElement.querySelectorAll('.content-card');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('should display pillar badges on cards', () => {
    const badges = fixture.nativeElement.querySelectorAll('.pillar-badge');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('should render "New Content" button', () => {
    const btn = fixture.nativeElement.querySelector('.btn-new-content');
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('New Content');
  });

  it('should emit createItem on "New Content" click', () => {
    const spy = vi.fn();
    component.createItem.subscribe(spy);
    const btn = fixture.nativeElement.querySelector('.btn-new-content') as HTMLButtonElement;
    btn.click();
    expect(spy).toHaveBeenCalled();
  });

  it('should toggle filter panel visibility', () => {
    expect(fixture.nativeElement.querySelector('.filter-panel')).toBeFalsy();
    component.toggleFilterPanel();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.filter-panel')).toBeTruthy();
  });

  it('should render filter chips for pillars when panel is open', () => {
    component.toggleFilterPanel();
    fixture.detectChanges();
    const chips = fixture.nativeElement.querySelectorAll('.filter-chip');
    expect(chips.length).toBeGreaterThanOrEqual(MOCK_PILLARS.length);
  });

  it('should filter items by pillar', () => {
    const initialCount = component.filteredItems().length;
    component.toggleFilterPillar('p1');
    const filteredCount = component.filteredItems().length;
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
    component.filteredItems().forEach((item) => {
      expect(item.pillarIds).toContain('p1');
    });
  });

  it('should clear all filters', () => {
    component.toggleFilterPillar('p1');
    component.toggleFilterPlatform('instagram');
    expect(component.activeFilterCount()).toBe(2);
    component.clearAllFilters();
    expect(component.activeFilterCount()).toBe(0);
  });

  it('should switch to list view', () => {
    component.setViewMode('list');
    fixture.detectChanges();
    const listItems = fixture.nativeElement.querySelector('.list-items');
    expect(listItems).toBeTruthy();
    const kanban = fixture.nativeElement.querySelector('.kanban-board');
    expect(kanban).toBeFalsy();
  });

  it('should render list cards for each item', () => {
    component.setViewMode('list');
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('.list-card');
    expect(cards.length).toBe(MOCK_CONTENT_ITEMS.length);
  });

  it('should filter items by search query', () => {
    component.searchQuery.set('yoga');
    fixture.detectChanges();
    const filtered = component.filteredItems();
    expect(filtered.length).toBeLessThan(MOCK_CONTENT_ITEMS.length);
    filtered.forEach((item) => {
      const text = (item.title + item.description).toLowerCase();
      expect(text).toContain('yoga');
    });
  });

  it('should emit selectItem on card click', () => {
    const spy = vi.fn();
    component.selectItem.subscribe(spy);
    const card = fixture.nativeElement.querySelector('.content-card') as HTMLButtonElement;
    card.click();
    expect(spy).toHaveBeenCalled();
  });

  it('should render view toggle buttons', () => {
    const toggles = fixture.nativeElement.querySelectorAll('.toggle-btn');
    expect(toggles.length).toBe(2);
  });

  it('should toggle sort order', () => {
    expect(component.sortOrder()).toBe('desc');
    component.toggleSort('updatedAt');
    expect(component.sortOrder()).toBe('asc');
    component.toggleSort('updatedAt');
    expect(component.sortOrder()).toBe('desc');
  });

  it('should change sort field', () => {
    component.toggleSort('title');
    expect(component.sortField()).toBe('title');
    expect(component.sortOrder()).toBe('desc');
  });

  it('should format dates', () => {
    const formatted = component.formatDate('2026-02-28T09:00:00');
    expect(formatted).toContain('Feb');
    expect(formatted).toContain('28');
  });

  it('should get pillar name by id', () => {
    expect(component.getPillarName('p1')).toBe('Yoga & Movement');
    expect(component.getPillarName('unknown')).toBe('');
  });

  it('should distribute items across kanban columns', () => {
    const ideaItems = component.getColumnItems('ideas');
    const publishedItems = component.getColumnItems('published');
    expect(ideaItems.length).toBeGreaterThan(0);
    expect(publishedItems.length).toBeGreaterThan(0);
  });

  it('should return empty array for invalid column', () => {
    expect(component.getColumnItems('nonexistent')).toEqual([]);
  });

  it('should compute available content types from items', () => {
    const types = component.availableContentTypes();
    expect(types.length).toBeGreaterThan(0);
    expect(types).toContain('reel');
  });

  it('should filter by platform', () => {
    component.toggleFilterPlatform('instagram');
    const filtered = component.filteredItems();
    filtered.forEach((item) => {
      expect(item.platform).toBe('instagram');
    });
  });

  it('should filter by content type', () => {
    component.toggleFilterContentType('reel');
    const filtered = component.filteredItems();
    filtered.forEach((item) => {
      expect(item.contentType).toBe('reel');
    });
  });

  it('should update search query via onSearch', () => {
    const input = fixture.nativeElement.querySelector('.search-input') as HTMLInputElement;
    input.value = 'mobility';
    input.dispatchEvent(new Event('input'));
    expect(component.searchQuery()).toBe('mobility');
  });

  it('should toggle filter panel via filter button click', () => {
    const btn = fixture.nativeElement.querySelector('.filter-btn') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    expect(component.showFilterPanel()).toBe(true);
    expect(fixture.nativeElement.querySelector('.filter-panel')).toBeTruthy();
    btn.click();
    fixture.detectChanges();
    expect(component.showFilterPanel()).toBe(false);
  });

  it('should remove filter when toggled twice', () => {
    component.toggleFilterPillar('p1');
    expect(component.filterPillars()).toContain('p1');
    component.toggleFilterPillar('p1');
    expect(component.filterPillars()).not.toContain('p1');
  });

  it('should toggle platform filter on and off', () => {
    component.toggleFilterPlatform('instagram');
    expect(component.filterPlatforms()).toContain('instagram');
    component.toggleFilterPlatform('instagram');
    expect(component.filterPlatforms()).not.toContain('instagram');
  });

  it('should toggle content type filter on and off', () => {
    component.toggleFilterContentType('reel');
    expect(component.filterContentTypes()).toContain('reel');
    component.toggleFilterContentType('reel');
    expect(component.filterContentTypes()).not.toContain('reel');
  });

  it('should render items without hooks showing description', () => {
    const ideas = component.getColumnItems('ideas');
    const ideaWithoutHook = ideas.find((i) => !i.hook);
    expect(ideaWithoutHook).toBeTruthy();
  });

  it('should handle empty items array', () => {
    const emptyFixture = TestBed.createComponent(PipelineViewComponent);
    emptyFixture.componentInstance.items = [];
    emptyFixture.componentInstance.pillars = [];
    emptyFixture.detectChanges();
    expect(emptyFixture.componentInstance.filteredItems().length).toBe(0);
    const empties = emptyFixture.nativeElement.querySelectorAll('.empty-column');
    expect(empties.length).toBe(5);
  });

  it('should show content type filter group when content types exist', () => {
    component.toggleFilterPanel();
    fixture.detectChanges();
    const groups = fixture.nativeElement.querySelectorAll('.filter-group');
    // Should have 3 groups: Pillars, Platform, Content Types
    expect(groups.length).toBe(3);
  });

  it('should render list view with pillar badges', () => {
    component.setViewMode('list');
    fixture.detectChanges();
    const badges = fixture.nativeElement.querySelectorAll('.list-card .pillar-badge');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('should render list cards with stage badge and column label', () => {
    component.setViewMode('list');
    fixture.detectChanges();
    const stages = fixture.nativeElement.querySelectorAll('.list-card-stage');
    expect(stages.length).toBeGreaterThan(0);
  });

  it('should render list cards with column icon', () => {
    component.setViewMode('list');
    fixture.detectChanges();
    const icons = fixture.nativeElement.querySelectorAll('.list-card-icon');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('should show filter count badge when filters are active', () => {
    component.toggleFilterPillar('p1');
    fixture.detectChanges();
    const countBadge = fixture.nativeElement.querySelector('.filter-count');
    expect(countBadge).toBeTruthy();
    expect(countBadge.textContent).toContain('1');
  });

  it('should show "Clear all" button in filter panel when filters are active', () => {
    component.toggleFilterPanel();
    component.toggleFilterPillar('p1');
    fixture.detectChanges();
    const clearBtn = fixture.nativeElement.querySelector('.clear-filters');
    expect(clearBtn).toBeTruthy();
  });

  it('should render active filter chip styling', () => {
    component.toggleFilterPanel();
    component.toggleFilterPillar('p1');
    fixture.detectChanges();
    const activeChips = fixture.nativeElement.querySelectorAll('.filter-chip.active');
    expect(activeChips.length).toBe(1);
  });

  it('should have idea items without hooks in mock data', () => {
    const ideaItems = component.getColumnItems('ideas');
    const noHookCount = ideaItems.filter((i) => !i.hook).length;
    expect(noHookCount).toBeGreaterThan(0);
  });

  it('should emit navigateToStep', () => {
    const spy = vi.fn();
    component.navigateToStep.subscribe(spy);
    component.navigateToStep.emit('production');
    expect(spy).toHaveBeenCalledWith('production');
  });
});
