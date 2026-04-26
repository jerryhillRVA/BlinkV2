import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import type {
  CalendarContentItemContract,
  CalendarMilestoneContract,
  CalendarResponseContract,
} from '@blinksocial/contracts';
import { CalendarPageComponent } from './calendar-page.component';
import { CalendarApiService } from './calendar-api.service';

const REF_ISO = '2026-05-01T00:00:00.000Z';

function buildItem(
  overrides: Partial<CalendarContentItemContract> = {},
): CalendarContentItemContract {
  return {
    id: 'item-1',
    title: 'Spring launch',
    platform: 'instagram',
    canonicalType: 'IMAGE_SINGLE',
    status: 'in-progress',
    owner: 'Ava Chen',
    scheduleAt: '2026-05-03T15:00:00.000Z',
    blockers: [],
    ...overrides,
  };
}

function buildMilestone(
  overrides: Partial<CalendarMilestoneContract> = {},
): CalendarMilestoneContract {
  return {
    milestoneId: 'item-1-draft-0',
    contentId: 'item-1',
    milestoneType: 'draft_due',
    dueAt: '2026-04-28T00:00:00.000Z',
    milestoneOwner: 'Ava Chen',
    isRequired: true,
    ...overrides,
  };
}

function buildResponse(): CalendarResponseContract {
  return {
    workspaceId: 'hive-collective',
    referenceDate: REF_ISO,
    items: [
      buildItem(),
      buildItem({
        id: 'item-2',
        title: 'Event recap',
        platform: 'youtube',
        canonicalType: 'VIDEO_LONG_HORIZONTAL',
        status: 'approved',
        owner: 'Marcus Lee',
        scheduleAt: '2026-05-10T12:00:00.000Z',
      }),
    ],
    milestones: [
      buildMilestone(),
      buildMilestone({
        milestoneId: 'item-2-qa-0',
        contentId: 'item-2',
        milestoneType: 'qa_due',
        dueAt: '2026-05-06T00:00:00.000Z',
      }),
    ],
  };
}

type GetCalendarReturn = ReturnType<CalendarApiService['getCalendar']>;

function setupTestBed(
  getCalendar: () => GetCalendarReturn,
  paramMap: Record<string, string> = { id: 'hive-collective' },
) {
  const router = { navigate: vi.fn() } as unknown as Router;
  TestBed.configureTestingModule({
    imports: [CalendarPageComponent],
    providers: [
      { provide: Router, useValue: router },
      {
        provide: ActivatedRoute,
        useValue: { paramMap: of(convertToParamMap(paramMap)) },
      },
      { provide: CalendarApiService, useValue: { getCalendar } },
    ],
  });
  return router;
}

