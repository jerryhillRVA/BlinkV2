import { TestBed } from '@angular/core/testing';
import { CalendarPeekCardComponent } from './peek-card.component';
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
});
