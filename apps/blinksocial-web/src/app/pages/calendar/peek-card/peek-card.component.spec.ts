import { TestBed } from '@angular/core/testing';
import { CalendarPeekCardComponent } from './peek-card.component';
import {
  computePlacement,
  PEEK_PLACEMENT_GAP,
  PEEK_PLACEMENT_GUTTER,
} from './peek-placement';
import type { CalendarEventView } from '../calendar.types';

function buildEvent(overrides: Partial<CalendarEventView> = {}): CalendarEventView {
  return {
    id: 'publish-x',
    kind: 'publish',
    contentId: 'x',
    date: new Date('2026-05-12T15:00:00.000Z'),
    item: {
      id: 'x',
      title: 'Spring launch teaser',
      platform: 'instagram',
      canonicalType: 'IMAGE_SINGLE',
      status: 'in-progress',
      owner: 'Ava Chen',
      scheduleAt: '2026-05-12T15:00:00.000Z',
      blockers: [],
    },
    severity: null,
    ...overrides,
  } as CalendarEventView;
}

describe('CalendarPeekCardComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [CalendarPeekCardComponent] });
  });

  it('renders title, status, platform, summary, owner, and the action buttons', () => {
    const fixture = TestBed.createComponent(CalendarPeekCardComponent);
    fixture.componentRef.setInput('event', buildEvent());
    fixture.componentRef.setInput('anchor', { x: 0, y: 0, width: 100, height: 20 });
    fixture.componentRef.setInput('summary', 'Publishes: Tue, May 12 • 3:00 PM');
    fixture.componentRef.setInput('statusLabel', 'In Progress');
    fixture.componentRef.setInput('platformLabel', 'Instagram');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.peek-title')?.textContent).toContain('Spring launch teaser');
    expect(el.querySelector('[data-testid="peek-edit"]')).toBeTruthy();
    expect(el.querySelector('[data-testid="peek-open"]')).toBeTruthy();
    expect(el.querySelector('[data-testid="peek-copy"]')).toBeTruthy();
    expect(el.textContent).toContain('In Progress');
    expect(el.textContent).toContain('Instagram');
    expect(el.textContent).toContain('Ava Chen');
  });

  it('emits openItem on title click and copyLink on copy click', () => {
    const fixture = TestBed.createComponent(CalendarPeekCardComponent);
    const ev = buildEvent();
    fixture.componentRef.setInput('event', ev);
    fixture.componentRef.setInput('anchor', { x: 0, y: 0, width: 100, height: 20 });
    fixture.componentRef.setInput('summary', '');
    fixture.componentRef.setInput('statusLabel', 'In Progress');
    fixture.componentRef.setInput('platformLabel', 'Instagram');
    fixture.detectChanges();
    const opened: CalendarEventView[] = [];
    const copied: CalendarEventView[] = [];
    fixture.componentInstance.openItem.subscribe((e) => opened.push(e));
    fixture.componentInstance.copyLink.subscribe((e) => copied.push(e));
    const el: HTMLElement = fixture.nativeElement;
    (el.querySelector('.peek-title') as HTMLButtonElement).click();
    (el.querySelector('[data-testid="peek-copy"]') as HTMLButtonElement).click();
    expect(opened).toHaveLength(1);
    expect(copied).toHaveLength(1);
    expect(opened[0]).toBe(ev);
    expect(copied[0]).toBe(ev);
  });

  it('renders a milestone badge and severity row when provided', () => {
    const fixture = TestBed.createComponent(CalendarPeekCardComponent);
    fixture.componentRef.setInput('event', buildEvent({
      kind: 'milestone',
      milestoneType: 'draft_due',
      severity: 'overdue',
    } as Partial<CalendarEventView>));
    fixture.componentRef.setInput('anchor', { x: 0, y: 0, width: 100, height: 20 });
    fixture.componentRef.setInput('summary', 'Draft Due: Tue, Apr 28 • All day');
    fixture.componentRef.setInput('statusLabel', 'In Progress');
    fixture.componentRef.setInput('platformLabel', 'Instagram');
    fixture.componentRef.setInput('milestoneLabel', 'Draft Due');
    fixture.componentRef.setInput('severityLabel', 'Overdue');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.kind-badge')?.textContent).toContain('Draft Due');
    expect(el.querySelector('.peek-severity.sev-overdue')).toBeTruthy();
    expect(el.querySelector('.peek-severity')?.textContent).toContain('Overdue');
  });

  it('initializes placement to right-of-anchor before measurement', () => {
    const fixture = TestBed.createComponent(CalendarPeekCardComponent);
    fixture.componentRef.setInput('event', buildEvent());
    fixture.componentRef.setInput('anchor', { x: 100, y: 50, width: 80, height: 20 });
    fixture.componentRef.setInput('summary', '');
    fixture.componentRef.setInput('statusLabel', 'In Progress');
    fixture.componentRef.setInput('platformLabel', 'Instagram');
    fixture.detectChanges();
    const placement = fixture.componentInstance.placement();
    expect(placement.left).toBe(100 + 80 + PEEK_PLACEMENT_GAP);
    expect(placement.top).toBe(50);
    expect(placement.flipped).toBe(false);
  });
});

describe('computePlacement', () => {
  const card = { width: 320, height: 220 };
  const viewport = { width: 1280, height: 800 };

  it('returns right-of-anchor when there is room on the right', () => {
    const result = computePlacement({ x: 200, y: 100, width: 60, height: 20 }, card, viewport);
    expect(result.left).toBe(200 + 60 + PEEK_PLACEMENT_GAP);
    expect(result.top).toBe(100);
    expect(result.flipped).toBe(false);
  });

  it('flips to left-of-anchor when the right edge would overflow', () => {
    // Anchor near right edge: 1180 + 60 + 8 + 320 = 1568 > 1280-8
    const result = computePlacement({ x: 1180, y: 100, width: 60, height: 20 }, card, viewport);
    expect(result.left).toBe(1180 - 320 - PEEK_PLACEMENT_GAP);
    expect(result.flipped).toBe(true);
    expect(result.left + card.width).toBeLessThanOrEqual(viewport.width - PEEK_PLACEMENT_GUTTER);
  });

  it('clamps to the right gutter when neither side fits at full width', () => {
    // Narrow viewport: card is wider than either side of the anchor at full width
    const narrow = { width: 400, height: 600 };
    const result = computePlacement({ x: 200, y: 100, width: 60, height: 20 }, card, narrow);
    expect(result.left).toBe(narrow.width - card.width - PEEK_PLACEMENT_GUTTER);
    expect(result.left).toBeGreaterThanOrEqual(PEEK_PLACEMENT_GUTTER);
    expect(result.flipped).toBe(false);
  });

  it('clamps top when the bottom edge would overflow the viewport', () => {
    // anchor.y + card.height = 700 + 220 = 920 > 800 - 8
    const result = computePlacement({ x: 200, y: 700, width: 60, height: 20 }, card, viewport);
    expect(result.top).toBe(viewport.height - card.height - PEEK_PLACEMENT_GUTTER);
  });

  it('clamps top to the gutter when the anchor sits above the viewport', () => {
    const result = computePlacement({ x: 200, y: -50, width: 60, height: 20 }, card, viewport);
    expect(result.top).toBe(PEEK_PLACEMENT_GUTTER);
  });
});