describe('CalendarPageComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('renders the page heading and defaults to Month view', () => {
    setupTestBed(() => of(buildResponse()));
    const fixture = TestBed.createComponent(CalendarPageComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('h1')?.textContent?.trim()).toBe('Content Calendar');
    expect(fixture.componentInstance.viewMode()).toBe('month');
    expect(el.querySelector('[data-testid="month-grid"]')).toBeTruthy();
  });

  it('fetches calendar data on init using the workspace id from the route', () => {
    const spy = vi.fn().mockReturnValue(of(buildResponse()));
    setupTestBed(spy, { id: 'booze-kills' });
    const fixture = TestBed.createComponent(CalendarPageComponent);
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledWith('booze-kills');
    expect(fixture.componentInstance.workspaceId()).toBe('booze-kills');
  });

  it('switches between views when the view switcher buttons are clicked', () => {
    setupTestBed(() => of(buildResponse()));
    const fixture = TestBed.createComponent(CalendarPageComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;

    (el.querySelector('[data-testid="view-btn-week"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.viewMode()).toBe('week');
    expect(el.querySelector('[data-testid="week-grid"]')).toBeTruthy();

    (el.querySelector('[data-testid="view-btn-day"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.querySelector('[data-testid="day-grid"]')).toBeTruthy();

    (el.querySelector('[data-testid="view-btn-list"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.querySelector('[data-testid="list-grid"]')).toBeTruthy();

    (el.querySelector('[data-testid="view-btn-month"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.querySelector('[data-testid="month-grid"]')).toBeTruthy();
  });

  it('navigates forward and backward between months and returns via Today', () => {
    setupTestBed(() => of(buildResponse()));
    const fixture = TestBed.createComponent(CalendarPageComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;

    const initial = fixture.componentInstance.cursorDate();
    (el.querySelector('[data-testid="nav-next"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.cursorDate().getUTCMonth()).toBe(initial.getUTCMonth() + 1);

    (el.querySelector('[data-testid="nav-prev"]') as HTMLButtonElement).click();
    (el.querySelector('[data-testid="nav-prev"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.cursorDate().getUTCMonth()).toBe(initial.getUTCMonth() - 1);

    (el.querySelector('[data-testid="nav-today"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.cursorDate().toISOString()).toBe(REF_ISO);
  });

  it('applies a platform filter and narrows visible events', () => {
    setupTestBed(() => of(buildResponse()));
    const fixture = TestBed.createComponent(CalendarPageComponent);
    fixture.detectChanges();
    const before = fixture.componentInstance.filteredEvents().length;
    fixture.componentInstance.togglePlatform('instagram');
    fixture.detectChanges();
    const after = fixture.componentInstance.filteredEvents();
    expect(after.length).toBeLessThan(before);
    expect(after.every((e) => e.item.platform === 'instagram')).toBe(true);
  });

  it('hides milestones when the Show milestones toggle is disabled', () => {
    setupTestBed(() => of(buildResponse()));
    const fixture = TestBed.createComponent(CalendarPageComponent);
    fixture.detectChanges();
    fixture.componentInstance.toggleShowMilestones();
    fixture.detectChanges();
    expect(
      fixture.componentInstance
        .filteredEvents()
        .every((e) => e.kind === 'publish'),
    ).toBe(true);
  });

  it('hides published events when the Show published toggle is disabled', () => {
    setupTestBed(() =>
      of({
        workspaceId: 'hive-collective',
        referenceDate: REF_ISO,
        items: [
          buildItem({ id: 'a', status: 'published' }),
          buildItem({ id: 'b', status: 'in-progress' }),
        ],
        milestones: [],
      }),
    );
    const fixture = TestBed.createComponent(CalendarPageComponent);
    fixture.detectChanges();
    fixture.componentInstance.toggleShowPublished();
    fixture.detectChanges();
    expect(
      fixture.componentInstance
        .filteredEvents()
        .every((e) => !(e.kind === 'publish' && e.item.status === 'published')),
    ).toBe(true);
  });

  it('applies a status filter', () => {
    setupTestBed(() => of(buildResponse()));
    const fixture = TestBed.createComponent(CalendarPageComponent);
    fixture.detectChanges();
    fixture.componentInstance.toggleStatus('approved');
    fixture.detectChanges();
    expect(
      fixture.componentInstance
        .filteredEvents()
        .every((e) => e.item.status === 'approved'),
    ).toBe(true);
  });

  it('applies an owner filter', () => {
    setupTestBed(() => of(buildResponse()));
    const fixture = TestBed.createComponent(CalendarPageComponent);
    fixture.detectChanges();
    fixture.componentInstance.toggleOwner('Marcus Lee');
    fixture.detectChanges();
    expect(
      fixture.componentInstance
        .filteredEvents()
        .every((e) => e.item.owner === 'Marcus Lee'),
    ).toBe(true);
  });

  it('applies a search filter', () => {
    setupTestBed(() => of(buildResponse()));
    const fixture = TestBed.createComponent(CalendarPageComponent);
    fixture.detectChanges();
    fixture.componentInstance.setSearch('recap');
    fixture.detectChanges();
    const results = fixture.componentInstance.filteredEvents();
    expect(results.every((e) => /recap/i.test(e.item.title))).toBe(true);
  });

  it('surfaces an error banner when the API fails', () => {
    setupTestBed(() => throwError(() => new Error('boom')));
    const fixture = TestBed.createComponent(CalendarPageComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[data-testid="calendar-error"]')).toBeTruthy();
    expect(fixture.componentInstance.loadError()).toBe('Failed to load calendar data.');
  });

  it('pins overdue events at the top of the upcoming panel', () => {
    setupTestBed(() => of(buildResponse()));
    const fixture = TestBed.createComponent(CalendarPageComponent);
    fixture.detectChanges();
    const top = fixture.componentInstance.upcomingEvents()[0];
    expect(top).toBeDefined();
    expect(top.severity).toBe('overdue');
  });

  it('collapses the upcoming panel when toggled', () => {
    setupTestBed(() => of(buildResponse()));
    const fixture = TestBed.createComponent(CalendarPageComponent);
    fixture.detectChanges();
    fixture.componentInstance.toggleUpcomingPanel();
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[data-testid="upcoming-panel"] ul.upcoming-list')).toBeFalsy();
  });

  it('opens the content detail page with the correct ?tab= query param for publish events', () => {
    const router = setupTestBed(() => of(buildResponse()));
    const fixture = TestBed.createComponent(CalendarPageComponent);
    fixture.detectChanges();
    const publish = fixture.componentInstance
      .allEvents()
      .find((e) => e.kind === 'publish');
    expect(publish).toBeDefined();
    if (!publish) return;
    fixture.componentInstance.openEvent(publish);
    expect(router.navigate).toHaveBeenCalledWith(
      ['/workspace', 'hive-collective', 'content', publish.contentId],
      { queryParams: { tab: 'packaging' } },
    );
  });

  it('opens the content detail with the tab derived from the milestone type', () => {
    const router = setupTestBed(() => of(buildResponse()));
    const fixture = TestBed.createComponent(CalendarPageComponent);
    fixture.detectChanges();
    const milestone = fixture.componentInstance
      .allEvents()
      .find((e) => e.kind === 'milestone');
    expect(milestone).toBeDefined();
    if (!milestone) return;
    fixture.componentInstance.openEvent(milestone);
    expect(router.navigate).toHaveBeenCalledWith(
      ['/workspace', 'hive-collective', 'content', milestone.contentId],
      { queryParams: { tab: 'draft' } },
    );
  });

  it('derives owner options from the loaded events', () => {
    setupTestBed(() => of(buildResponse()));
    const fixture = TestBed.createComponent(CalendarPageComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.ownerOptions()).toEqual(
      expect.arrayContaining(['Ava Chen', 'Marcus Lee']),
    );
  });

  it('reports active filters via isFilterActive helper', () => {
    setupTestBed(() => of(buildResponse()));
    const fixture = TestBed.createComponent(CalendarPageComponent);
    fixture.detectChanges();
    const c = fixture.componentInstance;
    c.togglePlatform('instagram');
    c.toggleStatus('approved');
    c.toggleOwner('Ava Chen');
    expect(c.isFilterActive('platform', 'instagram')).toBe(true);
    expect(c.isFilterActive('status', 'approved')).toBe(true);
    expect(c.isFilterActive('owner', 'Ava Chen')).toBe(true);
    expect(c.isFilterActive('platform', 'youtube')).toBe(false);
  });

  it('trims the day cell events at the configured max and reports overflow', () => {
    const manyEvents = Array.from({ length: 5 }, (_, i) =>
      buildItem({
        id: `bulk-${i}`,
        title: `Item ${i}`,
        scheduleAt: '2026-05-03T15:00:00.000Z',
      }),
    );
    setupTestBed(() =>
      of({
        workspaceId: 'hive-collective',
        referenceDate: REF_ISO,
        items: manyEvents,
        milestones: [],
      }),
    );
    const fixture = TestBed.createComponent(CalendarPageComponent);
    fixture.detectChanges();
    const day = new Date('2026-05-03T00:00:00.000Z');
    const cell = fixture.componentInstance.trimmedEventsForCell(day);
    expect(cell.visible.length).toBe(3);
    expect(cell.overflow).toBe(2);
  });

  it('navigates previous/next weeks in Week view and days in Day view', () => {
    setupTestBed(() => of(buildResponse()));
    const fixture = TestBed.createComponent(CalendarPageComponent);
    fixture.detectChanges();
    const c = fixture.componentInstance;
    c.setView('week');
    const weekStart = c.cursorDate();
    c.goNext();
    expect(c.cursorDate().getUTCDate()).toBe(weekStart.getUTCDate() + 7);

    c.setView('day');
    const dayStart = c.cursorDate();
    c.goNext();
    expect(c.cursorDate().getUTCDate()).toBe(dayStart.getUTCDate() + 1);
    c.goPrev();
    expect(c.cursorDate().getUTCDate()).toBe(dayStart.getUTCDate());
  });

  it('formats human-readable event labels for publish and milestone events', () => {
    setupTestBed(() => of(buildResponse()));
    const fixture = TestBed.createComponent(CalendarPageComponent);
    fixture.detectChanges();
    const c = fixture.componentInstance;
    const publish = c.allEvents().find((e) => e.kind === 'publish');
    const milestone = c.allEvents().find((e) => e.kind === 'milestone');
    if (!publish || !milestone) throw new Error('events missing');
    expect(c.eventLabel(publish)).toMatch(/Instagram|YouTube/);
    expect(c.eventLabel(milestone)).toMatch(/Draft Due|QA Due/);
  });

  it('toggling a filter twice adds and then removes it', () => {
    setupTestBed(() => of(buildResponse()));
    const fixture = TestBed.createComponent(CalendarPageComponent);
    fixture.detectChanges();
    const c = fixture.componentInstance;

    c.togglePlatform('instagram');
    expect(c.filter().platforms).toContain('instagram');
    c.togglePlatform('instagram');
    expect(c.filter().platforms).not.toContain('instagram');

    c.toggleStatus('approved');
    expect(c.filter().statuses).toContain('approved');
    c.toggleStatus('approved');
    expect(c.filter().statuses).not.toContain('approved');

    c.toggleOwner('Ava Chen');
    expect(c.filter().owners).toContain('Ava Chen');
    c.toggleOwner('Ava Chen');
    expect(c.filter().owners).not.toContain('Ava Chen');
  });

  it('sameMonth returns false for days outside the cursor month', () => {
    setupTestBed(() => of(buildResponse()));
    const fixture = TestBed.createComponent(CalendarPageComponent);
    fixture.detectChanges();
    const c = fixture.componentInstance;
    const otherMonth = new Date('2026-03-03T00:00:00.000Z');
    expect(c.sameMonth(otherMonth)).toBe(false);
    expect(c.sameMonth(new Date('2026-05-15T00:00:00.000Z'))).toBe(true);
  });

  it('isReferenceDay returns true on the reference day only', () => {
    setupTestBed(() => of(buildResponse()));
    const fixture = TestBed.createComponent(CalendarPageComponent);
    fixture.detectChanges();
    const c = fixture.componentInstance;
    expect(c.isReferenceDay(new Date(REF_ISO))).toBe(true);
    expect(c.isReferenceDay(new Date('2026-05-05T00:00:00.000Z'))).toBe(false);
  });

  it('platformLabel and statusLabel return fallback values for unknown keys', () => {
    setupTestBed(() => of(buildResponse()));
    const fixture = TestBed.createComponent(CalendarPageComponent);
    fixture.detectChanges();
    const c = fixture.componentInstance;
    expect(c.platformLabel('tbd')).toBe('TBD');
    expect(c.statusLabel('archived')).toBe('Archived');
    expect(c.statusLabel('unknown-status' as never)).toBe('unknown-status');
  });

  it('severityLabel returns the right label per severity value', () => {
    setupTestBed(() => of(buildResponse()));
    const fixture = TestBed.createComponent(CalendarPageComponent);
    fixture.detectChanges();
    const c = fixture.componentInstance;
    const overdue = { severity: 'overdue' } as never;
    const atRisk = { severity: 'at-risk' } as never;
    const blocked = { severity: 'blocked' } as never;
    const none = { severity: null } as never;
    expect(c.severityLabel(overdue)).toBe('Overdue');
    expect(c.severityLabel(atRisk)).toBe('At-risk');
    expect(c.severityLabel(blocked)).toBe('Blocked');
    expect(c.severityLabel(none)).toBeNull();
  });

  it('toggles the filters popover open and closed and clears all filters', () => {
    setupTestBed(() => of(buildResponse()));
    const fixture = TestBed.createComponent(CalendarPageComponent);
    fixture.detectChanges();
    const c = fixture.componentInstance;

    expect(c.filtersOpen()).toBe(false);
    c.toggleFiltersOpen();
    expect(c.filtersOpen()).toBe(true);
    c.toggleFiltersOpen();
    expect(c.filtersOpen()).toBe(false);

    c.toggleFiltersOpen();
    c.closeFilters();
    expect(c.filtersOpen()).toBe(false);

    c.togglePlatform('instagram');
    c.toggleStatus('approved');
    c.setSearch('foo');
    c.toggleShowMilestones();
    c.toggleShowPublished();
    expect(c.activeFilterCount()).toBe(5);

    c.clearAllFilters();
    expect(c.activeFilterCount()).toBe(0);
    expect(c.filter().platforms).toEqual([]);
    expect(c.filter().statuses).toEqual([]);
    expect(c.filter().search).toBe('');
  });

  it('exposes insight warnings for a 7-day publish gap and items without a publish date', () => {
    setupTestBed(() =>
      of({
        workspaceId: 'hive-collective',
        referenceDate: REF_ISO,
        items: [
          buildItem({
            id: 'no-date',
            scheduleAt: null as unknown as string,
            status: 'in-progress',
          }),
        ],
        milestones: [],
      }),
    );
    const fixture = TestBed.createComponent(CalendarPageComponent);
    fixture.detectChanges();
    const w = fixture.componentInstance.insightWarnings();
    expect(w.length).toBe(2);
    expect(w[0].headline).toMatch(/publish gap/i);
    expect(w[1].headline).toMatch(/without a publish date/i);
  });

  it('returns empty insight warnings when there are no issues', () => {
    setupTestBed(() => of(buildResponse()));
    const fixture = TestBed.createComponent(CalendarPageComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.insightWarnings().length).toBe(0);
  });

  it('pillLabel returns just the title for publishes and "<Type> · <Title>" for milestones', () => {
    setupTestBed(() => of(buildResponse()));
    const fixture = TestBed.createComponent(CalendarPageComponent);
    fixture.detectChanges();
    const c = fixture.componentInstance;
    const pub = c.allEvents().find((e) => e.kind === 'publish');
    const ms = c.allEvents().find((e) => e.kind === 'milestone');
    if (!pub || !ms) throw new Error('events missing');
    expect(c.pillLabel(pub)).toBe(pub.item.title);
    expect(c.pillLabel(ms)).toMatch(/Draft Due · |QA Due · /);
  });

  it('goToDay sets the cursor to the given day and switches to day view', () => {
    setupTestBed(() => of(buildResponse()));
    const fixture = TestBed.createComponent(CalendarPageComponent);
    fixture.detectChanges();
    const c = fixture.componentInstance;
    const target = new Date('2026-05-15T00:00:00.000Z');
    c.goToDay(target);
    expect(c.cursorDate().toISOString()).toBe(target.toISOString());
    expect(c.viewMode()).toBe('day');
  });

  it('milestoneShortLabel returns the labeled milestone type for milestone events and empty for publishes', () => {
    setupTestBed(() => of(buildResponse()));
    const fixture = TestBed.createComponent(CalendarPageComponent);
    fixture.detectChanges();
    const c = fixture.componentInstance;
    const ms = c.allEvents().find((e) => e.kind === 'milestone');
    const pub = c.allEvents().find((e) => e.kind === 'publish');
    if (!ms || !pub) throw new Error('events missing');
    expect(c.milestoneShortLabel(ms)).toMatch(/Draft Due|QA Due/);
    expect(c.milestoneShortLabel(pub)).toBe('');
  });

  it('peek lifecycle: enter sets event+anchor, leave clears, peek hover keeps it open', async () => {
    setupTestBed(() => of(buildResponse()));
    const fixture = TestBed.createComponent(CalendarPageComponent);
    fixture.detectChanges();
    const c = fixture.componentInstance;
    const ev = c.allEvents()[0];
    const fakeTarget = {
      getBoundingClientRect: () => ({ left: 10, top: 20, width: 100, height: 20 }),
    } as unknown as HTMLElement;

    c.onPillEnter(ev, fakeTarget);
    expect(c.peekEvent()).toBe(ev);
    expect(c.peekAnchor()).toEqual({ x: 10, y: 20, width: 100, height: 20 });

    c.onPeekEnter(); // Cancels close timer
    c.onPillLeave(); // Schedules close
    c.onPeekEnter(); // Cancels again — still open
    expect(c.peekEvent()).toBe(ev);

    c.closePeek();
    expect(c.peekEvent()).toBeNull();
    expect(c.peekAnchor()).toBeNull();
  });

  it('peekSummary returns a publish-style line for publish events and a milestone line for milestones', () => {
    setupTestBed(() => of(buildResponse()));
    const fixture = TestBed.createComponent(CalendarPageComponent);
    fixture.detectChanges();
    const c = fixture.componentInstance;
    const pub = c.allEvents().find((e) => e.kind === 'publish');
    const ms = c.allEvents().find((e) => e.kind === 'milestone');
    if (!pub || !ms) throw new Error('events missing');
    expect(c.peekSummary(pub)).toMatch(/^Publishes:/);
    expect(c.peekSummary(ms)).toMatch(/All day$/);
  });

  it('copyEventLink writes a workspace URL to the clipboard and closes the peek', () => {
    setupTestBed(() => of(buildResponse()));
    const fixture = TestBed.createComponent(CalendarPageComponent);
    fixture.detectChanges();
    const c = fixture.componentInstance;
    const writeText = vi.fn();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    const ev = c.allEvents()[0];
    c.onPillEnter(ev, {
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0 }),
    } as unknown as HTMLElement);
    c.copyEventLink(ev);
    expect(writeText).toHaveBeenCalled();
    const url = writeText.mock.calls[0][0] as string;
    expect(url).toMatch(/\/workspace\/hive-collective\/content\/item-/);
    expect(c.peekEvent()).toBeNull();
  });

  it('does nothing when the route has no id param', () => {
    const spy = vi.fn().mockReturnValue(of(buildResponse()));
    setupTestBed(spy, {});
    const fixture = TestBed.createComponent(CalendarPageComponent);
    fixture.detectChanges();
    expect(spy).not.toHaveBeenCalled();
  });
});
