import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router, provideRouter, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { PipelineViewComponent } from './pipeline-view.component';
import { MOCK_CONTENT_ITEMS, MOCK_PILLARS } from '../../content.mock-data';

describe('PipelineViewComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<PipelineViewComponent>>;
  let component: PipelineViewComponent;

  beforeEach(async () => {
    // D-27 persists viewMode to localStorage; clear between specs so each
    // test starts from the default 'kanban' view.
    localStorage.removeItem('blink-content-view-mode');
    await TestBed.configureTestingModule({
      imports: [PipelineViewComponent],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: 'hive-collective' })),
            snapshot: { paramMap: convertToParamMap({ id: 'hive-collective' }) },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PipelineViewComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('items', MOCK_CONTENT_ITEMS);
    fixture.componentRef.setInput('pillars', MOCK_PILLARS);
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

  it('includes per-column count in the title in parentheses (not as a separate badge)', () => {
    const titles = fixture.nativeElement.querySelectorAll('.column-title');
    const ideasTitle = titles[0].textContent?.trim() ?? '';
    // Expect shape like "Ideas (N)"
    expect(ideasTitle).toMatch(/Ideas \(\d+\)/);
    // And the separate count badge no longer exists
    expect(fixture.nativeElement.querySelector('.column-count')).toBeNull();
  });

  it('renders a + add button in Ideas, Concepts, and In Production column headers only', () => {
    const columns = fixture.nativeElement.querySelectorAll('.kanban-column');
    // Ideas, Concepts, In Production: have add button
    [0, 1, 2].forEach((i) => {
      expect(columns[i].querySelector('.column-add-btn')).not.toBeNull();
    });
    // Review, Published: no add button
    [3, 4].forEach((i) => {
      expect(columns[i].querySelector('.column-add-btn')).toBeNull();
    });
  });

  it('toggleSort flips order to ascending, affecting sortedItems output', () => {
    // Default is 'updatedAt' desc; flipping twice on the same field reverses back to asc
    component.toggleSort('updatedAt');
    expect(component.sortOrder()).toBe('asc');
    const asc = component.sortedItems().map((i) => i.updatedAt);
    const ascExpected = [...asc].sort();
    expect(asc).toEqual(ascExpected);
  });

  it('sorts by a different field (title) in asc order', () => {
    component.toggleSort('title'); // switches field, defaults to desc
    component.toggleSort('title'); // flips to asc
    expect(component.sortField()).toBe('title');
    expect(component.sortOrder()).toBe('asc');
  });

  it('toggleShowArchived flips true → false → true correctly', () => {
    expect(component.showArchived()).toBe(false);
    component.toggleShowArchived();
    expect(component.showArchived()).toBe(true);
    component.toggleShowArchived();
    expect(component.showArchived()).toBe(false);
  });

  it('hides archived items by default and reveals them when Show Archived is toggled on', () => {
    const withArchived = [
      ...MOCK_CONTENT_ITEMS,
      {
        ...MOCK_CONTENT_ITEMS[0],
        id: 'archived-1',
        title: 'An archived item',
        archived: true,
      },
    ];
    fixture.componentRef.setInput('items', withArchived);
    fixture.detectChanges();

    // By default archived items are excluded from filteredItems
    expect(component.filteredItems().some((i) => i.id === 'archived-1')).toBe(false);

    // Opening the filter panel exposes the Show Archived toggle
    component.toggleFilterPanel();
    fixture.detectChanges();
    const toggle: HTMLButtonElement = fixture.nativeElement.querySelector('.slide-toggle');
    expect(toggle).not.toBeNull();
    expect(toggle.getAttribute('role')).toBe('switch');
    expect(toggle.getAttribute('aria-checked')).toBe('false');

    // Clicking the switch includes archived items and reflects checked state
    toggle.click();
    fixture.detectChanges();
    expect(component.showArchived()).toBe(true);
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    expect(toggle.classList.contains('is-on')).toBe(true);
    expect(component.filteredItems().some((i) => i.id === 'archived-1')).toBe(true);
  });

  it('renders the Show Archived label using the shared filter-group-label style', () => {
    component.toggleFilterPanel();
    fixture.detectChanges();
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('.filter-group-label') as NodeListOf<HTMLElement>,
    ).map((el) => el.textContent?.trim());
    expect(labels).toContain('Show Archived');
  });

  it('clicking the add button emits createItemAs with the column-specific type', () => {
    const emitted: string[] = [];
    component.createItemAs.subscribe((t) => emitted.push(t));
    const addBtns = fixture.nativeElement.querySelectorAll('.column-add-btn') as NodeListOf<HTMLButtonElement>;
    addBtns[0].click(); // Ideas
    addBtns[1].click(); // Concepts
    addBtns[2].click(); // In Production
    expect(emitted).toEqual(['idea', 'concept', 'production-brief']);
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

  it('navigates to the item detail route on card click', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const card = fixture.nativeElement.querySelector('.content-card') as HTMLButtonElement;
    card.click();
    expect(navigateSpy).toHaveBeenCalled();
    const args = navigateSpy.mock.calls[0][0] as string[];
    expect(args[0]).toBe('/workspace');
    expect(args[1]).toBe('hive-collective');
    expect(args[2]).toBe('content');
    expect(typeof args[3]).toBe('string');
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
    emptyFixture.componentRef.setInput('items', []);
    emptyFixture.componentRef.setInput('pillars', []);
    emptyFixture.detectChanges();
    expect(emptyFixture.componentInstance.filteredItems().length).toBe(0);
    const empties = emptyFixture.nativeElement.querySelectorAll('.empty-column');
    expect(empties.length).toBe(5);
  });

  it('should show content type filter group when content types exist', () => {
    component.toggleFilterPanel();
    fixture.detectChanges();
    const groups = fixture.nativeElement.querySelectorAll('.filter-group');
    // Four groups: Pillars, Platform, Content Types, Show Archived toggle
    expect(groups.length).toBe(4);
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
