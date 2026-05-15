import { TestBed } from '@angular/core/testing';
import {
  CalendarQuickEditModalComponent,
  QuickEditSavePayload,
  datetimeLocalToIso,
  dateOnlyToIso,
  isoToDateOnly,
  isoToDatetimeLocal,
} from './quick-edit-modal.component';
import type {
  CalendarEventView,
  CalendarMilestoneEventView,
  CalendarPublishEventView,
} from '../calendar.types';

function buildPublishEvent(
  overrides: Partial<CalendarPublishEventView> = {},
): CalendarPublishEventView {
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
      status: 'scheduled',
      owner: 'Ava Chen',
      scheduledAt: '2026-05-12T15:00:00.000Z',
      blockers: [],
    },
    severity: null,
    ...overrides,
  };
}

function buildMilestoneEvent(
  overrides: Partial<CalendarMilestoneEventView> = {},
): CalendarMilestoneEventView {
  return {
    id: 'milestone-x-assets',
    kind: 'milestone',
    contentId: 'x',
    milestoneId: 'x-assets_due-0',
    milestoneType: 'assets_due',
    date: new Date('2026-05-15T00:00:00.000Z'),
    item: {
      id: 'x',
      title: 'Spring launch teaser',
      platform: 'instagram',
      canonicalType: 'IMAGE_SINGLE',
      status: 'in-progress',
      owner: 'Ava Chen',
      scheduledAt: '2026-05-20T14:00:00.000Z',
      blockers: [],
    },
    milestone: {
      milestoneId: 'x-assets_due-0',
      contentId: 'x',
      milestoneType: 'assets_due',
      dueAt: '2026-05-15T00:00:00.000Z',
      milestoneOwner: 'Ava Chen',
      isRequired: true,
    },
    severity: null,
    ...overrides,
  };
}

describe('quick-edit date helpers', () => {
  it('isoToDatetimeLocal round-trips via datetimeLocalToIso for whole minutes (UTC)', () => {
    const iso = '2026-05-12T15:30:00.000Z';
    const local = isoToDatetimeLocal(iso);
    expect(local).toBe('2026-05-12T15:30');
    expect(datetimeLocalToIso(local)).toBe(iso);
  });

  it('isoToDateOnly extracts the UTC date slice', () => {
    expect(isoToDateOnly('2026-05-15T23:59:59.000Z')).toBe('2026-05-15');
  });

  it('dateOnlyToIso produces midnight-UTC ISO and rejects malformed input', () => {
    expect(dateOnlyToIso('2026-05-13')).toBe('2026-05-13T00:00:00.000Z');
    expect(dateOnlyToIso('05/13/2026')).toBeNull();
    expect(dateOnlyToIso('')).toBeNull();
  });

  it('datetimeLocalToIso rejects malformed input', () => {
    expect(datetimeLocalToIso('not-a-date')).toBeNull();
    expect(datetimeLocalToIso('')).toBeNull();
  });
});

