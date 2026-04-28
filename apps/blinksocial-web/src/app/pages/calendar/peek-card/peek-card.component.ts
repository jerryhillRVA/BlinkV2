import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Injector,
  Input,
  Output,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import type { CalendarEventView } from '../calendar.types';
import {
  computePlacement,
  PEEK_PLACEMENT_GAP,
  type PeekAnchor,
  type PlacementResult,
} from './peek-placement';

export type { PeekAnchor };

@Component({
  selector: 'app-calendar-peek-card',
  imports: [CommonModule],
  templateUrl: './peek-card.component.html',
  styleUrl: './peek-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarPeekCardComponent {
  private readonly injector = inject(Injector);

  readonly peekRoot = viewChild<ElementRef<HTMLElement>>('peekRoot');
  readonly placement = signal<PlacementResult>({ left: 0, top: 0, flipped: false });

  private _anchor!: PeekAnchor;
  @Input({ required: true })
  set anchor(value: PeekAnchor) {
    this._anchor = value;
    this.placement.set({
      left: value.x + value.width + PEEK_PLACEMENT_GAP,
      top: value.y,
      flipped: false,
    });
    if (typeof window !== 'undefined') {
      afterNextRender(() => this.measureAndPlace(), { injector: this.injector });
    }
  }
  get anchor(): PeekAnchor {
    return this._anchor;
  }

  @Input({ required: true }) event!: CalendarEventView;
  @Input({ required: true }) summary!: string;
  @Input({ required: true }) statusLabel!: string;
  @Input({ required: true }) platformLabel!: string;
  @Input() milestoneLabel: string | null = null;
  @Input() severityLabel: string | null = null;

  @Output() openItem = new EventEmitter<CalendarEventView>();
  @Output() copyLink = new EventEmitter<CalendarEventView>();
  @Output() editDates = new EventEmitter<CalendarEventView>();
  @Output() closed = new EventEmitter<void>();
  @Output() peekEnter = new EventEmitter<void>();
  @Output() peekLeave = new EventEmitter<void>();

  private measureAndPlace(): void {
    const el = this.peekRoot()?.nativeElement;
    if (!el || typeof window === 'undefined') return;
    const rect = el.getBoundingClientRect();
    const next = computePlacement(
      this._anchor,
      { width: rect.width, height: rect.height },
      { width: window.innerWidth, height: window.innerHeight },
    );
    this.placement.set(next);
  }
}
