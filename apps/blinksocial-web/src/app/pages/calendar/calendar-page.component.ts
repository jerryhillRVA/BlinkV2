import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import type {
  CalendarResponseContract,
  PlatformContract,
} from '@blinksocial/contracts';
import { CalendarApiService } from './calendar-api.service';
import {
  applyFilters,
  buildEvents,
  sortEventsForCell,
} from './calendar-event.util';
import {
  CalendarEventView,
  CalendarFilterState,
  CalendarViewMode,
  EMPTY_FILTER_STATE,
} from './calendar.types';
import { CalendarPeekCardComponent } from './peek-card/peek-card.component';

const MILESTONE_LABELS: Record<string, string> = {
  brief_due: 'Brief Due',
  draft_due: 'Draft Due',
  blueprint_due: 'Blueprint Due',
  assets_due: 'Assets Due',
  packaging_due: 'Packaging Due',
  qa_due: 'QA Due',
};

const MILESTONE_TAB_MAP: Record<string, string> = {
  brief_due: 'brief',
  draft_due: 'draft',
  blueprint_due: 'blueprint',
  assets_due: 'assets',
  packaging_due: 'packaging',
  qa_due: 'qa',
};

const PLATFORM_LABELS: Record<PlatformContract, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  tbd: 'TBD',
};

const STATUS_LABELS: Record<string, string> = {
  intake: 'Intake',
  'in-progress': 'In Progress',
  'in-review': 'In Review',
  revisions: 'Revisions',
  approved: 'Approved',
  scheduled: 'Scheduled',
  published: 'Published',
  archived: 'Archived',
};

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_EVENTS_PER_CELL = 3;
const UPCOMING_HORIZON_DAYS = 14;

const ALLOWED_VIEW_MODES: readonly CalendarViewMode[] = [
  'month',
  'week',
  'day',
  'list',
];