describe('CalendarQuickEditModalComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [CalendarQuickEditModalComponent] });
  });

  afterEach(() => {
    document.body.style.overflow = '';
    document
      .querySelectorAll('[data-testid="quick-edit-overlay"]')
      .forEach((el) => el.remove());
  });

  function mountWith(event: CalendarEventView, saving = false) {
    const fixture = TestBed.createComponent(CalendarQuickEditModalComponent);
    fixture.componentInstance.event = event;
    fixture.componentInstance.saving = saving;
    fixture.detectChanges();
    return fixture;
  }

  it('publish variant — initial value mirrors item.scheduledAt and Save emits {scheduledAt}', () => {
    const fixture = mountWith(buildPublishEvent());
    const dialog = document.querySelector(
      '[data-testid="quick-edit-dialog"]',
    ) as HTMLElement;
    expect(dialog).toBeTruthy();
    const input = dialog.querySelector(
      '[data-testid="quick-edit-datetime"]',
    ) as HTMLInputElement;
    expect(input.value).toBe('2026-05-12T15:00');

    const payloads: QuickEditSavePayload[] = [];
    fixture.componentInstance.save.subscribe((p) => payloads.push(p));

    input.value = '2026-05-18T10:30';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    (dialog.querySelector('[data-testid="quick-edit-save"]') as HTMLButtonElement).click();

    expect(payloads).toHaveLength(1);
    expect(payloads[0].patch.scheduledAt).toBe('2026-05-18T10:30:00.000Z');
    expect(payloads[0].patch).not.toHaveProperty('scheduledDate');
  });

  it('milestone variant — Save emits milestoneOverrides with midnight-UTC ISO (server-side deep-merges)', () => {
    const ev = buildMilestoneEvent();
    const fixture = mountWith(ev);
    const dialog = document.querySelector(
      '[data-testid="quick-edit-dialog"]',
    ) as HTMLElement;
    const input = dialog.querySelector(
      '[data-testid="quick-edit-date"]',
    ) as HTMLInputElement;
    expect(input.value).toBe('2026-05-15');

    const payloads: QuickEditSavePayload[] = [];
    fixture.componentInstance.save.subscribe((p) => payloads.push(p));

    input.value = '2026-05-13';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    (dialog.querySelector('[data-testid="quick-edit-save"]') as HTMLButtonElement).click();

    expect(payloads).toHaveLength(1);
    const overrides = payloads[0].patch.milestoneOverrides as Record<
      string,
      { dueAt: string }
    >;
    expect(overrides).toEqual({
      assets_due: { dueAt: '2026-05-13T00:00:00.000Z' },
    });
  });

  it('disables Save when the date is empty and emits no save', () => {
    const fixture = mountWith(buildPublishEvent());
    const dialog = document.querySelector(
      '[data-testid="quick-edit-dialog"]',
    ) as HTMLElement;
    const input = dialog.querySelector(
      '[data-testid="quick-edit-datetime"]',
    ) as HTMLInputElement;
    input.value = '';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const saveBtn = dialog.querySelector(
      '[data-testid="quick-edit-save"]',
    ) as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(true);
    const payloads: QuickEditSavePayload[] = [];
    fixture.componentInstance.save.subscribe((p) => payloads.push(p));
    saveBtn.click();
    expect(payloads).toHaveLength(0);
  });

  it('Cancel + backdrop emit cancelEdit without save', () => {
    const fixture = mountWith(buildPublishEvent());
    const overlay = document.querySelector(
      '[data-testid="quick-edit-overlay"]',
    ) as HTMLElement;
    const dialog = overlay.querySelector(
      '[data-testid="quick-edit-dialog"]',
    ) as HTMLElement;
    let cancelled = 0;
    const saves: QuickEditSavePayload[] = [];
    fixture.componentInstance.cancelEdit.subscribe(() => (cancelled += 1));
    fixture.componentInstance.save.subscribe((p) => saves.push(p));

    (dialog.querySelector('[data-testid="quick-edit-cancel"]') as HTMLButtonElement).click();
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(cancelled).toBeGreaterThanOrEqual(1);
    expect(saves).toHaveLength(0);
  });

  it('openItem button emits openItem with the event', () => {
    const ev = buildPublishEvent();
    const fixture = mountWith(ev);
    const dialog = document.querySelector(
      '[data-testid="quick-edit-dialog"]',
    ) as HTMLElement;
    const seen: CalendarEventView[] = [];
    fixture.componentInstance.openItem.subscribe((e) => seen.push(e));
    (dialog.querySelector('[data-testid="quick-edit-open"]') as HTMLButtonElement).click();
    expect(seen).toEqual([ev]);
  });

  it('saving=true disables Save, Cancel, Open Item, and ignores backdrop dismissal', () => {
    const fixture = mountWith(buildPublishEvent(), true);
    const overlay = document.querySelector(
      '[data-testid="quick-edit-overlay"]',
    ) as HTMLElement;
    const dialog = overlay.querySelector(
      '[data-testid="quick-edit-dialog"]',
    ) as HTMLElement;
    expect((dialog.querySelector('[data-testid="quick-edit-save"]') as HTMLButtonElement).disabled).toBe(true);
    expect((dialog.querySelector('[data-testid="quick-edit-cancel"]') as HTMLButtonElement).disabled).toBe(true);
    expect((dialog.querySelector('[data-testid="quick-edit-open"]') as HTMLButtonElement).disabled).toBe(true);
    let cancelled = 0;
    fixture.componentInstance.cancelEdit.subscribe(() => (cancelled += 1));
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(cancelled).toBe(0);
  });
});
