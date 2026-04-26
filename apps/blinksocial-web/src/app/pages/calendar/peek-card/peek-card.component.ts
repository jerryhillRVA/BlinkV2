import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { CalendarEventView } from '../calendar.types';

export interface PeekAnchor {
  x: number;
  y: number;
  width: number;
  height: number;
}

@Component({
  selector: 'app-calendar-peek-card',
  imports: [CommonModule],
  templateUrl: './peek-card.component.html',
  styleUrl: './peek-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarPeekCardComponent {
  @Input({ required: true }) event!: CalendarEventView;
  @Input({ required: true }) anchor!: PeekAnchor;
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
}
