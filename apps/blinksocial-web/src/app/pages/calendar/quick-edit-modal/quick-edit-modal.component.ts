import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  EmbeddedViewRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type {
  CalendarMilestoneTypeContract,
  UpdateContentItemRequestContract,
} from '@blinksocial/contracts';
import type { CalendarEventView } from '../calendar.types';

export type QuickEditSavePayload = {
  event: CalendarEventView;
  patch: UpdateContentItemRequestContract;
};

const MILESTONE_LABELS: Record<CalendarMilestoneTypeContract, string> = {
  brief_due: 'Brief Due',
  draft_due: 'Draft Due',
  blueprint_due: 'Blueprint Due',
  assets_due: 'Assets Due',
  packaging_due: 'Packaging Due',
  qa_due: 'QA Due',
};

/**
 * Format an ISO timestamp as `YYYY-MM-DDTHH:mm` in UTC for binding to
 * `<input type="datetime-local">`. The control treats this as a local
 * wall-clock value with no zone marker — by populating it from the UTC
 * components of the ISO string we display the same "calendar slot" the
 * Calendar surface renders, avoiding zone-shift surprises in the editor.
 */
export function isoToDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

/** Inverse of {@link isoToDatetimeLocal} — treat the input string as UTC. */
export function datetimeLocalToIso(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, m, d, hh, mm] = match;
  const ms = Date.UTC(+y, +m - 1, +d, +hh, +mm, 0, 0);
  if (Number.isNaN(ms)) return null;
  return new Date(ms).toISOString();
}

/** Extract the `YYYY-MM-DD` slice of an ISO timestamp using UTC parts. */
export function isoToDateOnly(iso: string): string {
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** `YYYY-MM-DD` → `YYYY-MM-DDT00:00:00.000Z` (midnight UTC). */
export function dateOnlyToIso(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const ms = Date.parse(`${value}T00:00:00.000Z`);
  if (Number.isNaN(ms)) return null;
  return new Date(ms).toISOString();
}

@Component({
  selector: 'app-calendar-quick-edit-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './quick-edit-modal.component.html',
  styleUrl: './quick-edit-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarQuickEditModalComponent implements AfterViewInit, OnDestroy {
  private readonly doc = inject(DOCUMENT);
  private readonly vcr = inject(ViewContainerRef);
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true })
  set event(value: CalendarEventView) {
    this.eventSig.set(value);
    if (value.kind === 'publish') {
      const iso = value.item.scheduledAt;
      this.dateValue.set(iso ? isoToDatetimeLocal(iso) : '');
    } else {
      this.dateValue.set(isoToDateOnly(value.date.toISOString()));
    }
  }
  get event(): CalendarEventView {
    return this.eventSig() as CalendarEventView;
  }

  /** Disables Save + Cancel + backdrop dismissal while the parent PUT is in flight. */
  @Input() saving = false;

  @Output() save = new EventEmitter<QuickEditSavePayload>();
  @Output() openItem = new EventEmitter<CalendarEventView>();
  @Output() cancelEdit = new EventEmitter<void>();

  @ViewChild('dialogTpl', { static: true }) dialogTpl!: TemplateRef<unknown>;
  @ViewChild('dateInput') dateInput?: ElementRef<HTMLInputElement>;

  private view: EmbeddedViewRef<unknown> | null = null;

  protected readonly eventSig = signal<CalendarEventView | null>(null);
  protected readonly dateValue = signal('');

  protected readonly title = computed(() => {
    const ev = this.eventSig();
    if (!ev) return 'Quick Edit';
    return ev.kind === 'publish' ? 'Quick Edit — Publish' : 'Quick Edit — Milestone';
  });

  protected readonly milestoneLabel = computed(() => {
    const ev = this.eventSig();
    if (!ev || ev.kind !== 'milestone') return '';
    return MILESTONE_LABELS[ev.milestoneType] ?? ev.milestoneType;
  });

  protected readonly invalid = computed(() => {
    const ev = this.eventSig();
    const v = this.dateValue();
    if (!ev || !v) return true;
    return ev.kind === 'publish'
      ? datetimeLocalToIso(v) === null
      : dateOnlyToIso(v) === null;
  });

  ngAfterViewInit(): void {
    this.view = this.vcr.createEmbeddedView(this.dialogTpl);
    this.view.detectChanges();
    const body = this.doc.body;
    for (const node of this.view.rootNodes as Node[]) {
      if (node.nodeType === 1) body.appendChild(node);
    }
    body.style.overflow = 'hidden';
    // Defer focus by a microtask so the input is attached and selectable.
    queueMicrotask(() => this.dateInput?.nativeElement.focus());
    this.destroyRef.onDestroy(() => this.teardown());
  }

  ngOnDestroy(): void {
    this.teardown();
  }

  private teardown(): void {
    if (this.view) {
      this.view.destroy();
      this.view = null;
    }
    if (this.doc.body) this.doc.body.style.overflow = '';
  }

  protected onDateInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.dateValue.set(target.value);
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (this.saving) return;
    if (event.target === event.currentTarget) {
      this.cancelEdit.emit();
    }
  }

  protected onEscape(): void {
    if (this.saving) return;
    this.cancelEdit.emit();
  }

  protected onCancel(): void {
    if (this.saving) return;
    this.cancelEdit.emit();
  }

  protected onOpenItem(): void {
    const ev = this.eventSig();
    if (!ev) return;
    this.openItem.emit(ev);
  }

  protected onSave(): void {
    if (this.invalid() || this.saving) return;
    const ev = this.eventSig();
    if (!ev) return;
    const v = this.dateValue();
    if (ev.kind === 'publish') {
      const iso = datetimeLocalToIso(v);
      if (!iso) return;
      this.save.emit({
        event: ev,
        patch: {
          scheduledAt: iso,
        },
      });
    } else {
      const iso = dateOnlyToIso(v);
      if (!iso) return;
      // Send only the diff for the edited type. `ContentItemsService.updateItem`
      // deep-merges the `milestoneOverrides` map (#134) so previously-set
      // overrides for other types are preserved.
      this.save.emit({
        event: ev,
        patch: {
          milestoneOverrides: { [ev.milestoneType]: { dueAt: iso } },
        },
      });
    }
  }

  protected stopEvent(event: Event): void {
    event.stopPropagation();
  }
}