@Component({
  selector: 'app-calendar-page',
  imports: [CommonModule, FormsModule, DatePipe, CalendarPeekCardComponent],
  templateUrl: './calendar-page.component.html',
  styleUrl: './calendar-page.component.scss',
})
export class CalendarPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(CalendarApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly workspaceId = signal<string>('');
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly response = signal<CalendarResponseContract | null>(null);

  readonly viewMode = signal<CalendarViewMode>('month');
  readonly cursorDate = signal<Date>(new Date('2026-05-01T00:00:00.000Z'));
  readonly filter = signal<CalendarFilterState>({ ...EMPTY_FILTER_STATE });
  readonly upcomingCollapsed = signal(false);
  readonly filtersOpen = signal(false);

  readonly peekEvent = signal<CalendarEventView | null>(null);
  readonly peekAnchor = signal<{ x: number; y: number; width: number; height: number } | null>(null);
  private peekCloseTimer: ReturnType<typeof setTimeout> | null = null;

  readonly transitioning = signal(false);
  readonly activeFilterCount = computed(() => {
    const f = this.filter();
    return (
      f.platforms.length +
      f.statuses.length +
      f.owners.length +
      (f.search ? 1 : 0) +
      (f.showMilestones ? 0 : 1) +
      (f.showPublished ? 0 : 1)
    );
  });

  readonly referenceDate = computed<Date>(() => {
    const r = this.response();
    return r ? new Date(r.referenceDate) : new Date('2026-05-01T00:00:00.000Z');
  });

  readonly allEvents = computed<CalendarEventView[]>(() => {
    const r = this.response();
    return r ? buildEvents(r) : [];
  });

  readonly filteredEvents = computed<CalendarEventView[]>(() =>
    applyFilters(this.allEvents(), this.filter()),
  );

  readonly ownerOptions = computed<string[]>(() => {
    const set = new Set<string>();
    for (const ev of this.allEvents()) set.add(ev.item.owner);
    return Array.from(set).sort();
  });

  readonly platformOptions: PlatformContract[] = [
    'instagram',
    'tiktok',
    'youtube',
    'facebook',
    'linkedin',
  ];

  readonly statusOptions: string[] = [
    'intake',
    'in-progress',
    'in-review',
    'revisions',
    'approved',
    'scheduled',
    'published',
  ];

  readonly monthHeader = computed(() =>
    this.cursorDate().toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }),
  );

  readonly monthDays = computed<Date[][]>(() => {
    const cur = this.cursorDate();
    const year = cur.getUTCFullYear();
    const month = cur.getUTCMonth();
    const firstOfMonth = new Date(Date.UTC(year, month, 1));
    const firstWeekday = firstOfMonth.getUTCDay();
    const gridStart = new Date(firstOfMonth.getTime() - firstWeekday * DAY_MS);
    const weeks: Date[][] = [];
    for (let w = 0; w < 6; w += 1) {
      const week: Date[] = [];
      for (let d = 0; d < 7; d += 1) {
        week.push(new Date(gridStart.getTime() + (w * 7 + d) * DAY_MS));
      }
      weeks.push(week);
    }
    return weeks;
  });

  readonly weekDays = computed<Date[]>(() => {
    const cur = this.cursorDate();
    const day = cur.getUTCDay();
    const start = new Date(
      Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), cur.getUTCDate()) - day * DAY_MS,
    );
    const days: Date[] = [];
    for (let i = 0; i < 7; i += 1) {
      days.push(new Date(start.getTime() + i * DAY_MS));
    }
    return days;
  });

  readonly dayHours = Array.from({ length: 16 }, (_, i) => i + 6);

  readonly listGroupedEvents = computed(() => {
    const groups = new Map<string, CalendarEventView[]>();
    for (const ev of this.filteredEvents()) {
      const key = ev.date.toISOString().slice(0, 10);
      const arr = groups.get(key) ?? [];
      arr.push(ev);
      groups.set(key, arr);
    }
    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateKey, events]) => ({ dateKey, date: new Date(dateKey), events }));
  });

  readonly insightWarnings = computed(() => {
    const r = this.response();
    if (!r) return [] as { headline: string; detail: string }[];
    const warnings: { headline: string; detail: string }[] = [];
    const ref = this.referenceDate();
    const start = ref;
    const end = new Date(ref.getTime() + 7 * DAY_MS);
    const next7 = r.items.filter((it) => {
      if (!it.scheduleAt) return false;
      const d = new Date(it.scheduleAt);
      return d >= start && d <= end;
    });
    if (next7.length === 0) {
      warnings.push({
        headline: '7-day publish gap ahead',
        detail:
          'No content scheduled in the next 7 days. Fill gaps to maintain cadence.',
      });
    }
    const noDate = r.items.filter(
      (it) => !it.scheduleAt && it.status !== 'published',
    );
    if (noDate.length > 0) {
      warnings.push({
        headline: `${noDate.length} item${noDate.length === 1 ? '' : 's'} without a publish date`,
        detail:
          'Set a publish date to auto-generate milestones and production windows.',
      });
    }
    return warnings;
  });

  readonly upcomingEvents = computed<CalendarEventView[]>(() => {
    const ref = this.referenceDate();
    const horizon = new Date(ref.getTime() + UPCOMING_HORIZON_DAYS * DAY_MS);
    const within: CalendarEventView[] = [];
    for (const ev of this.filteredEvents()) {
      if (ev.severity === 'overdue' || ev.severity === 'blocked') {
        within.push(ev);
        continue;
      }
      if (ev.date >= ref && ev.date <= horizon) {
        within.push(ev);
      }
    }
    return within.sort((a, b) => {
      const aOver = a.severity === 'overdue' || a.severity === 'blocked' ? 0 : 1;
      const bOver = b.severity === 'overdue' || b.severity === 'blocked' ? 0 : 1;
      if (aOver !== bOver) return aOver - bOver;
      return a.date.getTime() - b.date.getTime();
    });
  });

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap;
    const qView = qp.get('calendarView');
    if (qView && (ALLOWED_VIEW_MODES as readonly string[]).includes(qView)) {
      this.viewMode.set(qView as CalendarViewMode);
    }
    const qCursor = qp.get('calendarCursor');
    if (qCursor) {
      const d = new Date(qCursor);
      if (!isNaN(d.getTime())) {
        this.cursorFromQuery = d;
        this.cursorDate.set(d);
      }
    }

    let isFirst = true;
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const id = params.get('id');
        if (!id) return;
        const changed = id !== this.workspaceId();
        this.workspaceId.set(id);
        if (isFirst) {
          isFirst = false;
          this.load(id);
        } else if (changed) {
          this.transitioning.set(true);
          setTimeout(() => {
            this.load(id);
            this.transitioning.set(false);
          }, 0);
        }
      });
  }

  private cursorFromQuery: Date | null = null;

  private load(workspaceId: string): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.api
      .getCalendar(workspaceId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.response.set(res);
          if (this.cursorFromQuery) {
            this.cursorFromQuery = null;
          } else {
            this.cursorDate.set(new Date(res.referenceDate));
          }
          this.loading.set(false);
        },
        error: () => {
          this.loadError.set('Failed to load calendar data.');
          this.loading.set(false);
        },
      });
  }

  setView(mode: CalendarViewMode): void {
    this.viewMode.set(mode);
  }

  goPrev(): void {
    const cur = this.cursorDate();
    const next = new Date(cur);
    if (this.viewMode() === 'month') {
      next.setUTCMonth(cur.getUTCMonth() - 1);
    } else if (this.viewMode() === 'week') {
      next.setUTCDate(cur.getUTCDate() - 7);
    } else {
      next.setUTCDate(cur.getUTCDate() - 1);
    }
    this.cursorDate.set(next);
  }

  goNext(): void {
    const cur = this.cursorDate();
    const next = new Date(cur);
    if (this.viewMode() === 'month') {
      next.setUTCMonth(cur.getUTCMonth() + 1);
    } else if (this.viewMode() === 'week') {
      next.setUTCDate(cur.getUTCDate() + 7);
    } else {
      next.setUTCDate(cur.getUTCDate() + 1);
    }
    this.cursorDate.set(next);
  }

  goToday(): void {
    const r = this.response();
    this.cursorDate.set(r ? new Date(r.referenceDate) : new Date());
  }

  goToDay(day: Date): void {
    this.cursorDate.set(new Date(day));
    this.viewMode.set('day');
  }

  togglePlatform(platform: PlatformContract): void {
    this.filter.update((f) => {
      const platforms = f.platforms.includes(platform)
        ? f.platforms.filter((p) => p !== platform)
        : [...f.platforms, platform];
      return { ...f, platforms };
    });
  }

  toggleStatus(status: string): void {
    this.filter.update((f) => {
      const statuses = f.statuses.includes(status)
        ? f.statuses.filter((s) => s !== status)
        : [...f.statuses, status];
      return { ...f, statuses };
    });
  }

  toggleOwner(owner: string): void {
    this.filter.update((f) => {
      const owners = f.owners.includes(owner)
        ? f.owners.filter((o) => o !== owner)
        : [...f.owners, owner];
      return { ...f, owners };
    });
  }

  setSearch(value: string): void {
    this.filter.update((f) => ({ ...f, search: value }));
  }

  toggleShowMilestones(): void {
    this.filter.update((f) => ({ ...f, showMilestones: !f.showMilestones }));
  }

  toggleShowPublished(): void {
    this.filter.update((f) => ({ ...f, showPublished: !f.showPublished }));
  }

  toggleUpcomingPanel(): void {
    this.upcomingCollapsed.update((v) => !v);
  }

  toggleFiltersOpen(): void {
    this.filtersOpen.update((v) => !v);
  }

  closeFilters(): void {
    this.filtersOpen.set(false);
  }

  clearAllFilters(): void {
    this.filter.set({ ...EMPTY_FILTER_STATE });
  }

  eventsForDay(day: Date): CalendarEventView[] {
    const dayKey = day.toISOString().slice(0, 10);
    return this.filteredEvents().filter(
      (ev) => ev.date.toISOString().slice(0, 10) === dayKey,
    );
  }

  trimmedEventsForCell(day: Date): {
    visible: CalendarEventView[];
    overflow: number;
  } {
    const all = sortEventsForCell(this.eventsForDay(day));
    if (all.length <= MAX_EVENTS_PER_CELL) {
      return { visible: all, overflow: 0 };
    }
    return {
      visible: all.slice(0, MAX_EVENTS_PER_CELL),
      overflow: all.length - MAX_EVENTS_PER_CELL,
    };
  }

  sameMonth(day: Date): boolean {
    const cur = this.cursorDate();
    return day.getUTCMonth() === cur.getUTCMonth();
  }

  isReferenceDay(day: Date): boolean {
    return day.toISOString().slice(0, 10) === this.referenceDate().toISOString().slice(0, 10);
  }

  eventLabel(ev: CalendarEventView): string {
    if (ev.kind === 'publish') {
      return `${PLATFORM_LABELS[ev.item.platform] ?? ev.item.platform} • ${ev.item.title}`;
    }
    const mtype = MILESTONE_LABELS[ev.milestoneType] ?? ev.milestoneType;
    return `${mtype} • ${ev.item.title}`;
  }

  /** Compact label shown directly inside cell pills — no platform prefix. */
  pillLabel(ev: CalendarEventView): string {
    if (ev.kind === 'publish') return ev.item.title;
    const mtype = MILESTONE_LABELS[ev.milestoneType] ?? ev.milestoneType;
    return `${mtype} · ${ev.item.title}`;
  }

  milestoneShortLabel(ev: CalendarEventView): string {
    if (ev.kind !== 'milestone') return '';
    return MILESTONE_LABELS[ev.milestoneType] ?? ev.milestoneType;
  }

  severityLabel(ev: CalendarEventView): string | null {
    if (!ev.severity) return null;
    if (ev.severity === 'overdue') return 'Overdue';
    if (ev.severity === 'at-risk') return 'At-risk';
    return 'Blocked';
  }

  platformLabel(platform: PlatformContract): string {
    return PLATFORM_LABELS[platform] ?? platform;
  }

  statusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
  }

  onPillEnter(ev: CalendarEventView, target: HTMLElement): void {
    if (this.peekCloseTimer) {
      clearTimeout(this.peekCloseTimer);
      this.peekCloseTimer = null;
    }
    const rect = target.getBoundingClientRect();
    this.peekAnchor.set({
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    });
    this.peekEvent.set(ev);
  }

  onPillLeave(): void {
    if (this.peekCloseTimer) clearTimeout(this.peekCloseTimer);
    this.peekCloseTimer = setTimeout(() => {
      this.peekEvent.set(null);
      this.peekAnchor.set(null);
    }, 220);
  }

  onPeekEnter(): void {
    if (this.peekCloseTimer) {
      clearTimeout(this.peekCloseTimer);
      this.peekCloseTimer = null;
    }
  }

  onPeekLeave(): void {
    this.onPillLeave();
  }

  closePeek(): void {
    if (this.peekCloseTimer) {
      clearTimeout(this.peekCloseTimer);
      this.peekCloseTimer = null;
    }
    this.peekEvent.set(null);
    this.peekAnchor.set(null);
  }

  copyEventLink(ev: CalendarEventView): void {
    const wsId = this.workspaceId();
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/workspace/${wsId}/content/${ev.contentId}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(url);
    }
    this.closePeek();
  }

  peekSummary(ev: CalendarEventView): string {
    const date = ev.date;
    const datePart = date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
    if (ev.kind === 'milestone') {
      const label = MILESTONE_LABELS[ev.milestoneType] ?? ev.milestoneType;
      return `${label}: ${datePart} • All day`;
    }
    const time = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'UTC',
    });
    return `Publishes: ${datePart} • ${time}`;
  }

  openEvent(ev: CalendarEventView): void {
    const wsId = this.workspaceId();
    const tab = ev.kind === 'publish'
      ? 'packaging'
      : MILESTONE_TAB_MAP[ev.milestoneType] ?? 'brief';
    this.router.navigate(['/workspace', wsId, 'content', ev.contentId], {
      queryParams: {
        tab,
        from: 'calendar',
        calendarView: this.viewMode(),
        calendarCursor: this.cursorDate().toISOString(),
      },
    });
  }

  isFilterActive(kind: 'platform' | 'status' | 'owner', value: string): boolean {
    const f = this.filter();
    if (kind === 'platform') return f.platforms.includes(value as PlatformContract);
    if (kind === 'status') return f.statuses.includes(value);
    return f.owners.includes(value);
  }
}
